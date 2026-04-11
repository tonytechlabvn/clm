"use client";
// Top bar for the visual template editor. Contains the template-name input,
// undo/redo buttons (wired to zundo temporal store), zoom controls, preview
// toggle, and Save/Cancel buttons. Save compiles the layer tree to HTML and
// POSTs/PUTs the template via editor-save-handler.

import { useCallback } from "react";
import {
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Save,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import { useTemporalStore } from "./use-temporal-store";
import { useEditorSave } from "./use-editor-save";

interface Props {
  onCancel?: () => void;
  onSaved?: (templateId: string) => void;
}

export function EditorTopBar({ onCancel, onSaved }: Props) {
  const name = useEditorStore((s) => s.meta.name);
  const setMeta = useEditorStore((s) => s.setMeta);
  const zoom = useEditorStore((s) => s.zoom);
  const setZoom = useEditorStore((s) => s.setZoom);
  const isDirty = useEditorStore((s) => s.isDirty);
  const isSystem = useEditorStore((s) => s.meta.isSystem);
  const previewMode = useEditorStore((s) => s.previewMode);
  const setPreviewMode = useEditorStore((s) => s.setPreviewMode);

  const { undo, redo, pastCount, futureCount } = useTemporalStore();
  const { save: handleSave, saving, error: saveError } = useEditorSave({
    onSaved,
  });

  const handleZoomIn = useCallback(() => setZoom(zoom + 0.1), [zoom, setZoom]);
  const handleZoomOut = useCallback(() => setZoom(zoom - 0.1), [zoom, setZoom]);
  const handleZoomReset = useCallback(() => setZoom(1), [setZoom]);

  return (
    <div className="flex items-center gap-2 border-b bg-background px-3 py-2 h-12 shrink-0">
      {/* Cancel */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        title="Close editor"
        className="shrink-0"
      >
        <X className="h-4 w-4" />
      </Button>

      {/* Template name (inline edit) */}
      <div className="flex-1 min-w-0 max-w-xs">
        <Input
          value={name}
          onChange={(e) => setMeta({ name: e.target.value })}
          placeholder="Template name"
          maxLength={100}
          className="h-8"
          disabled={isSystem}
        />
      </div>

      {isSystem && (
        <span className="text-xs text-muted-foreground italic">
          System template — fork to edit
        </span>
      )}

      <div className="mx-2 h-6 w-px bg-border" />

      {/* Undo / Redo */}
      <Button
        variant="ghost"
        size="sm"
        onClick={undo}
        disabled={pastCount === 0}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={redo}
        disabled={futureCount === 0}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 className="h-4 w-4" />
      </Button>

      <div className="mx-2 h-6 w-px bg-border" />

      {/* Zoom controls */}
      <Button variant="ghost" size="sm" onClick={handleZoomOut} title="Zoom out">
        <ZoomOut className="h-4 w-4" />
      </Button>
      <span className="text-xs tabular-nums w-12 text-center text-muted-foreground">
        {Math.round(zoom * 100)}%
      </span>
      <Button variant="ghost" size="sm" onClick={handleZoomIn} title="Zoom in">
        <ZoomIn className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleZoomReset}
        title="Reset zoom to 100%"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled
        title="Fit to screen (phase-09)"
      >
        <Maximize2 className="h-4 w-4" />
      </Button>

      <div className="mx-2 h-6 w-px bg-border" />

      {/* Preview mode toggle — swaps canvas token substitution */}
      <Button
        variant={previewMode ? "default" : "ghost"}
        size="sm"
        onClick={() => setPreviewMode(!previewMode)}
        title={previewMode ? "Preview on — click to show raw tokens" : "Preview off — click to substitute variables"}
      >
        {previewMode ? (
          <Eye className="h-4 w-4 mr-1.5" />
        ) : (
          <EyeOff className="h-4 w-4 mr-1.5" />
        )}
        <span className="text-xs">Preview</span>
      </Button>

      <div className="ml-auto" />

      {saveError && (
        <span
          className="text-[11px] text-destructive max-w-[200px] truncate"
          title={saveError}
        >
          {saveError}
        </span>
      )}

      {/* Save */}
      <Button
        size="sm"
        onClick={handleSave}
        disabled={(!isDirty && useEditorStore.getState().meta.id !== null) || isSystem || saving}
        title={
          isSystem
            ? "System template — fork first (phase-13)"
            : saving
            ? "Saving…"
            : "Save template"
        }
      >
        <Save className="h-4 w-4 mr-1.5" />
        {saving ? "Saving…" : "Save"}
      </Button>
    </div>
  );
}
