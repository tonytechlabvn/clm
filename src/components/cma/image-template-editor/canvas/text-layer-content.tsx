"use client";
// Presentation component for a text layer in the canvas. Tokens in the text
// string are substituted with sample variables so the preview matches what the
// Puppeteer render will ultimately produce.

import type { TextLayer } from "@/lib/cma/types/image-template-layer-types";
import { substituteSampleVars } from "./substitute-sample-vars";

interface Props {
  layer: TextLayer;
  sampleVars: Record<string, string>;
}

export function TextLayerContent({ layer, sampleVars }: Props) {
  const displayText = substituteSampleVars(layer.text, sampleVars);

  // Match the alignment logic in the server-side compiler (flex-based vertical
  // centering, align-items controlled by textAlign). Keeping these in sync
  // prevents WYSIWYG drift between the editor and Puppeteer output.
  const justifyContent =
    layer.textAlign === "center"
      ? "center"
      : layer.textAlign === "right"
      ? "flex-end"
      : "flex-start";

  const textShadow = layer.textShadow
    ? `${layer.textShadow.x}px ${layer.textShadow.y}px ${layer.textShadow.blur}px ${layer.textShadow.color}`
    : undefined;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent,
        fontFamily: `'${layer.fontFamily}', sans-serif`,
        fontSize: `${layer.fontSize}px`,
        fontWeight: layer.fontWeight,
        color: layer.color,
        textAlign: layer.textAlign,
        lineHeight: layer.lineHeight,
        letterSpacing: `${layer.letterSpacing}px`,
        textShadow,
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        overflow: "hidden",
        userSelect: "none",
      }}
    >
      <span style={{ width: "100%" }}>{displayText}</span>
    </div>
  );
}
