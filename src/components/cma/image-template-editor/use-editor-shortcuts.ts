"use client";
// Keyboard shortcuts for the visual editor. Phase-08 wired undo/redo; phase-09
// adds selection-dependent shortcuts: Delete/Backspace removes the selected
// layer, Ctrl+D duplicates it, and arrow keys nudge 1px (Shift = 10px).
//
// The editable-target guard is critical: without it, typing in the template
// name input or a future properties field would trigger delete/nudge.

import { useEffect } from "react";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import type { Layer } from "@/lib/cma/types/image-template-layer-types";

function isEditableTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    el.isContentEditable
  );
}

type ArrowAxis = { key: keyof Pick<Layer, "x" | "y">; delta: number };

function arrowFromKey(key: string, step: number): ArrowAxis | null {
  if (key === "ArrowUp") return { key: "y", delta: -step };
  if (key === "ArrowDown") return { key: "y", delta: step };
  if (key === "ArrowLeft") return { key: "x", delta: -step };
  if (key === "ArrowRight") return { key: "x", delta: step };
  return null;
}

export function useEditorShortcuts(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const mod = e.ctrlKey || e.metaKey;
      const store = useEditorStore.getState();
      const selectedId = store.selectedLayerId;

      // ── Undo / Redo (phase-08) ──────────────────────────────────────
      if (mod && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.temporal.getState().undo();
        return;
      }
      if (
        mod &&
        (e.key.toLowerCase() === "y" ||
          (e.key.toLowerCase() === "z" && e.shiftKey))
      ) {
        e.preventDefault();
        useEditorStore.temporal.getState().redo();
        return;
      }

      // ── Duplicate selected layer (Ctrl+D) ────────────────────────────
      // Always preventDefault so the browser never opens "Add bookmark",
      // even when nothing is selected. Duplicate only runs with a selection.
      if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        if (selectedId) store.duplicateLayer(selectedId);
        return;
      }

      // From here on, shortcuts need a selected layer.
      if (!selectedId) return;

      // ── Delete selected layer ───────────────────────────────────────
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        store.deleteLayer(selectedId);
        return;
      }

      // ── Arrow-key nudge (1px / 10px with Shift) ─────────────────────
      const arrow = arrowFromKey(e.key, e.shiftKey ? 10 : 1);
      if (arrow) {
        const layer = store.layers.find((l) => l.id === selectedId);
        if (!layer || layer.locked) return;
        e.preventDefault();
        store.updateLayer(selectedId, {
          [arrow.key]: layer[arrow.key] + arrow.delta,
        });
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
