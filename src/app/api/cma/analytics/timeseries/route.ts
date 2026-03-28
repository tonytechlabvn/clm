// Analytics Time-series — GET metric data over time

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { getTimeSeries } from "@/lib/cma/services/analytics-service";

// GET /api/cma/analytics/timeseries?orgId=...&metric=clicks&period=30
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const metric = searchParams.get("metric") || "clicks";
  const days = Math.min(parseInt(searchParams.get("period") || "30", 10), 365);
  const data = await getTimeSeries(auth.orgId, metric, days);
  return NextResponse.json({ data });
}
