// Inject slot values into HTML template and wrap with scoped CSS container
// Used by both live preview and publishing pipeline

import type { SlotValues } from "@/types/cma-template-types";

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

/**
 * Replace {{slot_name}} placeholders in HTML template with slot values.
 * Text slots are HTML-escaped; image slots have URL sanitization.
 */
export function injectSlotValues(
  htmlTemplate: string,
  slotValues: SlotValues
): string {
  return htmlTemplate.replace(/\{\{(\w+)\}\}/g, (_match, slotName: string) => {
    const value = slotValues[slotName];
    if (value === undefined) return `{{${slotName}}}`;
    // Image URLs: sanitize for safe attribute injection
    if (htmlTemplate.includes(`src="{{${slotName}}}"`)) return sanitizeUrl(value);
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
  templateId: string
): string {
  const scopeClass = `tpl-${templateId.slice(0, 8)}`;
  const rendered = injectSlotValues(htmlTemplate, slotValues);
  return `<style>${cssScoped}</style>\n<div class="${scopeClass}">${rendered}</div>`;
}
