"use client";
// Simplified 2-step "New template" wizard:
//   1. Pick a starter (system template) OR "Start blank"
//   2. Editor opens with that starter's layerData pre-loaded, ready to fork
//      on first save (fork flow is server-side — POSTing a new template with
//      isSystem:false lands as an org-owned copy).
//
// Starter picker doubles as a category filter via the same sidebar the
// gallery uses so users don't have to learn a second layout.

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GalleryTemplate } from "./gallery-types";
import { GalleryCategorySidebar } from "./gallery-category-sidebar";
import { GalleryGrid } from "./gallery-grid";

interface Props {
  templates: GalleryTemplate[];
  onClose: () => void;
  // Called when the user picks a starter — passes the templateId so the
  // parent can navigate to `?mode=new&starter={id}` and the editor loads
  // layerData from that template. If starterId is null the user chose
  // "Start blank" and the editor opens with a default empty canvas.
  onPickStarter: (starterId: string | null) => void;
}

export function NewTemplateWizard({ templates, onClose, onPickStarter }: Props) {
  const [category, setCategory] = useState("all");

  const systemStarters = useMemo(
    () => templates.filter((t) => t.isSystem),
    [templates]
  );

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: systemStarters.length };
    for (const t of systemStarters) map[t.platform] = (map[t.platform] ?? 0) + 1;
    return map;
  }, [systemStarters]);

  const filtered = useMemo(() => {
    if (category === "all") return systemStarters;
    return systemStarters.filter((t) => t.platform === category);
  }, [systemStarters, category]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-6">
      <div className="bg-background border rounded-lg shadow-xl max-w-5xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-lg font-semibold">New template</h2>
            <p className="text-xs text-muted-foreground">
              Pick a starter to fork, or start from a blank canvas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close wizard"
            className="h-8 w-8 flex items-center justify-center rounded hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body — category sidebar + starter grid */}
        <div className="flex-1 flex min-h-0">
          <GalleryCategorySidebar
            counts={counts}
            selected={category}
            onSelect={setCategory}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <GalleryGrid
              templates={filtered}
              onEdit={(t) => onPickStarter(t.id)}
              onDuplicate={(t) => onPickStarter(t.id)}
              onDelete={() => {
                /* no-op: system templates can't be deleted from the wizard */
              }}
            />
          </div>
        </div>

        {/* Footer — always offer "Start blank" */}
        <div className="border-t p-3 flex justify-between items-center">
          <span className="text-[11px] text-muted-foreground">
            Selecting a starter creates an org-owned copy you can edit freely.
          </span>
          <Button variant="outline" size="sm" onClick={() => onPickStarter(null)}>
            Start blank
          </Button>
        </div>
      </div>
    </div>
  );
}
