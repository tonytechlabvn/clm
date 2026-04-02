// GET /api/cma/facebook/auth — initiate FB OAuth flow, redirect to FB Login Dialog

import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/cma/services/org-auth";
import { buildFbLoginUrl } from "@/lib/cma/services/facebook-oauth-service";

export async function GET(request: Request) {
  try {
    const auth = await withAdminAuth();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId parameter" }, { status: 400 });
    }

    const loginUrl = buildFbLoginUrl(orgId, auth.userId);
    return NextResponse.redirect(loginUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : "OAuth init failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
