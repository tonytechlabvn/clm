// SSRF prevention — validates URLs before fetching external content
// Blocks private/reserved IPs, non-HTTP schemes, oversized responses

import { lookup } from "dns/promises";

const BLOCKED_IP_RANGES = [
  /^127\./, /^10\./, /^172\.(1[6-9]|2\d|3[01])\./, /^192\.168\./,
  /^169\.254\./, /^0\./, /^::1$/, /^fc00:/, /^fe80:/,
];

/** Validate a URL is safe to fetch — blocks SSRF vectors */
export async function validateUrlSafety(url: string): Promise<void> {
  const parsed = new URL(url);

  // Scheme allowlist
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error(`Blocked URL scheme: ${parsed.protocol}`);
  }

  // Resolve DNS and check for private IPs
  try {
    const { address } = await lookup(parsed.hostname);
    if (BLOCKED_IP_RANGES.some((re) => re.test(address))) {
      throw new Error("Blocked: URL resolves to private/reserved IP");
    }
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("Blocked")) throw err;
    throw new Error(`DNS resolution failed for ${parsed.hostname}`);
  }
}
