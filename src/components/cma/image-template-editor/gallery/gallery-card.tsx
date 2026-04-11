"use client";
// Single template card in the gallery grid. Shows the thumbnail (falling
// back to a Direct URL render when thumbnail hasn't been generated yet) +
// name + size. Hover exposes Edit/Duplicate/Delete actions. Delete is
// hidden for system templates — server-side blocks it anyway, but keeping
// the button out avoids a confusing click.

import { Edit2, Copy, Trash2, Lock } from "lucide-react";
import type { GalleryTemplate } from "./gallery-types";
import { PLATFORM_LABELS } from "./gallery-types";

interface Props {
  template: GalleryTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

// Build a Direct URL fallback so the card still has a preview before the
// first save generates an actual thumbnail file.
function directUrlPreview(t: GalleryTemplate): string {
  const params = new URLSearchParams({ auth: t.authCode });
  return `/api/cma/image-templates/${t.id}/image?${params.toString()}`;
}

export function GalleryCard({ template, onEdit, onDuplicate, onDelete }: Props) {
  const previewSrc = template.thumbnail ?? directUrlPreview(template);

  return (
    <div
      onClick={onEdit}
      className="group relative border rounded-lg overflow-hidden bg-background cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Thumbnail */}
      <div className="aspect-[16/9] bg-muted/40 relative overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewSrc}
          alt={template.name}
          className="w-full h-full object-contain"
          loading="lazy"
        />
        {template.isSystem && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
            <Lock className="h-2.5 w-2.5" />
            System
          </div>
        )}
      </div>

      {/* Meta */}
      <div className="p-2.5">
        <div className="text-xs font-medium truncate">{template.name}</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">
          {PLATFORM_LABELS[template.platform] ?? template.platform} &middot;{" "}
          {template.width}×{template.height}
        </div>
      </div>

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          title="Edit"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className="h-6 w-6 flex items-center justify-center rounded bg-background/95 shadow border hover:bg-background"
        >
          <Edit2 className="h-3 w-3" />
        </button>
        <button
          type="button"
          title="Duplicate"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          className="h-6 w-6 flex items-center justify-center rounded bg-background/95 shadow border hover:bg-background"
        >
          <Copy className="h-3 w-3" />
        </button>
        {!template.isSystem && (
          <button
            type="button"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="h-6 w-6 flex items-center justify-center rounded bg-background/95 shadow border hover:bg-destructive hover:text-destructive-foreground"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
