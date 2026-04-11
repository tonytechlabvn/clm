"use client";
// Text-layer-specific properties: raw text, font family, size, weight, color,
// alignment, line-height, letter-spacing. Type guard via store selector so
// re-renders don't cascade when other layer types are selected.
//
// Phase-11: "Insert variable" dropdown above the textarea injects {{name}}
// at the current cursor position via the native setRangeText API.

import { useRef } from "react";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import { CURATED_FONTS } from "@/lib/cma/types/image-template-fonts";
import {
  ColorInput,
  InspectorSectionHeader,
  NumericInput,
  SelectInput,
} from "./inspector-primitives";

const FONT_OPTIONS = CURATED_FONTS.map((f) => ({ value: f, label: f }));

const WEIGHT_OPTIONS = [
  { value: "400", label: "400 Regular" },
  { value: "500", label: "500 Medium" },
  { value: "600", label: "600 Semibold" },
  { value: "700", label: "700 Bold" },
  { value: "800", label: "800 Extrabold" },
] as const;

const ALIGN_OPTIONS = [
  { value: "left", label: "Left" },
  { value: "center", label: "Center" },
  { value: "right", label: "Right" },
] as const;

interface Props {
  layerId: string;
}

export function TextPropertiesSection({ layerId }: Props) {
  const layer = useEditorStore((s) => s.layers.find((l) => l.id === layerId));
  const updateLayer = useEditorStore((s) => s.updateLayer);
  const variables = useEditorStore((s) => s.variables);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!layer || layer.type !== "text") return null;

  const handleInsertToken = (name: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const token = `{{${name}}}`;
    const start = ta.selectionStart ?? ta.value.length;
    const end = ta.selectionEnd ?? ta.value.length;
    ta.focus();
    // setRangeText with 'end' selection mode positions the cursor right after
    // the inserted token so consecutive inserts feel natural.
    ta.setRangeText(token, start, end, "end");
    updateLayer(layerId, { text: ta.value });
  };

  return (
    <section>
      <InspectorSectionHeader>Text</InspectorSectionHeader>

      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Content
        </label>
        {variables.length > 0 && (
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) handleInsertToken(e.target.value);
              // Reset the select so it always shows the placeholder.
              e.target.value = "";
            }}
            className="text-[10px] border rounded px-1 py-0.5 bg-background"
            aria-label="Insert variable token"
          >
            <option value="">Insert var…</option>
            {variables.map((v) => (
              <option key={v.name} value={v.name}>
                {`{{${v.name}}}`}
              </option>
            ))}
          </select>
        )}
      </div>
      <textarea
        ref={textareaRef}
        value={layer.text}
        onChange={(e) => updateLayer(layerId, { text: e.target.value })}
        rows={3}
        placeholder="Your text — use {{name}} to embed variables"
        className="w-full text-xs border rounded px-2 py-1 bg-background mb-2 font-mono"
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <SelectInput
            label="Font family"
            value={layer.fontFamily}
            options={FONT_OPTIONS}
            onChange={(fontFamily) => {
              // Cast is safe: CURATED_FONTS is the source of truth for the enum
              updateLayer(layerId, {
                fontFamily: fontFamily as (typeof CURATED_FONTS)[number],
              });
            }}
          />
        </div>
        <NumericInput
          label="Size"
          value={layer.fontSize}
          min={1}
          suffix="px"
          onChange={(fontSize) => updateLayer(layerId, { fontSize })}
        />
        <SelectInput
          label="Weight"
          value={String(layer.fontWeight) as "400" | "500" | "600" | "700" | "800"}
          options={WEIGHT_OPTIONS}
          onChange={(w) => {
            const weight = Number(w) as 400 | 500 | 600 | 700 | 800;
            updateLayer(layerId, { fontWeight: weight });
          }}
        />
        <SelectInput
          label="Align"
          value={layer.textAlign}
          options={ALIGN_OPTIONS}
          onChange={(textAlign) => updateLayer(layerId, { textAlign })}
        />
        <NumericInput
          label="Line height"
          value={layer.lineHeight}
          step={0.05}
          min={0}
          onChange={(lineHeight) => updateLayer(layerId, { lineHeight })}
        />
        <NumericInput
          label="Letter spacing"
          value={layer.letterSpacing}
          step={0.5}
          suffix="px"
          onChange={(letterSpacing) => updateLayer(layerId, { letterSpacing })}
        />
        <div className="col-span-2">
          <ColorInput
            label="Color"
            value={layer.color}
            onChange={(color) => updateLayer(layerId, { color })}
          />
        </div>
      </div>
    </section>
  );
}
