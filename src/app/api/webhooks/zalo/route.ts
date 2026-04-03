// POST /api/webhooks/zalo — handles both Zalo OA webhooks and OpenZCA personal bot webhooks

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma-client";
import { ZaloOaProvider } from "@/lib/zalo/zalo-oa-provider";
import { routeMessage } from "@/lib/zalo/zalo-message-router";
import { createZaloBotProvider } from "@/lib/zalo/zalo-bot-provider";

// Verify Zalo OA webhook signature (HMAC-SHA256)
function verifyOaSignature(body: string, signature: string | null): boolean {
  const secret = process.env.ZALO_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(sigBuf, expectedBuf);
}

// Detect if payload is from OpenZCA (personal bot) vs Zalo OA
function isOpenZcaPayload(data: Record<string, unknown>): boolean {
  return typeof data.senderId === "string" && typeof data.content === "string" && typeof data.threadId === "string";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-ZEvent-Signature") || request.headers.get("mac");

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  // Route based on payload format
  if (isOpenZcaPayload(event)) {
    // OpenZCA personal bot — no HMAC signature (trusted sidecar on same network)
    processOpenZcaMessage(event).catch((err) =>
      console.error("[zalo-webhook] OpenZCA error:", err)
    );
    return NextResponse.json({ received: true });
  }

  // Zalo OA webhook — requires HMAC signature
  if (!verifyOaSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  processOaEvent(event).catch((err) =>
    console.error("[zalo-webhook] OA error:", err)
  );
  return NextResponse.json({ received: true });
}

// Handle OpenZCA personal bot messages
async function processOpenZcaMessage(event: Record<string, unknown>): Promise<void> {
  const senderId = event.senderId as string;
  const content = (event.content as string)?.trim();
  const toId = event.toId as string | undefined;
  if (!content || !senderId) return;

  // Find personal bot config matching the receiver (our bot's ID)
  const config = toId
    ? await prisma.cmaZaloBotConfig.findFirst({ where: { selfId: toId, botType: "personal", isActive: true } })
    : await prisma.cmaZaloBotConfig.findFirst({ where: { botType: "personal", isActive: true } });

  if (!config) {
    console.log("[zalo-webhook] No active personal bot config found");
    return;
  }

  const provider = await createZaloBotProvider(config.orgId);
  if (!provider) return;

  await routeMessage(senderId, content, config.orgId, provider);
}

// Handle Zalo OA webhook events
async function processOaEvent(event: Record<string, unknown>): Promise<void> {
  const eventName = event.event_name as string;
  const sender = event.sender as { id: string } | undefined;
  if (!sender?.id) return;

  const oaId = event.oa_id as string | undefined;
  const config = oaId
    ? await prisma.cmaZaloBotConfig.findFirst({ where: { oaId, botType: "oa", isActive: true } })
    : await prisma.cmaZaloBotConfig.findFirst({ where: { botType: "oa", isActive: true } });

  if (!config) return;
  const provider = new ZaloOaProvider(config);

  switch (eventName) {
    case "user_send_text": {
      const message = event.message as { text?: string } | undefined;
      const text = message?.text?.trim();
      if (!text) return;
      await routeMessage(sender.id, text, config.orgId, provider);
      break;
    }
    case "follow":
      await provider.sendTextMessage(sender.id,
        "Welcome! Send /help to see available commands.\nTo start creating posts, ask your admin for a link code."
      );
      break;
    default:
      break;
  }
}
