// Facebook Graph API adapter — publishes plain text + optional image via FB Page API

import { prisma } from "@/lib/prisma-client";
import { fbGraphFetch } from "./facebook-graph-client";
import { stripMarkdownToPlainText } from "../utils/strip-markdown-to-plain-text";
import { decryptToken } from "../crypto-utils";
import { revokePermissions } from "../services/facebook-oauth-service";
import type {
  PlatformAdapter,
  PublishPayload,
  PlatformPostResult,
  ContentValidation,
  ConnectPayload,
  MediaUploadResult,
  PlatformMetrics,
} from "./platform-adapter";

// FB post IDs are formatted as {pageId}_{postId} — validate to prevent path injection
function validateFbPostId(id: string): void {
  if (!/^\d+_\d+$/.test(id)) throw new Error("Invalid Facebook post ID format");
}

// DB-based rate limiter: query CmaPostPlatform.publishedAt for spacing + daily cap
async function checkRateLimit(pageId: string): Promise<void> {
  const now = new Date();

  // Check 20-minute spacing since last publish to this page
  const lastPublish = await prisma.cmaPostPlatform.findFirst({
    where: {
      account: { platform: "facebook", siteUrl: pageId },
      status: "published",
      publishedAt: { not: null },
    },
    orderBy: { publishedAt: "desc" },
    select: { publishedAt: true },
  });

  if (lastPublish?.publishedAt) {
    const elapsedMs = now.getTime() - lastPublish.publishedAt.getTime();
    const minSpacingMs = 20 * 60 * 1000; // 20 minutes
    if (elapsedMs < minSpacingMs) {
      const retryAfterSec = Math.ceil((minSpacingMs - elapsedMs) / 1000);
      throw new Error(
        `Facebook rate limit: wait ${retryAfterSec}s before next post (20-min spacing)`
      );
    }
  }

  // Check daily cap: max 25 posts per page per day
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const todayCount = await prisma.cmaPostPlatform.count({
    where: {
      account: { platform: "facebook", siteUrl: pageId },
      status: "published",
      publishedAt: { gte: startOfDay },
    },
  });

  if (todayCount >= 25) {
    throw new Error("Facebook rate limit: maximum 25 posts per page per day reached");
  }
}

export class FacebookAdapter implements PlatformAdapter {
  readonly id = "facebook";
  readonly name = "Facebook";
  readonly maxContentLength = 63_206;
  readonly supportedMedia = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  readonly usesHtmlPipeline = false; // Facebook uses plain text — skip HTML conversion

  async connect(credentials: ConnectPayload) {
    const { accessToken } = credentials;
    // Validate Page Access Token via GET /me
    const res = await fbGraphFetch("/me?fields=id,name", accessToken);
    const page = await res.json();
    return { valid: true, displayName: page.name || "Facebook Page" };
  }

  async disconnect(accountId: string): Promise<void> {
    // Revoke FB permissions using the stored long-lived user token (refreshToken)
    try {
      const account = await prisma.cmaPlatformAccount.findUnique({ where: { id: accountId } });
      if (account?.refreshToken) {
        const userToken = decryptToken(account.refreshToken);
        await revokePermissions(userToken);
      }
    } catch {
      // Best-effort revocation — continue even if FB API fails
    }
  }

  async validateConnection(_siteUrl: string, _username: string, token: string): Promise<boolean> {
    try {
      await fbGraphFetch("/me?fields=id", token);
      return true;
    } catch {
      return false;
    }
  }

  // Facebook uses plain text — strip markdown/HTML, return clean text
  prepareContent(content: string, format: string): string {
    if (format === "markdown") return stripMarkdownToPlainText(content);
    if (format === "blocks" || format === "html") {
      // Strip HTML tags for plain text output
      return content.replace(/<[^>]+>/g, "").trim();
    }
    return content;
  }

