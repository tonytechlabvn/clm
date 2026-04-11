"use client";
// Per-layer wrapper DOM element. Provides the absolute-positioned box that
// Moveable will attach handles to via `data-layer-id`. The inner content
// component (TextLayerContent / ImageLayerContent / RectLayerContent) handles
// layer-specific rendering.
//
// Invariants:
//   - `data-layer-id` MUST be present so editor-canvas-area can querySelector it
//   - Locked layers set pointer-events:none + cursor:default so they can't be
//     accidentally dragged; deselect by clicking the canvas background
//   - No outline/chrome when not selected — the Moveable overlay renders its
//     own handles; we keep the layer DOM clean so saved HTML matches exactly

import type { MouseEvent as ReactMouseEvent } from "react";
import type { Layer } from "@/lib/cma/types/image-template-layer-types";
import { TextLayerContent } from "./text-layer-content";
import { ImageLayerContent } from "./image-layer-content";
import { RectLayerContent } from "./rect-layer-content";

interface Props {
  layer: Layer;
  isSelected: boolean;
  onSelect: (id: string) => void;
  sampleVars: Record<string, string>;
}

export function LayerView({ layer, isSelected, onSelect, sampleVars }: Props) {
  const handleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    // Always stop propagation so the canvas background's click-to-deselect
    // doesn't fire for clicks that land on a layer.
    e.stopPropagation();
    if (!layer.locked) onSelect(layer.id);
  };

  return (
    <div
      data-layer-id={layer.id}
      data-selected={isSelected || undefined}
      onClick={handleClick}
      style={{
        position: "absolute",
        left: `${layer.x}px`,
        top: `${layer.y}px`,
        width: `${layer.width}px`,
        height: `${layer.height}px`,
        transform: `rotate(${layer.rotation}deg)`,
        transformOrigin: "center center",
        opacity: layer.opacity,
        zIndex: layer.zIndex,
        cursor: layer.locked ? "default" : "move",
        pointerEvents: layer.locked ? "none" : "auto",
        // Dashed hint ring when hovered but not selected — only shows via CSS
        // hover state in the stylesheet (keeps DOM stable)
      }}
    >
      {layer.type === "text" && (
        <TextLayerContent layer={layer} sampleVars={sampleVars} />
      )}
      {layer.type === "image" && (
        <ImageLayerContent layer={layer} sampleVars={sampleVars} />
      )}
      {layer.type === "rect" && (
        <RectLayerContent layer={layer} sampleVars={sampleVars} />
      )}
    </div>
  );
}
