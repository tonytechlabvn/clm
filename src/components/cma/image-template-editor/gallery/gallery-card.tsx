"use client";
// Single template card in the gallery grid. Shows the rendered preview,
// the template name, its dimensions, a copyable template ID, and a "Copy
// URL" action that yields the Direct URL (with sample variable values
// pre-filled) so authors can paste it into og:image tags, Slack, etc.
//
// The thumbnail area uses the TEMPLATE's own aspect ratio (width / height)
// instead of a hardcoded 16:9 — otherwise square templates like the
// Instagram starter end up as pillarboxed strips with mostly blank bars.
//
// Hover exposes Edit / Duplicate / Copy-URL / Delete. Delete is hidden for
// system templates (server-side blocks it anyway).

import { useState } from "react";
import { Edit2, Copy, Trash2, Lock, Link as LinkIcon, Check } from "lucide-react";
import type { GalleryTemplate } from "./gallery-types";
import { PLATFORM_LABELS } from "./gallery-types";

interface Props {
  template: GalleryTemplate;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

// Build a Direct URL for preview + copy. Includes sample variable defaults
// from the declared variableSchema so empty `{{title}}` tokens don't cause
// the preview to render as an almost-empty background.
function buildDirectUrl(t: GalleryTemplate, origin = ""): string {
  const params = new URLSearchParams({ auth: t.authCode });
  const schema = Array.isArray(t.variableSchema) ? t.variableSchema : [];
  for (const v of schema as Array<{ name: string; defaultValue?: string }>) {
    if (v.defaultValue && v.defaultValue !== "") {
      params.set(v.name, v.defaultValue);
    }
  }
  return `${origin}/api/cma/image-templates/${t.id}/image?${params.toString()}`;
}

// Clamp aspect ratio so absurdly tall templates (e.g., Pinterest 1000×1500)
// don't consume vertical real estate in the grid; clamp to between 3:4 and
// 2:1 relative to width, giving a consistent row height.
function clampAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  const clamped = Math.max(0.75, Math.min(2, ratio));
  return `${clamped.toFixed(4)} / 1`;
}

export function GalleryCard({ template, onEdit, onDuplicate, onDelete }: Props) {
  const [copied, setCopied] = useState(false);

  // Absolute URL (origin-aware) for the Copy URL button; relative URL works
  // for the preview <img> since it's same-origin.
  const previewSrc = template.thumbnail ?? buildDirectUrl(template);
  const aspect = clampAspectRatio(template.width, template.height);

  const handleCopyUrl = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const absoluteUrl = buildDirectUrl(template, origin);
    try {
      await navigator.clipboard.writeText(absoluteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (insecure context) — fall back to prompt
      window.prompt("Copy this Direct URL:", absoluteUrl);
    }
  };

  const handleCopyId = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(template.id);
    } catch {
      window.prompt("Copy template id:", template.id);
    }
  };

  return (
    <div
      onClick={onEdit}
      className="group relative border rounded-lg overflow-hidden bg-background cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Thumbnail — uses the template's own aspect ratio, not a fixed 16:9 */}
      <div
        className="bg-muted/40 relative overflow-hidden"
        style={{ aspectRatio: aspect }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewSrc}
          alt={template.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {template.isSystem && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded z-10">
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
        {/* Template ID — click to copy, useful for referencing via Direct URL */}
        <button
          type="button"
          onClick={handleCopyId}
          title="Click to copy template id"
          className="mt-1 block text-[10px] font-mono text-muted-foreground hover:text-foreground truncate w-full text-left"
        >
          id: {template.id}
        </button>
      </div>

      {/* Hover actions */}
      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          type="button"
          title={copied ? "Copied!" : "Copy Direct URL"}
          onClick={handleCopyUrl}
          className="h-6 w-6 flex items-center justify-center rounded bg-background/95 shadow border hover:bg-background"
        >
          {copied ? (
            <Check className="h-3 w-3 text-green-600" />
          ) : (
            <LinkIcon className="h-3 w-3" />
          )}
        </button>
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
