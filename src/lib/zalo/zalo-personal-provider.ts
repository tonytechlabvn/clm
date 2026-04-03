// Zalo personal bot provider — sends messages via OpenZCA CLI (docker exec)

import type { ZaloBotProvider } from "./zalo-bot-provider";

// Execute openzca command in the sidecar container
function openzcaExec(cmd: string): Promise<string> {
  const { execSync } = require("child_process");
  try {
    return Promise.resolve(
      execSync(`docker exec -u node clm-openzca npx openzca@latest ${cmd}`, { timeout: 15000, encoding: "utf8" })
    );
  } catch (err: any) {
    console.error("[zalo-personal] Command failed:", err.stderr || err.message);
    return Promise.resolve("");
  }
}

export class ZaloPersonalProvider implements ZaloBotProvider {
  readonly botType = "personal" as const;
  private messageCallback: ((senderId: string, text: string) => void) | null = null;

  async sendTextMessage(userId: string, text: string): Promise<void> {
    // Escape single quotes for shell safety — keep newlines as-is (openzca handles them)
    const safeText = text.replace(/'/g, "'\\''");
    console.log(`[zalo-personal] Sending to ${userId}: ${safeText.substring(0, 50)}...`);
    const result = await openzcaExec(`msg send '${userId}' '${safeText}'`);
    console.log(`[zalo-personal] Send result: ${result.substring(0, 100)}`);
  }

  async sendImageMessage(userId: string, imageUrl: string, _caption?: string): Promise<void> {
    await openzcaExec(`msg image '${userId}' '${imageUrl}'`);
  }

  // Personal mode receives messages via webhook (OpenZCA --webhook flag)
  onMessage(callback: (senderId: string, text: string) => void): void {
    this.messageCallback = callback;
  }

  async start(): Promise<void> { /* OpenZCA runs as separate container */ }
  async stop(): Promise<void> { /* Managed by Docker */ }
}
