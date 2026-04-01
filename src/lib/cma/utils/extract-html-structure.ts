// Extract structure from HTML post content — convert to html-slots template data
// Reuses heuristic slot detection (no AI calls) for pure format extraction

import { heuristicSlotDetection, injectSlotPlaceholders } from "@/lib/cma/services/template-slot-detector";
import type { HtmlSlotTemplateData } from "@/types/cma-template-types";

/**
 * Extract HTML post content into an html-slots template.
 * Parses the content (JSON {html,css,js} or raw HTML), detects content zones
 * via heuristic analysis, and replaces them with {{slot}} placeholders.
 */
export function extractHtmlStructure(content: string): HtmlSlotTemplateData {
  let html = "";
  let css = "";

  // Try JSON format first: {html, css, js}
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed.html === "string") {
      html = parsed.html;
      css = parsed.css || "";
    } else {
      // JSON but not the expected shape — treat content as raw HTML
      html = content;
    }
  } catch {
    // Not JSON — treat as raw HTML string
    html = content;
  }

  // Detect content zones using heuristic (no AI, no budget needed)
  const slotDefinitions = heuristicSlotDetection(html);

  // Replace detected content with {{slot_name}} placeholders
  const htmlTemplate = injectSlotPlaceholders(html, slotDefinitions);

  return {
    htmlTemplate,
    cssScoped: css,
    slotDefinitions,
  };
}
