"use client";
// Canvas viewport + layer renderer. Hosts Moveable overlay via child component.
//
// Layout layers (outer → inner):
//   1. scroll viewport (overflow auto, fills remaining space)
//   2. zoom wrapper with CSS transform:scale(zoom) sized to width*zoom × height*zoom
//   3. canvas body (width × height unscaled) — Moveable attaches to layers here
//   4. absolute-positioned layer views, one per visible Layer
//
// NEVER apply CSS transform to the canvas body itself — Moveable captures
// bounding-client-rect snapshots that transform origin shifts corrupt.
// Scale must live on the *wrapper* around the canvas body.

import { useEffect, useMemo, useRef, useState } from "react";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import { LayerView } from "./canvas/layer-view";
import { useSampleVars } from "./canvas/use-sample-vars";
import { CanvasMoveableOverlay } from "./canvas/canvas-moveable-overlay";

export function EditorCanvasArea() {
  const width = useEditorStore((s) => s.meta.width);
  const height = useEditorStore((s) => s.meta.height);
  const backgroundColor = useEditorStore((s) => s.meta.backgroundColor);
  const zoom = useEditorStore((s) => s.zoom);
  const layers = useEditorStore((s) => s.layers);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const selectLayer = useEditorStore((s) => s.selectLayer);

  const sampleVars = useSampleVars();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [target, setTarget] = useState<HTMLElement | null>(null);

  const sortedLayers = useMemo(
    () =>
      [...layers]
        .filter((l) => l.visible)
        .sort((a, b) => a.zIndex - b.zIndex),
    [layers]
  );

  const selectedLayer = useMemo(
    () => layers.find((l) => l.id === selectedLayerId) ?? null,
    [layers, selectedLayerId]
  );

  // Re-query the Moveable target whenever selection or the layer list changes.
  // React may reuse DOM nodes but their positions move, so we must refresh.
  useEffect(() => {
    if (!selectedLayerId || !canvasRef.current) {
      setTarget(null);
      return;
    }
    const el = canvasRef.current.querySelector<HTMLElement>(
      `[data-layer-id="${selectedLayerId}"]`
    );
    setTarget(el);
  }, [selectedLayerId, layers]);

  // Gather other visible layer elements for Moveable's alignment guidelines.
  // Rebuilt whenever layers or selection change — cheap for <100 layers.
  const guidelineElements: HTMLElement[] = useMemo(() => {
    if (!canvasRef.current) return [];
    const all = Array.from(
      canvasRef.current.querySelectorAll<HTMLElement>("[data-layer-id]")
    );
    return all.filter((el) => el.dataset.layerId !== selectedLayerId);
    // canvasRef.current isn't reactive — we depend on layers + selection
    // which cover all cases we care about.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layers, selectedLayerId]);

  return (
    <div className="flex-1 min-w-0 overflow-auto bg-muted/40">
      <div className="min-w-max min-h-full flex items-center justify-center p-12">
        <div
          style={{
            width: `${width * zoom}px`,
            height: `${height * zoom}px`,
            position: "relative",
          }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: "top left",
              width: `${width}px`,
              height: `${height}px`,
            }}
          >
            <div
              ref={canvasRef}
              data-canvas="1"
              // Click-to-deselect: clicks that reach the canvas body (not a layer,
              // which stops propagation in layer-view.tsx) clear the selection.
              onClick={() => selectLayer(null)}
              style={{
                width: `${width}px`,
                height: `${height}px`,
                backgroundColor,
                position: "relative",
                overflow: "hidden",
                boxShadow:
                  "0 0 0 1px rgba(0,0,0,0.1), 0 4px 20px rgba(0,0,0,0.15)",
              }}
            >
              {sortedLayers.map((layer) => (
                <LayerView
                  key={layer.id}
                  layer={layer}
                  isSelected={layer.id === selectedLayerId}
                  onSelect={selectLayer}
                  sampleVars={sampleVars}
                />
              ))}

              {sortedLayers.length === 0 && (
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(0,0,0,0.3)",
                    fontSize: "12px",
                    fontFamily: "monospace",
                    pointerEvents: "none",
                  }}
                >
                  {width} × {height} — drop an element from the left palette
                </div>
              )}

              <CanvasMoveableOverlay
                target={target}
                selectedLayer={selectedLayer}
                zoom={zoom}
                guidelineElements={guidelineElements}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
