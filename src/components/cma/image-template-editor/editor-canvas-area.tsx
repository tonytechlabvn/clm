"use client";
// Scrollable viewport that hosts the fixed-size template canvas.
// Phase-08 renders an empty canvas inner div sized by meta.width/height × zoom;
// phase-09 will inject the layer tree and Moveable handles into this container.
//
// Key constraint from plan phase-08 "Key Insights": do NOT apply CSS transform
// to the canvas body element — Moveable snapshots position/offset and transforms
// break its math. We multiply width/height by zoom instead.

import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";

export function EditorCanvasArea() {
  const width = useEditorStore((s) => s.meta.width);
  const height = useEditorStore((s) => s.meta.height);
  const backgroundColor = useEditorStore((s) => s.meta.backgroundColor);
  const zoom = useEditorStore((s) => s.zoom);
  const selectLayer = useEditorStore((s) => s.selectLayer);

  const displayWidth = width * zoom;
  const displayHeight = height * zoom;

  return (
    <div
      className="flex-1 min-w-0 overflow-auto bg-muted/40 editor-canvas-scroll"
      onClick={() => selectLayer(null)}
    >
      {/* Padding gives breathing room on all sides so zoomed canvas never hugs the edges */}
      <div className="min-w-max min-h-full flex items-center justify-center p-12">
        <div
          className="relative shadow-lg ring-1 ring-border editor-canvas"
          data-canvas="1"
          style={{
            width: `${displayWidth}px`,
            height: `${displayHeight}px`,
            backgroundColor,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Phase-09 fills this with absolute-positioned layer elements */}
          {/* Placeholder watermark while phases 09-10 are pending */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-xs text-muted-foreground/60 font-mono">
              {width} × {height}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
