// Inlines CSS class styles into HTML element style="" attributes for WordPress compatibility
// WordPress often strips <style> blocks depending on user role/theme/plugins,
// so inlining guarantees visual fidelity. Pseudo-selectors (:hover, @media, nth-child)
// are preserved in a <style> block as a progressive enhancement.

const juice = require("juice") as (html: string, options?: Record<string, unknown>) => string; // CJS module — no ESM default export

/**
 * Inlines CSS rules into HTML elements as style="" attributes.
 * Keeps a <style> block for rules that can't be inlined (pseudo-selectors, media queries).
 */
export function inlineCssIntoHtml(html: string, css: string): string {
  // Wrap HTML with <style> so juice can match selectors to elements
  const doc = `<style>${css}</style>\n${html}`;

  const inlined = juice(doc, {
    // Keep rules that can't be inlined (pseudo-classes, media queries) in a <style> block
    preserveMediaQueries: true,
    preservePseudos: true,
    // Don't remove the original <style> — juice will leave un-inlinable rules there
    removeStyleTags: false,
    // Preserve !important declarations
    preserveImportant: true,
    // Preserve @font-face and @import rules
    preserveFontFaces: true,
    // Apply styles from style attributes already on elements
    applyStyleTags: true,
    // Insert preserved pseudo/media rules into a <style> tag in output
    insertPreservedExtraCss: true,
  });

  return inlined;
}
