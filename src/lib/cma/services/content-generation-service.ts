// AI original content generation — two-step: outline → full blog post
// Uses higher-quality models (Claude/GPT-4) for original content

import { callAI } from "@/lib/ai-service";
import { getActiveAiConfig } from "@/lib/ai-settings-service";
import { checkAiBudget, trackTokenUsage } from "./content-ai-service";
import { parseAiJson } from "./ai-json-parser";

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

  const parsed = parseAiJson(result.text);
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

  const systemPrompt = `You are a senior content writer for TonyTechLab, an EdTech company.
Style: ${tone}. SEO: Use keywords naturally. Length: ~${targetWordCount} words. Language: ${language}.

Generate a beautifully structured blog post using TonyTechLab's HTML template.
CSS is provided externally — you ONLY output HTML using these exact class names.

TEMPLATE STRUCTURE (follow this order):
1. Wrap everything in: <div class="tn-cf-post">
2. Intro box: <div class="tn-cf-intro"><em>Intro text with <strong>key topic</strong> highlighted...</em></div>
3. Table of contents: <div class="tn-cf-toc"><h3>📑 Mục Lục</h3><ul><li>👉 <a href="#section-id">Section Title</a></li>...</ul></div>
4. Regular sections: <h2 id="section-id">Section Title</h2> (use relevant emojis)
5. Sub-sections: <h3>Sub-heading</h3>
6. Numbered step sections: <h2 class="tn-step-heading" id="step-x"><span class="tn-step-number">1</span> Step Title</h2>
7. Conclusion: <div class="tn-conclusion"><h2>Title</h2><p>Summary...</p><ul><li><span class="tn-check-icon">✔</span> Key point</li>...</ul></div>
8. Tags: <div class="tn-tags"><span class="tn-tag">#Tag1</span><span class="tn-tag">#Tag2</span>...</div>

AVAILABLE COMPONENTS (use these class names exactly):
- Info callout: <div class="tn-callout tn-highlight-box"><strong>💡 Title:</strong> Content...</div>
- Warning callout: <div class="tn-callout tn-warning-box"><strong>⚠️ Title:</strong> Content...</div>
- Success callout: <div class="tn-callout tn-success-box"><strong>✅ Title:</strong> Content...</div>
- Code block: <div class="tn-code-block"><span class="tn-code-label">Label</span><pre><code>code here</code></pre></div>
- Table: <div class="tn-comparison-table-wrapper"><table class="tn-comparison-table"><thead><tr><th>Col1</th>...</tr></thead><tbody><tr><td>Data</td>...</tr></tbody></table></div>
- Regular elements: <p>, <ul>, <ol>, <li>, <strong>, <em>, <code>, <a href="">

IMAGE PLACEHOLDERS (2-4 per post):
- Use: <figure class="ai-image tn-cf-figure" data-query="2-5 english words for stock photo"><figcaption class="tn-cf-figcaption">Caption</figcaption></figure>

RULES:
- Do NOT use inline style= attributes (CSS is external)
- Do NOT include <style>, <html>, <head>, or <body>
- Use emojis in headings for visual appeal
- Make content engaging with callout boxes, tables, code blocks
- Include a TOC linking to section IDs
- For numbered steps, ALWAYS use <h2 class="tn-step-heading"> with <span class="tn-step-number">N</span> inside — this renders the number as a circular badge inline with the heading text
- For conclusion checklist items, use <span class="tn-check-icon">✔</span> before each point
- Wrap tables in <div class="tn-comparison-table-wrapper"> for responsive scrolling

Return valid JSON only (no markdown fences):
{
  "blogContent": "<div class='tn-cf-post'>...HTML content...</div>",
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
  console.log(`[generateFullContent] Using ${ai.provider}/${ai.model}`);
  const result = await callAI(ai.provider, ai.apiKey, fullPrompt, 16384, ai.model);
  console.log(`[generateFullContent] Response length: ${result.text.length}, tokens: ${result.usage.totalTokens}`);
  await trackTokenUsage(orgId, result.usage.totalTokens);

  const parsed = parseAiJson(result.text);
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

