// Zalo message router — processes incoming messages, commands, and approvals

import { prisma } from "@/lib/prisma-client";
import { createPost } from "@/lib/cma/services/post-service";
import { routePostByMode } from "@/lib/cma/services/publish-mode-router";
import { publishPost } from "@/lib/cma/services/publishing-service";
import { getLinkedUserId, verifyAndLink } from "./zalo-user-mapping";
import type { ZaloBotProvider } from "./zalo-bot-provider";

const MAX_TITLE_LENGTH = 100;

// Strip OpenZCA media metadata from message, extract image URL if present
function parseMessageContent(raw: string): { text: string; imageUrl: string | null } {
  let text = raw;
  let imageUrl: string | null = null;

  // Extract Zalo CDN image URL from [media attached: ...] metadata
  const cdnMatch = raw.match(/https?:\/\/[^\s\]]+\.zdn\.vn[^\s\]]+\.(jpg|jpeg|png|gif|webp)/i);
  if (cdnMatch) imageUrl = cdnMatch[0];

  // Remove [media attached: /home/node/...] metadata blocks
  text = text.replace(/\[media attached:[^\]]*\]/gi, "").trim();
  // Remove standalone file paths
  text = text.replace(/\/home\/node\/[^\s]+/g, "").trim();
  // Remove Zalo CDN URLs that were already extracted
  if (imageUrl) text = text.replace(imageUrl, "").trim();
  // Clean up leftover separators
  text = text.replace(/\|\s*/g, "").replace(/\s+/g, " ").trim();

  return { text, imageUrl };
}

