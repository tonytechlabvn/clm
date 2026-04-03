// Zalo message router — processes incoming messages via simple mode (MVP)

import { createPost } from "@/lib/cma/services/post-service";
import { routePostByMode } from "@/lib/cma/services/publish-mode-router";
import { getLinkedUserId, verifyAndLink } from "./zalo-user-mapping";
import type { ZaloBotProvider } from "./zalo-bot-provider";

const MAX_TITLE_LENGTH = 100;

// Route an incoming Zalo message — provider-agnostic (works with OA and future Personal)
export async function routeMessage(
  senderId: string,
  text: string,
  orgId: string,
  provider: ZaloBotProvider
): Promise<void> {
  const trimmed = text.trim();

  // /help command
  if (trimmed.toLowerCase() === "/help") {
    await provider.sendTextMessage(senderId,
      "Commands:\n• /link <code> — Link your Zalo to CLM\n• /help — Show this message\n\nSend any text to create a draft post."
    );
    return;
  }

  // /link <code> command — verify admin-generated code
  if (trimmed.toLowerCase().startsWith("/link ")) {
    const code = trimmed.slice(6).trim().toUpperCase();
    if (!code || code.length < 4) {
      await provider.sendTextMessage(senderId, "Invalid code format. Use: /link <CODE>");
      return;
    }
    const result = await verifyAndLink(orgId, senderId, undefined, code);
    if (result.success) {
      await provider.sendTextMessage(senderId, "Account linked successfully! You can now send messages to create drafts.");
    } else {
      await provider.sendTextMessage(senderId, `Link failed: ${result.error}`);
    }
    return;
  }

  // Simple mode: create draft from text message
  const userId = await getLinkedUserId(orgId, senderId);
  if (!userId) {
    await provider.sendTextMessage(senderId,
      "Your Zalo account is not linked to CLM. Ask your admin for a link code, then send: /link <CODE>"
    );
    return;
  }

  // Create draft post — title = first line (truncated), content = full text
  const firstLine = trimmed.split("\n")[0] || "Untitled";
  const title = firstLine.length > MAX_TITLE_LENGTH
    ? firstLine.substring(0, MAX_TITLE_LENGTH) + "..."
    : firstLine;

  try {
    const post = await createPost({
      orgId,
      authorId: userId,
      title,
      content: trimmed,
      contentFormat: "markdown",
      source: "zalo_bot",
    });

    // Route through publishing mode system
    const result = await routePostByMode(post.id, orgId, "zalo_bot");

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://clm.tonytechlab.com";
    const editUrl = `${baseUrl}/admin/cma/posts/${post.id}`;
    const approvalUrl = `${baseUrl}/admin/cma/approval`;

    const statusMsg = result.action === "auto_publish"
      ? `✅ Draft created and queued for auto-publish!\n\nTitle: ${title}\n\n📝 Edit: ${editUrl}`
      : `📋 Draft created and sent for review.\n\nTitle: ${title}\n\n📝 Edit: ${editUrl}\n✅ Approve: ${approvalUrl}`;
    await provider.sendTextMessage(senderId, statusMsg);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    await provider.sendTextMessage(senderId, `Failed to create draft: ${msg}`);
  }
}
