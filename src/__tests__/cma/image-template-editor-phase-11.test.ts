// Phase-11 smoke test — token extraction, declared/used diff, and
// previewMode store behavior (including zundo partialize exclusion).

import { describe, it, expect, beforeEach } from "vitest";
import {
  extractUsedVariableNames,
  diffDeclaredVsUsed,
} from "@/lib/cma/editor/extract-layer-variables";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import {
  makeTextLayer,
  makeImageLayer,
  makeRectLayer,
} from "@/components/cma/image-template-editor/palette/default-layers";
import type { VariableDefinition } from "@/lib/cma/types/image-template-types";

describe("extractUsedVariableNames", () => {
  it("collects tokens from text layers", () => {
    const t = { ...makeTextLayer(1200, 630, 0), text: "Hello {{title}} — {{author}}" };
    expect(extractUsedVariableNames([t])).toEqual(["title", "author"]);
  });

  it("collects tokens from image layer src", () => {
    const i = { ...makeImageLayer(1200, 630, 0), src: "{{imageUrl}}" };
    expect(extractUsedVariableNames([i])).toEqual(["imageUrl"]);
  });

  it("collects tokens from rect layer fillColor", () => {
    const r = { ...makeRectLayer(1200, 630, 0), fillColor: "{{accentColor}}" };
    expect(extractUsedVariableNames([r])).toEqual(["accentColor"]);
  });

  it("dedupes tokens across layers", () => {
    const t1 = { ...makeTextLayer(1200, 630, 0), text: "{{title}}" };
    const t2 = { ...makeTextLayer(1200, 630, 1), text: "Also {{title}}" };
    expect(extractUsedVariableNames([t1, t2])).toEqual(["title"]);
  });

  it("returns empty array when no tokens present", () => {
    const t = { ...makeTextLayer(1200, 630, 0), text: "Plain text" };
    expect(extractUsedVariableNames([t])).toEqual([]);
  });

  it("tolerates whitespace inside token braces", () => {
    const t = { ...makeTextLayer(1200, 630, 0), text: "{{ name }}" };
    expect(extractUsedVariableNames([t])).toEqual(["name"]);
  });
});

describe("diffDeclaredVsUsed", () => {
  const makeVar = (name: string): VariableDefinition => ({
    name,
    label: name,
    type: "text",
    required: false,
    defaultValue: "",
  });

  it("reports tokens used but not declared as missing", () => {
    const declared = [makeVar("title")];
    const used = ["title", "author", "year"];
    expect(diffDeclaredVsUsed(declared, used)).toEqual({
      missing: ["author", "year"],
      unused: [],
    });
  });

  it("reports declared variables not referenced as unused", () => {
    const declared = [makeVar("title"), makeVar("subtitle")];
    const used = ["title"];
    expect(diffDeclaredVsUsed(declared, used)).toEqual({
      missing: [],
      unused: ["subtitle"],
    });
  });

  it("returns both missing and unused in mixed case", () => {
    const declared = [makeVar("title"), makeVar("oldSubtitle")];
    const used = ["title", "description"];
    expect(diffDeclaredVsUsed(declared, used)).toEqual({
      missing: ["description"],
      unused: ["oldSubtitle"],
    });
  });

  it("empty declared + empty used → all empty", () => {
    expect(diffDeclaredVsUsed([], [])).toEqual({ missing: [], unused: [] });
  });
});

describe("previewMode store behavior", () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
    useEditorStore.temporal.getState().clear();
  });

  it("starts disabled by default", () => {
    expect(useEditorStore.getState().previewMode).toBe(false);
  });

  it("setPreviewMode toggles the flag", () => {
    useEditorStore.getState().setPreviewMode(true);
    expect(useEditorStore.getState().previewMode).toBe(true);
    useEditorStore.getState().setPreviewMode(false);
    expect(useEditorStore.getState().previewMode).toBe(false);
  });

  it("previewMode change does NOT push a zundo history entry", () => {
    // Add a layer to produce a baseline history entry
    useEditorStore.getState().addLayer(makeTextLayer(1200, 630, 0));
    const baseline = useEditorStore.temporal.getState().pastStates.length;

    useEditorStore.getState().setPreviewMode(true);
    useEditorStore.getState().setPreviewMode(false);

    const after = useEditorStore.temporal.getState().pastStates.length;
    expect(after).toBe(baseline);
  });

  it("loadTemplate resets previewMode to false", () => {
    useEditorStore.getState().setPreviewMode(true);
    useEditorStore.getState().loadTemplate({
      id: null,
      name: "Test",
      platform: "generic",
      isSystem: false,
      width: 1200,
      height: 630,
      backgroundColor: "#fff",
      layers: [],
      variables: [],
    });
    expect(useEditorStore.getState().previewMode).toBe(false);
  });

  it("addVariable rejects duplicate names (store invariant)", () => {
    const store = useEditorStore.getState();
    store.addVariable({
      name: "title",
      label: "Title",
      type: "text",
      required: false,
      defaultValue: "",
    });
    store.addVariable({
      name: "title",
      label: "Conflict",
      type: "text",
      required: false,
      defaultValue: "x",
    });
    const vars = useEditorStore.getState().variables;
    expect(vars).toHaveLength(1);
    expect(vars[0].label).toBe("Title"); // original preserved
  });
});