export async function routeMessage(
  senderId: string,
  text: string,
  orgId: string,
  provider: ZaloBotProvider
): Promise<void> {
  const { text: cleanText, imageUrl } = parseMessageContent(text);
  const trimmed = cleanText || text.trim();
  const cmd = trimmed.toLowerCase();

  // /help command
  if (cmd === "/help") {
    await provider.sendTextMessage(senderId, [
      "📌 Commands:",
      "• /link <code> — Link Zalo to CLM",
      "• /list — Show your pending drafts",
      "• /approve — Approve your latest draft",
      "• /approve <number> — Approve draft by number",
      "• /edit <new content> — Edit your latest draft",
      "• /help — Show this message",
      "",
      "Or send any text to create a new draft post.",
    ].join("\n"));
    return;
  }

  // /link command
  if (cmd.startsWith("/link ")) {
    const code = trimmed.slice(6).trim().toUpperCase();
    if (!code || code.length < 4) {
      await provider.sendTextMessage(senderId, "Invalid code. Use: /link <CODE>");
      return;
    }
    const result = await verifyAndLink(orgId, senderId, undefined, code);
    await provider.sendTextMessage(senderId,
      result.success ? "✅ Account linked! You can now send messages to create drafts.\n\nSend /help to see all commands." : `❌ Link failed: ${result.error}`
    );
    return;
  }

  // All commands below require linked account
  const userId = await getLinkedUserId(orgId, senderId);
  if (!userId) {
    await provider.sendTextMessage(senderId,
      "Your Zalo is not linked to CLM.\nAsk your admin for a link code, then send: /link <CODE>"
    );
    return;
  }

  // /list — show pending drafts
  if (cmd === "/list") {
    const posts = await prisma.cmaPost.findMany({
      where: { orgId, authorId: userId, status: { in: ["draft", "pending_review"] } },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true, status: true, createdAt: true },
    });
    if (posts.length === 0) {
      await provider.sendTextMessage(senderId, "No pending drafts.");
      return;
    }
    const list = posts.map((p, i) =>
      `${i + 1}. ${p.title}\n   Status: ${p.status === "pending_review" ? "⏳ Pending review" : "📝 Draft"}`
    ).join("\n\n");
    await provider.sendTextMessage(senderId, `📋 Your recent drafts:\n\n${list}\n\nUse /approve or /approve <number> to approve.`);
    return;
  }

  // /approve — show platform options or approve to specific platform
  // /approve fb, /approve wp, /approve all, /approve <number> fb
  if (cmd === "/approve" || cmd.startsWith("/approve ")) {
    const args = trimmed.slice(8).trim().toLowerCase().split(/\s+/);
    const num = parseInt(args[0]) || 0;
    const platformArg = num > 0 ? (args[1] || "") : (args[0] || "");

    const posts = await prisma.cmaPost.findMany({
      where: { orgId, authorId: userId, status: "pending_review" },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true },
    });
    if (posts.length === 0) {
      await provider.sendTextMessage(senderId, "No drafts pending review.");
      return;
    }
    const target = num > 0 && num <= posts.length ? posts[num - 1] : posts[0];

    // If no platform specified, show options
    if (!platformArg) {
      const accounts = await prisma.cmaPlatformAccount.findMany({
        where: { orgId, isActive: true },
        select: { platform: true, label: true },
      });
      if (accounts.length === 0) {
        await provider.sendTextMessage(senderId, "⚠️ No platform connected. Go to CLM settings to connect one.");
        return;
      }
      // Store pending approval context so short replies (fb/wp/all) work
      await prisma.cmaPost.update({ where: { id: target.id }, data: { status: "pending_review" } });
      const hasFb = accounts.some((a) => a.platform === "facebook");
      const hasWp = accounts.some((a) => a.platform === "wordpress");
      const lines = [`📋 "${target.title}"`, "", "Where to publish? Reply:"];
      if (hasFb) lines.push("👉 /approve fb");
      if (hasWp) lines.push("👉 /approve wp");
      if (hasFb && hasWp) lines.push("👉 /approve all");
      await provider.sendTextMessage(senderId, lines.join("\n"));
      return;
    }

    // Resolve target platforms
    const allAccounts = await prisma.cmaPlatformAccount.findMany({
      where: { orgId, isActive: true },
      select: { id: true, platform: true, label: true },
    });
    let targetAccounts = allAccounts;
    if (platformArg === "fb" || platformArg === "facebook") {
      targetAccounts = allAccounts.filter((a) => a.platform === "facebook");
    } else if (platformArg === "wp" || platformArg === "wordpress") {
      targetAccounts = allAccounts.filter((a) => a.platform === "wordpress");
    }
    // "all" keeps all accounts

    if (targetAccounts.length === 0) {
      await provider.sendTextMessage(senderId, `⚠️ No ${platformArg} platform connected.`);
      return;
    }

    // Approve the post
    await prisma.cmaPost.update({ where: { id: target.id }, data: { status: "approved" } });

    // Create CmaPostPlatform records + enqueue publish for each target
    const published: string[] = [];
    for (const account of targetAccounts) {
      // Publish directly (not via pg-boss queue)
      const result = await publishPost({ postId: target.id, accountId: account.id, orgId });
      if (result.success) {
        published.push(`${account.label} (${account.platform})\n🔗 ${result.platformUrl || ""}`);
      } else {
        published.push(`${account.label} — ❌ ${result.error}`)
      }
    }

    await provider.sendTextMessage(senderId, [
      `✅ Approved and queued for publishing!`,
      "",
      `Title: ${target.title}`,
      `Platform${published.length > 1 ? "s" : ""}: ${published.join(", ")}`,
    ].join("\n"));
    return;
  }

  // /edit — replace content of latest draft
  if (cmd.startsWith("/edit ")) {
    const newContent = trimmed.slice(6).trim();
    if (!newContent) {
      await provider.sendTextMessage(senderId, "Usage: /edit <new content>");
      return;
    }
    const latest = await prisma.cmaPost.findFirst({
      where: { orgId, authorId: userId, status: { in: ["draft", "pending_review"] } },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true },
    });
    if (!latest) {
      await provider.sendTextMessage(senderId, "No draft to edit.");
      return;
    }
    await prisma.cmaPost.update({ where: { id: latest.id }, data: { content: newContent } });
    await provider.sendTextMessage(senderId, `📝 Updated!\n\nTitle: ${latest.title}\nNew content saved.`);
    return;
  }

  // Short replies: "fb", "wp", "all" → treat as /approve <platform> for pending review posts
  if (["fb", "wp", "all", "facebook", "wordpress"].includes(cmd)) {
    const pending = await prisma.cmaPost.findFirst({
      where: { orgId, authorId: userId, status: "pending_review" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });
    if (pending) {
      // Re-route as /approve <platform>
      return routeMessage(senderId, `/approve ${trimmed}`, orgId, provider);
    }
  }

  // Default: create new draft from text
  const firstLine = trimmed.split("\n")[0] || "Untitled";
  const title = firstLine.length > MAX_TITLE_LENGTH ? firstLine.substring(0, MAX_TITLE_LENGTH) + "..." : firstLine;

  try {
    const post = await createPost({
      orgId, authorId: userId, title, content: trimmed,
      contentFormat: "markdown", source: "zalo_bot",
      featuredImage: imageUrl || undefined,
    });
    const result = await routePostByMode(post.id, orgId, "zalo_bot");

    if (result.action === "auto_publish") {
      await provider.sendTextMessage(senderId, `✅ Draft created and queued for auto-publish!\n\nTitle: ${title}`);
    } else {
      await provider.sendTextMessage(senderId, [
        `📋 Draft created and sent for review.`,
        ``,
        `Title: ${title}`,
        ``,
        `Reply with:`,
        `• /approve — to approve and publish`,
        `• /edit <new text> — to change content`,
        `• /list — to see all drafts`,
      ].join("\n"));
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await provider.sendTextMessage(senderId, `❌ Failed to create draft: ${msg}`);
  }
}
