// CMA scheduling service — schedule, reschedule, cancel post publishing via pg-boss

import { prisma } from "@/lib/prisma-client";
import { enqueueScheduledPublish, cancelScheduledJob } from "./pgboss-service";
import { publishPost } from "./publishing-service";

/**
 * Schedule a post for future publishing.
 * Uses optimistic locking to prevent concurrent schedule attempts.
 */
export async function schedulePost(
  postId: string,
  accountId: string,
  orgId: string,
  scheduledAt: Date
): Promise<{ pgBossJobId: string }> {
  // Validate scheduled time is in the future
  if (scheduledAt <= new Date()) {
    throw new Error("Scheduled time must be in the future");
  }

  // Validate account exists and belongs to org
  const account = await prisma.cmaPlatformAccount.findFirst({
    where: { id: accountId, orgId, isActive: true },
  });
  if (!account) throw new Error("Platform account not found or inactive");

  // Idempotency guard — optimistic lock via status transition (same pattern as publishing-service)
  const lockResult = await prisma.cmaPost.updateMany({
    where: { id: postId, orgId, status: { in: ["draft", "approved", "failed"] } },
    data: { status: "scheduled", scheduledAt },
  });
  if (lockResult.count === 0) {
    throw new Error("Post not found or cannot be scheduled from current status");
  }

  // Enqueue pg-boss job — if this fails, revert status
  let pgBossJobId: string;
  try {
    pgBossJobId = await enqueueScheduledPublish(postId, accountId, orgId, scheduledAt);
  } catch (err) {
    // Compensate: revert to draft if enqueue fails
    await prisma.cmaPost.update({
      where: { id: postId },
      data: { status: "draft", scheduledAt: null, pgBossJobId: null },
    });
    throw err;
  }

  // Store the job ID for future cancellation
  await prisma.cmaPost.update({
    where: { id: postId },
    data: { pgBossJobId },
  });

  return { pgBossJobId };
}

/**
 * Reschedule a post — cancel old pg-boss job, enqueue new one, update DB.
 */
export async function reschedulePost(
  postId: string,
  orgId: string,
  newScheduledAt: Date
): Promise<{ pgBossJobId: string }> {
  if (newScheduledAt <= new Date()) {
    throw new Error("Scheduled time must be in the future");
  }

  const post = await prisma.cmaPost.findFirst({
    where: { id: postId, orgId, status: "scheduled" },
  });
  if (!post) throw new Error("Post not found or not in scheduled status");

  // Cancel existing pg-boss job
  if (post.pgBossJobId) {
    try {
      await cancelScheduledJob(post.pgBossJobId);
    } catch {
      // Job may already be completed or expired — safe to ignore
    }
  }

  // Find the linked account (org-scoped via post ownership check above)
  const postPlatform = await prisma.cmaPostPlatform.findFirst({
    where: { postId, post: { orgId } },
  });
  if (!postPlatform) throw new Error("No platform account linked to this post");

  // Enqueue new job with compensating rollback
  let pgBossJobId: string;
  try {
    pgBossJobId = await enqueueScheduledPublish(postId, postPlatform.accountId, orgId, newScheduledAt);
  } catch (err) {
    // Revert scheduledAt to original value on failure
    await prisma.cmaPost.update({
      where: { id: postId },
      data: { scheduledAt: post.scheduledAt, pgBossJobId: post.pgBossJobId },
    });
    throw err;
  }

  await prisma.cmaPost.update({
    where: { id: postId },
    data: { scheduledAt: newScheduledAt, pgBossJobId },
  });

  return { pgBossJobId };
}

/**
 * Cancel a scheduled post — cancel pg-boss job, revert to draft.
 */
export async function cancelScheduledPost(
  postId: string,
  orgId: string
): Promise<void> {
  const post = await prisma.cmaPost.findFirst({
    where: { id: postId, orgId, status: "scheduled" },
  });
  if (!post) throw new Error("Post not found or not in scheduled status");

  if (post.pgBossJobId) {
    try {
      await cancelScheduledJob(post.pgBossJobId);
    } catch {
      // Safe to ignore — job may be gone
    }
  }

  await prisma.cmaPost.update({
    where: { id: postId },
    data: { status: "draft", scheduledAt: null, pgBossJobId: null },
  });
}

/**
 * Handler called by pg-boss when a scheduled publish fires.
 * Used by registerScheduledPublishWorker().
 */
export async function handleScheduledPublish(data: {
  postId: string;
  accountId: string;
  orgId: string;
}): Promise<void> {
  const post = await prisma.cmaPost.findFirst({
    where: { id: data.postId, orgId: data.orgId },
  });
  if (!post || post.status !== "scheduled") {
    console.warn(`[scheduling] Skipping publish for post ${data.postId}: status=${post?.status}`);
    return;
  }

  const result = await publishPost(data);
  if (!result.success) {
    console.error(`[scheduling] Failed to publish post ${data.postId}: ${result.error}`);
  }
}
