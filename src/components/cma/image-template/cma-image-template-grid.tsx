"use client";

// Image template browser grid — displays system + org templates with platform filter

import { Loader2, ImageIcon } from "lucide-react";
import { useCmaGet } from "@/lib/cma/use-cma-api";
import type { CmaImageTemplate } from "@prisma/client";

interface Props {
  orgId: string;
  platform: string;
  selectedId: string | null;
  onSelect: (template: CmaImageTemplate) => void;
}

export function CmaImageTemplateGrid({ orgId, platform, selectedId, onSelect }: Props) {
  const platformParam = platform && platform !== "all" ? `&platform=${platform}` : "";
  const { data, loading, error } = useCmaGet<{ data: CmaImageTemplate[] }>(
    `/api/cma/image-templates?orgId=${orgId}${platformParam}`
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-destructive py-4">{error}</p>;
  }

  const templates = data?.data ?? [];

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No templates available</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {templates.map((tpl) => (
        <button
          key={tpl.id}
          onClick={() => onSelect(tpl)}
          className={`text-left rounded-lg border-2 p-3 transition-all hover:shadow-md ${
            selectedId === tpl.id
              ? "border-primary bg-primary/5 shadow-sm"
              : "border-transparent bg-muted/50 hover:border-muted-foreground/20"
          }`}
        >
          {/* Thumbnail placeholder — aspect ratio matches FB 1200×630 */}
          <div className="aspect-[1200/630] bg-muted rounded-md mb-2 flex items-center justify-center overflow-hidden">
            {tpl.thumbnail ? (
              <img src={tpl.thumbnail} alt={tpl.name} className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
            )}
          </div>
          <p className="text-sm font-medium truncate">{tpl.name}</p>
          <p className="text-xs text-muted-foreground">
            {tpl.platform} · {tpl.width}×{tpl.height}
          </p>
        </button>
      ))}
    </div>
  );
}
