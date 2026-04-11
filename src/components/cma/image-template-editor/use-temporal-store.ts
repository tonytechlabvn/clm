"use client";
// React-reactive wrapper around the zundo temporal store.
// zundo exposes `useEditorStore.temporal` as a plain zustand store — plugging
// it through useSyncExternalStore lets components re-render when past/future
// stacks change, so undo/redo buttons can show the right disabled state.

import { useSyncExternalStore } from "react";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";

interface TemporalView {
  undo: () => void;
  redo: () => void;
  clear: () => void;
  pastCount: number;
  futureCount: number;
}

export function useTemporalStore(): TemporalView {
  const { pastStates, futureStates, undo, redo, clear } = useSyncExternalStore(
    useEditorStore.temporal.subscribe,
    useEditorStore.temporal.getState,
    useEditorStore.temporal.getState
  );

  return {
    undo,
    redo,
    clear,
    pastCount: pastStates.length,
    futureCount: futureStates.length,
  };
}
