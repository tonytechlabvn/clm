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
import { wrapHtmlInTemplate } from "./template-html-wrapper";
import { notifyPublished } from "./notification-service";

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

    // 7. Prepare content for platform — adapter decides format
    //    usesHtmlPipeline=true (WordPress): runs HTML conversion pipeline below
    //    usesHtmlPipeline=false (Facebook): adapter.prepareContent() strips to plain text
    let htmlContent: string;
    if (!adapter.usesHtmlPipeline) {
      // Adapter handles its own content format (e.g. Facebook → plain text)
      htmlContent = adapter.prepareContent(post.content, post.contentFormat);
    } else if (post.contentFormat === "blocks") {
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
        let rawHtml = parsed.html || "";
        let customCss = parsed.css ? parsed.css : "";

        // If post has an html-slots template, wrap AI content in the template's design.
        // The AI generates plain HTML (h2 + p sections); this injects that content into
        // the template's styled card structure so CSS classes actually match.
        if (post.templateId) {
          const template = await prisma.cmaTemplate.findUnique({ where: { id: post.templateId } });
          if (template?.templateType === "html-slots" && template.htmlTemplate && template.cssScoped) {
            rawHtml = wrapHtmlInTemplate(rawHtml, template.htmlTemplate, post.title);
            const scopeClass = `tpl-${template.id.slice(0, 8)}`;
            rawHtml = `<div class="${scopeClass}">${rawHtml}</div>`;
            // Prepend template CSS (before any AI-generated CSS)
            customCss = template.cssScoped + (customCss ? `\n${customCss}` : "");
          }
        }

        const allCss = TONYTECHLAB_CUSTOM_CSS + (customCss ? `\n${customCss}` : "");
        htmlContent = inlineCssIntoHtml(rawHtml, allCss);
      } catch {
        // Fallback: treat as raw HTML string
        htmlContent = post.content;
      }
    } else {
      // Markdown content — convert to HTML, wrap in .tn-cf-post for consistent styling,
      // then optionally wrap in HTML-slots template. This matches the HTML path output
      // so posts created via MCP (markdown) look identical to direct CLM (HTML) posts.
      const themedHtml = await markdownToThemedHtml(post.content, post.styleTheme || "default");

      // Wrap in .tn-cf-post so TONYTECHLAB_CUSTOM_CSS rules match (same as AI HTML generator)
      const wrappedHtml = `<div class="tn-cf-post">${themedHtml}</div>`;

      if (post.templateId) {
        const template = await prisma.cmaTemplate.findUnique({ where: { id: post.templateId } });
        if (template?.templateType === "html-slots" && template.htmlTemplate && template.cssScoped) {
          // Template wrapping: inject content into template's card structure
          const wrapped = wrapHtmlInTemplate(wrappedHtml, template.htmlTemplate, post.title);
          const scopeClass = `tpl-${template.id.slice(0, 8)}`;
          const scopedHtml = `<div class="${scopeClass}">${wrapped}</div>`;
          // Prepend template CSS before TONYTECHLAB_CUSTOM_CSS
          const customCss = template.cssScoped;
          const allCss = TONYTECHLAB_CUSTOM_CSS + (customCss ? `\n${customCss}` : "");
          htmlContent = inlineCssIntoHtml(scopedHtml, allCss);
        } else {
          // Template exists but not html-slots — just apply standard CSS inlining
          htmlContent = inlineCssIntoHtml(wrappedHtml, TONYTECHLAB_CUSTOM_CSS);
        }
      } else {
        // No template — apply standard CSS inlining with tn-cf-post styles
        htmlContent = inlineCssIntoHtml(wrappedHtml, TONYTECHLAB_CUSTOM_CSS);
      }
    }

    // 7b–7c: Image resolution — only for HTML-based platforms (skip for plain text adapters)
    let featuredMediaId: string | undefined;
    if (adapter.usesHtmlPipeline) {
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

      // Determine featured image — use first inline image, or fetch dedicated one
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
          await prisma.cmaPost.update({
            where: { id: req.postId },
            data: { featuredImage: featured.url },
          });
        }
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

    // Fire-and-forget post-publish notification
    notifyPublished(req.postId, req.orgId).catch((err) =>
      console.error("[notifications] Failed post-publish notification:", err)
    );

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
