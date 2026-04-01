// Template extraction orchestrator — URL → HTML extraction → CSS scoping → AI slot detection → template data
// Main entry point for Template Studio's URL-to-template extraction pipeline

import DOMPurify from "isomorphic-dompurify";
import { extractContentHtml } from "./crawler-service";
import {
  extractPageCss,
  fetchExternalStylesheets,
  scopeCss,
  extractSpecialCssRules,
  sanitizeCss,
} from "./template-css-scoper";
import {
  simplifyHtmlForAi,
  detectSlots,
  injectSlotPlaceholders,
} from "./template-slot-detector";
import type { SlotDefinition } from "@/types/cma-template-types";

export interface ExtractedTemplate {
  title: string;
  htmlTemplate: string; // HTML with {{slot_name}} placeholders
  cssScoped: string; // Scoped CSS under .tpl-{id} container
  slotDefinitions: SlotDefinition[];
  sourceUrl: string;
}

/** Sanitize extracted HTML — strip scripts, event handlers, tracking pixels */
function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "h1", "h2", "h3", "h4", "h5", "h6",
      "p", "br", "hr", "blockquote", "pre", "code",
      "ul", "ol", "li", "dl", "dt", "dd",
      "a", "img", "figure", "figcaption",
      "table", "thead", "tbody", "tr", "th", "td",
      "div", "span", "section", "article", "header", "footer",
      "strong", "em", "b", "i", "u", "s", "mark", "small", "sub", "sup",
    ],
    ALLOWED_ATTR: [
      "href", "src", "alt", "title", "width", "height",
      "class", "id", "style", "colspan", "rowspan",
      "data-*", "role", "aria-label", "target", "rel",
    ],
    ALLOW_DATA_ATTR: true,
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "textarea", "select"],
    FORBID_ATTR: ["onclick", "onerror", "onload", "onmouseover", "onfocus"],
  });
}

/**
 * Extract a reusable template from a public URL.
 * Pipeline: fetch full page → extract content with inline styles → extract CSS → AI slot detection → placeholders
 *
 * Key: We bypass Readability (which strips styles) and extract directly from the DOM
 * to preserve all inline styling that defines the visual format.
 */
export async function extractTemplateFromUrl(
  url: string,
  orgId: string,
  scopeId?: string
): Promise<ExtractedTemplate> {
  // 1. Fetch full page DOM (not Readability — Readability strips inline styles)
  const { title, contentHtml, fullDom } = await extractContentHtml(url);

  // 2. Try to get content with styles preserved from the original DOM
  // Readability's contentHtml loses inline styles, so we try to find the article
  // element in the full DOM and extract it with styles intact
  const doc = fullDom.window.document;
  let styledHtml = contentHtml; // fallback to Readability output

  // Look for the main article/content area in the original DOM (before Readability mutates it)
  const articleEl = doc.querySelector("article .entry-content") // WordPress
    || doc.querySelector(".entry-content")
    || doc.querySelector(".post-content")
    || doc.querySelector("article")
    || doc.querySelector('[role="main"]')
    || doc.querySelector("main");

  if (articleEl) {
    // Get innerHTML with all inline styles preserved
    styledHtml = articleEl.innerHTML;
  }

  // 3. Sanitize HTML — keep style attributes but strip scripts/event handlers
  const sanitizedHtml = sanitizeHtml(styledHtml);

  // 4. Extract CSS from page <style> tags + external stylesheets
  const [pageCss, externalCss] = await Promise.all([
    Promise.resolve(extractPageCss(fullDom)),
    fetchExternalStylesheets(fullDom),
  ]);
  const allCss = sanitizeCss(`${pageCss}\n${externalCss}`);

  // 5. Scope CSS under container class and extract special rules
  const containerClass = `tpl-${scopeId || Date.now()}`;
  const specialRules = extractSpecialCssRules(allCss);
  const scopedRules = scopeCss(allCss, containerClass);
  const cssScoped = `${specialRules}\n${scopedRules}`.trim();

  // 6. Simplify HTML for AI (strip attrs, truncate text → save tokens)
  const simplified = simplifyHtmlForAi(sanitizedHtml);

  // 7. AI-assisted slot detection
  const slotDefinitions = await detectSlots(simplified, orgId);

  // 8. Inject {{slot_name}} placeholders into the sanitized HTML
  const htmlTemplate = injectSlotPlaceholders(sanitizedHtml, slotDefinitions);

  return {
    title,
    htmlTemplate,
    cssScoped,
    slotDefinitions,
    sourceUrl: url,
  };
}
