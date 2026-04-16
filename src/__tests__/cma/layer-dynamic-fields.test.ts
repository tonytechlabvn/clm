// Unit tests for APITemplate.io-style dynamic layer fields.
// Covers:
//   - Compiler emits {{fieldName.prop}} tokens per layer type when dynamic=true
//   - Static (non-dynamic) layers keep rendering their literal content
//   - collectDynamicFields + mergeDynamicFieldsIntoVariables derivation
//   - Direct URL query parser: flat keys, dotted keys, reserved keys, missing
//     required, prototype-pollution guard, default fallback
//   - flattenContextForValidation produces dotted keys the SSRF/color heuristics can match

import { describe, it, expect } from "vitest";
import { compileLayersToHtml } from "@/lib/cma/services/template-layer-compiler";
import {
  collectDynamicFields,
  mergeDynamicFieldsIntoVariables,
} from "@/lib/cma/editor/extract-layer-variables";
import {
  buildRenderContext,
  flattenContextForValidation,
} from "@/lib/cma/services/direct-url-query-parser";
import type {
  TemplateLayerData,
  TextLayer,
  ImageLayer,
  RectLayer,
} from "@/lib/cma/types/image-template-layer-types";
import type { VariableDefinition } from "@/lib/cma/types/image-template-types";

const BASE = {
  rotation: 0,
  visible: true,
  locked: false,
  opacity: 1,
} as const;

