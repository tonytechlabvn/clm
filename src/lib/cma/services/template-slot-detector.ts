// AI-powered slot detection + placeholder injection for Template Studio
// Analyzes simplified HTML to identify content zones, then replaces content with {{slot}} placeholders

import { callAI } from "@/lib/ai-service";
import { getActiveAiConfig } from "@/lib/ai-settings-service";
import { parseAiJson } from "./ai-json-parser";
import {
  checkAiBudget,
  trackTokenUsage,
} from "./content-ai-service";
import { CMA_SLOT_DETECTION_SYSTEM_PROMPT } from "@/lib/prompts/cma-slot-detection-prompt";
import type { SlotDefinition } from "@/types/cma-template-types";

/** Strip attributes and truncate text to create a lightweight HTML outline for AI */
export function simplifyHtmlForAi(html: string): string {
  return (
    html
      // Strip all attributes except tag names
      .replace(/<(\w+)\s[^>]*>/g, "<$1>")
      // Collapse whitespace
      .replace(/\s{2,}/g, " ")
      // Truncate text nodes to 50 chars
      .replace(/>([^<]{50,})/g, (_m, text: string) => {
        return `>${text.slice(0, 50).trim()}...`;
      })
      // Remove empty elements
      .replace(/<(\w+)>\s*<\/\1>/g, "")
      .trim()
  );
}

/** Use AI to detect content slots from simplified HTML */
export async function detectSlots(
  simplifiedHtml: string,
  orgId: string
): Promise<SlotDefinition[]> {
  await checkAiBudget(orgId);

  const ai = await getActiveAiConfig();
  const prompt = `${CMA_SLOT_DETECTION_SYSTEM_PROMPT}\n\n---\n\n${simplifiedHtml.slice(0, 6000)}`;

  const result = await callAI(ai.provider, ai.apiKey, prompt, 2048, ai.model);
  await trackTokenUsage(orgId, result.usage.totalTokens);

  // Parse response — AI returns a JSON array, parseAiJson expects object so we wrap
  const text = result.text.trim();
  let slots: SlotDefinition[];

  try {
    // Try direct array parse first
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      slots = JSON.parse(arrayMatch[0]);
    } else {
      // Fallback: wrap in object and parse
      const parsed = parseAiJson(`{"slots": ${text}}`);
      slots = parsed.slots as SlotDefinition[];
    }
  } catch {
    console.warn("[slot-detector] AI parse failed, using heuristic fallback");
    slots = heuristicSlotDetection(simplifiedHtml);
  }

  return validateSlots(slots);
}

/** Heuristic fallback when AI fails — detect slots from HTML tags */
export function heuristicSlotDetection(html: string): SlotDefinition[] {
  const slots: SlotDefinition[] = [];
  let sectionCount = 0;

  // Detect headings as text slots
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (h1Match) {
    slots.push({
      name: "title",
      type: "text",
      label: "Main Title",
      placeholder: h1Match[1].replace(/<[^>]+>/g, "").slice(0, 100),
      maxLength: 200,
      required: true,
    });
  }

  // Detect first image as hero
  const imgMatch = html.match(/<img[^>]*src="([^"]*)"[^>]*>/i);
  if (imgMatch) {
    slots.push({
      name: "hero_image",
      type: "image",
      label: "Hero Image",
      placeholder: imgMatch[1] || "",
      required: false,
    });
  }

  // Detect paragraph blocks as richtext — single body content slot
  const pBlocks = html.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
  if (pBlocks.length > 0) {
    sectionCount++;
    slots.push({
      name: "body_content",
      type: "richtext",
      label: "Body Content",
      placeholder: "Paste or write your content here...",
      maxLength: 50000,
      required: true,
    });
  }

  return slots.length > 0
    ? slots
    : [
        {
          name: "content",
          type: "richtext",
          label: "Content",
          placeholder: "Content goes here...",
          maxLength: 10000,
          required: true,
        },
      ];
}

/** Validate and sanitize slot definitions from AI */
function validateSlots(slots: SlotDefinition[]): SlotDefinition[] {
  if (!Array.isArray(slots) || slots.length === 0) {
    return [
      {
        name: "content",
        type: "richtext",
        label: "Content",
        placeholder: "",
        required: true,
      },
    ];
  }

  const validTypes = new Set(["text", "richtext", "image", "list"]);

  return slots
    .filter((s) => s && typeof s.name === "string" && s.name.length > 0)
    .map((s) => ({
      name: s.name.replace(/[^a-z0-9_]/gi, "_").toLowerCase(),
      type: validTypes.has(s.type) ? s.type : "text",
      label: String(s.label || s.name),
      placeholder: String(s.placeholder || ""),
      maxLength: s.maxLength ? Math.min(Number(s.maxLength), 50000) : undefined,
      required: Boolean(s.required),
    }))
    .slice(0, 15); // Cap at 15 slots
}

/** Replace content in HTML with {{slot_name}} placeholders based on slot definitions */
export function injectSlotPlaceholders(
  html: string,
  slots: SlotDefinition[]
): string {
  let result = html;

  for (const slot of slots) {
    if (slot.type === "image") {
      // Replace first img src with placeholder
      if (slot.placeholder) {
        result = result.replace(
          new RegExp(`src="${escapeRegex(slot.placeholder)}"`, "i"),
          `src="{{${slot.name}}}"`
        );
      } else {
        // Replace first img src found
        result = result.replace(
          /src="([^"]+)"/i,
          `src="{{${slot.name}}}"`
        );
      }
    } else if (slot.type === "text" && slot.name.includes("title")) {
      // Replace heading content
      result = result.replace(
        /(<h[1-3][^>]*>)([\s\S]*?)(<\/h[1-3]>)/i,
        `$1{{${slot.name}}}$3`
      );
    } else if (slot.type === "richtext" || slot.type === "list") {
      // Strip text from leaf elements (p, li, h2-h6, blockquote, figcaption, span)
      // but keep structural wrappers (div, section, article) with their class names
      result = replaceLeafTextWithPlaceholders(result);
    }
  }

  return result;
}

/**
 * Replace text content inside leaf HTML elements with short placeholder text.
 * Keeps structural wrappers (div, section, article, figure) and their CSS classes intact.
 * Only clears text inside content elements: p, h1-h6, li, blockquote, figcaption, span, code, pre, td, th.
 */
function replaceLeafTextWithPlaceholders(html: string): string {
  // Leaf tags whose inner text should be replaced with placeholder
  const leafTags = "p|h[1-6]|li|blockquote|figcaption|td|th";
  const leafRegex = new RegExp(
    `(<(?:${leafTags})(\\s[^>]*)?>)([\\s\\S]*?)(<\\/(?:${leafTags})>)`,
    "gi"
  );

  let counter = 0;
  return html.replace(leafRegex, (_, open: string, _attrs: string, _content: string, close: string) => {
    counter++;
    // Determine placeholder based on tag type
    const tagMatch = open.match(/<(\w+)/);
    const tag = tagMatch ? tagMatch[1].toLowerCase() : "p";
    let placeholder = "...";
    if (tag.match(/^h\d$/)) placeholder = `Heading ${counter}`;
    else if (tag === "li") placeholder = `Item ${counter}`;
    else if (tag === "p") placeholder = `Paragraph ${counter}`;
    else if (tag === "blockquote") placeholder = "Quote text here";
    else if (tag === "figcaption") placeholder = "Caption";
    else if (tag === "td" || tag === "th") placeholder = "...";
    return `${open}${placeholder}${close}`;
  });
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
