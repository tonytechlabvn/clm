// Analytics Overview — GET dashboard summary metrics

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { getOverview } from "@/lib/cma/services/analytics-service";

// GET /api/cma/analytics/overview?orgId=...&period=30
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const days = Math.min(parseInt(searchParams.get("period") || "30", 10), 365);
  const data = await getOverview(auth.orgId, days);
  return NextResponse.json(data);
}
