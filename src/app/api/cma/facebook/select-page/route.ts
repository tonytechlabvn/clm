// POST /api/cma/facebook/select-page — finalize FB connection with selected page

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma-client";
import { withApiKeyOrSessionAuth } from "@/lib/cma/services/org-auth";
import { getPageAccessToken } from "@/lib/cma/services/facebook-oauth-service";
import { encryptToken } from "@/lib/cma/crypto-utils";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, pageId, pageName } = body;

    if (!orgId || !pageId || !pageName) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, pageId, pageName" },
        { status: 400 }
      );
    }

    // Verify auth + org membership
    const auth = await withApiKeyOrSessionAuth(orgId, request);
    if (auth instanceof NextResponse) return auth;

    // Retrieve long-lived user token from httpOnly cookie
    const cookieStore = await cookies();
    const longLivedToken = cookieStore.get("fb_temp_token")?.value;
    const tokenExpirySec = Number(cookieStore.get("fb_token_expiry")?.value || "5184000");

    if (!longLivedToken) {
      return NextResponse.json(
        { error: "Facebook token expired — please restart the connection flow" },
        { status: 400 }
      );
    }

    // Exchange long-lived user token for never-expiring Page Access Token
    const pageAccessToken = await getPageAccessToken(longLivedToken, pageId);

    // Calculate token expiry for the long-lived user token (refresh token)
    const tokenExpiry = new Date(Date.now() + tokenExpirySec * 1000);

    // Store encrypted tokens in CmaPlatformAccount
    const account = await prisma.cmaPlatformAccount.create({
      data: {
        orgId,
        userId: auth.userId,
        platform: "facebook",
        label: pageName,
        siteUrl: pageId,          // FB Page ID stored in siteUrl
        username: pageName,       // Page name stored in username
        accessToken: encryptToken(pageAccessToken),
        refreshToken: encryptToken(longLivedToken),
        tokenExpiry,
      },
      select: {
        id: true,
        platform: true,
        label: true,
        siteUrl: true,
        isActive: true,
      },
    });

    // Clear temporary cookies
    cookieStore.delete("fb_temp_token");
    cookieStore.delete("fb_token_expiry");

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to connect Facebook page";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
