// Notification service — sends Zalo messages for approval requests + post-publish confirmations

import { prisma } from "@/lib/prisma-client";
import { createZaloBotProvider } from "@/lib/zalo/zalo-bot-provider";
import { getLinkedUserId } from "@/lib/zalo/zalo-user-mapping";
import { buildApprovalUrl } from "./approval-token-service";

// Notify admins when a post enters pending_review
export async function notifyApprovers(postId: string, orgId: string): Promise<void> {
  const [post, admins] = await Promise.all([
    prisma.cmaPost.findUnique({
      where: { id: postId },
      select: { title: true, content: true, source: true },
    }),
    prisma.orgMember.findMany({
      where: { orgId, role: { in: ["owner", "admin"] } },
      select: { userId: true },
    }),
  ]);
  if (!post || admins.length === 0) return;

  // Send Zalo notification (OA mode only — personal mode skips Zalo per validation)
  const provider = await createZaloBotProvider(orgId);
  if (!provider || provider.botType !== "oa") return;

  const preview = post.content.substring(0, 200) + (post.content.length > 200 ? "..." : "");
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://clm.tonytechlab.com"}/admin/cma/approval`;

  for (const admin of admins) {
    // Find admin's Zalo mapping to send them a message
    const mapping = await prisma.cmaZaloUserMapping.findFirst({
      where: { orgId, userId: admin.userId, isActive: true },
      select: { zaloUserId: true },
    });
    if (!mapping) continue;

    const approveUrl = buildApprovalUrl(postId, orgId, admin.userId, "approve");
    const message = [
      "📝 New post needs approval!",
      "",
      `Title: ${post.title}`,
      `Source: ${post.source || "web"}`,
      `Preview: ${preview}`,
      "",
      `Approve: ${approveUrl}`,
      `View in CLM: ${dashboardUrl}`,
    ].join("\n");

    try {
      await provider.sendTextMessage(mapping.zaloUserId, message);
    } catch (err) {
      console.error(`[notifications] Failed to send Zalo notification to admin ${admin.userId}:`, err);
    }
  }
}

// Notify author after successful publish — send Zalo message with published links
export async function notifyPublished(postId: string, orgId: string): Promise<void> {
  const post = await prisma.cmaPost.findUnique({
    where: { id: postId },
    select: { title: true, authorId: true },
  });
  if (!post) return;

  // Get all published platform URLs for this post
  const platforms = await prisma.cmaPostPlatform.findMany({
    where: { postId, status: "published", platformUrl: { not: null } },
    select: { platformUrl: true, account: { select: { platform: true, label: true } } },
  });

  const provider = await createZaloBotProvider(orgId);
  if (!provider) return;

  // Find author's Zalo mapping
  const authorMapping = await prisma.cmaZaloUserMapping.findFirst({
    where: { orgId, userId: post.authorId, isActive: true },
    select: { zaloUserId: true },
  });
  if (!authorMapping) return;

  const links = platforms.map((p) =>
    `🔗 ${p.account.platform}: ${p.platformUrl}`
  );

  const msg = [
    `🎉 Published successfully!`,
    ``,
    `Title: ${post.title}`,
    ...(links.length > 0 ? ["", ...links] : ["", "⏳ Links will be available shortly."]),
  ].join("\n");

  try {
    await provider.sendTextMessage(authorMapping.zaloUserId, msg);
  } catch (err) {
    console.error("[notifications] Failed to send publish notification:", err);
  }
}
