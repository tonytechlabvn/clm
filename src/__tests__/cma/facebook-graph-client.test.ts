import { describe, it, expect, beforeEach, vi } from "vitest";
import { fbGraphFetch, isFbRateLimitError } from "@/lib/cma/adapters/facebook-graph-client";

// Mock fetch globally
global.fetch = vi.fn();

describe("facebook-graph-client", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fbGraphFetch", () => {
    it("makes request to correct URL", async () => {
      const mockResponse = new Response(JSON.stringify({ id: "123" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

      await fbGraphFetch("/me", "test-token");

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("https://graph.facebook.com/v21.0/me"),
        expect.any(Object)
      );
    });

    it("uses Bearer token in Authorization header", async () => {
      const mockResponse = new Response(JSON.stringify({ id: "123" }), {
        status: 200,
      });
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

      const token = "test-token-abc123";
      await fbGraphFetch("/me", token);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );
    });

    it("handles full URLs without prepending base", async () => {
      const mockResponse = new Response(JSON.stringify({ id: "123" }), {
        status: 200,
      });
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

      const fullUrl = "https://graph.facebook.com/v21.0/custom/path";
      await fbGraphFetch(fullUrl, "test-token");

      expect(global.fetch).toHaveBeenCalledWith(
        fullUrl,
        expect.any(Object)
      );
    });

    it("merges custom headers with Authorization header", async () => {
      const mockResponse = new Response(JSON.stringify({ id: "123" }), {
        status: 200,
      });
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

      await fbGraphFetch("/me", "test-token", {
        headers: { "X-Custom": "value" },
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Bearer"),
            "X-Custom": "value",
          }),
        })
      );
    });

    it("passes through request options", async () => {
      const mockResponse = new Response(JSON.stringify({ id: "123" }), {
        status: 200,
      });
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

      await fbGraphFetch("/me", "test-token", {
        method: "POST",
        body: JSON.stringify({ key: "value" }),
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ key: "value" }),
        })
      );
    });

    it("returns response on success", async () => {
      const mockResponse = new Response(JSON.stringify({ id: "123", name: "Test" }), {
        status: 200,
      });
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

      const result = await fbGraphFetch("/me", "test-token");

      expect(result).toBe(mockResponse);
      expect(result.ok).toBe(true);
    });

    it("throws error on non-200 response with JSON error body", async () => {
      const errorBody = {
        error: {
          message: "Invalid token",
          type: "OAuthException",
          code: 190,
        },
      };
      const mockResponse = new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

      await expect(fbGraphFetch("/me", "bad-token")).rejects.toThrow(
        "Facebook API error 190: Invalid token"
      );
    });

    it("throws error on non-200 response without JSON error body", async () => {
      const mockResponse = new Response("Internal Server Error", {
        status: 500,
      });
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

      await expect(fbGraphFetch("/me", "test-token")).rejects.toThrow(
        "Facebook API error 500"
      );
    });

    it("sanitizes access token from error messages", async () => {
      const token = "test-token-secret-12345";
      const errorBody = {
        error: {
          message: `Error with token ${token}`,
          type: "Error",
          code: 400,
        },
      };
      const mockResponse = new Response(JSON.stringify(errorBody), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

      try {
        await fbGraphFetch("/me", token);
      } catch (error) {
        expect((error as Error).message).toContain("[REDACTED]");
        expect((error as Error).message).not.toContain(token);
      }
    });

    it("sanitizes token-like patterns (EAAx format) from errors", async () => {
      const errorBody = {
        error: {
          message: "Error: EAABrandom1234567890abc passed token",
          type: "Error",
          code: 400,
        },
      };
      const mockResponse = new Response(JSON.stringify(errorBody), {
        status: 400,
      });
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

      await expect(fbGraphFetch("/me", "test-token")).rejects.toThrow("[REDACTED]");
    });
  });

  describe("isFbRateLimitError", () => {
    it("returns true for error code 32", () => {
      const error = new Error("Facebook API error 32: Rate limit exceeded");
      expect(isFbRateLimitError(error)).toBe(true);
    });

    it("returns true for error code 4", () => {
      const error = new Error("Facebook API error 4: Application request limit reached");
      expect(isFbRateLimitError(error)).toBe(true);
    });

    it("returns false for other error codes", () => {
      const error = new Error("Facebook API error 190: Invalid token");
      expect(isFbRateLimitError(error)).toBe(false);
    });

    it("returns false for non-Error objects", () => {
      expect(isFbRateLimitError("not an error")).toBe(false);
      expect(isFbRateLimitError(null)).toBe(false);
      expect(isFbRateLimitError(undefined)).toBe(false);
      expect(isFbRateLimitError({ message: "test" })).toBe(false);
    });

    it("returns false for Error objects without rate limit codes", () => {
      const error = new Error("Some other error");
      expect(isFbRateLimitError(error)).toBe(false);
    });

    it("handles error code 32 in different message formats", () => {
      const error1 = new Error("error 32: rate limited");
      const error2 = new Error("Facebook API error 32: exceeded");
      expect(isFbRateLimitError(error1)).toBe(true);
      expect(isFbRateLimitError(error2)).toBe(true);
    });

    it("handles error code 4 in different message formats", () => {
      const error1 = new Error("error 4: limit");
      const error2 = new Error("Facebook API error 4: app limit");
      expect(isFbRateLimitError(error1)).toBe(true);
      expect(isFbRateLimitError(error2)).toBe(true);
    });
  });

  describe("error handling edge cases", () => {
    it("handles malformed JSON error response", async () => {
      const mockResponse = new Response("{ invalid json", {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

      await expect(fbGraphFetch("/me", "test-token")).rejects.toThrow(
        "Facebook API error 400"
      );
    });

    it("handles error response without error field", async () => {
      const mockResponse = new Response(JSON.stringify({ message: "Something broke" }), {
        status: 500,
      });
      vi.mocked(global.fetch).mockResolvedValueOnce(mockResponse);

      await expect(fbGraphFetch("/me", "test-token")).rejects.toThrow(
        "Facebook API error 500"
      );
    });

    it("handles network errors", async () => {
      vi.mocked(global.fetch).mockRejectedValueOnce(new Error("Network error"));

      await expect(fbGraphFetch("/me", "test-token")).rejects.toThrow("Network error");
    });
  });
});
