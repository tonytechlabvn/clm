// AI-powered content curation and generation bridge
// Uses system/user message separation for prompt safety (RT2#8)

import { callAI } from "@/lib/ai-service";
import { prisma } from "@/lib/prisma-client";
import type { AIProvider } from "@/types";
import { getActiveAiConfig } from "@/lib/ai-settings-service";
import { sanitizeExtractedText } from "./crawler-service";

export interface CurationResult {
  blogDraft: string;
  fbExcerpt: string;
  linkedinExcerpt: string;
  tags: string[];
  tokensUsed: number;
}

const CURATION_SYSTEM_PROMPT = `You are a content marketing specialist for TonyTechLab (EdTech).
Given the article in the user message, create a JSON response with:
1. "blogDraft": Blog summary (150-300 words, markdown, maintain key insights, add attribution)
2. "fbExcerpt": Facebook excerpt (max 200 chars, engaging tone)
3. "linkedinExcerpt": LinkedIn excerpt (max 300 chars, professional tone)
4. "tags": Array of 3-5 relevant tags (lowercase, no #)

Respond ONLY with valid JSON. No markdown code fences.`;

/** Curate content from extracted article text using AI */
export async function curateContent(
  articleText: string,
  sourceUrl: string,
  orgId: string
): Promise<CurationResult> {
  await checkAiBudget(orgId);

  const sanitized = sanitizeExtractedText(articleText);
  const userMessage = `Source: ${sourceUrl}\n\nArticle:\n${sanitized.slice(0, 8000)}`;
  const ai = await getActiveAiConfig();
  const fullPrompt = `${CURATION_SYSTEM_PROMPT}\n\n---\n\n${userMessage}`;

  const result = await callAI(
    ai.provider,
    ai.apiKey,
    fullPrompt,
    2048,
    ai.model
  );

  // Track token usage
  await trackTokenUsage(orgId, result.usage.totalTokens);

  // Parse JSON response
  const parsed = parseJsonResponse(result.text);
  return {
    blogDraft: String(parsed.blogDraft || ""),
    fbExcerpt: String(parsed.fbExcerpt || "").slice(0, 200),
    linkedinExcerpt: String(parsed.linkedinExcerpt || "").slice(0, 300),
    tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 5) : [],
    tokensUsed: result.usage.totalTokens,
  };
}

/** Check org AI budget — throws if over limit */
export async function checkAiBudget(orgId: string): Promise<void> {
  const month = new Date().toISOString().slice(0, 7); // "2026-04"
  const usage = await prisma.cmaAiUsage.findUnique({
    where: { orgId_month: { orgId, month } },
  });

  if (usage && usage.tokensUsed >= usage.tokenLimit) {
    throw new Error(
      `AI budget exceeded for this month. Used: ${usage.tokensUsed}, Limit: ${usage.tokenLimit}`
    );
  }
}

/** Track token usage for org budget */
export async function trackTokenUsage(
  orgId: string,
  tokens: number
): Promise<void> {
  const month = new Date().toISOString().slice(0, 7);
  await prisma.cmaAiUsage.upsert({
    where: { orgId_month: { orgId, month } },
    create: { orgId, month, tokensUsed: tokens },
    update: { tokensUsed: { increment: tokens } },
  });
}

/** Parse JSON from AI response, handling common formatting issues */
function parseJsonResponse(text: string): Record<string, unknown> {
  // Strip markdown code fences if present
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract JSON object from response
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Failed to parse AI response as JSON");
  }
}
