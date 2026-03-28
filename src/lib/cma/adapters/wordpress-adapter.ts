// WordPress REST API adapter — publishes content via WP Application Password (Basic Auth)

import type {
  PlatformAdapter,
  PublishPayload,
  PlatformPostResult,
  ContentValidation,
  ConnectPayload,
  MediaUploadResult,
  PlatformMetrics,
} from "./platform-adapter";

// Builds Basic Auth header from WP username + Application Password
function basicAuthHeader(username: string, token: string): string {
  const encoded = Buffer.from(`${username}:${token}`).toString("base64");
  return `Basic ${encoded}`;
}

// Validates siteUrl is a safe external HTTPS URL — prevents SSRF (C1)
function validateSiteUrl(siteUrl: string): void {
  let parsed: URL;
  try {
    parsed = new URL(siteUrl);
  } catch {
    throw new Error("Invalid WordPress site URL");
  }
  if (parsed.protocol !== "https:" && process.env.NODE_ENV === "production") {
    throw new Error("WordPress site URL must use HTTPS in production");
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Invalid protocol for WordPress site URL");
  }
  // Block private/reserved IPs and metadata endpoints
  const host = parsed.hostname;
  const blocked = /^(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.|::1|\[::1\])/;
  if (blocked.test(host)) {
    throw new Error("WordPress site URL cannot point to internal/private networks");
  }
}

// Ensures site URL ends without trailing slash and has /wp-json/wp/v2 base
function wpApiUrl(siteUrl: string, path: string): string {
  validateSiteUrl(siteUrl);
  const base = siteUrl.replace(/\/+$/, "");
  return `${base}/wp-json/wp/v2${path}`;
}

async function wpFetch(
  url: string,
  username: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: basicAuthHeader(username, token),
      ...options.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`WordPress API error ${res.status}: ${body}`);
  }
  return res;
}

// C3 fix: validate platformPostId is numeric-only to prevent path injection
function validatePlatformPostId(id: string): void {
  if (!/^\d+$/.test(id)) throw new Error("Invalid platform post ID");
}

export class WordPressAdapter implements PlatformAdapter {
  readonly id = "wordpress";
  readonly name = "WordPress";
  readonly maxContentLength = 500_000; // WP has no hard limit, but practical
  readonly supportedMedia = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  async connect(credentials: ConnectPayload) {
    const { siteUrl, username, accessToken } = credentials;
    if (!siteUrl || !username) throw new Error("WordPress requires siteUrl and username");

    const valid = await this.validateConnection(siteUrl, username, accessToken);
    if (!valid) throw new Error("Invalid WordPress credentials");

    // Fetch display name from WP user profile
    const res = await wpFetch(wpApiUrl(siteUrl, "/users/me"), username, accessToken);
    const user = await res.json();
    return { valid: true, displayName: user.name || username };
  }

  async disconnect(): Promise<void> {
    // No remote cleanup needed — Application Password stays on WP side
  }

  async validateConnection(siteUrl: string, username: string, token: string): Promise<boolean> {
    try {
      await wpFetch(wpApiUrl(siteUrl, "/users/me"), username, token);
      return true;
    } catch {
      return false;
    }
  }

