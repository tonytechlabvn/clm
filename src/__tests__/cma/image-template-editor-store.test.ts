// Phase-08 smoke test for the visual template editor store.
// Exercises every store action + zundo temporal partialize guarantees so
// that phase-09 can trust the store contract without re-verifying basics.

import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import { createBlankTemplatePayload } from "@/lib/cma/editor/image-template-editor-defaults";
import type { TextLayer, RectLayer } from "@/lib/cma/types/image-template-layer-types";

function makeTextLayer(id: string, zIndex = 1): TextLayer {
  return {
    id,
    type: "text",
    x: 10,
    y: 20,
    width: 300,
    height: 80,
    rotation: 0,
    zIndex,
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
  };
}

function makeRectLayer(id: string, zIndex = 0): RectLayer {
  return {
    id,
    type: "rect",
    x: 0,
    y: 0,
    width: 1200,
    height: 630,
    rotation: 0,
    zIndex,
    visible: true,
    locked: false,
    opacity: 1,
    fillColor: "#eeeeee",
  };
}

describe("image-template-editor-store — phase 08 smoke", () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
    useEditorStore.temporal.getState().clear();
  });

  describe("defaults", () => {
    it("starts with blank meta, empty layers/variables, isDirty=false", () => {
      const s = useEditorStore.getState();
      expect(s.meta.id).toBeNull();
      expect(s.meta.width).toBe(1200);
      expect(s.meta.height).toBe(630);
      expect(s.layers).toHaveLength(0);
      expect(s.variables).toHaveLength(0);
      expect(s.selectedLayerId).toBeNull();
      expect(s.zoom).toBe(1);
      expect(s.isDirty).toBe(false);
    });
  });

  describe("loadTemplate", () => {
    it("loads a blank payload and resets dirty flag", () => {
      useEditorStore.getState().loadTemplate(
        createBlankTemplatePayload({ platform: "instagram", width: 1080, height: 1080 })
      );
      const s = useEditorStore.getState();
      expect(s.meta.platform).toBe("instagram");
      expect(s.meta.width).toBe(1080);
      expect(s.isDirty).toBe(false);
      expect(s.selectedLayerId).toBeNull();
    });
  });

  describe("layer operations set isDirty", () => {
    it("addLayer appends and selects the new layer", () => {
      const layer = makeTextLayer("t1");
      useEditorStore.getState().addLayer(layer);
      const s = useEditorStore.getState();
      expect(s.layers).toHaveLength(1);
      expect(s.selectedLayerId).toBe("t1");
      expect(s.isDirty).toBe(true);
    });

    it("updateLayer patches the target layer only", () => {
      const layer = makeTextLayer("t1");
      useEditorStore.getState().addLayer(layer);
      useEditorStore.getState().updateLayer("t1", { x: 999 });
      const s = useEditorStore.getState();
      expect(s.layers[0].x).toBe(999);
      expect(s.layers[0].id).toBe("t1");
    });

    it("deleteLayer drops the target and clears selection if selected", () => {
      const layer = makeTextLayer("t1");
      useEditorStore.getState().addLayer(layer);
      useEditorStore.getState().deleteLayer("t1");
      const s = useEditorStore.getState();
      expect(s.layers).toHaveLength(0);
      expect(s.selectedLayerId).toBeNull();
    });

    it("reorderLayer rewrites zIndex", () => {
      useEditorStore.getState().addLayer(makeTextLayer("t1", 1));
      useEditorStore.getState().reorderLayer("t1", 5);
      expect(useEditorStore.getState().layers[0].zIndex).toBe(5);
    });

    it("duplicateLayer clones with new id + offset", () => {
      const layer = makeTextLayer("t1");
      useEditorStore.getState().addLayer(layer);
      useEditorStore.getState().duplicateLayer("t1");
      const s = useEditorStore.getState();
      expect(s.layers).toHaveLength(2);
      const dup = s.layers[1];
      expect(dup.id).not.toBe("t1");
      expect(dup.x).toBe(layer.x + 20);
      expect(dup.y).toBe(layer.y + 20);
      expect(s.selectedLayerId).toBe(dup.id);
    });
  });

  describe("selection never sets isDirty", () => {
    it("selectLayer leaves isDirty false", () => {
      useEditorStore.getState().loadTemplate(createBlankTemplatePayload());
      useEditorStore.getState().selectLayer("anything");
      expect(useEditorStore.getState().isDirty).toBe(false);
    });
  });

  describe("zoom clamping", () => {
    it("clamps setZoom to [0.25, 2]", () => {
      const store = useEditorStore.getState();
      store.setZoom(10);
      expect(useEditorStore.getState().zoom).toBe(2);
      store.setZoom(0.01);
      expect(useEditorStore.getState().zoom).toBe(0.25);
      store.setZoom(1.5);
      expect(useEditorStore.getState().zoom).toBe(1.5);
    });

    it("fitToScreen scales to 90% of the min axis ratio", () => {
      useEditorStore.getState().fitToScreen(1200, 630);
      // min(1200/1200, 630/630) * 0.9 = 0.9
      expect(useEditorStore.getState().zoom).toBeCloseTo(0.9, 4);
    });

    it("fitToScreen respects clamp", () => {
      useEditorStore.getState().fitToScreen(100, 50);
      // 0.0833 * 0.9 = 0.075 → clamped up to 0.25
      expect(useEditorStore.getState().zoom).toBe(0.25);
    });

    it("setZoom does NOT mark isDirty", () => {
      useEditorStore.getState().setZoom(1.5);
      expect(useEditorStore.getState().isDirty).toBe(false);
    });
  });

  describe("variables CRUD", () => {
    it("add/update/delete variables + set isDirty", () => {
      const store = useEditorStore.getState();
      store.addVariable({ name: "title", type: "text", label: "Title", required: true });
      expect(useEditorStore.getState().variables).toHaveLength(1);
      expect(useEditorStore.getState().isDirty).toBe(true);

      store.updateVariable("title", { label: "Headline" });
      expect(useEditorStore.getState().variables[0].label).toBe("Headline");

      store.deleteVariable("title");
      expect(useEditorStore.getState().variables).toHaveLength(0);
    });
  });

  describe("zundo temporal partialize", () => {
    it("undo restores previous layers state", () => {
      useEditorStore.getState().addLayer(makeTextLayer("t1"));
      expect(useEditorStore.getState().layers).toHaveLength(1);
      useEditorStore.getState().addLayer(makeRectLayer("r1"));
      expect(useEditorStore.getState().layers).toHaveLength(2);

      useEditorStore.temporal.getState().undo();
      expect(useEditorStore.getState().layers).toHaveLength(1);
      expect(useEditorStore.getState().layers[0].id).toBe("t1");
    });

    it("redo re-applies the undone operation", () => {
      useEditorStore.getState().addLayer(makeTextLayer("t1"));
      useEditorStore.getState().addLayer(makeRectLayer("r1"));
      useEditorStore.temporal.getState().undo();
      useEditorStore.temporal.getState().redo();
      expect(useEditorStore.getState().layers).toHaveLength(2);
    });

    it("zoom changes are NOT tracked in undo history", () => {
      useEditorStore.getState().addLayer(makeTextLayer("t1"));
      const pastBefore = useEditorStore.temporal.getState().pastStates.length;

      useEditorStore.getState().setZoom(1.5);
      useEditorStore.getState().setZoom(0.5);

      const pastAfter = useEditorStore.temporal.getState().pastStates.length;
      // Zoom mutations should not push new history entries since partialize
      // excludes zoom/selection/isDirty — only layers/variables/meta count
      expect(pastAfter).toBe(pastBefore);
    });

    it("selectLayer is NOT tracked in undo history", () => {
      useEditorStore.getState().addLayer(makeTextLayer("t1"));
      const pastBefore = useEditorStore.temporal.getState().pastStates.length;

      useEditorStore.getState().selectLayer("t1");
      useEditorStore.getState().selectLayer(null);

      const pastAfter = useEditorStore.temporal.getState().pastStates.length;
      expect(pastAfter).toBe(pastBefore);
    });
  });
});
