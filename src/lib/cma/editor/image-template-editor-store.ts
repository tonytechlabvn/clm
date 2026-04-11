"use client";
// Zustand + zundo store for the visual image template editor.
// Partialized temporal middleware tracks only meta/layers/variables in history
// so ephemeral UI state (zoom, selection, dirty flag) never pollutes undo stack.
// All mutating actions set isDirty=true so the top bar can gate the Save button.

import { create } from "zustand";
import { shallow } from "zustand/shallow";
import { temporal } from "zundo";
import { nanoid } from "nanoid";
import type { Layer } from "@/lib/cma/types/image-template-layer-types";
import {
  DEFAULT_META,
  DEFAULT_LAYERS,
  DEFAULT_VARIABLES,
} from "./image-template-editor-defaults";
import {
  type EditorState,
  ZOOM_MIN,
  ZOOM_MAX,
  ZOOM_DEFAULT,
  UNDO_LIMIT,
} from "./image-template-editor-store-types";

const clampZoom = (z: number) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, z));

export const useEditorStore = create<EditorState>()(
  temporal(
    (set, get) => ({
      meta: { ...DEFAULT_META },
      layers: DEFAULT_LAYERS,
      variables: DEFAULT_VARIABLES,
      selectedLayerId: null,
      zoom: ZOOM_DEFAULT,
      isDirty: false,

      // ── meta ────────────────────────────────────────────────────────
      setMeta: (patch) =>
        set((s) => ({ meta: { ...s.meta, ...patch }, isDirty: true })),

      loadTemplate: (p) =>
        set(() => ({
          meta: {
            id: p.id,
            name: p.name,
            platform: p.platform,
            isSystem: p.isSystem,
            width: p.width,
            height: p.height,
            backgroundColor: p.backgroundColor,
          },
          layers: p.layers,
          variables: p.variables,
          selectedLayerId: null,
          zoom: ZOOM_DEFAULT,
          isDirty: false,
        })),

      reset: () =>
        set(() => ({
          meta: { ...DEFAULT_META },
          layers: [],
          variables: [],
          selectedLayerId: null,
          zoom: ZOOM_DEFAULT,
          isDirty: false,
        })),

      // ── layers ──────────────────────────────────────────────────────
      addLayer: (layer) =>
        set((s) => ({
          layers: [...s.layers, layer],
          selectedLayerId: layer.id,
          isDirty: true,
        })),

      updateLayer: (id, patch) =>
        set((s) => ({
          layers: s.layers.map((l) =>
            l.id === id ? ({ ...l, ...patch } as Layer) : l
          ),
          isDirty: true,
        })),

      deleteLayer: (id) =>
        set((s) => ({
          layers: s.layers.filter((l) => l.id !== id),
          selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId,
          isDirty: true,
        })),

      reorderLayer: (id, newZIndex) =>
        set((s) => ({
          layers: s.layers.map((l) =>
            l.id === id ? { ...l, zIndex: newZIndex } : l
          ),
          isDirty: true,
        })),

      duplicateLayer: (id) => {
        const src = get().layers.find((l) => l.id === id);
        if (!src) return;
        // Offset the copy slightly so users can see it landed and not cover the original
        const copy = { ...src, id: nanoid(), x: src.x + 20, y: src.y + 20 } as Layer;
        set((s) => ({
          layers: [...s.layers, copy],
          selectedLayerId: copy.id,
          isDirty: true,
        }));
      },

      // ── selection ───────────────────────────────────────────────────
      selectLayer: (id) => set(() => ({ selectedLayerId: id })),

      // ── variables ───────────────────────────────────────────────────
      addVariable: (v) =>
        set((s) => ({ variables: [...s.variables, v], isDirty: true })),

      updateVariable: (name, patch) =>
        set((s) => ({
          variables: s.variables.map((v) =>
            v.name === name ? { ...v, ...patch } : v
          ),
          isDirty: true,
        })),

      deleteVariable: (name) =>
        set((s) => ({
          variables: s.variables.filter((v) => v.name !== name),
          isDirty: true,
        })),

      // ── zoom ────────────────────────────────────────────────────────
      setZoom: (z) => set(() => ({ zoom: clampZoom(z) })),

      fitToScreen: (cw, ch) => {
        const { width, height } = get().meta;
        if (width <= 0 || height <= 0) return;
        // 0.9 leaves breathing room around the canvas in the scroll viewport
        const z = Math.min(cw / width, ch / height) * 0.9;
        set(() => ({ zoom: clampZoom(z) }));
      },
    }),
    {
      limit: UNDO_LIMIT,
      // Ephemeral UI state (zoom, selection, dirty flag) must NOT be tracked —
      // undoing a zoom change would surprise users and defeat the purpose of the
      // history stack. Only layers/variables/meta are user-facing content.
      partialize: (s) => ({
        meta: s.meta,
        layers: s.layers,
        variables: s.variables,
      }),
      // partialize alone filters what's stored but does NOT prevent zundo from
      // pushing same-content snapshots. setZoom/selectLayer produce a new top-level
      // state object while leaving meta/layers/variables refs untouched — shallow
      // equality at the partialized level correctly detects "nothing changed" and
      // skips the push so the undo stack only contains real content edits.
      equality: (a, b) => shallow(a, b),
    }
  )
);
