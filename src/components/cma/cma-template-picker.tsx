"use client";

// CMA Template Picker — modal overlay for selecting a post template or starting blank

import { useEffect, useState } from "react";
import { useCmaGet } from "@/lib/cma/use-cma-api";
import { Loader2, X, FileText, LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CmaTemplate {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  blocks: unknown[];
  styleTheme: string;
  orgId: string | null;
}

interface TemplateSelection {
  blocks: unknown[];
  templateId: string;
  styleTheme: string;
}

interface CmaTemplatePickerProps {
  open: boolean;
  onClose: () => void;
  /** Called with template data, or null for blank post */
  onSelect: (selection: TemplateSelection | null) => void;
  orgId: string;
}

const CATEGORY_LABELS: Record<string, string> = {
  tutorial: "Tutorial",
  news: "News",
  announce: "Announcement",
};

const CATEGORY_COLORS: Record<string, string> = {
  tutorial: "bg-blue-100 text-blue-700",
  news: "bg-green-100 text-green-700",
  announce: "bg-purple-100 text-purple-700",
};

export function CmaTemplatePicker({ open, onClose, onSelect, orgId }: CmaTemplatePickerProps) {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const { data, loading, error } = useCmaGet<{ templates: CmaTemplate[] }>(
    open && orgId ? `/api/cma/templates?orgId=${orgId}` : null
  );

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  const templates = data?.templates ?? [];
  const categories = ["all", ...Array.from(new Set(templates.map((t) => t.category)))];
  const filtered = activeCategory === "all"
    ? templates
    : templates.filter((t) => t.category === activeCategory);

  function handleSelect(template: CmaTemplate) {
    onSelect({
      blocks: Array.isArray(template.blocks) ? template.blocks : [],
      templateId: template.id,
      styleTheme: template.styleTheme,
    });
  }

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative bg-background rounded-xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Choose a Template</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category filter */}
        {templates.length > 0 && (
          <div className="flex gap-2 px-6 py-3 border-b overflow-x-auto shrink-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat === "all" ? "All" : (CATEGORY_LABELS[cat] ?? cat)}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex items-center justify-center h-40">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
              Failed to load templates: {error}
            </div>
          )}

          {!loading && !error && (
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              {/* Blank option — always first */}
              <div className="group rounded-lg border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-3 p-6 min-h-[140px]">
                <FileText className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                <div className="text-center">
                  <p className="font-medium text-sm">Blank Post</p>
                  <p className="text-xs text-muted-foreground mt-1">Start from scratch</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => onSelect(null)}>
                  Use
                </Button>
              </div>

              {/* Template cards */}
              {filtered.map((template) => (
                <div
                  key={template.id}
                  className="group rounded-lg border hover:border-primary/50 hover:shadow-md transition-all flex flex-col gap-3 p-5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm leading-tight">{template.name}</p>
                    <span
                      className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
                        CATEGORY_COLORS[template.category] ?? "bg-muted text-muted-foreground"
                      }`}
                    >
                      {CATEGORY_LABELS[template.category] ?? template.category}
                    </span>
                  </div>
                  {template.description && (
                    <p className="text-xs text-muted-foreground line-clamp-3 flex-1">
                      {template.description}
                    </p>
                  )}
                  <Button size="sm" variant="outline" className="w-full mt-auto" onClick={() => handleSelect(template)}>
                    Use Template
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
