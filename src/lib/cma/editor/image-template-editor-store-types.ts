// Types for the visual editor store. Split from the main store file so
// default-state module can import EditorMeta without pulling zustand into
// modules that don't need it (avoids circular imports).

import type { Layer } from "@/lib/cma/types/image-template-layer-types";
import type { VariableDefinition } from "@/lib/cma/types/image-template-types";

export interface EditorMeta {
  id: string | null; // null = new template; set to templateId when editing existing
  name: string;
  platform: string; // one of IMAGE_TEMPLATE_PLATFORMS
  isSystem: boolean; // system templates can be forked but not edited in place
  width: number;
  height: number;
  backgroundColor: string;
  // APITemplate.io-style Direct URL auth token. Null for unsaved drafts — the
  // server assigns one on first save. The editor reads this to preview the
  // public Direct URL in the Direct URL panel.
  authCode: string | null;
}

// Shape accepted by store.loadTemplate() — decoupled from API response type so
// the store doesn't depend on Prisma's generated types.
// `authCode` is optional here (the store reducer normalizes missing → null)
// so older test fixtures and the blank-template factory stay backward-compatible.
export interface LoadPayload extends Omit<EditorMeta, "authCode"> {
  authCode?: string | null;
  layers: Layer[];
  variables: VariableDefinition[];
}

export interface EditorState {
  meta: EditorMeta;
  layers: Layer[];
  variables: VariableDefinition[];
  selectedLayerId: string | null;
  zoom: number; // clamped to [ZOOM_MIN, ZOOM_MAX]
  isDirty: boolean;
  // Phase-11: when true, text/image/rect tokens render substituted with
  // variable defaults; when false, raw `{{name}}` tokens appear on canvas
  // so authors can see which slots they've wired up.
  previewMode: boolean;

  // meta
  setMeta: (patch: Partial<EditorMeta>) => void;
  loadTemplate: (payload: LoadPayload) => void;
  reset: () => void;
  setPreviewMode: (next: boolean) => void;

  // layers
  addLayer: (layer: Layer) => void;
  updateLayer: (id: string, patch: Partial<Layer>) => void;
  deleteLayer: (id: string) => void;
  reorderLayer: (id: string, newZIndex: number) => void;
  duplicateLayer: (id: string) => void;

  // selection
  selectLayer: (id: string | null) => void;

  // variables
  addVariable: (v: VariableDefinition) => void;
  updateVariable: (name: string, patch: Partial<VariableDefinition>) => void;
  deleteVariable: (name: string) => void;

  // zoom
  setZoom: (z: number) => void;
  fitToScreen: (containerWidth: number, containerHeight: number) => void;
}

export const ZOOM_MIN = 0.25;
export const ZOOM_MAX = 2;
export const ZOOM_DEFAULT = 1;
export const UNDO_LIMIT = 50;
