// Analytics Best Times — GET engagement heatmap by day/hour

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { getBestTimes } from "@/lib/cma/services/analytics-service";

// GET /api/cma/analytics/best-times?orgId=...&period=90
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const days = Math.min(parseInt(searchParams.get("period") || "90", 10), 365);
  const heatmap = await getBestTimes(auth.orgId, days);
  return NextResponse.json({ heatmap });
}
