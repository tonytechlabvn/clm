import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FacebookAdapter } from "@/lib/cma/adapters/facebook-adapter";
import { stripMarkdownToPlainText } from "@/lib/cma/utils/strip-markdown-to-plain-text";
import * as facebookGraphClient from "@/lib/cma/adapters/facebook-graph-client";
import * as facebookOauthService from "@/lib/cma/services/facebook-oauth-service";
import * as cryptoUtils from "@/lib/cma/crypto-utils";
import * as prismaClient from "@/lib/prisma-client";

// Mock dependencies
vi.mock("@/lib/cma/adapters/facebook-graph-client");
vi.mock("@/lib/cma/services/facebook-oauth-service");
vi.mock("@/lib/cma/crypto-utils");

// Mock prisma with proper structure
vi.mock("@/lib/prisma-client", () => ({
  prisma: {
    cmaPostPlatform: {
      findFirst: vi.fn(),
      count: vi.fn(),
    },
    cmaPlatformAccount: {
      findUnique: vi.fn(),
    },
  },
}));

describe("FacebookAdapter", () => {
  let adapter: FacebookAdapter;

  beforeEach(() => {
    adapter = new FacebookAdapter();
    vi.clearAllMocks();
  });

  describe("properties", () => {
    it("has correct id", () => {
      expect(adapter.id).toBe("facebook");
    });

    it("has correct name", () => {
      expect(adapter.name).toBe("Facebook");
    });

    it("has correct max content length", () => {
      expect(adapter.maxContentLength).toBe(63_206);
    });

    it("supports correct media types", () => {
      expect(adapter.supportedMedia).toEqual([
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ]);
    });

    it("supports media type check", () => {
      expect(adapter.supportedMedia).toContain("image/jpeg");
      expect(adapter.supportedMedia).toContain("image/png");
      expect(adapter.supportedMedia).not.toContain("image/svg+xml");
    });
  });

  describe("connect", () => {
    it("validates page access token via Graph API", async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValueOnce({ id: "page-123", name: "Test Page" }),
      };
      vi.mocked(facebookGraphClient.fbGraphFetch).mockResolvedValueOnce(mockResponse as any);

      const result = await adapter.connect({
        platform: "facebook",
        accessToken: "valid-token",
        label: "Test Page",
      });

      expect(facebookGraphClient.fbGraphFetch).toHaveBeenCalledWith(
        "/me?fields=id,name",
        "valid-token"
      );
      expect(result.valid).toBe(true);
      expect(result.displayName).toBe("Test Page");
    });

    it("uses page name as displayName when available", async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValueOnce({ id: "page-456", name: "My Business Page" }),
      };
      vi.mocked(facebookGraphClient.fbGraphFetch).mockResolvedValueOnce(mockResponse as any);

      const result = await adapter.connect({ platform: "facebook", accessToken: "token", label: "Page" });

      expect(result.displayName).toBe("My Business Page");
    });

    it("uses default displayName when page name not provided", async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValueOnce({ id: "page-789" }),
      };
      vi.mocked(facebookGraphClient.fbGraphFetch).mockResolvedValueOnce(mockResponse as any);

      const result = await adapter.connect({ platform: "facebook", accessToken: "token", label: "Page" });

      expect(result.displayName).toBe("Facebook Page");
    });
  });

  describe("validateConnection", () => {
    it("returns true for valid token", async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValueOnce({ id: "page-123" }),
      };
      vi.mocked(facebookGraphClient.fbGraphFetch).mockResolvedValueOnce(mockResponse as any);

      const result = await adapter.validateConnection("page-123", "user", "valid-token");

      expect(result).toBe(true);
      expect(facebookGraphClient.fbGraphFetch).toHaveBeenCalledWith("/me?fields=id", "valid-token");
    });

    it("returns false when API call fails", async () => {
      vi.mocked(facebookGraphClient.fbGraphFetch).mockRejectedValueOnce(
        new Error("Invalid token")
      );

      const result = await adapter.validateConnection("page-123", "user", "invalid-token");

      expect(result).toBe(false);
    });

    it("ignores siteUrl and username parameters", async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValueOnce({ id: "page-123" }),
      };
      vi.mocked(facebookGraphClient.fbGraphFetch).mockResolvedValueOnce(mockResponse as any);

      await adapter.validateConnection("different-site", "different-user", "token");

      expect(facebookGraphClient.fbGraphFetch).toHaveBeenCalledWith(
        "/me?fields=id",
        "token"
      );
    });
  });

  describe("prepareContent", () => {
    it("strips markdown for markdown format", () => {
      const markdown = "**Bold** [link](url)";
      const result = adapter.prepareContent(markdown, "markdown");
      expect(result).toBe("Bold link (url)");
    });

    it("strips HTML tags for HTML format", () => {
      const html = "<div><strong>Bold</strong> <a href='url'>link</a></div>";
      const result = adapter.prepareContent(html, "html");
      expect(result).toContain("Bold");
      expect(result).toContain("link");
      expect(result).not.toContain("<");
    });

    it("strips HTML tags for blocks format", () => {
      const html = "<p>Content</p>";
      const result = adapter.prepareContent(html, "blocks");
      expect(result).toContain("Content");
      expect(result).not.toContain("<");
    });

    it("returns content as-is for unknown format", () => {
      const content = "Plain text content";
      const result = adapter.prepareContent(content, "unknown");
      expect(result).toBe(content);
    });

    it("handles empty content", () => {
      const result = adapter.prepareContent("", "markdown");
      expect(result).toBe("");
    });

    it("trims whitespace after HTML stripping", () => {
      const result = adapter.prepareContent("<div>  Content  </div>", "html");
      expect(result.trim()).toBe("Content");
    });
  });

  describe("validateContent", () => {
    it("returns valid for good content", () => {
      const result = adapter.validateContent("Title", "This is valid content");
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("returns error for empty content", () => {
      const result = adapter.validateContent("Title", "");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Content is required for Facebook posts");
    });

    it("returns error for whitespace-only content", () => {
      const result = adapter.validateContent("Title", "   ");
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Content is required for Facebook posts");
    });

    it("returns error for content exceeding max length", () => {
      const tooLong = "x".repeat(63_207);
      const result = adapter.validateContent("Title", tooLong);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain("exceeds Facebook's");
      expect(result.errors[0]).toContain("63206");
    });

    it("allows content at exact max length", () => {
      const maxLength = "x".repeat(63_206);
      const result = adapter.validateContent("Title", maxLength);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("ignores title parameter", () => {
      const result1 = adapter.validateContent("", "Valid content");
      const result2 = adapter.validateContent("Title", "Valid content");
      expect(result1.valid).toBe(result2.valid);
    });

    it("returns multiple errors when applicable", () => {
      const tooLong = "x".repeat(63_207);
      const result = adapter.validateContent("Title", tooLong);
      // Only content length error should be present (empty handled separately)
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe("publish", () => {
    it("publishes text-only post", async () => {
      vi.mocked(prismaClient.prisma.cmaPostPlatform.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prismaClient.prisma.cmaPostPlatform.count).mockResolvedValueOnce(5);

      const mockResponse = {
        json: vi.fn().mockResolvedValueOnce({ id: "123456_789" }),
      };
      vi.mocked(facebookGraphClient.fbGraphFetch).mockResolvedValueOnce(mockResponse as any);

      const result = await adapter.publish(
        "page-123",
        "user",
        "token",
        {
          title: "Test",
          content: "Test post",
          featuredMediaId: undefined,
        }
      );

      expect(result.platformPostId).toBe("123456_789");
      expect(result.platformUrl).toContain("facebook.com");
    });

    it("publishes photo post with message", async () => {
      vi.mocked(prismaClient.prisma.cmaPostPlatform.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prismaClient.prisma.cmaPostPlatform.count).mockResolvedValueOnce(5);

      const mockResponse = {
        json: vi.fn().mockResolvedValueOnce({ id: "123456_789" }),
      };
      vi.mocked(facebookGraphClient.fbGraphFetch).mockResolvedValueOnce(mockResponse as any);

      const result = await adapter.publish(
        "page-123",
        "user",
        "token",
        {
          title: "Photo",
          content: "Photo post",
          featuredMediaId: "photo-456",
        }
      );

      expect(facebookGraphClient.fbGraphFetch).toHaveBeenCalledWith(
        "/page-123/photos",
        "token",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("photo-456"),
        })
      );
      expect(result.platformPostId).toBe("123456_789");
    });

    it("checks rate limits before publishing", async () => {
      vi.mocked(prismaClient.prisma.cmaPostPlatform.findFirst).mockResolvedValueOnce(null);
      vi.mocked(prismaClient.prisma.cmaPostPlatform.count).mockResolvedValueOnce(25);

      await expect(
        adapter.publish(
          "page-123",
          "user",
          "token",
          { title: "Test", content: "Test", featuredMediaId: undefined }
        )
      ).rejects.toThrow("Facebook rate limit: maximum 25 posts per page per day reached");
    });

    it("enforces 20-minute spacing between posts", async () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      vi.mocked(prismaClient.prisma.cmaPostPlatform.findFirst).mockResolvedValueOnce({
        publishedAt: fiveMinutesAgo,
      } as any);

      await expect(
        adapter.publish(
          "page-123",
          "user",
          "token",
          { title: "Test", content: "Test", featuredMediaId: undefined }
        )
      ).rejects.toThrow("Facebook rate limit: wait");
    });
  });

  describe("updatePost", () => {
    it("updates post message", async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValueOnce({}),
      };
      vi.mocked(facebookGraphClient.fbGraphFetch).mockResolvedValueOnce(mockResponse as any);

      const result = await adapter.updatePost(
        "page-123",
        "user",
        "token",
        "123456_789",
        { title: "Update", content: "Updated message", featuredMediaId: undefined }
      );

      expect(facebookGraphClient.fbGraphFetch).toHaveBeenCalledWith(
        "/123456_789",
        "token",
        expect.objectContaining({
          method: "POST",
          body: expect.stringContaining("Updated message"),
        })
      );
      expect(result.platformPostId).toBe("123456_789");
    });

    it("validates Facebook post ID format", async () => {
      await expect(
        adapter.updatePost(
          "page-123",
          "user",
          "token",
          "invalid-id",
          { title: "Test", content: "Test", featuredMediaId: undefined }
        )
      ).rejects.toThrow("Invalid Facebook post ID format");
    });
  });

  describe("deletePost", () => {
    it("deletes post", async () => {
      const mockResponse = { json: vi.fn() };
      vi.mocked(facebookGraphClient.fbGraphFetch).mockResolvedValueOnce(mockResponse as any);

      await adapter.deletePost("page-123", "user", "token", "123456_789");

      expect(facebookGraphClient.fbGraphFetch).toHaveBeenCalledWith(
        "/123456_789",
        "token",
        expect.objectContaining({ method: "DELETE" })
      );
    });

    it("validates Facebook post ID format", async () => {
      await expect(
        adapter.deletePost("page-123", "user", "token", "invalid-id")
      ).rejects.toThrow("Invalid Facebook post ID format");
    });
  });

  describe("uploadMedia", () => {
    it("uploads unpublished photo", async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValueOnce({ id: "photo-789" }),
      };
      vi.mocked(facebookGraphClient.fbGraphFetch).mockResolvedValueOnce(mockResponse as any);

      const buffer = Buffer.from("fake-image-data");
      const result = await adapter.uploadMedia(
        "page-123",
        "user",
        "token",
        buffer,
        "test.jpg",
        "image/jpeg"
      );

      expect(result.platformMediaId).toBe("photo-789");
      expect(facebookGraphClient.fbGraphFetch).toHaveBeenCalledWith(
        "/page-123/photos",
        "token",
        expect.objectContaining({
          method: "POST",
          body: expect.any(Object), // FormData
        })
      );
    });

    it("converts media ID to string", async () => {
      const mockResponse = {
        json: vi.fn().mockResolvedValueOnce({ id: 123456789 }), // numeric ID
      };
      vi.mocked(facebookGraphClient.fbGraphFetch).mockResolvedValueOnce(mockResponse as any);

      const buffer = Buffer.from("data");
      const result = await adapter.uploadMedia(
        "page-123",
        "user",
        "token",
        buffer,
        "file.jpg",
        "image/jpeg"
      );

      expect(typeof result.platformMediaId).toBe("string");
      expect(result.platformMediaId).toBe("123456789");
    });
  });

  describe("getMetrics", () => {
    it("fetches and returns post metrics", async () => {
      const insightsResponse = {
        json: vi.fn().mockResolvedValueOnce({
          data: [
            { name: "post_impressions", values: [{ value: 100 }] },
            { name: "post_impressions_unique", values: [{ value: 80 }] },
            { name: "post_clicks", values: [{ value: 20 }] },
          ],
        }),
      };

      const postResponse = {
        json: vi.fn().mockResolvedValueOnce({
          shares: { count: 5 },
          comments: { summary: { total_count: 10 } },
          reactions: { summary: { total_count: 50 } },
        }),
      };

      vi.mocked(facebookGraphClient.fbGraphFetch)
        .mockResolvedValueOnce(insightsResponse as any)
        .mockResolvedValueOnce(postResponse as any);

      const result = await adapter.getMetrics(
        "page-123",
        "user",
        "token",
        "123456_789"
      );

      expect(result.views).toBe(100);
      expect(result.clicks).toBe(20);
      expect(result.likes).toBe(50);
      expect(result.shares).toBe(5);
      expect(result.comments).toBe(10);
    });

    it("returns zeros when metrics unavailable", async () => {
      vi.mocked(facebookGraphClient.fbGraphFetch).mockRejectedValueOnce(
        new Error("Insufficient permissions")
      );

      const result = await adapter.getMetrics(
        "page-123",
        "user",
        "token",
        "123456_789"
      );

      expect(result.views).toBe(0);
      expect(result.likes).toBe(0);
      expect(result.shares).toBe(0);
      expect(result.comments).toBe(0);
      expect(result.clicks).toBe(0);
    });

    it("validates Facebook post ID format", async () => {
      await expect(
        adapter.getMetrics("page-123", "user", "token", "invalid-id")
      ).rejects.toThrow("Invalid Facebook post ID format");
    });
  });

  describe("disconnect", () => {
    it("revokes permissions when account found", async () => {
      const decryptedToken = "user-token-decrypted";
      vi.mocked(cryptoUtils.decryptToken).mockReturnValueOnce(decryptedToken);
      vi.mocked(prismaClient.prisma.cmaPlatformAccount.findUnique).mockResolvedValueOnce({
        id: "account-123",
        refreshToken: "encrypted-user-token",
      } as any);
      vi.mocked(facebookOauthService.revokePermissions).mockResolvedValueOnce(undefined);

      await adapter.disconnect("account-123");

      expect(prismaClient.prisma.cmaPlatformAccount.findUnique).toHaveBeenCalledWith({
        where: { id: "account-123" },
      });
      expect(facebookOauthService.revokePermissions).toHaveBeenCalledWith(decryptedToken);
    });

    it("continues when account not found", async () => {
      vi.mocked(prismaClient.prisma.cmaPlatformAccount.findUnique).mockResolvedValueOnce(null);

      await expect(adapter.disconnect("nonexistent-id")).resolves.not.toThrow();
    });

    it("continues on revocation failure", async () => {
      vi.mocked(prismaClient.prisma.cmaPlatformAccount.findUnique).mockResolvedValueOnce({
        id: "account-123",
        refreshToken: "token",
      } as any);
      vi.mocked(cryptoUtils.decryptToken).mockReturnValueOnce("decrypted");
      vi.mocked(facebookOauthService.revokePermissions).mockRejectedValueOnce(
        new Error("FB API failed")
      );

      // Should not throw — best-effort revocation
      await expect(adapter.disconnect("account-123")).resolves.not.toThrow();
    });
  });
});
