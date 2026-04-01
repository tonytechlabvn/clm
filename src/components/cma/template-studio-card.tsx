// Template card component — shows template preview, metadata, and actions

"use client";

import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, Copy, Trash2, MoreHorizontal } from "lucide-react";
import { TemplateHtmlPreview } from "./template-html-preview";

export interface TemplateCardData {
  id: string;
  name: string;
  description: string | null;
  category: string;
  templateType: string;
  orgId: string | null;
  usageCount: number;
  lastUsedAt: string | null;
  isFavorite: boolean;
  htmlTemplate?: string | null;
  cssScoped?: string | null;
}

interface TemplateStudioCardProps {
  template: TemplateCardData;
  onUse: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onToggleFavorite: (id: string) => void;
}

export function TemplateStudioCard({
  template,
  onUse,
  onEdit,
  onDelete,
  onDuplicate,
  onToggleFavorite,
}: TemplateStudioCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isSystem = !template.orgId;

  // Close dropdown on outside click
  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showMenu]);
  const isHtmlSlots = template.templateType === "html-slots";

  const lastUsed = template.lastUsedAt
    ? new Date(template.lastUsedAt).toLocaleDateString()
    : null;

  return (
    <div className="border rounded-lg hover:shadow-md transition-shadow group">
      {/* Preview area */}
      <div className="h-36 bg-muted/30 overflow-hidden relative rounded-t-lg">
        {isHtmlSlots && template.htmlTemplate ? (
          <TemplateHtmlPreview
            htmlTemplate={template.htmlTemplate}
            cssScoped={template.cssScoped || ""}
            scopeClass={`tpl-${template.id.slice(0, 8)}`}
            scale={0.3}
            className="h-full"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            BlockNote Template
          </div>
        )}

        {/* Favorite star */}
        <button
          onClick={() => onToggleFavorite(template.id)}
          aria-label={template.isFavorite ? "Remove from favorites" : "Add to favorites"}
          className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background transition-colors cursor-pointer"
        >
          <Star
            className={`h-4 w-4 ${template.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"}`}
          />
        </button>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-medium text-sm line-clamp-1">{template.name}</h3>
          <div className="flex gap-1 shrink-0">
            <Badge variant="secondary" className="text-[10px] capitalize">
              {template.category}
            </Badge>
            <Badge variant={isHtmlSlots ? "default" : "outline"} className="text-[10px]">
              {isHtmlSlots ? "HTML" : "Blocks"}
            </Badge>
          </div>
        </div>

        {template.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{template.description}</p>
        )}

        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>
            {isSystem ? "System" : "Custom"} · Used {template.usageCount}x{lastUsed ? ` · ${lastUsed}` : ""}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 pt-1">
          <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => onUse(template.id)}>
            Use
          </Button>
          {!isSystem && (
            <Button size="sm" variant="ghost" className="text-xs" onClick={() => onEdit(template.id)}>
              Edit
            </Button>
          )}
          <div className="relative" ref={menuRef}>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 w-7 p-0"
              aria-label="More options"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
            {showMenu && (
              <div className="absolute right-0 bottom-8 z-10 bg-popover border rounded-md shadow-md py-1 min-w-[120px]">
                <button
                  className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted flex items-center gap-2 cursor-pointer"
                  onClick={() => { onDuplicate(template.id); setShowMenu(false); }}
                >
                  <Copy className="h-3 w-3" /> Duplicate
                </button>
                {!isSystem && (
                  <button
                    className="w-full px-3 py-1.5 text-xs text-left hover:bg-muted flex items-center gap-2 text-destructive cursor-pointer"
                    onClick={() => { onDelete(template.id); setShowMenu(false); }}
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
