"use client";
// Presentation component for an image layer. `src` may be a literal URL or
// a {{token}} — we run the sample-var substitution first so authors see a
// real preview when a sensible default is set, falling back to a placeholder
// tile if the src is missing/unresolved.

import type { ImageLayer } from "@/lib/cma/types/image-template-layer-types";
import { substituteSampleVars } from "./substitute-sample-vars";

interface Props {
  layer: ImageLayer;
  sampleVars: Record<string, string>;
}

export function ImageLayerContent({ layer, sampleVars }: Props) {
  const resolvedSrc = substituteSampleVars(layer.src, sampleVars);
  // If substitution left an unresolved token, treat as placeholder
  const hasRealSrc = resolvedSrc && !resolvedSrc.includes("{{");

  const objectFit = layer.fitMode === "fill" ? "fill" : layer.fitMode;
  const borderRadius = layer.borderRadius ? `${layer.borderRadius}px` : undefined;
  const border =
    layer.border && layer.border.width > 0
      ? `${layer.border.width}px solid ${layer.border.color}`
      : undefined;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
        borderRadius,
        border,
        userSelect: "none",
      }}
    >
      {hasRealSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedSrc}
          alt=""
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit,
            display: "block",
            pointerEvents: "none",
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "repeating-linear-gradient(45deg, #e5e7eb 0 8px, #f3f4f6 8px 16px)",
            color: "#6b7280",
            fontSize: "11px",
            fontFamily: "monospace",
          }}
        >
          {resolvedSrc || "image"}
        </div>
      )}
    </div>
  );
}
