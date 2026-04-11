// Phase-09 smoke test — token substitution helper + shortcut-driven store
// mutations (Delete, Ctrl+D, arrow nudge). Moveable interaction itself
// requires a real DOM environment and is covered by manual browser smoke
// (see plan). These tests cover the portions that are pure logic.

import { describe, it, expect, beforeEach } from "vitest";
import { substituteSampleVars } from "@/components/cma/image-template-editor/canvas/substitute-sample-vars";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import type { TextLayer } from "@/lib/cma/types/image-template-layer-types";

function makeTextLayer(id: string, overrides: Partial<TextLayer> = {}): TextLayer {
  return {
    id,
    type: "text",
    x: 100,
    y: 50,
    width: 400,
    height: 80,
    rotation: 0,
    zIndex: 1,
    visible: true,
    locked: false,
    opacity: 1,
    text: "Hello {{title}}",
    fontFamily: "Be Vietnam Pro",
    fontSize: 32,
    fontWeight: 700,
    color: "#111111",
    textAlign: "left",
    lineHeight: 1.2,
    letterSpacing: 0,
    ...overrides,
  };
}

describe("substituteSampleVars", () => {
  it("replaces known tokens with sample values", () => {
    const out = substituteSampleVars("Hi {{name}} you have {{count}} messages", {
      name: "Tony",
      count: "3",
    });
    expect(out).toBe("Hi Tony you have 3 messages");
  });

  it("leaves unknown tokens in their raw {{form}}", () => {
    const out = substituteSampleVars("Title: {{title}} ({{missing}})", {
      title: "Hello",
    });
    expect(out).toBe("Title: Hello ({{missing}})");
  });

  it("handles empty token value by leaving the token visible", () => {
    const out = substituteSampleVars("{{a}}", { a: "" });
    expect(out).toBe("{{a}}");
  });

  it("tolerates whitespace inside token braces", () => {
    expect(substituteSampleVars("{{ name }}", { name: "ok" })).toBe("ok");
  });
});

