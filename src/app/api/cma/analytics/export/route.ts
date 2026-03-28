// Analytics Export — GET CSV download of post metrics

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { prisma } from "@/lib/prisma-client";

// GET /api/cma/analytics/export?orgId=...&period=30&format=csv
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const days = Math.min(parseInt(searchParams.get("period") || "30", 10), 365);
  const since = new Date();
  since.setDate(since.getDate() - days);

  const posts = await prisma.cmaPost.findMany({
    where: { orgId: auth.orgId, status: "published", publishedAt: { gte: since } },
    include: { metrics: true },
    orderBy: { publishedAt: "desc" },
  });

  // Build CSV
  const headers = ["Title", "Published At", "Reach", "Impressions", "Clicks", "Likes", "Shares", "Comments", "Page Views"];
  const rows = posts.map((p) => [
    `"${(p.title || "").replace(/"/g, '""')}"`,
    p.publishedAt?.toISOString() || "",
    p.metrics?.reach || 0,
    p.metrics?.impressions || 0,
    p.metrics?.clicks || 0,
    p.metrics?.likes || 0,
    p.metrics?.shares || 0,
    p.metrics?.comments || 0,
    p.metrics?.pageViews || 0,
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="cma-analytics-${days}d.csv"`,
    },
  });
}
