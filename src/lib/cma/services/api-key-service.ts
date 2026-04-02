// API key authentication service — generate, validate, revoke keys for external API access

import { randomBytes, createHmac } from "crypto";
import { prisma } from "@/lib/prisma-client";
import type { OrgAuthContext } from "./org-auth";

const KEY_PREFIX = "clm_";
const KEY_RANDOM_BYTES = 24; // 32 base62 chars
function getHmacSecret(): string {
  const key = process.env.CMA_ENCRYPTION_KEY;
  if (!key) throw new Error("CMA_ENCRYPTION_KEY is required for API key authentication");
  return key;
}

// ─── In-memory rate limiter (resets on restart, not shared across instances) ───

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60; // 60 requests per minute per key

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Prune stale entries every 5 minutes to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  rateLimitMap.forEach((entry, key) => {
    if (now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) rateLimitMap.delete(key);
  });
}, 5 * 60_000).unref();

/** Returns true if request is allowed, false if rate-limited */
function checkRateLimit(keyId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(keyId);

  if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(keyId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

// ─── Key hashing ───

/** HMAC-SHA256 hash — fast, suitable for high-entropy machine-generated keys */
function hashKey(plaintext: string): string {
  return createHmac("sha256", getHmacSecret()).update(plaintext).digest("hex");
}

// ─── Key generation ───

/** Base62 charset for URL-safe random strings */
const BASE62 = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";

function randomBase62(length: number): string {
  const bytes = randomBytes(length);
  let result = "";
  for (let i = 0; i < length; i++) {
    result += BASE62[bytes[i] % 62];
  }
  return result;
}

/**
 * Generate a new API key for user+org. Returns the plaintext key (shown once).
 * Key format: clm_ + 32 random base62 chars
 */
export async function generateApiKey(
  userId: string,
  orgId: string,
  name: string,
  expiresAt?: Date
): Promise<{ key: string; keyId: string; keyPrefix: string }> {
  const randomPart = randomBase62(32);
  const plaintext = `${KEY_PREFIX}${randomPart}`;
  const keyHash = hashKey(plaintext);
  const keyPrefix = plaintext.slice(0, 8); // "clm_xxxx"

  const record = await prisma.apiKey.create({
    data: { name, keyHash, keyPrefix, userId, orgId, expiresAt },
  });

  return { key: plaintext, keyId: record.id, keyPrefix };
}

export class RateLimitError extends Error {
  constructor() {
    super("Rate limit exceeded");
    this.name = "RateLimitError";
  }
}

/**
 * Validate a Bearer token. Returns OrgAuthContext if valid, null if invalid.
 * Throws RateLimitError if rate-limited. Updates lastUsedAt on success.
 */
export async function validateApiKey(
  bearerToken: string
): Promise<(OrgAuthContext & { apiKeyId: string }) | null> {
  if (!bearerToken.startsWith(KEY_PREFIX)) return null;

  const keyHash = hashKey(bearerToken);
  const keyPrefix = bearerToken.slice(0, 8);

  // Look up by prefix first (indexed), then verify hash
  const candidates = await prisma.apiKey.findMany({
    where: { keyPrefix, isActive: true },
    include: {
      user: { select: { id: true, role: true, isActive: true } },
      org: { select: { id: true, isActive: true } },
    },
  });

  const matched = candidates.find((k) => k.keyHash === keyHash);
  if (!matched) return null;

  // Check expiry
  if (matched.expiresAt && matched.expiresAt < new Date()) return null;

  // Check user and org are active
  if (!matched.user.isActive || !matched.org.isActive) return null;

  // Check user has admin/root role (same gate as session auth)
  if (matched.user.role !== "admin" && matched.user.role !== "root") return null;

  // Rate limit check — throw typed error so caller can return 429
  if (!checkRateLimit(matched.id)) throw new RateLimitError();

  // Update lastUsedAt (fire-and-forget, don't block response)
  prisma.apiKey
    .update({ where: { id: matched.id }, data: { lastUsedAt: new Date() } })
    .catch(() => {});

  // Resolve org role — root users get "owner", others check membership
  let orgRole = "owner";
  if (matched.user.role !== "root") {
    const membership = await prisma.orgMember.findUnique({
      where: { userId_orgId: { userId: matched.userId, orgId: matched.orgId } },
    });
    if (!membership) return null;
    orgRole = membership.role;
  }

  return {
    userId: matched.userId,
    orgId: matched.orgId,
    orgRole,
    userRole: matched.user.role,
    apiKeyId: matched.id,
  };
}

/** Revoke an API key (soft-delete by setting isActive=false) */
export async function revokeApiKey(
  keyId: string,
  userId: string,
  orgId: string
): Promise<boolean> {
  const key = await prisma.apiKey.findFirst({
    where: { id: keyId, userId, orgId },
  });
  if (!key) return false;

  await prisma.apiKey.update({
    where: { id: keyId },
    data: { isActive: false },
  });
  return true;
}

/** List API keys for a user+org (never exposes hash) */
export async function listApiKeys(userId: string, orgId: string) {
  return prisma.apiKey.findMany({
    where: { userId, orgId },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      isActive: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
