// Spam guard — prevents Zalo bot from flooding platforms with posts
// Rate limits are configurable via admin settings (CmaOrgSettings)

import { prisma } from "@/lib/prisma-client";

// Load rate limits from org settings (with defaults)
async function getLimits(orgId: string) {
  const settings = await prisma.cmaOrgSettings.findUnique({ where: { orgId } });
  return {
    maxDraftsPerHour: settings?.maxDraftsPerHour ?? 15,
    maxDraftsPerDay: settings?.maxDraftsPerDay ?? 50,
    maxPublishesPerDay: settings?.maxPublishesPerDay ?? 10,
    minPublishGapMinutes: settings?.minPublishGapMinutes ?? 30,
  };
}

const DEDUP_WINDOW_MINUTES = 5;

interface GuardResult {
  allowed: boolean;
  reason?: string;
}

// Check if user can create a new draft
export async function canCreateDraft(orgId: string, userId: string, content: string): Promise<GuardResult> {
  const now = new Date();
  const limits = await getLimits(orgId);

  // 1. Dedup: block identical content within 5 minutes
  const recentDup = await prisma.cmaPost.findFirst({
    where: {
      orgId, authorId: userId, content,
      createdAt: { gte: new Date(now.getTime() - DEDUP_WINDOW_MINUTES * 60_000) },
    },
    select: { id: true },
  });
  if (recentDup) return { allowed: false, reason: "Duplicate message — same content sent recently." };

  // 2. Hourly rate limit
  const hourAgo = new Date(now.getTime() - 3600_000);
  const hourCount = await prisma.cmaPost.count({
    where: { orgId, authorId: userId, source: "zalo_bot", createdAt: { gte: hourAgo } },
  });
  if (hourCount >= limits.maxDraftsPerHour) {
    return { allowed: false, reason: `Rate limit: max ${limits.maxDraftsPerHour} drafts per hour. Try again later.` };
  }

  // 3. Daily rate limit
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const dayCount = await prisma.cmaPost.count({
    where: { orgId, authorId: userId, source: "zalo_bot", createdAt: { gte: startOfDay } },
  });
  if (dayCount >= limits.maxDraftsPerDay) {
    return { allowed: false, reason: `Daily limit: max ${limits.maxDraftsPerDay} drafts per day.` };
  }

  return { allowed: true };
}

// Check if a post can be published to Facebook (rate limiting)
export async function canPublishToFacebook(orgId: string, accountId: string): Promise<GuardResult> {
  const now = new Date();
  const limits = await getLimits(orgId);

  // 1. Minimum gap between publishes
  const lastPublish = await prisma.cmaPostPlatform.findFirst({
    where: { accountId, status: "published", publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: { publishedAt: true },
  });
  if (lastPublish?.publishedAt) {
    const elapsedMin = (now.getTime() - lastPublish.publishedAt.getTime()) / 60_000;
    if (elapsedMin < limits.minPublishGapMinutes) {
      const waitMin = Math.ceil(limits.minPublishGapMinutes - elapsedMin);
      return { allowed: false, reason: `Cooldown: wait ${waitMin} min before next publish (anti-spam).` };
    }
  }

  // 2. Daily publish cap
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const todayCount = await prisma.cmaPostPlatform.count({
    where: { accountId, status: "published", publishedAt: { gte: startOfDay } },
  });
  if (todayCount >= limits.maxPublishesPerDay) {
    return { allowed: false, reason: `Daily limit: max ${limits.maxPublishesPerDay} posts per day.` };
  }

  return { allowed: true };
}
