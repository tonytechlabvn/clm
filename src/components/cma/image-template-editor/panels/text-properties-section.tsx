"use client";
// Text-layer-specific properties: raw text, font family, size, weight, color,
// alignment, line-height, letter-spacing. Type guard via store selector so
// re-renders don't cascade when other layer types are selected.

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

  if (!layer || layer.type !== "text") return null;

  return (
    <section>
      <InspectorSectionHeader>Text</InspectorSectionHeader>

      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
        Content
      </label>
      <textarea
        value={layer.text}
        onChange={(e) => updateLayer(layerId, { text: e.target.value })}
        rows={3}
        placeholder="Your text — use {{name}} to embed variables"
        className="w-full text-xs border rounded px-2 py-1 bg-background mt-0.5 mb-2 font-mono"
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
