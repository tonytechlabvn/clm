// CMA Publishing orchestration — validates, converts, publishes via adapter with idempotency guard

import { prisma } from "@/lib/prisma-client";
import { getAdapter } from "../adapters/adapter-registry";
import { decryptToken } from "../crypto-utils";
import { markdownToSanitizedHtml } from "../markdown-to-html";
import { blocksToSanitizedHtml } from "../blocks-to-html";
import { blocksToStyledHtml } from "../themes/apply-theme-styles";
import { markdownToThemedHtml } from "../themes/apply-theme-to-markdown-html";
import { resolveImagePlaceholders, fetchAndUploadFeaturedImage } from "./image-resolution-service";
import { TONYTECHLAB_CUSTOM_CSS } from "../themes/tonytechlab-custom-css";
import { inlineCssIntoHtml } from "../css-inliner";

export interface PublishRequest {
  postId: string;
  accountId: string;
  orgId: string;
}

export interface PublishResult {
  success: boolean;
  platformPostId?: string;
  platformUrl?: string;
  error?: string;
}

export async function publishPost(req: PublishRequest): Promise<PublishResult> {
  // 1. Load post + account, verify org ownership
  const [post, account] = await Promise.all([
    prisma.cmaPost.findFirst({ where: { id: req.postId, orgId: req.orgId } }),
    prisma.cmaPlatformAccount.findFirst({ where: { id: req.accountId, orgId: req.orgId, isActive: true } }),
  ]);

  if (!post) throw new Error("Post not found");
  if (!account) throw new Error("Platform account not found or inactive");

  // 2. Validate post is in publishable state
  if (!["draft", "approved", "scheduled", "failed"].includes(post.status)) {
    throw new Error(`Post cannot be published from status: ${post.status}`);
  }

  // 3. Idempotency guard — optimistic locking via status transition
  //    Only one publish can succeed; concurrent attempts get zero rows
  const lockResult = await prisma.cmaPost.updateMany({
    where: { id: req.postId, status: { in: ["draft", "approved", "scheduled", "failed"] } },
    data: { status: "publishing" },
  });
  if (lockResult.count === 0) {
    throw new Error("Post is already being published");
  }

  // 4. Upsert the platform publish record
  const postPlatform = await prisma.cmaPostPlatform.upsert({
    where: { postId_accountId: { postId: req.postId, accountId: req.accountId } },
    create: { postId: req.postId, accountId: req.accountId, status: "publishing" },
    update: { status: "publishing", publishError: null },
  });

  try {
    // 5. Get adapter + decrypt credentials
    const adapter = getAdapter(account.platform);
    const token = decryptToken(account.accessToken);
    const siteUrl = account.siteUrl || "";
    const username = account.username || "";

    // 6. Validate content
    const validation = adapter.validateContent(post.title, post.content);
    if (!validation.valid) {
      throw new Error(`Content validation failed: ${validation.errors.join(", ")}`);
    }

    // 7. Convert content → HTML (blocks / html / markdown pipelines)
    let htmlContent: string;
    if (post.contentFormat === "blocks") {
      const blocks = JSON.parse(post.content);
      // Apply theme inline styles for WordPress compatibility
      htmlContent = blocksToStyledHtml(blocks, post.styleTheme || "default");
    } else if (post.contentFormat === "html") {
      // HTML format: content is JSON { html, css, js }
      // Inline CSS as style="" attributes for WordPress compatibility —
      // WP strips <style> blocks depending on user role/theme/plugins.
      // Pseudo-selectors (:hover, @media, nth-child) stay in a <style> fallback.
      try {
        const parsed = JSON.parse(post.content);
        const customCss = parsed.css ? parsed.css : "";
        const allCss = TONYTECHLAB_CUSTOM_CSS + (customCss ? `\n${customCss}` : "");
        htmlContent = inlineCssIntoHtml(parsed.html || "", allCss);
      } catch {
        // Fallback: treat as raw HTML string
        htmlContent = post.content;
      }
    } else {
      htmlContent = await markdownToThemedHtml(post.content, post.styleTheme || "default");
    }

    // 7b. Resolve [IMAGE] placeholders with real Unsplash images
    const suggestedPrompts: string[] = (() => {
      try {
        const data = post.outlineData as { suggestedImagePrompts?: string[] } | null;
        return data?.suggestedImagePrompts || [];
      } catch { return []; }
    })();

    const imageResult = await resolveImagePlaceholders(htmlContent, {
      siteUrl, username, token,
      orgId: req.orgId, postId: req.postId,
      suggestedImagePrompts: suggestedPrompts,
      postTitle: post.title,
    }, adapter);
    htmlContent = imageResult.html;

    // 7c. Determine featured image — use first inline image, or fetch dedicated one
    let featuredMediaId: number | undefined;
    if (imageResult.uploadedMediaIds.length > 0) {
      featuredMediaId = imageResult.uploadedMediaIds[0];
    } else if (adapter.uploadMedia) {
      const featured = await fetchAndUploadFeaturedImage(
        post.title,
        { siteUrl, username, token, orgId: req.orgId, postId: req.postId },
        adapter
      );
      if (featured) {
        featuredMediaId = featured.mediaId;
        // Store URL for dashboard display
        await prisma.cmaPost.update({
          where: { id: req.postId },
          data: { featuredImage: featured.url },
        });
      }
    }

    // 8. Publish or update on platform
    let result;
    if (postPlatform.platformPostId) {
      // Update existing platform post
      result = await adapter.updatePost(siteUrl, username, token, postPlatform.platformPostId, {
        title: post.title,
        content: htmlContent,
        excerpt: post.excerpt || undefined,
        categories: post.categories,
        tags: post.tags,
        featuredMediaId,
        status: "publish",
      });
    } else {
      // Create new platform post
      result = await adapter.publish(siteUrl, username, token, {
        title: post.title,
        content: htmlContent,
        excerpt: post.excerpt || undefined,
        categories: post.categories,
        tags: post.tags,
        featuredMediaId,
        status: "publish",
      });
    }

    // 9. Update DB with success
    const now = new Date();
    await Promise.all([
      prisma.cmaPost.update({
        where: { id: req.postId },
        data: { status: "published", publishedAt: now, publishError: null },
      }),
      prisma.cmaPostPlatform.update({
        where: { id: postPlatform.id },
        data: {
          status: "published",
          platformPostId: result.platformPostId,
          platformUrl: result.platformUrl,
          publishedAt: now,
          publishError: null,
        },
      }),
    ]);

    return { success: true, platformPostId: result.platformPostId, platformUrl: result.platformUrl };
  } catch (err) {
    // 10. Revert post status on failure
    const errorMsg = err instanceof Error ? err.message : String(err);
    await Promise.all([
      prisma.cmaPost.update({
        where: { id: req.postId },
        data: { status: "failed", publishError: errorMsg },
      }),
      prisma.cmaPostPlatform.update({
        where: { id: postPlatform.id },
        data: { status: "failed", publishError: errorMsg },
      }),
    ]);
    return { success: false, error: errorMsg };
  }
}

// Delete a published post from the platform and update DB
export async function unpublishPost(postId: string, accountId: string, orgId: string): Promise<void> {
  const postPlatform = await prisma.cmaPostPlatform.findFirst({
    where: { postId, accountId },
    include: { account: true },
  });
  if (!postPlatform?.platformPostId) return;

  const account = postPlatform.account;
  if (account.orgId !== orgId) throw new Error("Unauthorized");

  const adapter = getAdapter(account.platform);
  const token = decryptToken(account.accessToken);
  await adapter.deletePost(account.siteUrl || "", account.username || "", token, postPlatform.platformPostId);

  await prisma.cmaPostPlatform.delete({ where: { id: postPlatform.id } });
}
