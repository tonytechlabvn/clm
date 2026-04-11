// Phase-14 dedicated unit tests for the phase-07 HTML compiler.
// These lock the invariants that every downstream editor phase depends on:
//   - Pure output (deterministic, no time/random)
//   - XSS escape on static layer content
//   - {{token}} preservation for downstream Handlebars substitution
//   - zIndex sort order + invisible layer exclusion
//   - Google Fonts link URL shape + font dedup

import { describe, it, expect } from "vitest";
import { compileLayersToHtml } from "@/lib/cma/services/template-layer-compiler";
import {
  escapeHtml,
  escapeKeepTokens,
  textToHtml,
} from "@/lib/cma/services/template-layer-compiler-escape";
import {
  collectFonts,
  buildGoogleFontsLink,
} from "@/lib/cma/services/template-layer-compiler-fonts";
import type {
  TemplateLayerData,
  TextLayer,
  RectLayer,
  ImageLayer,
} from "@/lib/cma/types/image-template-layer-types";

const BASE = {
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 1,
};

function makeText(overrides: Partial<TextLayer> = {}): TextLayer {
  return {
    ...BASE,
    id: "t1",
    type: "text",
    x: 0,
    y: 0,
    width: 400,
    height: 80,
    zIndex: 0,
    text: "Hello",
    fontFamily: "Be Vietnam Pro",
    fontSize: 24,
    fontWeight: 400,
    color: "#000000",
    textAlign: "left",
    lineHeight: 1.2,
    letterSpacing: 0,
    ...overrides,
  };
}

function makeRect(overrides: Partial<RectLayer> = {}): RectLayer {
  return {
    ...BASE,
    id: "r1",
    type: "rect",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    zIndex: 0,
    fillColor: "#ffffff",
    ...overrides,
  };
}

function makeImage(overrides: Partial<ImageLayer> = {}): ImageLayer {
  return {
    ...BASE,
    id: "i1",
    type: "image",
    x: 0,
    y: 0,
    width: 300,
    height: 200,
    zIndex: 0,
    src: "",
    fitMode: "cover",
    ...overrides,
  };
}

function wrap(layers: TemplateLayerData["layers"]): TemplateLayerData {
  return {
    version: 1,
    width: 1200,
    height: 630,
    backgroundColor: "#ffffff",
    layers,
  };
}

describe("escape helpers", () => {
  it("escapeHtml escapes all five special chars", () => {
    expect(escapeHtml(`<b>"a&b"</b>'`)).toBe(
      "&lt;b&gt;&quot;a&amp;b&quot;&lt;/b&gt;&#39;"
    );
  });

  it("escapeKeepTokens preserves {{token}} but escapes the rest", () => {
    const out = escapeKeepTokens(`<script>{{title}}</script>`);
    expect(out).toContain("{{title}}");
    expect(out).toContain("&lt;script&gt;");
    expect(out).not.toContain("<script>");
  });

  it("escapeKeepTokens handles multiple tokens in one string", () => {
    const out = escapeKeepTokens(`Hi {{first}} and {{second}}`);
    expect(out).toBe("Hi {{first}} and {{second}}");
  });

  it("escapeKeepTokens tolerates whitespace inside token braces", () => {
    const out = escapeKeepTokens(`{{ name }}`);
    expect(out).toBe("{{ name }}");
  });

  it("textToHtml converts newlines to <br>", () => {
    expect(textToHtml("line1\nline2")).toBe("line1<br>line2");
  });
});

describe("font helpers", () => {
  it("collectFonts always includes the default font", () => {
    const fonts = collectFonts([]);
    expect(fonts).toContain("Be Vietnam Pro");
  });

  it("collectFonts dedupes across text layers", () => {
    const fonts = collectFonts([
      makeText({ id: "a", fontFamily: "Inter" }),
      makeText({ id: "b", fontFamily: "Inter" }),
      makeText({ id: "c", fontFamily: "Roboto" }),
    ]);
    expect(new Set(fonts)).toEqual(new Set(["Be Vietnam Pro", "Inter", "Roboto"]));
  });

  it("buildGoogleFontsLink uses + for spaces (canonical Google Fonts URL)", () => {
    const link = buildGoogleFontsLink(["Be Vietnam Pro"]);
    expect(link).toContain("family=Be+Vietnam+Pro:wght@");
    expect(link).not.toContain("Be%20Vietnam%20Pro");
  });

  it("buildGoogleFontsLink always includes weights 400 through 800", () => {
    const link = buildGoogleFontsLink(["Inter"]);
    expect(link).toContain("wght@400;500;600;700;800");
  });

  it("buildGoogleFontsLink returns empty when no fonts", () => {
    expect(buildGoogleFontsLink([])).toBe("");
  });
});

