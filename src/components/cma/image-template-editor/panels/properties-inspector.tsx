"use client";
// Properties inspector shell — dispatches to type-specific sections based on
// the selected layer. Empty state renders a helpful hint when nothing is
// selected. Transform section is shared across all types.

import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import { TransformSection } from "./transform-section";
import { TextPropertiesSection } from "./text-properties-section";
import { ImagePropertiesSection } from "./image-properties-section";
import { RectPropertiesSection } from "./rect-properties-section";
import { DynamicFieldSection } from "./dynamic-field-section";

export function PropertiesInspector() {
  const selectedLayerId = useEditorStore((s) => s.selectedLayerId);
  const layerType = useEditorStore((s) => {
    const l = s.layers.find((x) => x.id === s.selectedLayerId);
    return l?.type;
  });

  if (!selectedLayerId || !layerType) {
    return (
      <div className="p-4 text-xs text-muted-foreground">
        Select a layer from the canvas or the layer tree to edit its properties.
      </div>
    );
  }

  return (
    <div className="p-3 space-y-3 overflow-y-auto">
      <TransformSection layerId={selectedLayerId} />
      {layerType === "text" && <TextPropertiesSection layerId={selectedLayerId} />}
      {layerType === "image" && <ImagePropertiesSection layerId={selectedLayerId} />}
      {layerType === "rect" && <RectPropertiesSection layerId={selectedLayerId} />}
      <DynamicFieldSection layerId={selectedLayerId} />
    </div>
  );
}
