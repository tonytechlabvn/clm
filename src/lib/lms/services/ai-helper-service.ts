// Shared AI helper for LMS/Classroom — enforces rate limiting, quota, logging
// All LMS AI calls must go through callLmsAI to ensure consistent enforcement

import { callAI } from "@/lib/ai-service";
import { checkRateLimit } from "@/lib/rate-limiter";
import { prisma } from "@/lib/prisma-client";
import type { AIProvider, AIUsage } from "@/types";

interface CallLmsAIParams {
  userId: string;
  action: string;
  prompt: string;
  maxTokens?: number;
}

interface CallLmsAIResult {
  text: string;
  usage: AIUsage;
}

/** Resolve AI provider config from SystemSetting, falling back to env vars */
async function resolveAIConfig(): Promise<{
  provider: AIProvider;
  apiKey: string;
  modelId: string | undefined;
}> {
  const [providerSetting, apiKeySetting, modelSetting] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "ai_provider" } }),
    prisma.systemSetting.findUnique({ where: { key: "ai_api_key" } }),
    prisma.systemSetting.findUnique({ where: { key: "ai_model" } }),
  ]);

  const provider = (providerSetting?.value as AIProvider) || "gemini";
  const modelId = modelSetting?.value || undefined;

  let apiKey = apiKeySetting?.value || "";
  if (!apiKey) {
    if (provider === "gemini") apiKey = process.env.GEMINI_API_KEY || "";
    else if (provider === "openai") apiKey = process.env.OPENAI_API_KEY || "";
    else if (provider === "claude") apiKey = process.env.ANTHROPIC_API_KEY || "";
  }

  return { provider, apiKey, modelId };
}

/**
 * Central LMS AI call function.
 * Checks rate limit → checks quota → calls AI → logs usage → deducts quota.
 */
export async function callLmsAI(params: CallLmsAIParams): Promise<CallLmsAIResult> {
  const { userId, action, prompt, maxTokens = 4096 } = params;

  // 1. Rate limit check
  const rateLimit = checkRateLimit(userId);
  if (!rateLimit.allowed) {
    const retryAfterSec = Math.ceil(rateLimit.retryAfterMs / 1000);
    throw Object.assign(
      new Error(`Rate limit exceeded. Retry after ${retryAfterSec} seconds.`),
      { code: "RATE_LIMITED", retryAfterMs: rateLimit.retryAfterMs }
    );
  }

  // 2. Quota check — ensure user has remaining uses
  const quota = await prisma.userAiQuota.findUnique({ where: { userId } });
  const freeLeft = quota?.freeUsesLeft ?? 0;
  const paidLeft = quota?.paidUsesLeft ?? 0;

  if (freeLeft <= 0 && paidLeft <= 0) {
    throw Object.assign(
      new Error("AI quota exhausted. Please upgrade your plan."),
      { code: "QUOTA_EXHAUSTED" }
    );
  }

  // 3. Resolve provider config
  const { provider, apiKey, modelId } = await resolveAIConfig();

  // 4. Call AI
  console.log(`[lms-ai] action=${action} userId=${userId} provider=${provider}`);
  const response = await callAI(provider, apiKey, prompt, maxTokens, modelId);

  // 5. Log usage
  await prisma.aiUsageLog.create({
    data: {
      userId,
      action,
      source: "pool",
      provider,
      model: response.usage.model,
      tokens: response.usage.totalTokens,
    },
  });

  // 6. Deduct quota — free first, then paid; increment totalUsed
  const deductFree = freeLeft > 0;
  await prisma.userAiQuota.update({
    where: { userId },
    data: {
      freeUsesLeft: deductFree ? { decrement: 1 } : undefined,
      paidUsesLeft: !deductFree ? { decrement: 1 } : undefined,
      totalUsed: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });

  console.log(
    `[lms-ai] action=${action} completed tokens=${response.usage.totalTokens} model=${response.usage.model}`
  );

  return { text: response.text, usage: response.usage };
}
