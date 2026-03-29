// CSS extraction and scoping for Template Studio
// Extracts inline + <style> CSS from DOM, scopes rules under a unique container class

import type { JSDOM } from "jsdom";
import { validateUrlSafety } from "./url-safety";

/** Extract CSS from <style> tags and inline styles within the content area */
export function extractPageCss(fullDom: JSDOM): string {
  const doc = fullDom.window.document;
  const cssChunks: string[] = [];

  // Collect all <style> tag contents
  doc.querySelectorAll("style").forEach((style) => {
    if (style.textContent) cssChunks.push(style.textContent);
  });

  return cssChunks.join("\n");
}

/** Fetch external stylesheets referenced by <link> tags (best-effort, non-blocking) */
export async function fetchExternalStylesheets(
  fullDom: JSDOM
): Promise<string> {
  const doc = fullDom.window.document;
  const links = doc.querySelectorAll('link[rel="stylesheet"]');
  const urls: string[] = [];

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (href && href.startsWith("http")) urls.push(href);
  });

  if (urls.length === 0) return "";

  // Fetch up to 5 stylesheets with timeout, skip failures (with SSRF check)
  const results = await Promise.allSettled(
    urls.slice(0, 5).map(async (url) => {
      await validateUrlSafety(url); // SSRF prevention
      const res = await fetch(url, {
        signal: AbortSignal.timeout(5_000),
        headers: { "User-Agent": "TonyTechLab-CMA/1.0" },
      });
      if (!res.ok) return "";
      const text = await res.text();
      // Cap at 200KB per stylesheet to avoid huge CDN bundles
      return text.slice(0, 200_000);
    })
  );

  return results
    .filter(
      (r): r is PromiseFulfilledResult<string> => r.status === "fulfilled"
    )
    .map((r) => r.value)
    .join("\n");
}

/** Scope CSS rules under a container class to prevent style bleed */
export function scopeCss(css: string, scopeClass: string): string {
  if (!css.trim()) return "";

  // Split into rule blocks, scope each selector
  return css.replace(
    // Match CSS rule: selectors { declarations }
    /([^{}@]+)\{([^{}]*)\}/g,
    (_match, selectors: string, declarations: string) => {
      const scopedSelectors = selectors
        .split(",")
        .map((sel: string) => {
          const trimmed = sel.trim();
          if (!trimmed) return "";
          // Don't scope body/html selectors — replace them with container
          if (/^(body|html)$/i.test(trimmed)) return `.${scopeClass}`;
          return `.${scopeClass} ${trimmed}`;
        })
        .filter(Boolean)
        .join(", ");
      return `${scopedSelectors} { ${declarations.trim()} }`;
    }
  );
}

/** Sanitize CSS to prevent injection attacks (strip </style>, expressions, url(javascript:)) */
export function sanitizeCss(css: string): string {
  return css
    .replace(/<\/style>/gi, "") // Prevent breaking out of <style> tag
    .replace(/<script/gi, "") // Strip script tag starts
    .replace(/expression\s*\(/gi, "") // IE CSS expressions
    .replace(/url\s*\(\s*(['"]?)\s*javascript:/gi, 'url($1about:') // javascript: URLs
    .replace(/@import\s+/gi, "/* @import blocked */ "); // Prevent external imports
}

/** Extract @font-face and @keyframes rules that cannot be scoped */
export function extractSpecialCssRules(css: string): string {
  const special: string[] = [];
  // Match @font-face and @keyframes blocks
  const regex = /@(font-face|keyframes\s+[\w-]+)\s*\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    special.push(match[0]);
  }
  return special.join("\n");
}
