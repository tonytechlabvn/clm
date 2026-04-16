"use client";
// APITemplate.io-style "Dynamic Field" section rendered inside every layer
// property inspector (text / image / rect). The author assigns a `fieldName`
// and toggles `dynamic` — the compiler then emits `{{fieldName.<prop>}}` so
// the layer's content can be overridden via the Direct URL query string:
//
//   text layer  → ?fieldName.text=Hello
//   image layer → ?fieldName.url=https://...
//   rect layer  → ?fieldName.color=%23ff6600
//
// `locked` (UI lock that prevents selection/drag) is intentionally kept
// separate from `dynamic` — they solve different problems and users often
// want a dynamic layer that is also UI-locked while the chatbot fills it.

import { useMemo } from "react";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import {
  DYNAMIC_FIELD_PROPERTY,
  FIELD_NAME_RE,
  type Layer,
} from "@/lib/cma/types/image-template-layer-types";
import { InspectorSectionHeader } from "./inspector-primitives";

interface Props {
  layerId: string;
}

function suggestFieldName(l: Layer): string {
  // Best-effort default from the existing content so the author doesn't
  // have to invent a name. Falls back to the layer type.
  const raw =
    (l.type === "text" && l.text) ||
    (l.type === "image" && "image") ||
    (l.type === "rect" && "background") ||
    l.type;
  const slug = String(raw)
    .toLowerCase()
    .replace(/\{\{[^}]+\}\}/g, "")
    .trim()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 24);
  return slug && FIELD_NAME_RE.test(slug) ? slug : l.type;
}

export function DynamicFieldSection({ layerId }: Props) {
  const layer = useEditorStore((s) => s.layers.find((l) => l.id === layerId));
  const updateLayer = useEditorStore((s) => s.updateLayer);

  const propertyName = useMemo(
    () => (layer ? DYNAMIC_FIELD_PROPERTY[layer.type] : ""),
    [layer]
  );

  if (!layer) return null;

  const fieldName = layer.fieldName ?? "";
  const dynamic = Boolean(layer.dynamic);
  const fieldNameValid = fieldName === "" || FIELD_NAME_RE.test(fieldName);
  const fullPath = fieldName ? `${fieldName}.${propertyName}` : "";

  const handleToggleDynamic = (next: boolean) => {
    if (next && !fieldName) {
      // Auto-suggest a name the first time the author enables dynamic — keeps
      // the UX one-click for the common case.
      const suggested = suggestFieldName(layer);
      updateLayer(layerId, { dynamic: true, fieldName: suggested });
    } else {
      updateLayer(layerId, { dynamic: next });
    }
  };

  return (
    <section>
      <InspectorSectionHeader>Dynamic field</InspectorSectionHeader>

      <label className="flex items-center gap-2 mb-2 cursor-pointer">
        <input
          type="checkbox"
          checked={dynamic}
          onChange={(e) => handleToggleDynamic(e.target.checked)}
          className="h-3.5 w-3.5 accent-primary cursor-pointer"
        />
        <span className="text-xs">
          Unlock for URL override
          <span className="text-[10px] text-muted-foreground ml-1">
            (APITemplate.io-style)
          </span>
        </span>
      </label>

      <div className="flex flex-col gap-0.5 mb-1">
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Field name
        </label>
        <input
          type="text"
          value={fieldName}
          onChange={(e) =>
            updateLayer(layerId, { fieldName: e.target.value || undefined })
          }
          placeholder="e.g. date, title, background"
          disabled={!dynamic}
          className="w-full text-xs border rounded px-2 py-1 bg-background font-mono disabled:opacity-50"
        />
      </div>

      {!fieldNameValid && (
        <p className="text-[10px] text-destructive mb-1">
          Only letters, digits, and underscore. Must not start with a digit.
        </p>
      )}

      {dynamic && fieldName && fieldNameValid && (
        <p className="text-[10px] text-muted-foreground font-mono">
          Query key: <span className="text-foreground">?{fullPath}=…</span>
        </p>
      )}
      {dynamic && !fieldName && (
        <p className="text-[10px] text-destructive">
          Field name required when dynamic is on.
        </p>
      )}
    </section>
  );
}
