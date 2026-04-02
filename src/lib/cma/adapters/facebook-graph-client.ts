// Thin wrapper for Facebook Graph API v21.0 — Bearer auth, error sanitization

const FB_GRAPH_BASE = "https://graph.facebook.com/v21.0";

export interface FbGraphError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
}

// Sanitize access tokens from error messages to prevent log exposure
function sanitizeErrorMessage(message: string, token?: string): string {
  let sanitized = message;
  if (token && token.length > 8) {
    sanitized = sanitized.replaceAll(token, "[REDACTED]");
  }
  // Catch any remaining token-like patterns (EAAx... format)
  sanitized = sanitized.replace(/EAA[A-Za-z0-9]{20,}/g, "[REDACTED]");
  return sanitized;
}

// Execute a Graph API request with Bearer auth and structured error handling
export async function fbGraphFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = path.startsWith("http") ? path : `${FB_GRAPH_BASE}${path}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    let errorMsg = `Facebook API error ${res.status}`;
    try {
      const body = await res.json();
      const fbError = body.error as FbGraphError | undefined;
      if (fbError) {
        errorMsg = sanitizeErrorMessage(
          `Facebook API error ${fbError.code}: ${fbError.message}`,
          token
        );
      }
    } catch {
      // Response wasn't JSON — use status-only message
    }
    throw new Error(errorMsg);
  }

  return res;
}

// Check if an FB API error indicates rate limiting (code 32 or 4)
export function isFbRateLimitError(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  return /error (32|4):/.test(error.message);
}
