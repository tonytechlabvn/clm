// Phase-10 smoke test — default-layer factories + zIndex ceiling + Zod
// validation round-trip to confirm what the palette will produce is a
// structurally valid Layer the store (and downstream compiler) can accept.

import { describe, it, expect, beforeEach } from "vitest";
import {
  makeTextLayer,
  makeImageLayer,
  makeRectLayer,
  nextZIndex,
} from "@/components/cma/image-template-editor/palette/default-layers";
import { layerSchema } from "@/lib/cma/types/image-template-layer-types";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";

describe("default-layer factories (phase-10 palette)", () => {
  it("makeTextLayer produces a Zod-valid TextLayer centered on the canvas", () => {
    const layer = makeTextLayer(1200, 630, 0);
    const result = layerSchema.safeParse(layer);
    expect(result.success).toBe(true);
    expect(layer.type).toBe("text");
    expect(layer.x).toBe(Math.round((1200 - 400) / 2));
    expect(layer.y).toBe(Math.round((630 - 80) / 2));
    expect(layer.width).toBe(400);
    expect(layer.height).toBe(80);
    expect(layer.fontWeight).toBe(700);
    expect(layer.visible).toBe(true);
    expect(layer.locked).toBe(false);
  });

  it("makeImageLayer produces a Zod-valid ImageLayer with cover fit + empty src", () => {
    const layer = makeImageLayer(1080, 1080, 2);
    const result = layerSchema.safeParse(layer);
    expect(result.success).toBe(true);
    expect(layer.type).toBe("image");
    expect(layer.fitMode).toBe("cover");
    expect(layer.src).toBe("");
    expect(layer.zIndex).toBe(2);
  });

  it("makeRectLayer produces a Zod-valid RectLayer with neutral gray fill", () => {
    const layer = makeRectLayer(800, 600, 5);
    const result = layerSchema.safeParse(layer);
    expect(result.success).toBe(true);
    expect(layer.type).toBe("rect");
    expect(layer.fillColor).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("each factory assigns a fresh nanoid — no collisions across calls", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(makeTextLayer(1200, 630, i).id);
      ids.add(makeImageLayer(1200, 630, i).id);
      ids.add(makeRectLayer(1200, 630, i).id);
    }
    expect(ids.size).toBe(300);
  });

  it("nextZIndex returns 0 for an empty array", () => {
    expect(nextZIndex([])).toBe(0);
  });

  it("nextZIndex returns max + 1 when layers are present", () => {
    const a = makeTextLayer(1200, 630, 3);
    const b = makeRectLayer(1200, 630, 7);
    expect(nextZIndex([a, b])).toBe(8);
  });
});

describe("palette → store integration", () => {
  beforeEach(() => {
    useEditorStore.getState().reset();
    useEditorStore.temporal.getState().clear();
  });

  it("adding three layers assigns monotonic zIndex and selects the last", () => {
    const store = useEditorStore.getState();
    const w = store.meta.width;
    const h = store.meta.height;

    store.addLayer(makeTextLayer(w, h, nextZIndex(store.layers)));
    store.addLayer(
      makeImageLayer(w, h, nextZIndex(useEditorStore.getState().layers))
    );
    store.addLayer(
      makeRectLayer(w, h, nextZIndex(useEditorStore.getState().layers))
    );

    const s = useEditorStore.getState();
    expect(s.layers.map((l) => l.zIndex)).toEqual([0, 1, 2]);
    expect(s.selectedLayerId).toBe(s.layers[2].id);
    expect(s.isDirty).toBe(true);
  });

  it("layer tree reorder normalizes zIndices to 0..n-1 without gaps", () => {
    const store = useEditorStore.getState();
    const a = makeTextLayer(1200, 630, 0);
    const b = makeRectLayer(1200, 630, 1);
    const c = makeImageLayer(1200, 630, 2);

    store.addLayer(a);
    store.addLayer(b);
    store.addLayer(c);

    // Simulate what the layer-tree drop handler does: normalize zIndex
    // so front-of-list has highest zIndex. Here we swap a and c.
    const sorted = [...useEditorStore.getState().layers].sort(
      (x, y) => y.zIndex - x.zIndex
    );
    // sorted is [c, b, a] (zIndex 2, 1, 0). Swap c and a → [a, b, c]
    const next = [a, b, c];
    const total = next.length;
    next.forEach((l, i) => {
      const desiredZ = total - 1 - i;
      store.updateLayer(l.id, { zIndex: desiredZ });
    });

    const final = useEditorStore.getState().layers;
    const z = final.reduce<Record<string, number>>(
      (acc, l) => ({ ...acc, [l.id]: l.zIndex }),
      {}
    );
    expect(z[a.id]).toBe(2);
    expect(z[b.id]).toBe(1);
    expect(z[c.id]).toBe(0);
    expect(sorted.length).toBe(3); // sanity: initial fetch was good
  });
});
