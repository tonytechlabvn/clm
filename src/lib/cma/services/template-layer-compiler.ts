// Pure compiler: TemplateLayerData → HTML string suitable for the existing
// Puppeteer renderer. Invariants:
//   1. Deterministic — same input always produces same output (no Date.now / random)
//   2. Preserves {{var}} tokens so Handlebars can substitute them downstream
//   3. Emits {{width}} / {{height}} tokens in body CSS (injected by renderer)
//   4. Sorts layers by zIndex ascending; skips visible:false
//
// Consumed by phase-12 save flow: editor state → compileLayersToHtml → htmlContent.
// The existing renderer (src/lib/cma/services/image-template-renderer-service.ts)
// is NOT modified — it still reads htmlContent and runs Handlebars as before.

import type { TemplateLayerData } from "../types/image-template-layer-types";
import { escapeHtml } from "./template-layer-compiler-escape";
import {
  collectFonts,
  buildGoogleFontsLink,
} from "./template-layer-compiler-fonts";
import { renderLayer } from "./template-layer-compiler-renderers";

export function compileLayersToHtml(data: TemplateLayerData): string {
  const fonts = collectFonts(data.layers);
  const fontLink = buildGoogleFontsLink(fonts);

  // zIndex ascending = bottom layer first in DOM, painted first visually.
  // slice() to avoid mutating caller's array during sort.
  const body = data.layers
    .filter((l) => l.visible)
    .slice()
    .sort((a, b) => a.zIndex - b.zIndex)
    .map(renderLayer)
    .join("\n");

  const bg = escapeHtml(data.backgroundColor);

  // {{width}} / {{height}} tokens are injected by the renderer (system vars).
  // Keep them verbatim — Handlebars resolves them before Puppeteer loads the HTML.
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
${fontLink}
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:{{width}}px;height:{{height}}px}
  body{background:${bg};position:relative;overflow:hidden;font-family:'Be Vietnam Pro',sans-serif}
</style>
</head>
<body>
${body}
</body>
</html>`;
}

// Re-exports so callers only need one import path.
export { escapeHtml, escapeKeepTokens, textToHtml } from "./template-layer-compiler-escape";
export { collectFonts, buildGoogleFontsLink } from "./template-layer-compiler-fonts";
export { renderLayer } from "./template-layer-compiler-renderers";
