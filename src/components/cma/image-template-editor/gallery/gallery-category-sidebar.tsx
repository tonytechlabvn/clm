"use client";
// Left-side category list for the gallery. Shows every platform with a
// non-zero count plus "All", and highlights the current selection. Counts
// are computed in the parent so the sidebar stays presentation-only.

import { PLATFORM_LABELS } from "./gallery-types";

interface Props {
  counts: Record<string, number>;
  selected: string;
  onSelect: (platform: string) => void;
}

// Deterministic display order — categories a user rarely uses sink to the
// bottom. "all" is always first; platforms without templates stay hidden.
const PLATFORM_ORDER = [
  "all",
  "facebook",
  "instagram",
  "linkedin",
  "twitter",
  "pinterest",
  "og-image",
  "blog-header",
  "generic",
];

export function GalleryCategorySidebar({ counts, selected, onSelect }: Props) {
  const entries = PLATFORM_ORDER.filter((p) => p === "all" || (counts[p] ?? 0) > 0);

  return (
    <aside className="w-48 shrink-0 border-r bg-background p-3 space-y-0.5">
      <h3 className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 px-2">
        Categories
      </h3>
      {entries.map((platform) => {
        const label = PLATFORM_LABELS[platform] ?? platform;
        const count = counts[platform] ?? 0;
        const active = selected === platform;
        return (
          <button
            key={platform}
            type="button"
            onClick={() => onSelect(platform)}
            className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors ${
              active
                ? "bg-primary/10 text-foreground font-medium"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <span>{label}</span>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {count}
            </span>
          </button>
        );
      })}
    </aside>
  );
}
