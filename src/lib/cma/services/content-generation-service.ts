// AI original content generation — two-step: outline → full blog post
// Uses higher-quality models (Claude/GPT-4) for original content

import { callAI } from "@/lib/ai-service";
import type { AIProvider } from "@/types";
import { checkAiBudget, trackTokenUsage } from "./content-ai-service";

// Use Claude for high-quality original content generation
const GENERATION_PROVIDER: AIProvider = "gemini";
const GENERATION_MODEL = "gemini-2.5-flash";

function getGeminiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not configured");
  return key;
}

export type ContentTone = "professional" | "casual" | "technical" | "educational";

export interface OutlineSection {
  heading: string;
  keyPoints: string[];
}

export interface GeneratedOutline {
  title: string;
  metaDescription: string;
  sections: OutlineSection[];
  suggestedImagePrompts: string[];
}

export interface GeneratedContent {
  blogContent: string;
  metaDescription: string;
  fbExcerpt: string;
  linkedinExcerpt: string;
  suggestedImagePrompts: string[];
  tokensUsed: number;
}

const OUTLINE_SYSTEM_PROMPT = `You are a senior content strategist for TonyTechLab, an EdTech company.
Given the topic and keywords, create a structured blog post outline.

Respond with valid JSON only (no markdown fences):
{
  "title": "Compelling blog post title",
  "metaDescription": "SEO meta description (150-160 chars)",
  "sections": [
    { "heading": "H2 heading", "keyPoints": ["point 1", "point 2"] }
  ],
  "suggestedImagePrompts": ["description of relevant image 1", "..."]
}

Create 5-8 sections. Include intro and conclusion sections.`;

/** Generate a structured outline from topic + keywords */
export async function generateOutline(
  orgId: string,
  topic: string,
  keywords: string[],
  tone: ContentTone,
  language: string,
  targetWordCount: number
): Promise<GeneratedOutline & { tokensUsed: number }> {
  await checkAiBudget(orgId);

  const userMessage = `Topic: ${topic}
Keywords: ${keywords.join(", ")}
Tone: ${tone}
Language: ${language}
Target length: ~${targetWordCount} words`;

  const fullPrompt = `${OUTLINE_SYSTEM_PROMPT}\n\n${userMessage}`;

  const result = await callAI(GENERATION_PROVIDER, getGeminiKey(), fullPrompt, 2048, GENERATION_MODEL);
  await trackTokenUsage(orgId, result.usage.totalTokens);

  const parsed = parseJsonSafe(result.text);
  return {
    title: String(parsed.title || topic),
    metaDescription: String(parsed.metaDescription || "").slice(0, 160),
    sections: Array.isArray(parsed.sections) ? parsed.sections : [],
    suggestedImagePrompts: Array.isArray(parsed.suggestedImagePrompts) ? parsed.suggestedImagePrompts : [],
    tokensUsed: result.usage.totalTokens,
  };
}

/** Generate full blog content from an approved outline */
export async function generateFullContent(
  orgId: string,
  outline: { title: string; sections: OutlineSection[] },
  tone: ContentTone,
  language: string,
  targetWordCount: number
): Promise<GeneratedContent> {
  await checkAiBudget(orgId);

  const outlineText = outline.sections
    .map((s) => `## ${s.heading}\n${s.keyPoints.map((p) => `- ${p}`).join("\n")}`)
    .join("\n\n");

  const systemPrompt = `You are a senior content writer for TonyTechLab, an EdTech company.
Style: ${tone}
SEO: Include target keywords naturally. Use H2/H3 headings.
Length: ${targetWordCount} words.
Language: ${language}

Write engaging, informative content following the outline below.
Include practical examples where relevant.
Add [IMAGE] placeholders where visuals would help.
Write a compelling introduction and conclusion.

Return valid JSON only (no markdown fences):
{
  "blogContent": "Full markdown blog post content",
  "metaDescription": "SEO meta description (150-160 chars)",
  "fbExcerpt": "Facebook excerpt (max 200 chars, engaging)",
  "linkedinExcerpt": "LinkedIn excerpt (max 300 chars, professional)",
  "suggestedImagePrompts": ["image description 1", "..."]
}`;

  const userMessage = `Title: ${outline.title}\n\nOutline:\n${outlineText}`;
  const fullPrompt = `${systemPrompt}\n\n${userMessage}`;

  const result = await callAI(GENERATION_PROVIDER, getGeminiKey(), fullPrompt, 8192, GENERATION_MODEL);
  await trackTokenUsage(orgId, result.usage.totalTokens);

  const parsed = parseJsonSafe(result.text);
  return {
    blogContent: String(parsed.blogContent || ""),
    metaDescription: String(parsed.metaDescription || "").slice(0, 160),
    fbExcerpt: String(parsed.fbExcerpt || "").slice(0, 200),
    linkedinExcerpt: String(parsed.linkedinExcerpt || "").slice(0, 300),
    suggestedImagePrompts: Array.isArray(parsed.suggestedImagePrompts) ? parsed.suggestedImagePrompts : [],
    tokensUsed: result.usage.totalTokens,
  };
}

/** Safely parse JSON from AI response */
function parseJsonSafe(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Failed to parse AI response as JSON");
  }
}
