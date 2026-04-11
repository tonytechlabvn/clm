"use client";
// Responsive grid of gallery cards. Empty state when filters yield nothing.

import type { GalleryTemplate } from "./gallery-types";
import { GalleryCard } from "./gallery-card";

interface Props {
  templates: GalleryTemplate[];
  onEdit: (template: GalleryTemplate) => void;
  onDuplicate: (template: GalleryTemplate) => void;
  onDelete: (template: GalleryTemplate) => void;
}

export function GalleryGrid({ templates, onEdit, onDuplicate, onDelete }: Props) {
  if (templates.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground p-8">
        No templates match the current filter.
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {templates.map((t) => (
          <GalleryCard
            key={t.id}
            template={t}
            onEdit={() => onEdit(t)}
            onDuplicate={() => onDuplicate(t)}
            onDelete={() => onDelete(t)}
          />
        ))}
      </div>
    </div>
  );
}
