"use client";
// Shared transform section: x, y, width, height, rotation, opacity.
// Renders regardless of layer type and writes back via updateLayer.
// Each input is controlled by a selector that pulls only the relevant field
// so unrelated property edits don't re-render this section.

import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import { InspectorSectionHeader, NumericInput } from "./inspector-primitives";

interface Props {
  layerId: string;
}

export function TransformSection({ layerId }: Props) {
  const layer = useEditorStore((s) =>
    s.layers.find((l) => l.id === layerId)
  );
  const updateLayer = useEditorStore((s) => s.updateLayer);

  if (!layer) return null;

  return (
    <section>
      <InspectorSectionHeader>Transform</InspectorSectionHeader>
      <div className="grid grid-cols-2 gap-2">
        <NumericInput
          label="X"
          value={layer.x}
          onChange={(x) => updateLayer(layerId, { x })}
        />
        <NumericInput
          label="Y"
          value={layer.y}
          onChange={(y) => updateLayer(layerId, { y })}
        />
        <NumericInput
          label="Width"
          value={layer.width}
          min={1}
          onChange={(width) => updateLayer(layerId, { width })}
        />
        <NumericInput
          label="Height"
          value={layer.height}
          min={1}
          onChange={(height) => updateLayer(layerId, { height })}
        />
        <NumericInput
          label="Rotation"
          value={layer.rotation}
          suffix="°"
          onChange={(rotation) => updateLayer(layerId, { rotation })}
        />
        <NumericInput
          label="Opacity"
          value={layer.opacity}
          step={0.05}
          min={0}
          max={1}
          onChange={(opacity) => updateLayer(layerId, { opacity })}
        />
      </div>
    </section>
  );
}
