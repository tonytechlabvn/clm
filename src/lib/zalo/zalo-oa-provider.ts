// Zalo OA bot provider — sends/receives messages via Zalo Official Account API

import type { CmaZaloBotConfig } from "@prisma/client";
import { prisma } from "@/lib/prisma-client";
import { decryptToken, encryptToken } from "@/lib/cma/crypto-utils";
import type { ZaloBotProvider } from "./zalo-bot-provider";

const ZALO_OA_API = "https://openapi.zalo.me/v3.0/oa";

type MessageCallback = (senderId: string, text: string) => void;

export class ZaloOaProvider implements ZaloBotProvider {
  readonly botType = "oa" as const;
  private messageCallback: MessageCallback | null = null;

  constructor(private config: CmaZaloBotConfig) {}

  async sendTextMessage(userId: string, text: string): Promise<void> {
    const token = await this.getToken();
    const res = await fetch(`${ZALO_OA_API}/message/cs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: token },
      body: JSON.stringify({
        recipient: { user_id: userId },
        message: { text },
      }),
    });
    const data = await res.json();
    if (data.error !== 0 && data.error !== undefined) {
      // Token expired — refresh and retry once
      if (data.error === -216) {
        await this.refreshAccessToken();
        const newToken = await this.getToken();
        await fetch(`${ZALO_OA_API}/message/cs`, {
          method: "POST",
          headers: { "Content-Type": "application/json", access_token: newToken },
          body: JSON.stringify({ recipient: { user_id: userId }, message: { text } }),
        });
        return;
      }
      throw new Error(`Zalo OA API error ${data.error}: ${data.message}`);
    }
  }

  async sendImageMessage(userId: string, imageUrl: string, caption?: string): Promise<void> {
    const token = await this.getToken();
    await fetch(`${ZALO_OA_API}/message/cs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", access_token: token },
      body: JSON.stringify({
        recipient: { user_id: userId },
        message: {
          text: caption || "",
          attachment: { type: "template", payload: { template_type: "media", elements: [{ media_type: "image", url: imageUrl }] } },
        },
      }),
    });
  }

  onMessage(callback: MessageCallback): void {
    this.messageCallback = callback;
  }

  // Called by webhook handler when OA receives a message
  handleIncomingMessage(senderId: string, text: string): void {
    this.messageCallback?.(senderId, text);
  }

  async start(): Promise<void> { /* OA uses webhooks — no persistent connection needed */ }
  async stop(): Promise<void> { /* No cleanup needed */ }

  private async getToken(): Promise<string> {
    if (!this.config.accessToken) throw new Error("Zalo OA access token not configured");
    return decryptToken(this.config.accessToken);
  }

  // Refresh OA access token using refresh token (tokens expire ~24h)
  // Uses optimistic locking to prevent concurrent double-refresh race
  async refreshAccessToken(): Promise<void> {
    if (!this.config.refreshToken) throw new Error("No Zalo OA refresh token");

    // Re-read config — another thread may have refreshed already
    const freshConfig = await prisma.cmaZaloBotConfig.findUnique({ where: { id: this.config.id } });
    if (freshConfig && freshConfig.tokenExpiry && freshConfig.tokenExpiry > new Date()) {
      this.config = freshConfig;
      return; // Token was refreshed by another request
    }

    const refreshToken = decryptToken(this.config.refreshToken);
    const appId = process.env.ZALO_OA_ID;
    const appSecret = process.env.ZALO_OA_SECRET;
    if (!appId || !appSecret) throw new Error("Missing ZALO_OA_ID or ZALO_OA_SECRET");

    const res = await fetch("https://oauth.zaloapp.com/v4/oa/access_token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", secret_key: appSecret },
      body: new URLSearchParams({ refresh_token: refreshToken, app_id: appId, grant_type: "refresh_token" }),
    });
    const data = await res.json();
    if (data.error) throw new Error(`Zalo token refresh failed: ${data.error}`);

    await prisma.cmaZaloBotConfig.update({
      where: { id: this.config.id },
      data: {
        accessToken: encryptToken(data.access_token),
        refreshToken: encryptToken(data.refresh_token),
        tokenExpiry: new Date(Date.now() + 86400_000), // ~24h
      },
    });
    // Update local config for subsequent calls in same request
    this.config = { ...this.config, accessToken: encryptToken(data.access_token) };
  }
}
