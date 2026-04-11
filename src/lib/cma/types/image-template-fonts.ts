// Curated Google Fonts list for the visual template editor.
// Loaded in both the editor preview and Puppeteer-rendered HTML so WYSIWYG
// output matches the final PNG. Be Vietnam Pro is the default (Vietnamese support).
// To add a font: push to this array AND ensure it exists on fonts.google.com.

export const CURATED_FONTS = [
  "Be Vietnam Pro",
  "Inter",
  "Roboto",
  "Poppins",
  "Montserrat",
  "Playfair Display",
  "Lora",
  "Oswald",
  "Merriweather",
  "Open Sans",
] as const;

export type CuratedFont = (typeof CURATED_FONTS)[number];

export const DEFAULT_FONT: CuratedFont = "Be Vietnam Pro";

// Weights we always request for each font — keeps the compiled Google Fonts
// <link> URL deterministic and matches fontWeight union in layer types.
export const FONT_WEIGHTS = [400, 500, 600, 700, 800] as const;
