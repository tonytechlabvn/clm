// Inject slot values into HTML template and wrap with scoped CSS container
// Used by both live preview and publishing pipeline

import type { SlotValues, SlotDefinition } from "@/types/cma-template-types";

/** Escape HTML entities to prevent XSS from user-provided slot values */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Sanitize a URL for safe use in src/href attributes */
function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  // Block javascript: and data: URIs (except data:image for base64 images)
  if (/^javascript:/i.test(trimmed)) return "";
  if (/^data:(?!image\/)/i.test(trimmed)) return "";
  // Escape quotes to prevent attribute breakout
  return trimmed.replace(/"/g, "%22").replace(/'/g, "%27");
}

/** Basic HTML sanitization for richtext — strip script/event handlers but keep formatting tags */
function sanitizeRichtext(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "");
}

/**
 * Replace {{slot_name}} placeholders in HTML template with slot values.
 * Text slots are HTML-escaped; richtext slots are sanitized but keep HTML;
 * image slots have URL sanitization. Pass slotDefinitions to enable richtext rendering.
 */
export function injectSlotValues(
  htmlTemplate: string,
  slotValues: SlotValues,
  slotDefinitions?: SlotDefinition[]
): string {
  // Build a type lookup from slot definitions
  const slotTypeMap = new Map<string, string>();
  if (slotDefinitions) {
    for (const slot of slotDefinitions) {
      slotTypeMap.set(slot.name, slot.type);
    }
  }

  return htmlTemplate.replace(/\{\{(\w+)\}\}/g, (_match, slotName: string) => {
    const value = slotValues[slotName];
    if (value === undefined) return `{{${slotName}}}`;
    // Image URLs: sanitize for safe attribute injection
    if (htmlTemplate.includes(`src="{{${slotName}}}"`)) return sanitizeUrl(value);
    // Richtext/list slots: render HTML content (sanitized, not escaped)
    const slotType = slotTypeMap.get(slotName);
    if (slotType === "richtext" || slotType === "list") return sanitizeRichtext(value);
    return escapeHtml(value);
  });
}

/**
 * Render a complete HTML-slot template with scoped CSS wrapper.
 * Returns final HTML string ready for publishing or preview.
 */
export function renderSlotTemplate(
  htmlTemplate: string,
  cssScoped: string,
  slotValues: SlotValues,
  templateId: string,
  slotDefinitions?: SlotDefinition[]
): string {
  const scopeClass = `tpl-${templateId.slice(0, 8)}`;
  const rendered = injectSlotValues(htmlTemplate, slotValues, slotDefinitions);
  return `<style>${cssScoped}</style>\n<div class="${scopeClass}">${rendered}</div>`;
}
