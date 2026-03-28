// CMA Calendar API — GET posts for a date range, grouped by day

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withOrgAuth } from "@/lib/cma/services/org-auth";

// Platform color mapping for calendar display
const PLATFORM_COLORS: Record<string, string> = {
  wordpress: "#3b82f6",  // blue
  facebook: "#6366f1",   // indigo
  linkedin: "#0ea5e9",   // sky
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  const start = searchParams.get("start");
  const end = searchParams.get("end");

  if (!orgId || !start || !end) {
    return NextResponse.json(
      { error: "orgId, start, and end are required" },
      { status: 400 }
    );
  }

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const startDate = new Date(start);
  const endDate = new Date(end);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  // Cap range at 90 days to prevent unbounded queries
  const maxRangeMs = 90 * 24 * 60 * 60 * 1000;
  if (endDate.getTime() - startDate.getTime() > maxRangeMs) {
    return NextResponse.json({ error: "Date range cannot exceed 90 days" }, { status: 400 });
  }

  try {
    const posts = await prisma.cmaPost.findMany({
      where: {
        orgId: auth.orgId,
        OR: [
          { scheduledAt: { gte: startDate, lte: endDate } },
          { publishedAt: { gte: startDate, lte: endDate } },
        ],
      },
      select: {
        id: true,
        title: true,
        status: true,
        scheduledAt: true,
        publishedAt: true,
        platforms: {
          select: {
            account: { select: { platform: true, label: true } },
          },
        },
      },
      orderBy: { scheduledAt: "asc" },
    });

    const events = posts.map((post) => {
      const platform = post.platforms[0]?.account.platform || "wordpress";
      return {
        id: post.id,
        title: post.title,
        start: post.scheduledAt?.toISOString() || post.publishedAt?.toISOString(),
        status: post.status,
        platform,
        platformLabel: post.platforms[0]?.account.label || "",
        color: PLATFORM_COLORS[platform] || "#6b7280",
      };
    });

    return NextResponse.json({ events });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