function text(overrides: Partial<TextLayer> = {}): TextLayer {
  return {
    ...BASE,
    id: "t1",
    type: "text",
    x: 0,
    y: 0,
    width: 400,
    height: 80,
    zIndex: 0,
    text: "default text",
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

function image(overrides: Partial<ImageLayer> = {}): ImageLayer {
  return {
    ...BASE,
    id: "i1",
    type: "image",
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    zIndex: 1,
    src: "https://example.com/static.png",
    fitMode: "cover",
    ...overrides,
  };
}

function rect(overrides: Partial<RectLayer> = {}): RectLayer {
  return {
    ...BASE,
    id: "r1",
    type: "rect",
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    zIndex: 2,
    fillColor: "#ff0000",
    ...overrides,
  };
}

function shell(layers: Array<TextLayer | ImageLayer | RectLayer>): TemplateLayerData {
  return {
    version: 1,
    width: 1200,
    height: 630,
    backgroundColor: "#ffffff",
    layers,
  };
}

// ── Compiler token emission ──────────────────────────────────────────

describe("compiler — dynamic field token emission", () => {
  it("text layer with dynamic+fieldName emits {{fieldName.text}}", () => {
    const html = compileLayersToHtml(
      shell([text({ dynamic: true, fieldName: "date", text: "16/4/2026" })])
    );
    expect(html).toContain("{{date.text}}");
    // Literal default must NOT leak into output when dynamic is on
    expect(html).not.toContain("16/4/2026");
  });

  it("static text layer still renders its literal content", () => {
    const html = compileLayersToHtml(shell([text({ text: "Hello world" })]));
    expect(html).toContain("Hello world");
    expect(html).not.toContain("{{.text}}");
  });

  it("image layer with dynamic+fieldName emits {{fieldName.url}} wrapped in #if", () => {
    const html = compileLayersToHtml(
      shell([image({ dynamic: true, fieldName: "background" })])
    );
    expect(html).toContain("{{#if background.url}}");
    expect(html).toContain("src=\"{{background.url}}\"");
    expect(html).toContain("{{/if}}");
  });

  it("rect layer with dynamic+fieldName emits {{fieldName.color}}", () => {
    const html = compileLayersToHtml(
      shell([rect({ dynamic: true, fieldName: "banner" })])
    );
    expect(html).toContain("background-color:{{banner.color}}");
  });

  it("dynamic layer without fieldName falls back to static rendering", () => {
    // Author toggled dynamic on but didn't set a name — compiler must not
    // emit a broken token like {{.text}}. Editor UX surfaces the error.
    const html = compileLayersToHtml(
      shell([text({ dynamic: true, text: "fallback" })])
    );
    expect(html).not.toContain("{{.text}}");
    expect(html).toContain("fallback");
  });
});

// ── Variable-schema derivation ──────────────────────────────────────

describe("collectDynamicFields", () => {
  it("returns one entry per dynamic layer with full dotted name", () => {
    const layers = [
      text({ id: "t1", dynamic: true, fieldName: "date", text: "16/4" }),
      image({ id: "i1", dynamic: true, fieldName: "bg" }),
      rect({ id: "r1", dynamic: true, fieldName: "banner" }),
    ];
    const fields = collectDynamicFields(layers);
    expect(fields).toHaveLength(3);
    expect(fields.map((f) => f.fullName)).toEqual([
      "date.text",
      "bg.url",
      "banner.color",
    ]);
    expect(fields[0].varType).toBe("text");
    expect(fields[1].varType).toBe("image");
    expect(fields[2].varType).toBe("color");
    expect(fields[0].defaultValue).toBe("16/4");
  });

  it("skips layers missing fieldName or with dynamic=false", () => {
    const layers = [
      text({ id: "t1", dynamic: false, fieldName: "shouldSkip" }),
      text({ id: "t2", dynamic: true, fieldName: undefined, text: "no name" }),
      text({ id: "t3", dynamic: true, fieldName: "ok", text: "x" }),
    ];
    const fields = collectDynamicFields(layers);
    expect(fields).toHaveLength(1);
    expect(fields[0].fullName).toBe("ok.text");
  });
});

describe("mergeDynamicFieldsIntoVariables", () => {
  it("appends dynamic-field entries and preserves user-declared vars", () => {
    const declared: VariableDefinition[] = [
      { name: "freeform", label: "Free", type: "text", required: false, defaultValue: "x" },
    ];
    const layers = [text({ dynamic: true, fieldName: "title", text: "Hi" })];
    const merged = mergeDynamicFieldsIntoVariables(declared, layers);
    expect(merged.map((v) => v.name)).toEqual(["freeform", "title.text"]);
    expect(merged[1].defaultValue).toBe("Hi");
  });

  it("dynamic-derived entry overrides a clashing user-declared one", () => {
    const declared: VariableDefinition[] = [
      { name: "title.text", label: "old", type: "text", required: true, defaultValue: "stale" },
    ];
    const layers = [text({ dynamic: true, fieldName: "title", text: "fresh" })];
    const merged = mergeDynamicFieldsIntoVariables(declared, layers);
    expect(merged).toHaveLength(1);
    expect(merged[0].defaultValue).toBe("fresh");
    expect(merged[0].required).toBe(false);
  });
});

// ── Query parser ──────────────────────────────────────────────────────

function query(params: Record<string, string>): URLSearchParams {
  return new URLSearchParams(params);
}

describe("buildRenderContext", () => {
  const schema: VariableDefinition[] = [
    { name: "date.text", label: "date", type: "text", required: false, defaultValue: "fallback-date" },
    { name: "background.url", label: "bg", type: "image", required: false, defaultValue: "" },
    { name: "title", label: "Title", type: "text", required: false, defaultValue: "Default title" },
  ];

  it("parses dotted query keys into nested context", () => {
    const { context } = buildRenderContext(
      schema,
      query({ "date.text": "16/4/2026" })
    );
    expect(context.date).toEqual({ text: "16/4/2026", /* seeded defaults stay */ });
    // Non-overridden nested defaults also stay seeded
    expect((context.background as Record<string, string>).url).toBe("");
  });

  it("parses flat legacy query keys into flat context", () => {
    const { context } = buildRenderContext(schema, query({ title: "Hello" }));
    expect(context.title).toBe("Hello");
  });

  it("falls back to defaultValue when query is missing", () => {
    const { context } = buildRenderContext(schema, query({}));
    expect((context.date as Record<string, string>).text).toBe("fallback-date");
    expect(context.title).toBe("Default title");
  });

  it("ignores reserved query params (auth, _cb)", () => {
    const { context } = buildRenderContext(
      schema,
      query({ auth: "secret", _cb: "123", title: "t" })
    );
    expect(context.auth).toBeUndefined();
    expect(context._cb).toBeUndefined();
    expect(context.title).toBe("t");
  });

  it("ignores unknown query keys not declared in schema", () => {
    const { context } = buildRenderContext(
      schema,
      query({ evilKey: "inject", "title": "ok" })
    );
    expect(context.evilKey).toBeUndefined();
    expect(context.title).toBe("ok");
  });

  it("rejects dotted keys containing __proto__ / constructor as unknown", () => {
    const { context } = buildRenderContext(
      schema,
      query({
        "__proto__.polluted": "yes",
        "constructor.prototype": "bad",
      })
    );
    // Not declared in schema → ignored. No prototype pollution reachable.
    expect(({} as { polluted?: string }).polluted).toBeUndefined();
    expect(Object.keys(context)).not.toContain("__proto__");
  });

  it("reports missing required variables by name", () => {
    const requiredSchema: VariableDefinition[] = [
      { name: "date.text", label: "date", type: "text", required: true },
      { name: "title", label: "t", type: "text", required: true },
    ];
    const { missingRequired } = buildRenderContext(requiredSchema, query({}));
    expect(missingRequired).toEqual(["date.text", "title"]);
  });

  it("satisfies required when nested value is set", () => {
    const requiredSchema: VariableDefinition[] = [
      { name: "date.text", label: "date", type: "text", required: true },
    ];
    const { missingRequired } = buildRenderContext(
      requiredSchema,
      query({ "date.text": "16/4" })
    );
    expect(missingRequired).toEqual([]);
  });
});

describe("flattenContextForValidation", () => {
  it("flattens nested values to dotted keys for SSRF/hex heuristics", () => {
    const flat = flattenContextForValidation({
      title: "Hi",
      background: { url: "https://example.com/x.png" },
      banner: { color: "#ff6600" },
    });
    expect(flat).toEqual({
      title: "Hi",
      "background.url": "https://example.com/x.png",
      "banner.color": "#ff6600",
    });
  });
});
