// GET /api/cma/facebook/callback — FB OAuth callback, exchange tokens, redirect to page picker

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  verifyStateToken,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  listUserPages,
} from "@/lib/cma/services/facebook-oauth-service";

// Use NEXT_PUBLIC_APP_URL for redirects — request.url resolves to container internal address
function appUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || "https://clm.tonytechlab.com";
  return `${base}${path}`;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");
    const errorParam = searchParams.get("error");

    // User denied permissions
    if (errorParam) {
      const desc = searchParams.get("error_description") || "Permission denied";
      return NextResponse.redirect(appUrl(`/admin/cma/settings?fb_error=${encodeURIComponent(desc)}`));
    }

    if (!code || !state) {
      return NextResponse.redirect(appUrl("/admin/cma/settings?fb_error=Missing+code+or+state"));
    }

    // Verify CSRF state token
    const { orgId } = verifyStateToken(state);

    // Exchange code → short-lived → long-lived user token
    const shortToken = await exchangeCodeForToken(code, orgId);
    const { token: longLivedToken, expiresIn } = await exchangeForLongLivedToken(shortToken, orgId);

    // Fetch user's pages
    const pages = await listUserPages(longLivedToken);
    if (pages.length === 0) {
      return NextResponse.redirect(appUrl("/admin/cma/settings?fb_error=No+Facebook+pages+found"));
    }

    // Store long-lived token temporarily in httpOnly cookie (10 min TTL)
    const cookieStore = await cookies();
    cookieStore.set("fb_temp_token", longLivedToken, {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/",
    });
    cookieStore.set("fb_token_expiry", String(expiresIn), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 600, path: "/",
    });

    // Redirect to page picker UI with page list + orgId
    const pagesParam = encodeURIComponent(JSON.stringify(
      pages.map((p) => ({ id: p.id, name: p.name, category: p.category, picture: p.picture?.data?.url }))
    ));

    return NextResponse.redirect(appUrl(`/admin/cma/facebook/callback?orgId=${orgId}&pages=${pagesParam}`));
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth callback failed";
    return NextResponse.redirect(appUrl(`/admin/cma/settings?fb_error=${encodeURIComponent(message)}`));
  }
}
