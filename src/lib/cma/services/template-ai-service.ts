// AI-powered template generation and content filling for Template Studio

import DOMPurify from "isomorphic-dompurify";
import { callAI } from "@/lib/ai-service";
import { getActiveAiConfig } from "@/lib/ai-settings-service";
import { parseAiJson } from "./ai-json-parser";
import { checkAiBudget, trackTokenUsage } from "./content-ai-service";
import { scopeCss, sanitizeCss } from "./template-css-scoper";
import { CMA_TEMPLATE_GENERATION_PROMPT } from "@/lib/prompts/cma-template-generation-prompt";
import { CMA_CONTENT_FILL_PROMPT } from "@/lib/prompts/cma-content-fill-prompt";
import type { SlotDefinition } from "@/types/cma-template-types";
import type { SlotValues } from "@/types/cma-template-types";
import type { ExtractedTemplate } from "./template-extraction-service";

/** Generate an HTML/CSS template from a natural language description */
export async function generateTemplateFromDescription(
  description: string,
  orgId: string
): Promise<ExtractedTemplate> {
  await checkAiBudget(orgId);
  const ai = await getActiveAiConfig();

  const prompt = `${CMA_TEMPLATE_GENERATION_PROMPT}\n\n---\n\nDescription: ${description.slice(0, 2000)}`;
  const result = await callAI(ai.provider, ai.apiKey, prompt, 4096, ai.model);
  await trackTokenUsage(orgId, result.usage.totalTokens);

  const parsed = parseAiJson(result.text);

  // Sanitize the generated HTML
  const html = DOMPurify.sanitize(String(parsed.html || ""), {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "blockquote",
      "ul", "ol", "li", "a", "img", "figure", "figcaption",
      "div", "span", "section", "article", "header", "footer",
      "strong", "em", "b", "i", "u", "s", "mark", "small",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "width", "height", "class", "style"],
  });

  // Sanitize and scope CSS under template container
  const css = sanitizeCss(String(parsed.css || ""));
  const scopeClass = `tpl-${Date.now()}`;
  const cssScoped = scopeCss(css, scopeClass);

  // Parse slot definitions from AI response
  const rawSlots = Array.isArray(parsed.slots) ? parsed.slots : [];
  const slotDefinitions: SlotDefinition[] = rawSlots
    .filter((s: Record<string, unknown>) => s && typeof s.name === "string")
    .map((s: Record<string, unknown>) => ({
      name: String(s.name).replace(/[^a-z0-9_]/gi, "_").toLowerCase(),
      type: (["text", "richtext", "image", "list"].includes(String(s.type)) ? String(s.type) : "text") as SlotDefinition["type"],
      label: String(s.label || s.name),
      placeholder: String(s.placeholder || ""),
      maxLength: s.maxLength ? Math.min(Number(s.maxLength), 50000) : undefined,
      required: Boolean(s.required),
    }))
    .slice(0, 15);

  return {
    title: `AI Generated: ${description.slice(0, 50)}`,
    htmlTemplate: html,
    cssScoped,
    slotDefinitions,
    sourceUrl: "",
  };
}

/** Generate content for all slots given a topic and tone */
export async function fillTemplateSlots(
  slotDefinitions: SlotDefinition[],
  topic: string,
  tone: string,
  orgId: string
): Promise<SlotValues> {
  await checkAiBudget(orgId);
  const ai = await getActiveAiConfig();

  const slotSummary = slotDefinitions
    .map((s) => `- ${s.name} (${s.type}, label: "${s.label}", maxLength: ${s.maxLength || "none"}, required: ${s.required})`)
    .join("\n");

  const prompt = `${CMA_CONTENT_FILL_PROMPT}\n\n---\n\nSlots:\n${slotSummary}\n\nTopic: ${topic.slice(0, 1000)}\nTone: ${tone || "professional"}`;
  const result = await callAI(ai.provider, ai.apiKey, prompt, 2048, ai.model);
  await trackTokenUsage(orgId, result.usage.totalTokens);

  const parsed = parseAiJson(result.text);

  // Validate and truncate slot values to maxLength
  const slotValues: SlotValues = {};
  for (const slot of slotDefinitions) {
    const value = parsed[slot.name];
    if (value !== undefined) {
      let strValue = String(value);
      if (slot.maxLength && strValue.length > slot.maxLength) {
        strValue = strValue.slice(0, slot.maxLength);
      }
      slotValues[slot.name] = strValue;
    }
  }

  return slotValues;
}
