"use client";
// Layer tree with drag-reorder, visibility toggle, lock toggle, and delete.
// Layers are displayed topmost-first (reverse zIndex order) to match the
// Figma/Canva convention where the top of the list is front-most.
//
// Reorder strategy: on drop, swap the dragged layer to just-above the drop
// target, then normalize zIndices to 0..n-1 in render order so future
// reorders are O(1) instead of fractional-float accumulation.

import type { DragEvent as ReactDragEvent, MouseEvent as ReactMouseEvent } from "react";
import { useMemo } from "react";
import { Eye, EyeOff, Lock, Unlock, Trash2, Type, Image, Square } from "lucide-react";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import type { Layer } from "@/lib/cma/types/image-template-layer-types";

function layerIcon(type: Layer["type"]) {
  if (type === "text") return <Type className="h-3 w-3" />;
  if (type === "image") return <Image className="h-3 w-3" aria-label="image" />;
  return <Square className="h-3 w-3" />;
}

function layerLabel(layer: Layer): string {
  if (layer.type === "text") {
    const t = layer.text.trim();
    return t.length > 0 ? t.slice(0, 24) : "Text";
  }
  if (layer.type === "image") return "Image";
  return "Rectangle";
}

export function LayerTree() {
  const layers = useEditorStore((s) => s.layers);
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const selectLayer = useEditorStore((s) => s.selectLayer);
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const deleteLayer = useEditorStore((s) => s.deleteLayer);

  // Topmost (highest zIndex) first — matches Figma / Canva convention.
  const ordered = useMemo(
    () => [...layers].sort((a, b) => b.zIndex - a.zIndex),
    [layers]
  );

  const handleDragStart = (e: ReactDragEvent<HTMLDivElement>, id: string) => {
    e.dataTransfer.setData("text/plain", id);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: ReactDragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Drop strategy:
  //   - get the dragged layer's current rendered index in `ordered`
  //   - get the target layer's rendered index
  //   - splice the dragged layer into the new slot
  //   - reassign zIndex so rendering-top has highest zIndex, etc.
  const handleDrop = (e: ReactDragEvent<HTMLDivElement>, targetId: string) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData("text/plain");
    if (!draggedId || draggedId === targetId) return;

    const current = useEditorStore.getState().layers;
    const sorted = [...current].sort((a, b) => b.zIndex - a.zIndex);
    const from = sorted.findIndex((l) => l.id === draggedId);
    const to = sorted.findIndex((l) => l.id === targetId);
    if (from < 0 || to < 0) return;

    const next = [...sorted];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);

    // Assign zIndices: front-of-list (index 0) gets the highest zIndex so
    // visual stacking in the canvas matches the render order of the list.
    const total = next.length;
    next.forEach((l, i) => {
      const desiredZ = total - 1 - i;
      if (l.zIndex !== desiredZ) {
        updateLayer(l.id, { zIndex: desiredZ });
      }
    });
  };

  const stop = (cb: () => void) => (e: ReactMouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    cb();
  };

  if (ordered.length === 0) {
    return (
      <div className="p-3 text-xs text-muted-foreground">
        No layers yet — use the palette on the left to add one.
      </div>
    );
  }

  return (
    <div className="p-2 space-y-0.5 max-h-64 overflow-y-auto">
      {ordered.map((l) => {
        const isSelected = l.id === selectedLayerId;
        return (
          <div
            key={l.id}
            draggable
            onDragStart={(e) => handleDragStart(e, l.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, l.id)}
            onClick={() => selectLayer(l.id)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer select-none ${
              isSelected
                ? "bg-primary/10 ring-1 ring-primary/30"
                : "hover:bg-muted"
            }`}
          >
            <span className="text-muted-foreground">{layerIcon(l.type)}</span>
            <span className="flex-1 truncate">{layerLabel(l)}</span>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              title={l.visible ? "Hide layer" : "Show layer"}
              onClick={stop(() => updateLayer(l.id, { visible: !l.visible }))}
            >
              {l.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              title={l.locked ? "Unlock" : "Lock"}
              onClick={stop(() => updateLayer(l.id, { locked: !l.locked }))}
            >
              {l.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
            </button>
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive"
              title="Delete layer"
              onClick={stop(() => deleteLayer(l.id))}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
