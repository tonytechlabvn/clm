"use client";
// Keyboard shortcuts for the visual editor. Keeps undo/redo wired to the zundo
// temporal middleware so the store stays the single source of truth for history.
// Delete / Ctrl+D / arrow-nudging live in phase-09 (they need selected-layer access).

import { useEffect } from "react";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";

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

export function useEditorShortcuts(): void {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Never hijack shortcuts while the user is typing in a form field.
      if (isEditableTarget(e.target)) return;

      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;

      // Ctrl+Z (no shift) → undo
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        useEditorStore.temporal.getState().undo();
        return;
      }
      // Ctrl+Y or Ctrl+Shift+Z → redo
      if (
        e.key.toLowerCase() === "y" ||
        (e.key.toLowerCase() === "z" && e.shiftKey)
      ) {
        e.preventDefault();
        useEditorStore.temporal.getState().redo();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