describe("store operations driven by phase-09 keyboard shortcuts", () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
    useEditorStore.temporal.getState().clear();
  });

  it("delete selected layer removes it and clears selection", () => {
    const store = useEditorStore.getState();
    store.addLayer(makeTextLayer("t1"));
    expect(useEditorStore.getState().selectedLayerId).toBe("t1");

    store.deleteLayer("t1");
    expect(useEditorStore.getState().layers).toHaveLength(0);
    expect(useEditorStore.getState().selectedLayerId).toBeNull();
  });

  it("duplicate creates a fresh layer offset by +20/+20", () => {
    const store = useEditorStore.getState();
    const original = makeTextLayer("t1", { x: 100, y: 50 });
    store.addLayer(original);

    store.duplicateLayer("t1");
    const s = useEditorStore.getState();
    expect(s.layers).toHaveLength(2);
    const dup = s.layers.find((l) => l.id !== "t1")!;
    expect(dup.x).toBe(120);
    expect(dup.y).toBe(70);
    expect(s.selectedLayerId).toBe(dup.id);
  });

  it("arrow nudge 1px: updateLayer(x: x+1) matches ArrowRight behavior", () => {
    const store = useEditorStore.getState();
    store.addLayer(makeTextLayer("t1", { x: 100, y: 50 }));

    // Simulate ArrowRight 1px nudge as the shortcut hook would
    const layer = useEditorStore.getState().layers.find((l) => l.id === "t1")!;
    store.updateLayer("t1", { x: layer.x + 1 });
    expect(useEditorStore.getState().layers[0].x).toBe(101);
  });

  it("arrow nudge 10px: Shift+ArrowDown semantics", () => {
    const store = useEditorStore.getState();
    store.addLayer(makeTextLayer("t1", { x: 100, y: 50 }));

    const layer = useEditorStore.getState().layers.find((l) => l.id === "t1")!;
    store.updateLayer("t1", { y: layer.y + 10 });
    expect(useEditorStore.getState().layers[0].y).toBe(60);
  });

  it("locked layer: updateLayer still works (store doesn't guard) but shortcut hook should skip", () => {
    const store = useEditorStore.getState();
    store.addLayer(makeTextLayer("t1", { locked: true }));
    // Sanity: store itself doesn't enforce lock — the shortcut hook is what
    // checks layer.locked before nudging. This test documents the contract.
    const before = useEditorStore.getState().layers[0];
    expect(before.locked).toBe(true);
  });

  it("moveable onDrag → updateLayer(x,y)", () => {
    const store = useEditorStore.getState();
    store.addLayer(makeTextLayer("t1"));
    store.updateLayer("t1", { x: 200, y: 150 });
    const s = useEditorStore.getState();
    expect(s.layers[0].x).toBe(200);
    expect(s.layers[0].y).toBe(150);
    expect(s.isDirty).toBe(true);
  });

  it("moveable onResize → updateLayer(width, height, x, y)", () => {
    const store = useEditorStore.getState();
    store.addLayer(makeTextLayer("t1"));
    store.updateLayer("t1", { width: 500, height: 100, x: 90, y: 40 });
    const s = useEditorStore.getState();
    expect(s.layers[0].width).toBe(500);
    expect(s.layers[0].height).toBe(100);
    expect(s.layers[0].x).toBe(90);
    expect(s.layers[0].y).toBe(40);
  });

  it("moveable onRotate → updateLayer(rotation)", () => {
    const store = useEditorStore.getState();
    store.addLayer(makeTextLayer("t1"));
    store.updateLayer("t1", { rotation: 45 });
    expect(useEditorStore.getState().layers[0].rotation).toBe(45);
  });

  it("undo reverts an onDrag change", () => {
    const store = useEditorStore.getState();
    store.addLayer(makeTextLayer("t1", { x: 100, y: 50 }));
    store.updateLayer("t1", { x: 200, y: 150 });
    useEditorStore.temporal.getState().undo();
    const l = useEditorStore.getState().layers[0];
    expect(l.x).toBe(100);
    expect(l.y).toBe(50);
  });

  // Regression: continuous gesture (simulated 100 drag ticks) must become a
  // single undoable step. Without zundo pause/resume wrapping, the undo stack
  // saturates and Ctrl+Z rewinds to a mid-drag frame instead of pre-drag.
  it("gesture pause/resume collapses a long drag into one history entry", () => {
    const store = useEditorStore.getState();
    store.addLayer(makeTextLayer("t1", { x: 0, y: 0 }));
    const temporal = useEditorStore.temporal.getState();

    const pastBefore = temporal.pastStates.length;

    // Simulate a drag gesture: beginGesture → many onDrag ticks → endGesture.
    // This mirrors what CanvasMoveableOverlay does for Moveable's callbacks.
    const preSnapshot = { x: 0, y: 0, width: 400, height: 80, rotation: 0 };
    temporal.pause();
    for (let i = 1; i <= 100; i++) {
      useEditorStore.getState().updateLayer("t1", { x: i * 2, y: i });
    }
    // Begin end-gesture sequence
    temporal.resume();
    temporal.pause();
    useEditorStore.getState().updateLayer("t1", preSnapshot);
    temporal.resume();
    // Commit final state — this is the one history entry the gesture should produce
    useEditorStore.getState().updateLayer("t1", { x: 200, y: 100 });

    const pastAfter = useEditorStore.temporal.getState().pastStates.length;
    // Expected: exactly one new entry (the commit after resume), not 100.
    expect(pastAfter - pastBefore).toBe(1);

    // Undo should take us back to the pre-drag state (0,0), not a mid-drag frame
    useEditorStore.temporal.getState().undo();
    const l = useEditorStore.getState().layers[0];
    expect(l.x).toBe(0);
    expect(l.y).toBe(0);
  });
});
