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

/**
 * Build a custom AI prompt by analyzing the template HTML to detect its format type,
 * then instruct the AI to generate content in that format.
 */
function buildTemplatePrompt(
  templateHtml: string,
  tone: string,
  language: string,
  targetWordCount: number
): string {
  // Detect template format from HTML structure
  const isDialogue = templateHtml.includes('message-bubble') || templateHtml.includes('tony-chat');
  const hasSubCards = templateHtml.includes('ai-sub-card');
  const hasInsightBox = templateHtml.includes('ai-insight-box');
  const hasFooter = templateHtml.includes('<footer');

  if (isDialogue) {
    // Dialogue chat template — generate as Tony x AI conversation
    return `You are a content writer for TonyTechLab EdTech. Generate a dialogue/conversation between a human (Tony) and an AI assistant.
Style: ${tone}. Length: ~${targetWordCount} words. Language: ${language}.

FORMAT: Generate as a dialogue with 5-8 message exchanges. Each exchange has:
1. Tony asks a question or makes a statement
2. AI responds with analysis, numbered points, bullet lists, or insight boxes

Use TonyTechLab's HTML template structure exactly:
- Wrap in: <div class="tony-chat-wrapper" style="max-width: 850px; margin: 30px auto; background: #ffffff; border-radius: 16px; box-shadow: 0 10px 40px rgba(0,0,0,0.06); padding: 45px; border: 1px solid #f0f0f0;">
- Header: <header style="text-align: center; margin-bottom: 50px; border-bottom: 2px solid #f8fafc; padding-bottom: 30px;"><h1 style="font-size: 2.2em; color: #1e293b; line-height: 1.3; margin-bottom: 15px; font-weight: 700;">Title<br><span style="color: #2563eb;">Subtitle</span></h1><p style="color: #64748b; font-size: 1.1em; font-style: italic;">Description</p></header>
- Messages container: <div style="display: flex; flex-direction: column; gap: 35px;">
- Tony message: <div style="display: flex; flex-direction: column; align-items: flex-start;"><div style="display: flex; align-items: center; margin-bottom: 8px;"><span style="width: 32px; height: 32px; background: #2563eb; color: white; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-size: 14px; font-weight: bold; margin-right: 10px;">T</span><span style="font-weight: 700; color: #1e293b; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px;">Tony</span></div><div class="message-bubble" style="background-color: #f1f5f9; padding: 18px 25px; border-radius: 0 20px 20px 20px; border-left: 5px solid #2563eb; color: #334155; line-height: 1.7; max-width: 85%;"><p style="margin: 0;">Tony text here</p></div></div>
- AI message: <div style="display: flex; flex-direction: column; align-items: flex-end;"><div style="display: flex; align-items: center; margin-bottom: 8px; flex-direction: row-reverse;"><span style="width: 32px; height: 32px; background: #059669; color: white; display: flex; justify-content: center; align-items: center; border-radius: 50%; font-size: 14px; font-weight: bold; margin-left: 10px;">AI</span><span style="font-weight: 700; color: #1e293b; font-size: 0.9em; text-transform: uppercase; letter-spacing: 1px;">AI TITLE</span></div><div class="message-bubble" style="background-color: #f0fdf4; padding: 25px; border-radius: 20px 0 20px 20px; border-right: 5px solid #059669; color: #1a2e21; line-height: 1.7; max-width: 90%; text-align: left;">AI content with <strong>bold</strong>, lists, sub-cards</div></div>
${hasSubCards ? '- Sub-cards inside AI messages: <div class="ai-sub-card" style="background: #ffffff; padding: 15px; border-radius: 10px; border: 1px solid #dcfce7; margin-bottom: 12px;"><strong style="color: #059669;">Point Title</strong><p>Details</p></div>' : ""}
${hasInsightBox ? '- Insight boxes: <div class="ai-insight-box" style="margin-top: 20px; padding: 25px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; color: #92400e;"><strong>Warning/Insight Title</strong><p>Content</p></div>' : ""}
${hasFooter ? '- Footer: <footer style="margin-top: 60px; padding-top: 30px; border-top: 1px solid #f1f5f9; text-align: center;"><p style="font-weight: 600; color: #64748b; font-style: italic;">Closing quote</p><div style="color: #94a3b8; font-size: 0.8em; text-transform: uppercase; letter-spacing: 2px;">— End —</div></footer>' : ""}

CRITICAL: Copy the inline style= attributes EXACTLY. Do NOT use class-only styling.
CRITICAL: Return valid JSON only (no markdown fences, no extra text).

{
  "blogContent": "<complete HTML with the dialogue structure above>",
  "blogCss": "",
  "metaDescription": "SEO meta (150-160 chars)",
  "fbExcerpt": "Facebook excerpt (max 200 chars)",
  "linkedinExcerpt": "LinkedIn excerpt (max 300 chars)",
  "suggestedImagePrompts": ["img desc 1", "img desc 2"]
}`;
  }

  // Default: fallback — should not reach here, but return empty
  return "";
}

/** Generate full blog content from an approved outline, optionally enriched by source context */
export async function generateFullContent(
  orgId: string,
  outline: { title: string; sections: OutlineSection[] },
  tone: ContentTone,
  language: string,
  targetWordCount: number,
  sourceContext?: string,
  templateHtml?: string
): Promise<GeneratedContent> {
  await checkAiBudget(orgId);

  const outlineText = outline.sections
    .map(function(s) {
      const points = s.keyPoints.map(function(p) { return "- " + p; }).join("\n");
      return "## " + s.heading + "\n" + points;
    })
    .join("\n\n");

  // When a template HTML is provided, use it as the format reference instead of default
  const systemPrompt = templateHtml
    ? buildTemplatePrompt(templateHtml, tone, language, targetWordCount)
    : `You are a senior content writer for TonyTechLab, an EdTech company.
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

