// CMA Analytics — aggregation queries for dashboard metrics, time-series, campaigns, top posts

import { prisma } from "@/lib/prisma-client";

export interface OverviewData {
  totalPosts: number;
  totalReach: number;
  totalClicks: number;
  avgEngagement: number;
  topPosts: TopPost[];
  platformBreakdown: { platform: string; count: number; reach: number }[];
}

export interface TopPost {
  id: string;
  title: string;
  publishedAt: string | null;
  reach: number;
  clicks: number;
  likes: number;
  shares: number;
  engagementScore: number;
}

export interface TimeSeriesPoint {
  date: string;
  value: number;
}

/** Dashboard overview — aggregate metrics for a period */
export async function getOverview(orgId: string, days: number): Promise<OverviewData> {
  const since = daysAgo(days);

  const posts = await prisma.cmaPost.findMany({
    where: { orgId, status: "published", publishedAt: { gte: since } },
    include: {
      metrics: true,
      platforms: { select: { account: { select: { platform: true } } } },
    },
    orderBy: { publishedAt: "desc" },
  });

  let totalReach = 0;
  let totalClicks = 0;
  let totalEngagement = 0;
  const platformMap = new Map<string, { count: number; reach: number }>();
  const topPosts: TopPost[] = [];

  for (const post of posts) {
    const m = post.metrics;
    const reach = m?.reach ?? 0;
    const clicks = m?.clicks ?? 0;
    const likes = m?.likes ?? 0;
    const shares = m?.shares ?? 0;
    const engagement = clicks * 3 + shares * 2 + likes;

    totalReach += reach;
    totalClicks += clicks;
    totalEngagement += engagement;

    topPosts.push({
      id: post.id,
      title: post.title,
      publishedAt: post.publishedAt?.toISOString() || null,
      reach,
      clicks,
      likes,
      shares,
      engagementScore: engagement,
    });

    for (const pp of post.platforms) {
      const plat = pp.account.platform;
      const existing = platformMap.get(plat) || { count: 0, reach: 0 };
      existing.count++;
      existing.reach += m?.reach || 0;
      platformMap.set(plat, existing);
    }
  }

  // Sort top posts by engagement score
  topPosts.sort((a, b) => b.engagementScore - a.engagementScore);

  return {
    totalPosts: posts.length,
    totalReach,
    totalClicks,
    avgEngagement: posts.length > 0 ? Math.round(totalEngagement / posts.length) : 0,
    topPosts: topPosts.slice(0, 10),
    platformBreakdown: Array.from(platformMap.entries()).map(([platform, data]) => ({
      platform, ...data,
    })),
  };
}

/** Time-series data for charts — aggregated by day */
export async function getTimeSeries(
  orgId: string,
  metric: string,
  days: number
): Promise<TimeSeriesPoint[]> {
  const since = daysAgo(days);
  const validMetrics = ["reach", "clicks", "likes", "shares", "comments", "impressions"];
  const safeMetric = validMetrics.includes(metric) ? metric : "clicks";

  const snapshots = await prisma.cmaMetricsSnapshot.findMany({
    where: {
      date: { gte: since },
      post: { orgId },
    },
    orderBy: { date: "asc" },
  });

  // Group by date and sum the metric
  const dateMap = new Map<string, number>();
  for (const snap of snapshots) {
    const dateKey = snap.date.toISOString().split("T")[0];
    const value = (snap as Record<string, unknown>)[safeMetric] as number || 0;
    dateMap.set(dateKey, (dateMap.get(dateKey) || 0) + value);
  }

  return Array.from(dateMap.entries()).map(([date, value]) => ({ date, value }));
}

/** Best posting times heatmap — day x hour average engagement */
export async function getBestTimes(orgId: string, days: number) {
  const since = daysAgo(days);

  const posts = await prisma.cmaPost.findMany({
    where: { orgId, status: "published", publishedAt: { gte: since } },
    select: { publishedAt: true, metrics: { select: { clicks: true, likes: true, shares: true } } },
  });

  // Build heatmap: day (0-6) x hour (0-23)
  const heatmap: Record<number, Record<number, { total: number; count: number }>> = {};
  for (let d = 0; d < 7; d++) {
    heatmap[d] = {};
    for (let h = 0; h < 24; h++) heatmap[d][h] = { total: 0, count: 0 };
  }

  for (const post of posts) {
    if (!post.publishedAt || !post.metrics) continue;
    const day = post.publishedAt.getDay();
    const hour = post.publishedAt.getHours();
    const engagement = post.metrics.clicks * 3 + post.metrics.shares * 2 + post.metrics.likes;
    heatmap[day][hour].total += engagement;
    heatmap[day][hour].count++;
  }

  // Convert to averages
  const result: Record<number, Record<number, number>> = {};
  for (let d = 0; d < 7; d++) {
    result[d] = {};
    for (let h = 0; h < 24; h++) {
      const cell = heatmap[d][h];
      result[d][h] = cell.count > 0 ? Math.round(cell.total / cell.count) : 0;
    }
  }

  return result;
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}
