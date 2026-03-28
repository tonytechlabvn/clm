// Daily metrics sync worker — fetches organic metrics from all platforms
// Full implementation in Phase 6; stub registered at startup to avoid import errors

import { prisma } from "@/lib/prisma-client";
import { getAdapter } from "../adapters/adapter-registry";
import { decryptToken } from "../crypto-utils";

/** Handler for "cma:metrics-sync" pg-boss scheduled job */
export async function handleMetricsSync(data: { orgId?: string }): Promise<void> {
  console.log("[metrics-sync] Starting daily metrics sync");

  // Find all published posts from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const whereClause = {
    status: "published",
    publishedAt: { gte: thirtyDaysAgo },
    ...(data.orgId ? { orgId: data.orgId } : {}),
  };

  const publishedPosts = await prisma.cmaPostPlatform.findMany({
    where: {
      status: "published",
      platformPostId: { not: null },
      post: whereClause,
    },
    include: {
      post: { select: { id: true, orgId: true } },
      account: { select: { id: true, platform: true, siteUrl: true, username: true, accessToken: true } },
    },
  });

  console.log(`[metrics-sync] Found ${publishedPosts.length} published platform posts to sync`);

  let synced = 0;
  let failed = 0;

  for (const pp of publishedPosts) {
    try {
      const adapter = getAdapter(pp.account.platform);
      if (!adapter?.getMetrics) continue;

      const token = decryptToken(pp.account.accessToken);
      const metrics = await adapter.getMetrics(
        pp.account.siteUrl || "",
        pp.account.username || "",
        token,
        pp.platformPostId!
      );

      // Upsert latest metrics totals
      await prisma.cmaPostMetrics.upsert({
        where: { postId: pp.post.id },
        create: {
          postId: pp.post.id,
          reach: metrics.views || 0,
          impressions: metrics.views || 0,
          clicks: metrics.clicks || 0,
          likes: metrics.likes || 0,
          shares: metrics.shares || 0,
          comments: metrics.comments || 0,
          pageViews: metrics.views || 0,
          lastMetricsSyncAt: new Date(),
        },
        update: {
          reach: metrics.views || 0,
          impressions: metrics.views || 0,
          clicks: metrics.clicks || 0,
          likes: metrics.likes || 0,
          shares: metrics.shares || 0,
          comments: metrics.comments || 0,
          pageViews: metrics.views || 0,
          lastMetricsSyncAt: new Date(),
        },
      });

      // Insert daily snapshot (append-only for time-series)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      await prisma.cmaMetricsSnapshot.upsert({
        where: { postId_date: { postId: pp.post.id, date: today } },
        create: {
          postId: pp.post.id,
          date: today,
          reach: metrics.views || 0,
          impressions: metrics.views || 0,
          clicks: metrics.clicks || 0,
          likes: metrics.likes || 0,
          shares: metrics.shares || 0,
          comments: metrics.comments || 0,
        },
        update: {
          reach: metrics.views || 0,
          impressions: metrics.views || 0,
          clicks: metrics.clicks || 0,
          likes: metrics.likes || 0,
          shares: metrics.shares || 0,
          comments: metrics.comments || 0,
        },
      });

      synced++;
    } catch (err) {
      failed++;
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[metrics-sync] Failed for post ${pp.post.id}: ${message}`);
      // Continue — don't abort entire sync for one failure
    }
  }

  console.log(`[metrics-sync] Complete: ${synced} synced, ${failed} failed`);
}
