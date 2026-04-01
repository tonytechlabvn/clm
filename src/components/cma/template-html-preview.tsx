// Isolated HTML preview renderer — uses iframe srcdoc for true CSS isolation
// Prevents style bleed between multiple template previews on the same page

"use client";

import { useMemo } from "react";

interface TemplateHtmlPreviewProps {
  htmlTemplate: string;
  cssScoped: string;
  scopeClass: string; // e.g., "tpl-abc123"
  className?: string;
  scale?: number; // CSS scale for thumbnail view (e.g., 0.3)
}

export function TemplateHtmlPreview({
  htmlTemplate,
  cssScoped,
  scopeClass,
  className = "",
  scale,
}: TemplateHtmlPreviewProps) {
  // Build a self-contained HTML document for the iframe
  const srcdoc = useMemo(() => {
    const scaleStyles = scale
      ? `transform: scale(${scale}); transform-origin: top left; width: ${100 / scale}%; height: ${100 / scale}%;`
      : "";

    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>body { margin: 0; overflow: hidden; }</style>
<style>${cssScoped}</style>
</head><body>
<div class="${scopeClass}" style="${scaleStyles}">${htmlTemplate}</div>
</body></html>`;
  }, [htmlTemplate, cssScoped, scopeClass, scale]);

  return (
    <div className={`overflow-hidden ${className}`}>
      <iframe
        srcDoc={srcdoc}
        sandbox="allow-same-origin"
        title="Template preview"
        className="w-full h-full border-0"
        style={{ pointerEvents: "none" }}
      />
    </div>
  );
}
