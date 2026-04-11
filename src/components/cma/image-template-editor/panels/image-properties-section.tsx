"use client";
// Image-layer-specific properties: src, fit mode, border radius, border.
// Upload button wired in phase-12 (asset upload flow).

import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import {
  ColorInput,
  InspectorSectionHeader,
  NumericInput,
  SelectInput,
} from "./inspector-primitives";

const FIT_OPTIONS = [
  { value: "cover", label: "Cover (fill, crop)" },
  { value: "contain", label: "Contain (fit inside)" },
  { value: "fill", label: "Fill (stretch)" },
] as const;

interface Props {
  layerId: string;
}

export function ImagePropertiesSection({ layerId }: Props) {
  const layer = useEditorStore((s) => s.layers.find((l) => l.id === layerId));
  const updateLayer = useEditorStore((s) => s.updateLayer);

  if (!layer || layer.type !== "image") return null;

  return (
    <section>
      <InspectorSectionHeader>Image</InspectorSectionHeader>

      <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
        Source URL
      </label>
      <input
        type="text"
        value={layer.src}
        onChange={(e) => updateLayer(layerId, { src: e.target.value })}
        placeholder="https://... or {{imageUrl}}"
        className="w-full text-xs border rounded px-2 py-1 bg-background mt-0.5 mb-2 font-mono"
      />

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <SelectInput
            label="Fit mode"
            value={layer.fitMode}
            options={FIT_OPTIONS}
            onChange={(fitMode) => updateLayer(layerId, { fitMode })}
          />
        </div>
        <NumericInput
          label="Border radius"
          value={layer.borderRadius ?? 0}
          min={0}
          suffix="px"
          onChange={(borderRadius) =>
            updateLayer(layerId, {
              borderRadius: borderRadius > 0 ? borderRadius : undefined,
            })
          }
        />
        <NumericInput
          label="Border width"
          value={layer.border?.width ?? 0}
          min={0}
          suffix="px"
          onChange={(width) => {
            if (width <= 0) {
              updateLayer(layerId, { border: undefined });
              return;
            }
            updateLayer(layerId, {
              border: { width, color: layer.border?.color ?? "#000000" },
            });
          }}
        />
        <div className="col-span-2">
          <ColorInput
            label="Border color"
            value={layer.border?.color ?? "#000000"}
            onChange={(color) =>
              updateLayer(layerId, {
                border: { width: layer.border?.width ?? 1, color },
              })
            }
          />
        </div>
      </div>
    </section>
  );
}
