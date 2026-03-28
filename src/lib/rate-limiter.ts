/**
 * In-memory sliding window rate limiter.
 * Per-pod independent limiting (no Redis needed).
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

const WINDOW_MS = 60_000; // 1 minute window
const MAX_REQUESTS = 10; // max requests per user per window
const CLEANUP_INTERVAL_MS = 5 * 60_000; // cleanup every 5 minutes
const MAX_STORE_SIZE = 10_000; // max unique users tracked

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      entry.timestamps = entry.timestamps.filter((t: number) => now - t < WINDOW_MS);
      if (entry.timestamps.length === 0) store.delete(key);
    });
  }, CLEANUP_INTERVAL_MS);
  if (cleanupTimer.unref) cleanupTimer.unref();
}

export function checkRateLimit(userId: string): {
  allowed: boolean;
  retryAfterMs: number;
  remaining: number;
} {
  ensureCleanup();
  const now = Date.now();
  let entry = store.get(userId);

  if (!entry) {
    if (store.size >= MAX_STORE_SIZE) {
      const firstKey = store.keys().next().value;
      if (firstKey) store.delete(firstKey);
    }
    entry = { timestamps: [] };
    store.set(userId, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = WINDOW_MS - (now - oldestInWindow);
    return { allowed: false, retryAfterMs, remaining: 0 };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    retryAfterMs: 0,
    remaining: MAX_REQUESTS - entry.timestamps.length,
  };
}
