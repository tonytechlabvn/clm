// POST /api/webhooks/zalo — Zalo OA webhook handler with HMAC-SHA256 verification

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma-client";
import { ZaloOaProvider } from "@/lib/zalo/zalo-oa-provider";
import { routeMessage } from "@/lib/zalo/zalo-message-router";

// Verify Zalo webhook signature (HMAC-SHA256 of request body)
function verifySignature(body: string, signature: string | null): boolean {
  const secret = process.env.ZALO_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(body).digest("hex");
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expected);
  if (sigBuf.length !== expectedBuf.length) return false;
  return timingSafeEqual(sigBuf, expectedBuf);
}

// Validate webhook payload has required fields
function isValidEvent(event: Record<string, unknown>): boolean {
  return typeof event.event_name === "string"
    && typeof event.sender === "object" && event.sender !== null
    && typeof (event.sender as Record<string, unknown>).id === "string";
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-ZEvent-Signature")
    || request.headers.get("mac"); // Zalo uses "mac" header

  // Verify HMAC signature
  if (!verifySignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // Return 200 immediately — process async (Zalo requires <5s response)
  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Malformed JSON" }, { status: 400 });
  }

  // Validate event structure
  if (!isValidEvent(event)) {
    return NextResponse.json({ error: "Invalid event payload" }, { status: 400 });
  }

  // Fire and forget — don't await to meet Zalo's 5s timeout
  processEventAsync(event).catch((err) => {
    console.error("[zalo-webhook] Error processing event:", err);
  });

  return NextResponse.json({ received: true });
}

async function processEventAsync(event: Record<string, unknown>): Promise<void> {
  const eventName = event.event_name as string;
  const sender = event.sender as { id: string };
  const senderId = sender.id;

  // Find the org that owns this OA bot config
  const oaId = event.oa_id as string | undefined;
  const config = oaId
    ? await prisma.cmaZaloBotConfig.findFirst({ where: { oaId, botType: "oa", isActive: true } })
    : await prisma.cmaZaloBotConfig.findFirst({ where: { botType: "oa", isActive: true } });

  if (!config) return; // No active OA config — ignore

  const provider = new ZaloOaProvider(config);

  switch (eventName) {
    case "user_send_text": {
      const message = event.message as { text?: string } | undefined;
      const text = message?.text?.trim();
      if (!text) return;
      await routeMessage(senderId, text, config.orgId, provider);
      break;
    }
    case "follow": {
      await provider.sendTextMessage(senderId,
        "Welcome! Send /help to see available commands.\nTo start creating posts, ask your admin for a link code."
      );
      break;
    }
    case "unfollow":
      // Clean up: could deactivate user mapping, but keep for now
      break;
    default:
      // Ignore other event types (user_send_image handled in future)
      break;
  }
}
