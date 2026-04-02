// Publish mode router — routes posts to auto-publish or pending_review based on org settings

import { prisma } from "@/lib/prisma-client";
import { enqueueScheduledPublish } from "./pgboss-service";
import { notifyApprovers } from "./notification-service";

const VALID_SOURCES = ["web", "zalo_bot", "mcp", "scheduler"];

export interface RouteResult {
  action: "auto_publish" | "pending_review" | "draft";
  postId: string;
}

// Route a newly created post based on org publishing mode + source
export async function routePostByMode(
  postId: string,
  orgId: string,
  source: string,
  accountId?: string
): Promise<RouteResult> {
  if (!VALID_SOURCES.includes(source)) source = "web";

  // Load or create org settings with defaults
  const settings = await prisma.cmaOrgSettings.upsert({
    where: { orgId },
    create: { orgId },
    update: {},
  });

  // Sources in requireApprovalSources always go to pending_review
  if (settings.requireApprovalSources.includes(source)) {
    await prisma.cmaPost.update({
      where: { id: postId },
      data: { status: "pending_review" },
    });
    // Fire-and-forget notification
    notifyApprovers(postId, orgId).catch((err) =>
      console.error("[notifications] Failed to notify approvers:", err)
    );
    return { action: "pending_review", postId };
  }

  // Auto mode: enqueue immediate publish for allowed sources
  if (settings.publishingMode === "auto" && settings.autoPublishSources.includes(source)) {
    if (!accountId) {
      // Find first active FB or WP account for org
      const account = await prisma.cmaPlatformAccount.findFirst({
        where: { orgId, isActive: true },
        select: { id: true },
      });
      accountId = account?.id;
    }
    if (accountId) {
      await enqueueScheduledPublish(postId, accountId, orgId, new Date());
      return { action: "auto_publish", postId };
    }
  }

  // Default: pending_review (human-in-the-loop)
  await prisma.cmaPost.update({
    where: { id: postId },
    data: { status: "pending_review" },
  });
  notifyApprovers(postId, orgId).catch((err) =>
    console.error("[notifications] Failed to notify approvers:", err)
  );
  return { action: "pending_review", postId };
}
