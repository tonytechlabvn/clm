// ZaloBotProvider interface — OA implements now, Personal implements in Phase 4b

import { prisma } from "@/lib/prisma-client";
import { ZaloOaProvider } from "./zalo-oa-provider";

export interface ZaloBotProvider {
  readonly botType: "oa" | "personal";
  sendTextMessage(userId: string, text: string): Promise<void>;
  sendImageMessage(userId: string, imageUrl: string, caption?: string): Promise<void>;
  // OA: webhook calls handleIncomingMessage → triggers callback
  // Personal (4b): WebSocket listens and triggers callback
  onMessage(callback: (senderId: string, text: string) => void): void;
  start(): Promise<void>;
  stop(): Promise<void>;
}

// Factory — creates the correct provider based on org's bot config
export async function createZaloBotProvider(orgId: string): Promise<ZaloBotProvider | null> {
  const config = await prisma.cmaZaloBotConfig.findUnique({ where: { orgId } });
  if (!config?.isActive) return null;

  // Phase 4b: if (config.botType === "personal") return new ZaloPersonalProvider(config);
  if (config.botType === "oa") return new ZaloOaProvider(config);

  return null;
}
