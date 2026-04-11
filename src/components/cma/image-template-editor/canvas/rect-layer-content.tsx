"use client";
// Presentation component for a rectangle/solid-color layer.
// Mirrors the CSS produced by the server compiler (background-color + optional
// border-radius + border + box-shadow) so editor preview matches render output.

import type { RectLayer } from "@/lib/cma/types/image-template-layer-types";
import { substituteSampleVars } from "./substitute-sample-vars";

interface Props {
  layer: RectLayer;
  sampleVars: Record<string, string>;
}

export function RectLayerContent({ layer, sampleVars }: Props) {
  const fillColor = substituteSampleVars(layer.fillColor, sampleVars);

  const border =
    layer.border && layer.border.width > 0
      ? `${layer.border.width}px solid ${layer.border.color}`
      : undefined;

  const boxShadow = layer.shadow
    ? `${layer.shadow.x}px ${layer.shadow.y}px ${layer.shadow.blur}px ${layer.shadow.color}`
    : undefined;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: fillColor,
        borderRadius: layer.borderRadius ? `${layer.borderRadius}px` : undefined,
        border,
        boxShadow,
        userSelect: "none",
      }}
    />
  );
}
