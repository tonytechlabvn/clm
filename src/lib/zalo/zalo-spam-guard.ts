// Spam guard — prevents Zalo bot from flooding Facebook with posts

import { prisma } from "@/lib/prisma-client";

// Configurable limits
const MAX_DRAFTS_PER_HOUR = 5;   // max drafts a user can create per hour
const MAX_DRAFTS_PER_DAY = 20;   // max drafts a user can create per day
const MAX_PUBLISHES_PER_DAY = 10; // max FB publishes per page per day (conservative, FB allows 25)
const MIN_PUBLISH_GAP_MINUTES = 30; // minimum minutes between FB publishes
const DEDUP_WINDOW_MINUTES = 5;  // block identical messages within this window

interface GuardResult {
  allowed: boolean;
  reason?: string;
}

// Check if user can create a new draft
export async function canCreateDraft(orgId: string, userId: string, content: string): Promise<GuardResult> {
  const now = new Date();

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
  if (hourCount >= MAX_DRAFTS_PER_HOUR) {
    return { allowed: false, reason: `Rate limit: max ${MAX_DRAFTS_PER_HOUR} drafts per hour. Try again later.` };
  }

  // 3. Daily rate limit
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const dayCount = await prisma.cmaPost.count({
    where: { orgId, authorId: userId, source: "zalo_bot", createdAt: { gte: startOfDay } },
  });
  if (dayCount >= MAX_DRAFTS_PER_DAY) {
    return { allowed: false, reason: `Daily limit: max ${MAX_DRAFTS_PER_DAY} drafts per day.` };
  }

  return { allowed: true };
}

// Check if a post can be published to Facebook (rate limiting)
export async function canPublishToFacebook(orgId: string, accountId: string): Promise<GuardResult> {
  const now = new Date();

  // 1. Minimum gap between publishes
  const lastPublish = await prisma.cmaPostPlatform.findFirst({
    where: { accountId, status: "published", publishedAt: { not: null } },
    orderBy: { publishedAt: "desc" },
    select: { publishedAt: true },
  });
  if (lastPublish?.publishedAt) {
    const elapsedMin = (now.getTime() - lastPublish.publishedAt.getTime()) / 60_000;
    if (elapsedMin < MIN_PUBLISH_GAP_MINUTES) {
      const waitMin = Math.ceil(MIN_PUBLISH_GAP_MINUTES - elapsedMin);
      return { allowed: false, reason: `Cooldown: wait ${waitMin} min before next FB publish (anti-spam).` };
    }
  }

  // 2. Daily publish cap
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const todayCount = await prisma.cmaPostPlatform.count({
    where: { accountId, status: "published", publishedAt: { gte: startOfDay } },
  });
  if (todayCount >= MAX_PUBLISHES_PER_DAY) {
    return { allowed: false, reason: `Daily limit: max ${MAX_PUBLISHES_PER_DAY} FB posts per day.` };
  }

  return { allowed: true };
}