describe("compileLayersToHtml — structure", () => {
  it("emits a valid HTML skeleton for empty layers", () => {
    const html = compileLayersToHtml(wrap([]));
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("<body>");
    expect(html).toContain("{{width}}px");
    expect(html).toContain("{{height}}px");
    expect(html).toContain("fonts.googleapis.com");
  });

  it("is deterministic — same input produces identical output", () => {
    const data = wrap([makeText({ text: "Hi {{who}}" })]);
    expect(compileLayersToHtml(data)).toBe(compileLayersToHtml(data));
  });

  it("escapes the background color value", () => {
    const html = compileLayersToHtml({
      ...wrap([]),
      backgroundColor: `"><script>alert(1)</script>`,
    });
    expect(html).not.toContain(`<script>`);
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("compileLayersToHtml — text layers", () => {
  it("preserves {{token}} while escaping static HTML", () => {
    const html = compileLayersToHtml(
      wrap([makeText({ text: `<b>Hello</b> {{name}}` })])
    );
    expect(html).toContain("{{name}}");
    expect(html).toContain("&lt;b&gt;Hello&lt;/b&gt;");
    expect(html).not.toContain("<b>Hello</b>");
  });

  it("emits font-family with quotes + fallback", () => {
    const html = compileLayersToHtml(wrap([makeText({ fontFamily: "Inter" })]));
    expect(html).toContain("font-family:'Inter',sans-serif");
  });

  it("applies textShadow when present", () => {
    const html = compileLayersToHtml(
      wrap([
        makeText({
          textShadow: { x: 0, y: 2, blur: 4, color: "#000" },
        }),
      ])
    );
    expect(html).toContain("text-shadow:0px 2px 4px #000");
  });
});

describe("compileLayersToHtml — rect layers", () => {
  it("emits background-color and optional border-radius", () => {
    const html = compileLayersToHtml(
      wrap([makeRect({ fillColor: "#ff0000", borderRadius: 8 })])
    );
    expect(html).toContain("background-color:#ff0000");
    expect(html).toContain("border-radius:8px");
  });

  it("emits box-shadow when shadow present", () => {
    const html = compileLayersToHtml(
      wrap([
        makeRect({
          shadow: { x: 2, y: 4, blur: 12, color: "#888" },
        }),
      ])
    );
    expect(html).toContain("box-shadow:2px 4px 12px #888");
  });

  it("omits border when width is zero", () => {
    const html = compileLayersToHtml(
      wrap([makeRect({ border: { width: 0, color: "#000" } })])
    );
    expect(html).not.toContain("border:0px solid");
  });
});

describe("compileLayersToHtml — image layers", () => {
  it("emits img tag with object-fit from fitMode", () => {
    const html = compileLayersToHtml(
      wrap([makeImage({ src: "https://example.com/a.png", fitMode: "cover" })])
    );
    expect(html).toContain(`<img src="https://example.com/a.png"`);
    expect(html).toContain("object-fit:cover");
  });

  it("maps fitMode fill to object-fit fill", () => {
    const html = compileLayersToHtml(
      wrap([makeImage({ src: "https://example.com/a.png", fitMode: "fill" })])
    );
    expect(html).toContain("object-fit:fill");
  });

  it("preserves {{token}} in image src", () => {
    const html = compileLayersToHtml(
      wrap([makeImage({ src: "{{imageUrl}}" })])
    );
    expect(html).toContain(`src="{{imageUrl}}"`);
  });
});

describe("compileLayersToHtml — layer ordering and visibility", () => {
  it("sorts layers by zIndex ascending in the emitted HTML", () => {
    const html = compileLayersToHtml(
      wrap([
        makeRect({ id: "top", zIndex: 2, fillColor: "#111111" }),
        makeRect({ id: "mid", zIndex: 1, fillColor: "#222222" }),
        makeRect({ id: "low", zIndex: 0, fillColor: "#333333" }),
      ])
    );
    expect(html.indexOf("#333333")).toBeLessThan(html.indexOf("#222222"));
    expect(html.indexOf("#222222")).toBeLessThan(html.indexOf("#111111"));
  });

  it("excludes layers with visible: false", () => {
    const html = compileLayersToHtml(
      wrap([
        makeRect({ id: "show", fillColor: "#aaaaaa" }),
        makeRect({ id: "hide", fillColor: "#bbbbbb", visible: false }),
      ])
    );
    expect(html).toContain("#aaaaaa");
    expect(html).not.toContain("#bbbbbb");
  });

  it("emits opacity + rotation in inline style", () => {
    const html = compileLayersToHtml(
      wrap([makeRect({ rotation: 45, opacity: 0.5 })])
    );
    expect(html).toContain("transform:rotate(45deg)");
    expect(html).toContain("opacity:0.5");
  });
});
