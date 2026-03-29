// Scoped HTML preview renderer — renders extracted template HTML with isolated CSS

"use client";

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
  const containerStyle = scale
    ? {
        transform: `scale(${scale})`,
        transformOrigin: "top left",
        width: `${100 / scale}%`,
        height: `${100 / scale}%`,
      }
    : undefined;

  return (
    <div className={`overflow-hidden ${className}`}>
      {/* Inject scoped CSS */}
      <style dangerouslySetInnerHTML={{ __html: cssScoped }} />
      {/* Render sanitized HTML inside scoped container */}
      <div
        className={scopeClass}
        style={containerStyle}
        dangerouslySetInnerHTML={{ __html: htmlTemplate }}
      />
    </div>
  );
}
