"use client";
// Image-layer-specific properties: src, fit mode, border radius, border.
// Phase-12 wires the Upload button through useTemplateAssetUpload — the
// hook returns a public URL we write straight into layer.src.

import { useRef } from "react";
import { Upload, Loader2 } from "lucide-react";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { useTemplateAssetUpload } from "@/lib/cma/editor/use-template-asset-upload";
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
  const { org } = useCmaOrg();
  const { upload, uploading, error } = useTemplateAssetUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!layer || layer.type !== "image") return null;

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !org?.id) return;
    const url = await upload(file, org.id);
    if (url) updateLayer(layerId, { src: url });
    // Reset the input so the same file can be picked again later
    e.target.value = "";
  };

  return (
    <section>
      <InspectorSectionHeader>Image</InspectorSectionHeader>

      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] uppercase tracking-wide text-muted-foreground">
          Source URL
        </label>
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading || !org?.id}
          className="text-[10px] flex items-center gap-1 text-primary hover:underline disabled:opacity-50"
          title={org?.id ? "Upload an image" : "Organization not loaded"}
        >
          {uploading ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Upload className="h-3 w-3" />
          )}
          Upload
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        type="text"
        value={layer.src}
        onChange={(e) => updateLayer(layerId, { src: e.target.value })}
        placeholder="https://... or {{imageUrl}}"
        className="w-full text-xs border rounded px-2 py-1 bg-background mb-1 font-mono"
      />
      {error && (
        <p className="text-[10px] text-destructive mb-2">{error}</p>
      )}
      <div className="mb-2" />

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
