// Facebook OAuth 2.0 — token exchange, page listing, HMAC state tokens

import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma-client";
import { fbGraphFetch } from "../adapters/facebook-graph-client";
import { decryptToken } from "../crypto-utils";

const FB_OAUTH_BASE = "https://www.facebook.com/v21.0/dialog/oauth";
const FB_GRAPH_BASE = "https://graph.facebook.com/v21.0";

// Required FB permissions for page publishing + insights
const FB_SCOPES = [
  "pages_show_list",
  "pages_manage_posts",
  "pages_read_engagement",
  "read_insights",
  "pages_manage_metadata",
].join(",");

// Read FB App credentials from DB (per-org) with env var fallback
async function getAppCredentialsForOrg(orgId: string) {
  const settings = await prisma.cmaOrgSettings.findUnique({ where: { orgId } });
  const appId = settings?.fbAppId || process.env.FB_APP_ID;
  const appSecret = settings?.fbAppSecret
    ? decryptToken(settings.fbAppSecret)
    : process.env.FB_APP_SECRET;
  const redirectUri = settings?.fbRedirectUri || process.env.FB_REDIRECT_URI;
  if (!appId || !appSecret || !redirectUri) {
    throw new Error("Facebook App not configured — set App ID, App Secret, and Redirect URI in settings");
  }
  return { appId, appSecret, redirectUri };
}

// Synchronous fallback for non-org-scoped calls (token exchange uses env vars)
function getAppCredentials() {
  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  const redirectUri = process.env.FB_REDIRECT_URI;
  if (!appId || !appSecret || !redirectUri) {
    throw new Error("Facebook App not configured — set env vars or configure in settings");
  }
  return { appId, appSecret, redirectUri };
}

function getStateSecret(): string {
  const base = process.env.CMA_ENCRYPTION_KEY;
  if (!base) throw new Error("Missing CMA_ENCRYPTION_KEY for state signing");
  // Derive purpose-specific key to avoid sharing raw key with encryption
  return createHmac("sha256", base).update("fb-oauth-state-v1").digest("hex");
}

// Build HMAC-signed state token: {payload_base64}.{signature}
export function buildStateToken(orgId: string, userId: string): string {
  const payload = JSON.stringify({ orgId, userId, nonce: randomBytes(8).toString("hex"), exp: Date.now() + 600_000 });
  const encoded = Buffer.from(payload).toString("base64url");
  const sig = createHmac("sha256", getStateSecret()).update(encoded).digest("base64url");
  return `${encoded}.${sig}`;
}

// Verify + decode HMAC state token, returns payload or throws
export function verifyStateToken(state: string): { orgId: string; userId: string } {
  const [encoded, sig] = state.split(".");
  if (!encoded || !sig) throw new Error("Invalid OAuth state format");
  const expectedSig = createHmac("sha256", getStateSecret()).update(encoded).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    throw new Error("Invalid OAuth state signature");
  }
  const payload = JSON.parse(Buffer.from(encoded, "base64url").toString());
  if (payload.exp < Date.now()) throw new Error("OAuth state expired");
  return { orgId: payload.orgId, userId: payload.userId };
}

// Build FB Login Dialog redirect URL
export async function buildFbLoginUrl(orgId: string, userId: string): Promise<string> {
  const { appId, redirectUri } = await getAppCredentialsForOrg(orgId);
  const state = buildStateToken(orgId, userId);
  const params = new URLSearchParams({
    client_id: appId,
    redirect_uri: redirectUri,
    scope: FB_SCOPES,
    state,
    response_type: "code",
    auth_type: "rerequest", // always show page selection even if already authorized
  });
  return `${FB_OAUTH_BASE}?${params}`;
}

// Exchange authorization code for short-lived user token
export async function exchangeCodeForToken(code: string, orgId?: string): Promise<string> {
  const { appId, appSecret, redirectUri } = orgId ? await getAppCredentialsForOrg(orgId) : getAppCredentials();
  const params = new URLSearchParams({
    client_id: appId,
    client_secret: appSecret,
    redirect_uri: redirectUri,
    code,
  });
  const res = await fetch(`${FB_GRAPH_BASE}/oauth/access_token?${params}`);
  const data = await res.json();
  if (data.error) throw new Error(`FB token exchange failed: ${data.error.message}`);
  return data.access_token;
}

// Exchange short-lived for long-lived user token (~60 days)
export async function exchangeForLongLivedToken(shortToken: string, orgId?: string): Promise<{ token: string; expiresIn: number }> {
  const { appId, appSecret } = orgId ? await getAppCredentialsForOrg(orgId) : getAppCredentials();
  const params = new URLSearchParams({
    grant_type: "fb_exchange_token",
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: shortToken,
  });
  const res = await fetch(`${FB_GRAPH_BASE}/oauth/access_token?${params}`);
  const data = await res.json();
  if (data.error) throw new Error(`FB long-lived token exchange failed: ${data.error.message}`);
  return { token: data.access_token, expiresIn: data.expires_in || 5184000 };
}

export interface FbPage {
  id: string;
  name: string;
  category: string;
  picture?: { data?: { url?: string } };
}

// List pages the user is admin of
export async function listUserPages(userToken: string): Promise<FbPage[]> {
  const res = await fbGraphFetch("/me/accounts?fields=id,name,category,picture", userToken);
  const data = await res.json();
  return data.data || [];
}

// Exchange long-lived user token for never-expiring Page Access Token
export async function getPageAccessToken(longLivedUserToken: string, pageId: string): Promise<string> {
  const res = await fbGraphFetch(`/${pageId}?fields=access_token`, longLivedUserToken);
  const data = await res.json();
  if (!data.access_token) throw new Error("Failed to get Page Access Token");
  return data.access_token;
}

// Revoke all FB permissions for this user
export async function revokePermissions(userToken: string): Promise<void> {
  await fbGraphFetch("/me/permissions", userToken, { method: "DELETE" });
}
