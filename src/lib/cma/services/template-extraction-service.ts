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
    ],
    FORBID_TAGS: ["script", "iframe", "object", "embed", "form", "input", "textarea", "select"],
    FORBID_ATTR: ["onclick", "onerror", "onload", "onmouseover", "onfocus"],
  });
}

/**
 * Extract a reusable template from a public URL.
 * Pipeline: fetch → extract HTML → sanitize → extract CSS → scope CSS → AI slot detection → inject placeholders
 */
export async function extractTemplateFromUrl(
  url: string,
  orgId: string,
  scopeId?: string
): Promise<ExtractedTemplate> {
  // 1. Fetch and extract content HTML via Readability
  const { title, contentHtml, fullDom } = await extractContentHtml(url);

  // 2. Sanitize HTML (remove XSS vectors before any further processing)
  const sanitizedHtml = sanitizeHtml(contentHtml);

  // 3. Extract CSS from page <style> tags + external stylesheets
  const [pageCss, externalCss] = await Promise.all([
    Promise.resolve(extractPageCss(fullDom)),
    fetchExternalStylesheets(fullDom),
  ]);
  const allCss = sanitizeCss(`${pageCss}\n${externalCss}`);

  // 4. Scope CSS under container class and extract special rules
  const containerClass = `tpl-${scopeId || Date.now()}`;
  const specialRules = extractSpecialCssRules(allCss);
  const scopedRules = scopeCss(allCss, containerClass);
  const cssScoped = `${specialRules}\n${scopedRules}`.trim();

  // 5. Simplify HTML for AI (strip attrs, truncate text → save tokens)
  const simplified = simplifyHtmlForAi(sanitizedHtml);

  // 6. AI-assisted slot detection
  const slotDefinitions = await detectSlots(simplified, orgId);

  // 7. Inject {{slot_name}} placeholders into the sanitized HTML
  const htmlTemplate = injectSlotPlaceholders(sanitizedHtml, slotDefinitions);

  return {
    title,
    htmlTemplate,
    cssScoped,
    slotDefinitions,
    sourceUrl: url,
  };
}
