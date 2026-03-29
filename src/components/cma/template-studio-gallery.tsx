// Template Studio gallery — grid with search, category/type filters, favorites, sort

"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, FileText, Plus } from "lucide-react";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { TemplateStudioCard, type TemplateCardData } from "./template-studio-card";

const CATEGORY_FILTERS = ["all", "tutorial", "news", "announce", "article", "other"];
const TYPE_FILTERS = ["all", "blocks", "html-slots"] as const;
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "most-used", label: "Most Used" },
  { value: "recent-used", label: "Recently Used" },
] as const;

interface TemplateStudioGalleryProps {
  onUseTemplate: (id: string) => void;
  onEditTemplate: (id: string) => void;
  onExtractNew: () => void;
}

export function TemplateStudioGallery({
  onUseTemplate,
  onEditTemplate,
  onExtractNew,
}: TemplateStudioGalleryProps) {
  const { org, userId } = useCmaOrg();
  const [templates, setTemplates] = useState<TemplateCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sort, setSort] = useState<string>("newest");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  useEffect(() => {
    if (!org?.id) return;
    fetch(`/api/cma/templates?orgId=${org.id}&userId=${userId || ""}`)
      .then((r) => r.json())
      .then((d) => setTemplates(d.templates || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [org?.id, userId]);

  // Client-side filtering and sorting
  const filtered = useMemo(() => {
    let result = templates;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          (t.description || "").toLowerCase().includes(q)
      );
    }
    if (category !== "all") result = result.filter((t) => t.category === category);
    if (typeFilter !== "all") result = result.filter((t) => t.templateType === typeFilter);
    if (favoritesOnly) result = result.filter((t) => t.isFavorite);

    // Sort
    if (sort === "most-used") result = [...result].sort((a, b) => b.usageCount - a.usageCount);
    else if (sort === "recent-used")
      result = [...result].sort(
        (a, b) =>
          new Date(b.lastUsedAt || 0).getTime() - new Date(a.lastUsedAt || 0).getTime()
      );

    return result;
  }, [templates, search, category, typeFilter, sort, favoritesOnly]);

  async function handleToggleFavorite(id: string) {
    if (!org?.id) return;
    // Optimistic update
    setTemplates((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t))
    );
    await fetch(`/api/cma/templates/${id}/favorite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orgId: org.id }),
    }).catch(() => {
      // Revert on error
      setTemplates((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t))
      );
    });
  }

  async function handleDelete(id: string) {
    if (!org?.id || !confirm("Delete this template?")) return;
    await fetch(`/api/cma/templates/${id}?orgId=${org.id}`, { method: "DELETE" });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  function handleDuplicate(id: string) {
    // TODO: Implement duplicate via API
    console.log("Duplicate template:", id);
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="border rounded-lg p-4 space-y-3">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search + Filters */}
      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8"
          />
        </div>

        {/* Category pills */}
        <div className="flex gap-1">
          {CATEGORY_FILTERS.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-2.5 py-1 text-xs rounded-full border transition-colors capitalize cursor-pointer ${
                category === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary filters */}
      <div className="flex gap-2 items-center text-xs">
        {TYPE_FILTERS.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-2 py-0.5 rounded border cursor-pointer ${
              typeFilter === t ? "bg-muted font-medium" : "text-muted-foreground"
            }`}
          >
            {t === "all" ? "All Types" : t === "blocks" ? "BlockNote" : "HTML Slots"}
          </button>
        ))}
        <span className="text-muted-foreground">·</span>
        <button
          onClick={() => setFavoritesOnly(!favoritesOnly)}
          className={`px-2 py-0.5 rounded border cursor-pointer ${
            favoritesOnly ? "bg-yellow-100 text-yellow-700 border-yellow-300" : "text-muted-foreground"
          }`}
        >
          Favorites
        </button>
        <span className="text-muted-foreground">·</span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-xs border rounded px-1.5 py-0.5 bg-background"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <span className="ml-auto text-muted-foreground">{filtered.length} templates</span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="mb-4">No templates found</p>
          <Button variant="outline" onClick={onExtractNew}>
            <Plus className="h-4 w-4 mr-1" /> Extract from URL
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => (
            <TemplateStudioCard
              key={t.id}
              template={t}
              onUse={onUseTemplate}
              onEdit={onEditTemplate}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
