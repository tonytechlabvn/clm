// DALL-E 3 image generation service — with per-org daily rate limiting
// Google Imagen deferred per red team review

import OpenAI from "openai";
import { prisma } from "@/lib/prisma-client";

const DAILY_LIMIT = 10; // configurable default: 10 images/day/org

function getOpenAI(): OpenAI {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getTodayDate(): string {
  return new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
}

/** Check if org has remaining image generation quota for today */
export async function checkImageRateLimit(
  orgId: string
): Promise<{ allowed: boolean; remaining: number }> {
  const today = getTodayDate();
  const usage = await prisma.cmaAiImageUsage.findUnique({
    where: { orgId_date: { orgId, date: today } },
  });
  const used = usage?.imageCount ?? 0;
  const remaining = Math.max(0, DAILY_LIMIT - used);
  return { allowed: remaining > 0, remaining };
}

/** Increment daily image usage counter for org */
async function incrementUsage(orgId: string): Promise<void> {
  const today = getTodayDate();
  await prisma.cmaAiImageUsage.upsert({
    where: { orgId_date: { orgId, date: today } },
    create: { orgId, date: today, imageCount: 1 },
    update: { imageCount: { increment: 1 } },
  });
}

export interface DalleOptions {
  size?: "1024x1024" | "1024x1792" | "1792x1024";
  quality?: "standard" | "hd";
}

export interface GeneratedImageResult {
  imageBuffer: Buffer;
  revisedPrompt: string;
}

/**
 * Generate image via DALL-E 3.
 * Downloads the expiring URL immediately and returns a Buffer.
 * Enforces per-org daily quota before calling the API.
 */
export async function generateWithDalle(
  prompt: string,
  orgId: string,
  options: DalleOptions = {}
): Promise<GeneratedImageResult> {
  // Check rate limit before spending API credits
  const { allowed, remaining } = await checkImageRateLimit(orgId);
  if (!allowed) {
    throw new Error(
      `Daily image generation limit reached (${DAILY_LIMIT}/day). Try again tomorrow.`
    );
  }

  const openai = getOpenAI();
  const size = options.size ?? "1024x1024";
  const quality = options.quality ?? "standard";

  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt,
    size,
    quality,
    response_format: "url",
    n: 1,
  });

  const imageData = response.data?.[0];
  if (!imageData?.url) throw new Error("DALL-E returned no image URL");

  // Download immediately — URLs expire after 1 hour
  const imgRes = await fetch(imageData.url);
  if (!imgRes.ok) throw new Error(`Failed to download generated image: ${imgRes.status}`);
  const imageBuffer = Buffer.from(await imgRes.arrayBuffer());

  // Increment usage only after successful download
  await incrementUsage(orgId);

  const revisedPrompt = imageData.revised_prompt ?? prompt;
  return { imageBuffer, revisedPrompt };
}
