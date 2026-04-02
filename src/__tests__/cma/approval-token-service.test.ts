import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generateApprovalToken,
  verifyApprovalToken,
  buildApprovalUrl,
} from "@/lib/cma/services/approval-token-service";

// Mock environment variables
const originalEnv = process.env;

describe("approval-token-service", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.JWT_APPROVAL_SECRET = "test-secret-key-for-signing";
    process.env.NEXT_PUBLIC_APP_URL = "https://test.clm.com";
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("generateApprovalToken", () => {
    it("generates valid HMAC-signed token", () => {
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      expect(token).toBeTruthy();
      expect(typeof token).toBe("string");
    });

    it("token contains two parts separated by dot", () => {
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      const parts = token.split(".");
      expect(parts).toHaveLength(2);
    });

    it("first part is base64url encoded payload", () => {
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      const [encoded] = token.split(".");
      // Should be valid base64url (no padding)
      expect(/^[A-Za-z0-9_-]+$/.test(encoded)).toBe(true);
    });

    it("second part is base64url encoded signature", () => {
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      const [, sig] = token.split(".");
      expect(/^[A-Za-z0-9_-]+$/.test(sig)).toBe(true);
    });

    it("different payloads produce different tokens", () => {
      const token1 = generateApprovalToken("post-1", "org-1", "user-1", "approve");
      const token2 = generateApprovalToken("post-2", "org-2", "user-2", "reject");
      expect(token1).not.toBe(token2);
    });

    it("generates different token each time (different exp)", async () => {
      const token1 = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      // Wait to ensure different exp timestamp
      await new Promise(resolve => setTimeout(resolve, 2));
      const token2 = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      expect(token1).not.toBe(token2);
    });

    it("includes action in encoded payload", () => {
      const approveToken = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      const rejectToken = generateApprovalToken("post-123", "org-456", "user-789", "reject");
      expect(approveToken).not.toBe(rejectToken);
    });

    it("throws error when neither JWT_APPROVAL_SECRET nor CMA_ENCRYPTION_KEY set", () => {
      delete process.env.JWT_APPROVAL_SECRET;
      delete process.env.CMA_ENCRYPTION_KEY;
      expect(() => {
        generateApprovalToken("post-123", "org-456", "user-789", "approve");
      }).toThrow(/Missing JWT_APPROVAL_SECRET or CMA_ENCRYPTION_KEY/);
    });

    it("falls back to CMA_ENCRYPTION_KEY if JWT_APPROVAL_SECRET not set", () => {
      delete process.env.JWT_APPROVAL_SECRET;
      process.env.CMA_ENCRYPTION_KEY = "fallback-secret";
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      expect(token).toBeTruthy();
    });
  });

  describe("verifyApprovalToken", () => {
    it("verifies valid token", () => {
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      const payload = verifyApprovalToken(token);
      expect(payload).toBeTruthy();
    });

    it("returns null for invalid token format", () => {
      const result = verifyApprovalToken("invalid.token.format");
      expect(result).toBeNull();
    });

    it("returns null for tampered signature", () => {
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      const [encoded] = token.split(".");
      // Tamper with signature
      const tamperedToken = `${encoded}.invalidsignature`;
      const result = verifyApprovalToken(tamperedToken);
      expect(result).toBeNull();
    });

    it("returns null for tampered payload", () => {
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      const [, sig] = token.split(".");
      // Tamper with payload
      const badPayload = Buffer.from(JSON.stringify({ postId: "different" })).toString(
        "base64url"
      );
      const tamperedToken = `${badPayload}.${sig}`;
      const result = verifyApprovalToken(tamperedToken);
      expect(result).toBeNull();
    });

    it("decodes payload correctly", () => {
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      const payload = verifyApprovalToken(token);
      expect(payload?.postId).toBe("post-123");
      expect(payload?.orgId).toBe("org-456");
      expect(payload?.userId).toBe("user-789");
      expect(payload?.action).toBe("approve");
    });

    it("includes expiry in payload", () => {
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      const payload = verifyApprovalToken(token);
      expect(payload?.exp).toBeTruthy();
      expect(typeof payload?.exp).toBe("number");
    });

    it("returns null for empty token", () => {
      const result = verifyApprovalToken("");
      expect(result).toBeNull();
    });

    it("returns null for token with missing parts", () => {
      const result = verifyApprovalToken("onlyonepart");
      expect(result).toBeNull();
    });

    it("returns null for token with invalid base64", () => {
      const result = verifyApprovalToken("!!!invalid!!!.!!!invalid!!!");
      expect(result).toBeNull();
    });

    it("returns null when secret not available during verification", () => {
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      delete process.env.JWT_APPROVAL_SECRET;
      delete process.env.CMA_ENCRYPTION_KEY;
      // verifyApprovalToken calls getSecret which throws, caught in try block, returns null
      const result = verifyApprovalToken(token);
      expect(result).toBeNull();
    });

    it("returns null for expired token", () => {
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      const payload = verifyApprovalToken(token);
      // Manually create an expired token
      const expiredPayload = {
        postId: "post-123",
        orgId: "org-456",
        userId: "user-789",
        action: "approve" as const,
        exp: Date.now() - 1000, // 1 second ago
      };
      const encoded = Buffer.from(JSON.stringify(expiredPayload)).toString("base64url");
      const { createHmac } = require("crypto");
      const sig = createHmac("sha256", process.env.JWT_APPROVAL_SECRET!)
        .update(encoded)
        .digest("base64url");
      const expiredToken = `${encoded}.${sig}`;
      const result = verifyApprovalToken(expiredToken);
      expect(result).toBeNull();
    });

    it("token remains valid before expiry", () => {
      const beforeGen = Date.now();
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      const payload = verifyApprovalToken(token);
      // Token has 1h expiry (3600000 ms)
      const timeUntilExpiry = payload!.exp - beforeGen;
      // Allow 100ms variance due to test execution time
      expect(timeUntilExpiry).toBeGreaterThan(60 * 60 * 1000 - 100); // > 1h - 100ms
      expect(timeUntilExpiry).toBeLessThanOrEqual(60 * 60 * 1000 + 100); // <= 1h + 100ms
    });
  });

  describe("buildApprovalUrl", () => {
    it("builds valid approval URL with token", () => {
      const url = buildApprovalUrl("post-123", "org-456", "user-789", "approve");
      expect(url).toContain("https://test.clm.com");
      expect(url).toContain("/api/cma/approval/post-123/quick");
      expect(url).toContain("token=");
      expect(url).toContain("action=approve");
    });

    it("includes token parameter", () => {
      const url = buildApprovalUrl("post-123", "org-456", "user-789", "approve");
      const tokenMatch = url.match(/token=([^&]+)/);
      expect(tokenMatch).toBeTruthy();
      const token = tokenMatch![1];
      expect(token).toContain(".");
    });

    it("includes action parameter", () => {
      const approveUrl = buildApprovalUrl("post-123", "org-456", "user-789", "approve");
      expect(approveUrl).toContain("action=approve");

      const rejectUrl = buildApprovalUrl("post-123", "org-456", "user-789", "reject");
      expect(rejectUrl).toContain("action=reject");
    });

    it("uses NEXT_PUBLIC_APP_URL as base", () => {
      const url = buildApprovalUrl("post-123", "org-456", "user-789", "approve");
      expect(url.startsWith(process.env.NEXT_PUBLIC_APP_URL!)).toBe(true);
    });

    it("falls back to default URL if NEXT_PUBLIC_APP_URL not set", () => {
      delete process.env.NEXT_PUBLIC_APP_URL;
      const url = buildApprovalUrl("post-123", "org-456", "user-789", "approve");
      expect(url).toContain("https://clm.tonytechlab.com");
    });

    it("token in URL is verifiable", () => {
      const url = buildApprovalUrl("post-123", "org-456", "user-789", "approve");
      const tokenMatch = url.match(/token=([^&]+)/);
      const token = tokenMatch![1];
      const payload = verifyApprovalToken(token);
      expect(payload?.postId).toBe("post-123");
      expect(payload?.action).toBe("approve");
    });

    it("builds different URLs for different actions", () => {
      const approveUrl = buildApprovalUrl("post-123", "org-456", "user-789", "approve");
      const rejectUrl = buildApprovalUrl("post-123", "org-456", "user-789", "reject");
      expect(approveUrl).not.toBe(rejectUrl);
    });

    it("URL is properly encoded for query parameters", () => {
      const url = buildApprovalUrl("post-123", "org-456", "user-789", "approve");
      // Should be valid URL
      expect(() => new URL(url)).not.toThrow();
    });

    it("token in URL varies due to exp timestamp", async () => {
      const url1 = buildApprovalUrl("post-123", "org-456", "user-789", "approve");
      // Wait to ensure different exp timestamp
      await new Promise(resolve => setTimeout(resolve, 2));
      const url2 = buildApprovalUrl("post-123", "org-456", "user-789", "approve");
      // URLs should be different because exp changes
      expect(url1).not.toBe(url2);
    });
  });

  describe("round-trip verification", () => {
    it("token generated and verified maintains payload integrity", () => {
      const postId = "post-xyz";
      const orgId = "org-abc";
      const userId = "user-def";
      const action = "approve" as const;

      const token = generateApprovalToken(postId, orgId, userId, action);
      const verified = verifyApprovalToken(token);

      expect(verified).toBeTruthy();
      expect(verified?.postId).toBe(postId);
      expect(verified?.orgId).toBe(orgId);
      expect(verified?.userId).toBe(userId);
      expect(verified?.action).toBe(action);
    });

    it("token survives URL encoding/decoding", () => {
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      const encoded = encodeURIComponent(token);
      const decoded = decodeURIComponent(encoded);
      const verified = verifyApprovalToken(decoded);
      expect(verified).toBeTruthy();
      expect(verified?.postId).toBe("post-123");
    });

    it("multiple tokens with same payload are independent", async () => {
      const token1 = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      // Wait to ensure different exp timestamp
      await new Promise(resolve => setTimeout(resolve, 2));
      const token2 = generateApprovalToken("post-123", "org-456", "user-789", "approve");

      const payload1 = verifyApprovalToken(token1);
      const payload2 = verifyApprovalToken(token2);

      expect(payload1).toBeTruthy();
      expect(payload2).toBeTruthy();
      // exp timestamps will be different
      expect(payload1?.exp).not.toBe(payload2?.exp);
    });
  });

  describe("security properties", () => {
    it("changing secret invalidates tokens", () => {
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      const verified1 = verifyApprovalToken(token);
      expect(verified1).toBeTruthy();

      // Change secret
      process.env.JWT_APPROVAL_SECRET = "different-secret-key";

      const verified2 = verifyApprovalToken(token);
      expect(verified2).toBeNull();
    });

    it("token signature is HMAC-SHA256 based", () => {
      const token = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      const [encoded, sig] = token.split(".");
      // Verify signature is 43 chars (SHA256 in base64url is 43 chars)
      expect(sig.length).toBe(43);
    });

    it("different actions produce different tokens", () => {
      const approveToken = generateApprovalToken("post-123", "org-456", "user-789", "approve");
      const rejectToken = generateApprovalToken("post-123", "org-456", "user-789", "reject");
      expect(approveToken).not.toBe(rejectToken);

      const approveParsed = verifyApprovalToken(approveToken);
      const rejectParsed = verifyApprovalToken(rejectToken);
      expect(approveParsed?.action).toBe("approve");
      expect(rejectParsed?.action).toBe("reject");
    });
  });
});