  async publish(
    siteUrl: string,
    _username: string,
    token: string,
    post: PublishPayload,
    imageUrl?: string // optional: direct image URL to attach (e.g. from Zalo CDN)
  ): Promise<PlatformPostResult> {
    const pageId = siteUrl; // siteUrl stores FB Page ID
    await checkRateLimit(pageId);

    let result;
    // Determine image URL: from imageUrl param, or from featuredMediaId if it's a URL
    const imgUrl = imageUrl || (post.featuredMediaId?.startsWith("http") ? post.featuredMediaId : undefined);

    if (imgUrl) {
      // Photo post: POST /{pageId}/photos with url + message (FB downloads the image)
      result = await fbGraphFetch(`/${pageId}/photos`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: post.content, url: imgUrl }),
      });
    } else {
      // Text-only post
      result = await fbGraphFetch(`/${pageId}/feed`, token, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: post.content }),
      });
    }

    const data = await result.json();
    const postId = data.id || data.post_id;
    return {
      platformPostId: postId,
      platformUrl: `https://www.facebook.com/${postId}`,
    };
  }

  async updatePost(
    _siteUrl: string,
    _username: string,
    token: string,
    platformPostId: string,
    post: PublishPayload
  ): Promise<PlatformPostResult> {
    validateFbPostId(platformPostId);
    // FB only allows editing message text, not media
    await fbGraphFetch(`/${platformPostId}`, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: post.content }),
    });
    return {
      platformPostId,
      platformUrl: `https://www.facebook.com/${platformPostId}`,
    };
  }

  async deletePost(
    _siteUrl: string,
    _username: string,
    token: string,
    platformPostId: string
  ): Promise<void> {
    validateFbPostId(platformPostId);
    await fbGraphFetch(`/${platformPostId}`, token, { method: "DELETE" });
  }

  validateContent(_title: string, content: string): ContentValidation {
    const errors: string[] = [];
    if (!content?.trim()) errors.push("Content is required for Facebook posts");
    if (content && content.length > this.maxContentLength) {
      errors.push(`Content exceeds Facebook's ${this.maxContentLength} character limit`);
    }
    return { valid: errors.length === 0, errors };
  }

  async uploadMedia(
    siteUrl: string,
    _username: string,
    token: string,
    file: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<MediaUploadResult> {
    const pageId = siteUrl;
    // Upload as unpublished photo — returns media ID for attachment
    const formData = new FormData();
    formData.append("source", new Blob([new Uint8Array(file)], { type: mimeType }), fileName);
    formData.append("published", "false");

    const res = await fbGraphFetch(`/${pageId}/photos`, token, {
      method: "POST",
      body: formData,
    });
    const data = await res.json();
    return { platformMediaId: String(data.id), url: "" };
  }

  // Fetch FB post insights (reach, impressions, clicks) + engagement counts
  async getMetrics(
    _siteUrl: string,
    _username: string,
    token: string,
    platformPostId: string
  ): Promise<PlatformMetrics> {
    validateFbPostId(platformPostId);
    try {
      // Fetch insights metrics
      const insightsRes = await fbGraphFetch(
        `/${platformPostId}/insights?metric=post_impressions,post_impressions_unique,post_clicks`,
        token
      );
      const insights = await insightsRes.json();

      // Fetch engagement counts (shares, comments, reactions)
      const postRes = await fbGraphFetch(
        `/${platformPostId}?fields=shares,comments.summary(true),reactions.summary(true)`,
        token
      );
      const postData = await postRes.json();

      const getInsightValue = (name: string): number => {
        const metric = insights.data?.find((m: { name: string }) => m.name === name);
        return metric?.values?.[0]?.value || 0;
      };

      return {
        views: getInsightValue("post_impressions"),
        likes: postData.reactions?.summary?.total_count || 0,
        shares: postData.shares?.count || 0,
        comments: postData.comments?.summary?.total_count || 0,
        clicks: getInsightValue("post_clicks"),
      };
    } catch {
      // Return zeros if insights API fails (e.g. insufficient permissions)
      return { views: 0, likes: 0, shares: 0, comments: 0, clicks: 0 };
    }
  }
}
