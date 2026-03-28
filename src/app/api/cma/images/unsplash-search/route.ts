// GET /api/cma/images/unsplash-search?q=...&page=...&perPage=...&orgId=...
// Proxies Unsplash search — API key stays server-side

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { searchPhotos } from "@/lib/cma/services/unsplash-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    const q = searchParams.get("q");

    if (!orgId) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }
    if (!q?.trim()) {
      return NextResponse.json({ error: "Missing query param: q" }, { status: 400 });
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
    const perPage = Math.min(30, Math.max(1, parseInt(searchParams.get("perPage") ?? "12", 10)));

    const data = await searchPhotos(q.trim(), page, perPage);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
