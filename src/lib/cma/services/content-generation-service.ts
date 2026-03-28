// AI original content generation — two-step: outline → full blog post
// Uses higher-quality models (Claude/GPT-4) for original content

import { callAI } from "@/lib/ai-service";
import { getActiveAiConfig } from "@/lib/ai-settings-service";
import { checkAiBudget, trackTokenUsage } from "./content-ai-service";

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
  blogCss: string;
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

/** Generate a structured outline from topic + keywords, optionally enriched by source context */
export async function generateOutline(
  orgId: string,
  topic: string,
  keywords: string[],
  tone: ContentTone,
  language: string,
  targetWordCount: number,
  sourceContext?: string
): Promise<GeneratedOutline & { tokensUsed: number }> {
  await checkAiBudget(orgId);

  let userMessage = `Topic: ${topic}
Keywords: ${keywords.join(", ")}
Tone: ${tone}
Language: ${language}
Target length: ~${targetWordCount} words`;

  // When source context is provided, include it as reference material
  if (sourceContext) {
    userMessage += `\n\n--- SOURCE REFERENCE MATERIAL ---\n${sourceContext.slice(0, 6000)}\n--- END SOURCE ---\n\nIMPORTANT: Use the source material above as the primary reference. Build the outline around the key insights and facts from this source. Enhance and expand on the source content rather than ignoring it.`;
  }

  const fullPrompt = `${OUTLINE_SYSTEM_PROMPT}\n\n${userMessage}`;

  const ai = await getActiveAiConfig();
  const result = await callAI(ai.provider, ai.apiKey, fullPrompt, 2048, ai.model);
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

/** Generate full blog content from an approved outline, optionally enriched by source context */
export async function generateFullContent(
  orgId: string,
  outline: { title: string; sections: OutlineSection[] },
  tone: ContentTone,
  language: string,
  targetWordCount: number,
  sourceContext?: string
): Promise<GeneratedContent> {
  await checkAiBudget(orgId);

  const outlineText = outline.sections
    .map((s) => `## ${s.heading}\n${s.keyPoints.map((p) => `- ${p}`).join("\n")}`)
    .join("\n\n");

  const systemPrompt = `You are a senior content writer and web designer for TonyTechLab, an EdTech company.
Style: ${tone}
SEO: Include target keywords naturally. Use H2/H3 headings.
Length: ${targetWordCount} words.
Language: ${language}

Write engaging, informative content following the outline below as **semantic HTML** (not markdown).
Include practical examples where relevant.
Write a compelling introduction and conclusion.

HTML RULES:
- Use semantic HTML: <article>, <section>, <h2>, <h3>, <p>, <ul>, <ol>, <blockquote>, <figure>, <code>, <pre>, <table>
- Add 2-4 image placeholders using: <figure class="ai-image" data-query="descriptive english search query"><figcaption>Caption text</figcaption></figure>
  The data-query attribute should be 2-5 English words describing the image for stock photo search (e.g. "coding laptop workspace", "team collaboration office")
- Do NOT include <style> tags, <html>, <head>, or <body> — just the article content
- Do NOT use inline styles — only semantic HTML with class names

CSS RULES:
- Provide a separate CSS string that styles the content beautifully
- Use a root class ".ai-post" to scope all styles
- Make it responsive, modern, and professional
- Style headings, paragraphs, lists, code blocks, blockquotes, figures, tables
- Add nice spacing, typography, and visual hierarchy
- Use a cohesive color palette that matches ${tone} tone
- Style .ai-image figures with a placeholder background (#f0f4f8) and min-height: 200px

Return valid JSON only (no markdown fences):
{
  "blogContent": "<article class='ai-post'>...full HTML content...</article>",
  "blogCss": ".ai-post { ... } .ai-post h2 { ... } ...",
  "metaDescription": "SEO meta description (150-160 chars)",
  "fbExcerpt": "Facebook excerpt (max 200 chars, engaging)",
  "linkedinExcerpt": "LinkedIn excerpt (max 300 chars, professional)",
  "suggestedImagePrompts": ["image description 1", "..."]
}`;

  let userMessage = `Title: ${outline.title}\n\nOutline:\n${outlineText}`;

  // When source context is provided, include it as reference material for richer content
  if (sourceContext) {
    userMessage += `\n\n--- SOURCE REFERENCE MATERIAL ---\n${sourceContext.slice(0, 6000)}\n--- END SOURCE ---\n\nIMPORTANT: Use the source material above as primary reference. Include specific facts, data, and insights from the source. Enhance and expand on the content rather than generic writing.`;
  }

  const fullPrompt = `${systemPrompt}\n\n${userMessage}`;

  const ai = await getActiveAiConfig();
  const result = await callAI(ai.provider, ai.apiKey, fullPrompt, 8192, ai.model);
  await trackTokenUsage(orgId, result.usage.totalTokens);

  const parsed = parseJsonSafe(result.text);
  return {
    blogContent: String(parsed.blogContent || ""),
    blogCss: String(parsed.blogCss || ""),
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
