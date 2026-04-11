// Phase-13 smoke test — starter templates round-trip through the schema
// validator + compile cleanly via the phase-07 HTML compiler. If any
// starter ever drifts from the layer schema this test catches it before
// the seed script fails in prod.

import { describe, it, expect } from "vitest";
import { templateLayerDataSchema } from "@/lib/cma/types/image-template-layer-types";
import { compileLayersToHtml } from "@/lib/cma/services/template-layer-compiler";
import { instagramPostStarter } from "@/lib/cma/templates/image/layerdata/instagram-post-layerdata";
import { twitterCardStarter } from "@/lib/cma/templates/image/layerdata/twitter-card-layerdata";
import { ogImageStarter } from "@/lib/cma/templates/image/layerdata/og-image-layerdata";
import { quoteCardStarter } from "@/lib/cma/templates/image/layerdata/quote-card-layerdata";
import { linkedinPostStarter } from "@/lib/cma/templates/image/layerdata/linkedin-post-layerdata";
import type { StarterTemplate } from "@/lib/cma/templates/image/layerdata/starter-template-type";

const STARTERS: StarterTemplate[] = [
  instagramPostStarter,
  twitterCardStarter,
  ogImageStarter,
  quoteCardStarter,
  linkedinPostStarter,
];

describe("phase-13 starter templates", () => {
  it("every starter has a unique deterministic system id", () => {
    const ids = STARTERS.map((s) => s.id);
    expect(new Set(ids).size).toBe(STARTERS.length);
    for (const id of ids) {
      expect(id.startsWith("system-img-")).toBe(true);
    }
  });

  it.each(STARTERS.map((s) => [s.name, s]))(
    "%s: layerData parses against templateLayerDataSchema",
    (_name, starter) => {
      const result = templateLayerDataSchema.safeParse(starter.layerData);
      if (!result.success) {
        console.error(result.error.format());
      }
      expect(result.success).toBe(true);
    }
  );

  it.each(STARTERS.map((s) => [s.name, s]))(
    "%s: compileLayersToHtml produces non-empty HTML with system tokens",
    (_name, starter) => {
      const html = compileLayersToHtml(starter.layerData);
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("{{width}}px");
      expect(html).toContain("{{height}}px");
      // Body tag always present regardless of layer count
      expect(html).toMatch(/<body>/);
    }
  );

  it("every declared variable is referenced by at least one layer", () => {
    // Catches copy/paste mistakes where a starter declares a variable
    // that no layer actually uses.
    const TOKEN_RE = /\{\{\s*(\w+)\s*\}\}/g;
    for (const starter of STARTERS) {
      const used = new Set<string>();
      for (const layer of starter.layerData.layers) {
        const scan = (raw: string) => {
          const matches = Array.from(raw.matchAll(TOKEN_RE));
          for (const m of matches) used.add(m[1]);
        };
        if (layer.type === "text") scan(layer.text);
        if (layer.type === "image") scan(layer.src);
        if (layer.type === "rect") scan(layer.fillColor);
      }
      for (const v of starter.variables) {
        expect(
          used.has(v.name),
          `${starter.name}: variable "${v.name}" is declared but not used in any layer`
        ).toBe(true);
      }
    }
  });

  it("every layer has a unique id within its starter", () => {
    for (const starter of STARTERS) {
      const ids = starter.layerData.layers.map((l) => l.id);
      expect(
        new Set(ids).size,
        `${starter.name} has duplicate layer ids`
      ).toBe(ids.length);
    }
  });

  it("layer zIndices are monotonically increasing (render order)", () => {
    for (const starter of STARTERS) {
      const zs = starter.layerData.layers.map((l) => l.zIndex);
      const sorted = [...zs].sort((a, b) => a - b);
      expect(
        zs,
        `${starter.name} zIndex values are out of render order`
      ).toEqual(sorted);
    }
  });
});
