// Google Fonts URL builder + font collection for the layer compiler.
// Scans text layers for used fonts, builds a single <link> tag with all
// requested families + weights. Same URL is consumed by the browser editor
// and Puppeteer renderer to guarantee identical glyph metrics.

import type { Layer } from "../types/image-template-layer-types";
import {
  CURATED_FONTS,
  DEFAULT_FONT,
  FONT_WEIGHTS,
  type CuratedFont,
} from "../types/image-template-fonts";

// Collect the set of fonts actually used by text layers, plus the default font
// (always included so body fallback works if a text layer has no font set).
export function collectFonts(layers: Layer[]): CuratedFont[] {
  const used = new Set<CuratedFont>();
  used.add(DEFAULT_FONT);
  for (const l of layers) {
    if (l.type === "text" && (CURATED_FONTS as readonly string[]).includes(l.fontFamily)) {
      used.add(l.fontFamily as CuratedFont);
    }
  }
  return Array.from(used);
}

// Build a Google Fonts v2 CSS URL with all requested families + the standard
// weight set. `display=swap` prevents FOIT so Puppeteer waits less for fonts.
// Canonical Google Fonts encoding replaces spaces with '+' (not %20).
export function buildGoogleFontsLink(fonts: CuratedFont[]): string {
  if (fonts.length === 0) return "";
  const weightList = FONT_WEIGHTS.join(";");
  const families = fonts
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@${weightList}`)
    .join("&");
  const href = `https://fonts.googleapis.com/css2?${families}&display=swap`;
  return `<link href="${href}" rel="stylesheet">`;
}
