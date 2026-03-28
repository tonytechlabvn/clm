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

Write engaging, informative content following the outline below as **beautifully styled HTML with inline styles**.
Include practical examples where relevant.
Write a compelling introduction and conclusion.

CRITICAL HTML + INLINE STYLE RULES:
- Every element MUST have inline style= attributes (WordPress strips <style> tags)
- Wrap everything in: <div style="max-width:760px;margin:0 auto;font-family:'Segoe UI',system-ui,-apple-system,sans-serif;color:#2d3748;line-height:1.8;padding:20px;">
- H2: style="font-size:1.7em;font-weight:700;color:#1a365d;margin:1.8em 0 0.6em;padding-bottom:0.3em;border-bottom:3px solid #f6ad55;"
- H3: style="font-size:1.3em;font-weight:600;color:#2d3748;margin:1.5em 0 0.4em;"
- P: style="margin:0 0 1.3em;line-height:1.8;font-size:1.05em;"
- UL/OL: style="margin:0 0 1.3em;padding-left:1.5em;"
- LI: style="margin:0.4em 0;line-height:1.8;"
- BLOCKQUOTE: style="border-left:4px solid #3182ce;padding:16px 20px;margin:1.5em 0;background:#ebf8ff;border-radius:0 10px 10px 0;color:#2a4365;line-height:1.7;"
- CODE (inline): style="background:#edf2f7;padding:3px 7px;border-radius:6px;font-size:0.88em;font-family:monospace;color:#2d3748;"
- PRE: style="background:#1a202c;color:#e2e8f0;padding:20px 24px;border-radius:10px;overflow-x:auto;margin:1.5em 0;font-size:0.9em;line-height:1.6;"
- TABLE: style="width:100%;border-collapse:collapse;margin:1.5em 0;"
- TH: style="padding:12px 16px;font-weight:600;text-align:left;color:#1a365d;border-bottom:2px solid #2d3748;background:#f7fafc;"
- TD: style="padding:10px 16px;border-bottom:1px solid #e2e8f0;"
- IMG: style="max-width:100%;height:auto;border-radius:12px;margin:1em 0;"
- A: style="color:#3182ce;text-decoration:none;"
- Use <strong> for emphasis, <em> for italics

IMAGE PLACEHOLDERS (2-4 per post):
- Use: <figure class="ai-image" data-query="descriptive english search query" style="margin:1.5em 0;text-align:center;"><figcaption style="font-size:0.85em;color:#718096;margin-top:0.5em;font-style:italic;">Caption text</figcaption></figure>
- data-query: 2-5 English words for stock photo search (e.g. "coding laptop workspace", "team collaboration office")

Do NOT include <style>, <html>, <head>, or <body> tags.

Return valid JSON only (no markdown fences):
{
  "blogContent": "<div style='...'>...full inline-styled HTML...</div>",
  "blogCss": "",
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
