"use client";
// Rect-layer-specific properties: fill color, border radius, border, shadow.
// Shadow is optional — toggle via writing a default shadow object or clearing it.

import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import {
  ColorInput,
  InspectorSectionHeader,
  NumericInput,
} from "./inspector-primitives";

interface Props {
  layerId: string;
}

export function RectPropertiesSection({ layerId }: Props) {
  const layer = useEditorStore((s) => s.layers.find((l) => l.id === layerId));
  const updateLayer = useEditorStore((s) => s.updateLayer);

  if (!layer || layer.type !== "rect") return null;

  return (
    <section>
      <InspectorSectionHeader>Rectangle</InspectorSectionHeader>

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <ColorInput
            label="Fill color"
            value={layer.fillColor}
            onChange={(fillColor) => updateLayer(layerId, { fillColor })}
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
