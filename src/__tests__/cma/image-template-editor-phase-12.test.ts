// Phase-12 smoke test — save handler validation semantics + payload shape.
// Network calls are mocked via fetch stub so we can assert the end-to-end
// flow without needing a DB or a running API. Thumbnail generation is
// server-side and covered separately (not unit-testable without Puppeteer).

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  buildSavePayload,
  saveTemplate,
} from "@/lib/cma/editor/editor-save-handler";
import type { SaveInput } from "@/lib/cma/editor/editor-save-handler";
import {
  makeTextLayer,
  makeImageLayer,
  makeRectLayer,
} from "@/components/cma/image-template-editor/palette/default-layers";

function makeInput(overrides: Partial<SaveInput> = {}): SaveInput {
  return {
    meta: {
      id: null,
      name: "My Template",
      platform: "generic",
      width: 1200,
      height: 630,
      backgroundColor: "#ffffff",
    },
    layers: [makeTextLayer(1200, 630, 0)],
    variables: [],
    ...overrides,
  };
}

describe("buildSavePayload", () => {
  it("includes htmlContent + layerData + variableSchema in the POST body", () => {
    const input = makeInput();
    const payload = buildSavePayload(input, "org-123");

    expect(payload.orgId).toBe("org-123");
    expect(payload.name).toBe("My Template");
    expect(payload.platform).toBe("generic");
    expect(payload.width).toBe(1200);
    expect(payload.height).toBe(630);
    expect(typeof payload.htmlContent).toBe("string");
    expect(payload.htmlContent).toContain("<!DOCTYPE html>");
    expect(payload.layerData.version).toBe(1);
    expect(payload.layerData.layers).toHaveLength(1);
    expect(payload.variableSchema).toEqual([]);
  });

  it("trims the template name", () => {
    const payload = buildSavePayload(
      makeInput({ meta: { ...makeInput().meta, name: "  spaced  " } }),
      "org-1"
    );
    expect(payload.name).toBe("spaced");
  });
});

describe("saveTemplate validation", () => {
  beforeEach(() => {
    global.fetch = vi.fn() as typeof fetch;
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects empty template name", async () => {
    const result = await saveTemplate(
      makeInput({ meta: { ...makeInput().meta, name: "   " } }),
      { orgId: "org-1" }
    );
    expect(result).toEqual({
      ok: false,
      kind: "validation",
      error: "Template name is required",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("rejects save with zero layers", async () => {
    const result = await saveTemplate(makeInput({ layers: [] }), {
      orgId: "org-1",
    });
    expect(result).toEqual({
      ok: false,
      kind: "validation",
      error: "Add at least one layer before saving",
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns missing-variables when tokens referenced but not declared", async () => {
    const text = { ...makeTextLayer(1200, 630, 0), text: "Hello {{title}}" };
    const result = await saveTemplate(makeInput({ layers: [text] }), {
      orgId: "org-1",
    });
    expect(result).toEqual({
      ok: false,
      kind: "missing-variables",
      missing: ["title"],
    });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("saves successfully when autoCreateMissingVars is true", async () => {
    const text = { ...makeTextLayer(1200, 630, 0), text: "Hello {{title}}" };
    // @ts-expect-error — mock signature
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "tpl-abc" } }),
    });

    const result = await saveTemplate(makeInput({ layers: [text] }), {
      orgId: "org-1",
      autoCreateMissingVars: true,
    });

    expect(result).toEqual({ ok: true, id: "tpl-abc" });
    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as unknown as {
      mock: { calls: [string, RequestInit][] };
    }).mock.calls[0];
    expect(url).toBe("/api/cma/image-templates");
    expect(init.method).toBe("POST");
    const body = JSON.parse(String(init.body));
    expect(body.variableSchema).toHaveLength(1);
    expect(body.variableSchema[0].name).toBe("title");
  });

  it("PUTs when meta.id is set (existing template)", async () => {
    // @ts-expect-error — mock signature
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: "tpl-existing" } }),
    });

    const result = await saveTemplate(
      makeInput({ meta: { ...makeInput().meta, id: "tpl-existing" } }),
      { orgId: "org-1" }
    );

    expect(result.ok).toBe(true);
    const [url, init] = (global.fetch as unknown as {
      mock: { calls: [string, RequestInit][] };
    }).mock.calls[0];
    expect(url).toBe("/api/cma/image-templates/tpl-existing");
    expect(init.method).toBe("PUT");
  });

  it("surfaces server errors as kind: 'server'", async () => {
    // @ts-expect-error — mock signature
    global.fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: "DB down" }),
    });

    const result = await saveTemplate(makeInput(), { orgId: "org-1" });
    expect(result).toEqual({ ok: false, kind: "server", error: "DB down" });
  });

  it("handles network failures gracefully", async () => {
    // @ts-expect-error — mock signature
    global.fetch.mockRejectedValueOnce(new Error("ECONNREFUSED"));

    const result = await saveTemplate(makeInput(), { orgId: "org-1" });
    expect(result).toEqual({
      ok: false,
      kind: "server",
      error: "ECONNREFUSED",
    });
  });

  it("extracts tokens from image.src and rect.fillColor in addition to text.text", async () => {
    const img = { ...makeImageLayer(1200, 630, 0), src: "{{heroImage}}" };
    const rect = { ...makeRectLayer(1200, 630, 1), fillColor: "{{brandColor}}" };
    const result = await saveTemplate(makeInput({ layers: [img, rect] }), {
      orgId: "org-1",
    });
    expect(result).toEqual({
      ok: false,
      kind: "missing-variables",
      missing: ["heroImage", "brandColor"],
    });
  });
});