  async publish(
    siteUrl: string,
    username: string,
    token: string,
    post: PublishPayload
  ): Promise<PlatformPostResult> {
    const body: Record<string, unknown> = {
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || "",
      status: post.status || "publish",
    };

    // Resolve WP category/tag IDs if provided
    if (post.categories?.length) {
      body.categories = await this.resolveTermIds(siteUrl, username, token, "categories", post.categories);
    }
    if (post.tags?.length) {
      body.tags = await this.resolveTermIds(siteUrl, username, token, "tags", post.tags);
    }
    if (post.featuredMediaId) {
      body.featured_media = post.featuredMediaId;
    }

    const res = await wpFetch(wpApiUrl(siteUrl, "/posts"), username, token, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const wpPost = await res.json();
    return { platformPostId: String(wpPost.id), platformUrl: wpPost.link };
  }

  async updatePost(
    siteUrl: string,
    username: string,
    token: string,
    platformPostId: string,
    post: PublishPayload
  ): Promise<PlatformPostResult> {
    const body: Record<string, unknown> = {
      title: post.title,
      content: post.content,
      excerpt: post.excerpt || "",
    };
    if (post.categories?.length) {
      body.categories = await this.resolveTermIds(siteUrl, username, token, "categories", post.categories);
    }
    if (post.tags?.length) {
      body.tags = await this.resolveTermIds(siteUrl, username, token, "tags", post.tags);
    }
    if (post.featuredMediaId) {
      body.featured_media = post.featuredMediaId;
    }

    validatePlatformPostId(platformPostId);
    const res = await wpFetch(wpApiUrl(siteUrl, `/posts/${platformPostId}`), username, token, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const wpPost = await res.json();
    return { platformPostId: String(wpPost.id), platformUrl: wpPost.link };
  }

  async deletePost(
    siteUrl: string,
    username: string,
    token: string,
    platformPostId: string
  ): Promise<void> {
    validatePlatformPostId(platformPostId);
    // force=true bypasses WP trash
    await wpFetch(wpApiUrl(siteUrl, `/posts/${platformPostId}?force=true`), username, token, {
      method: "DELETE",
    });
  }

  validateContent(title: string, content: string): ContentValidation {
    const errors: string[] = [];
    if (!title?.trim()) errors.push("Title is required");
    if (!content?.trim()) errors.push("Content is required");
    if (content && content.length > this.maxContentLength) {
      errors.push(`Content exceeds max length of ${this.maxContentLength} characters`);
    }
    return { valid: errors.length === 0, errors };
  }

  async uploadMedia(
    siteUrl: string,
    username: string,
    token: string,
    file: Buffer,
    fileName: string,
    mimeType: string
  ): Promise<MediaUploadResult> {
    const res = await wpFetch(wpApiUrl(siteUrl, "/media"), username, token, {
      method: "POST",
      headers: {
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Type": mimeType,
      },
      body: new Uint8Array(file),
    });
    const media = await res.json();
    return { platformMediaId: media.id, url: media.source_url };
  }

  async getMetrics(
    siteUrl: string,
    username: string,
    token: string,
    platformPostId: string
  ): Promise<PlatformMetrics> {
    validatePlatformPostId(platformPostId);
    // Try WP Statistics plugin API first, fallback to comment count
    try {
      const statsRes = await wpFetch(
        wpApiUrl(siteUrl, `/statistic/post/${platformPostId}`),
        username, token
      );
      const stats = await statsRes.json();
      return {
        views: stats.views ?? stats.hits ?? 0,
        likes: 0, // WP doesn't have native likes
        shares: 0,
        comments: stats.comments ?? 0,
        clicks: stats.views ?? 0, // Approximate clicks = views for WP
      };
    } catch {
      // Fallback: just fetch the post for comment count
      try {
        const postRes = await wpFetch(
          wpApiUrl(siteUrl, `/posts/${platformPostId}?_fields=id,comment_count`),
          username, token
        );
        const post = await postRes.json();
        return {
          views: 0,
          likes: 0,
          shares: 0,
          comments: typeof post.comment_count === "number" ? post.comment_count : 0,
          clicks: 0,
        };
      } catch {
        return { views: 0, likes: 0, shares: 0, comments: 0, clicks: 0 };
      }
    }
  }

  // Resolves category/tag names to WP term IDs, creating terms if they don't exist
  private async resolveTermIds(
    siteUrl: string,
    username: string,
    token: string,
    taxonomy: "categories" | "tags",
    names: string[]
  ): Promise<number[]> {
    const ids: number[] = [];
    for (const name of names) {
      // Search for existing term
      const searchRes = await wpFetch(
        wpApiUrl(siteUrl, `/${taxonomy}?search=${encodeURIComponent(name)}&per_page=1`),
        username,
        token
      );
      const existing = await searchRes.json();
      if (existing.length > 0) {
        ids.push(existing[0].id);
      } else {
        // Create new term
        const createRes = await wpFetch(wpApiUrl(siteUrl, `/${taxonomy}`), username, token, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name }),
        });
        const created = await createRes.json();
        ids.push(created.id);
      }
    }
    return ids;
  }
}
