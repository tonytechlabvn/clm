// Default state and blank-template factory for the visual image template editor.
// Kept in its own module so both the store (for reset) and page loader (for
// new-template mode) can reach the same source of truth without circular deps.

import type { Layer } from "@/lib/cma/types/image-template-layer-types";
import type { VariableDefinition } from "@/lib/cma/types/image-template-types";
import type { EditorMeta, LoadPayload } from "./image-template-editor-store-types";

export const DEFAULT_META: EditorMeta = {
  id: null,
  name: "Untitled template",
  platform: "generic",
  isSystem: false,
  width: 1200,
  height: 630,
  backgroundColor: "#ffffff",
  authCode: null,
};

export const DEFAULT_LAYERS: Layer[] = [];
export const DEFAULT_VARIABLES: VariableDefinition[] = [];

// Build a blank LoadPayload for "new template" mode. Optional platform/width/height
// overrides let the gallery wizard seed a new doc pre-sized for a given social
// preset (e.g. 1080x1080 for Instagram).
export function createBlankTemplatePayload(
  overrides: Partial<EditorMeta> = {}
): LoadPayload {
  return {
    id: null,
    name: overrides.name ?? DEFAULT_META.name,
    platform: overrides.platform ?? DEFAULT_META.platform,
    isSystem: false,
    width: overrides.width ?? DEFAULT_META.width,
    height: overrides.height ?? DEFAULT_META.height,
    backgroundColor: overrides.backgroundColor ?? DEFAULT_META.backgroundColor,
    authCode: overrides.authCode ?? null,
    layers: [],
    variables: [],
  };
}
