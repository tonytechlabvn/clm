"use client";
// Top-level image template gallery. Fetches the list for the current org,
// filters by category + search, and wires Edit/Duplicate/Delete actions
// into the page-level navigation callbacks.

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { GalleryCategorySidebar } from "./gallery-category-sidebar";
import { GalleryGrid } from "./gallery-grid";
import type { GalleryTemplate } from "./gallery-types";

interface Props {
  onNewTemplate: () => void;
  onEditTemplate: (templateId: string) => void;
}

export function ImageTemplateGallery({ onNewTemplate, onEditTemplate }: Props) {
  const { org } = useCmaOrg();
  const [templates, setTemplates] = useState<GalleryTemplate[]>([]);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!org?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cma/image-templates?orgId=${org.id}`);
      if (!res.ok) throw new Error(`Failed to load templates (${res.status})`);
      const { data } = (await res.json()) as { data: GalleryTemplate[] };
      setTemplates(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [org?.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase();
    return templates.filter((t) => {
      if (category !== "all" && t.platform !== category) return false;
      if (needle && !t.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [templates, category, search]);

  const counts = useMemo(() => {
    const map: Record<string, number> = { all: templates.length };
    for (const t of templates) {
      map[t.platform] = (map[t.platform] ?? 0) + 1;
    }
    return map;
  }, [templates]);

  const handleDuplicate = useCallback(
    async (template: GalleryTemplate) => {
      if (!org?.id) return;
      const res = await fetch("/api/cma/image-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: org.id,
          name: `${template.name} (Copy)`,
          description: template.description ?? undefined,
          platform: template.platform,
          width: template.width,
          height: template.height,
          htmlContent: "<!-- placeholder — regenerated on next save -->",
          layerData: template.layerData,
          variableSchema: template.variableSchema,
        }),
      });
      if (res.ok) {
        const { data } = await res.json();
        onEditTemplate(data.id);
      }
    },
    [org?.id, onEditTemplate]
  );

  const handleDelete = useCallback(
    async (template: GalleryTemplate) => {
      if (!org?.id) return;
      if (!window.confirm(`Delete "${template.name}"? This can't be undone.`)) {
        return;
      }
      const res = await fetch(
        `/api/cma/image-templates/${template.id}?orgId=${org.id}`,
        { method: "DELETE" }
      );
      if (res.ok) refresh();
    },
    [org?.id, refresh]
  );

  return (
    <div className="p-4 space-y-4 max-w-7xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/cma">
          <button
            aria-label="Back"
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">Image Studio</h1>
          <p className="text-sm text-muted-foreground">
            Design branded social media graphics with the visual editor.
          </p>
        </div>
        <Button onClick={onNewTemplate} size="sm">
          <Plus className="h-4 w-4 mr-1.5" />
          New template
        </Button>
      </div>

      <div className="flex border rounded-lg overflow-hidden h-[calc(100vh-200px)] min-h-[500px] bg-background">
        <GalleryCategorySidebar
          counts={counts}
          selected={category}
          onSelect={setCategory}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <div className="p-3 border-b">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates…"
              className="w-full max-w-md text-sm border rounded px-3 py-1.5 bg-background"
            />
          </div>
          {error && (
            <div className="p-3 text-xs text-destructive">{error}</div>
          )}
          {loading && templates.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
              Loading templates…
            </div>
          ) : (
            <GalleryGrid
              templates={filtered}
              onEdit={(t) => onEditTemplate(t.id)}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          )}
        </div>
      </div>
    </div>
  );
}
