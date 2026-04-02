// Approval token service — HMAC-signed tokens for one-click approve/reject via Zalo

import { createHmac, timingSafeEqual } from "crypto";

function getSecret(): string {
  // Prefer dedicated secret; derive from encryption key with purpose prefix if not set
  const dedicated = process.env.JWT_APPROVAL_SECRET;
  if (dedicated) return dedicated;
  const base = process.env.CMA_ENCRYPTION_KEY;
  if (!base) throw new Error("Missing JWT_APPROVAL_SECRET or CMA_ENCRYPTION_KEY env var");
  return createHmac("sha256", base).update("approval-token-v1").digest("hex");
}

interface ApprovalPayload {
  postId: string;
  orgId: string;
  userId: string;
  action: "approve" | "reject";
  exp: number; // expiry timestamp ms
}

// Generate HMAC-signed approval token (24h expiry, userId-bound)
export function generateApprovalToken(postId: string, orgId: string, userId: string, action: "approve" | "reject"): string {
  // 1h expiry (reduced from 24h to limit replay window)
  const payload: ApprovalPayload = { postId, orgId, userId, action, exp: Date.now() + 3600_000 };
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = createHmac("sha256", getSecret()).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

// Verify and decode approval token
export function verifyApprovalToken(token: string): ApprovalPayload | null {
  try {
    const [encoded, sig] = token.split(".");
    if (!encoded || !sig) return null;
    const expectedSig = createHmac("sha256", getSecret()).update(encoded).digest("base64url");
    const sigBuf = Buffer.from(sig);
    const expectedBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) return null;
    const payload: ApprovalPayload = JSON.parse(Buffer.from(encoded, "base64url").toString());
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

// Build full approval URL for Zalo messages
export function buildApprovalUrl(postId: string, orgId: string, userId: string, action: "approve" | "reject"): string {
  const token = generateApprovalToken(postId, orgId, userId, action);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clm.tonytechlab.com";
  return `${baseUrl}/api/cma/approval/${postId}/quick?token=${token}&action=${action}`;
}
