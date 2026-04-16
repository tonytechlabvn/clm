// Pure helpers to analyze variable usage across an editor's layer tree.
// Used by:
//   - Phase-11 variables panel: surface undeclared tokens as warnings
//   - Phase-12 save flow: block saves until all used tokens are declared
//   - Phase-14 tests: token extraction regression coverage
//
// Keep these pure — no store access, no React — so they can be called from
// both client and server (save-time validation) without duplication.

import type { Layer } from "@/lib/cma/types/image-template-layer-types";
import { DYNAMIC_FIELD_PROPERTY } from "@/lib/cma/types/image-template-layer-types";
import type { VariableDefinition } from "@/lib/cma/types/image-template-types";

const TOKEN_RE = /\{\{\s*(\w+)\s*\}\}/g;

// Collect every unique variable name referenced across all layers' user-text
// fields. Text layers contribute `text`; image layers contribute `src`; rect
// layers contribute `fillColor`. Returned array order is insertion order
// (deterministic — Sets preserve it for identical inputs).
export function extractUsedVariableNames(layers: Layer[]): string[] {
  const names = new Set<string>();

  const scan = (raw: string | undefined) => {
    if (!raw) return;
    const matches = Array.from(raw.matchAll(TOKEN_RE));
    for (const m of matches) names.add(m[1]);
  };

  for (const l of layers) {
    if (l.type === "text") scan(l.text);
    if (l.type === "image") scan(l.src);
    if (l.type === "rect") scan(l.fillColor);
  }

  return Array.from(names);
}

// Diff declared variables against used tokens. `missing` are tokens referenced
// by layers but not declared in the variables array (block saves until fixed).
// `unused` are declared variables no layer references (warn but allow save —
// may be declarations in progress).
export interface VariableUsageDiff {
  missing: string[];
  unused: string[];
}

export function diffDeclaredVsUsed(
  declared: VariableDefinition[],
  used: string[]
): VariableUsageDiff {
  const declaredNames = new Set(declared.map((v) => v.name));
  const usedSet = new Set(used);
  return {
    missing: used.filter((n) => !declaredNames.has(n)),
    unused: declared
      .filter((v) => !usedSet.has(v.name))
      .map((v) => v.name),
  };
}

// ── Dynamic-field variable derivation ────────────────────────────────
// Every dynamic layer contributes one entry to `variableSchema` keyed by
// `fieldName.<prop>` (e.g. `date.text`). The Direct URL route accepts that
// exact name so the flat `variableSchemaValidator` check still passes — we
// never need a nested-object schema variant.
//
// Type is inferred from the layer type (text→text, image→image, rect→color)
// so SSRF + color-hex validation in the renderer still fires.

const LAYER_TYPE_TO_VAR_TYPE = {
  text: "text",
  image: "image",
  rect: "color",
} as const satisfies Record<Layer["type"], VariableDefinition["type"]>;

export interface DynamicFieldEntry {
  layerId: string;
  fieldName: string;
  property: string; // from DYNAMIC_FIELD_PROPERTY
  fullName: string; // `${fieldName}.${property}`
  varType: VariableDefinition["type"];
  defaultValue: string; // literal content the layer had before it became dynamic
}

// Collect one entry per layer that has both `dynamic: true` and `fieldName`.
// Skips incomplete layers (dynamic but no name) — those are surfaced as
// validation errors in the editor, not silently dropped.
export function collectDynamicFields(layers: Layer[]): DynamicFieldEntry[] {
  const out: DynamicFieldEntry[] = [];
  for (const l of layers) {
    if (!l.dynamic || !l.fieldName) continue;
    const property = DYNAMIC_FIELD_PROPERTY[l.type];
    const defaultValue =
      l.type === "text" ? l.text : l.type === "image" ? l.src : l.fillColor;
    out.push({
      layerId: l.id,
      fieldName: l.fieldName,
      property,
      fullName: `${l.fieldName}.${property}`,
      varType: LAYER_TYPE_TO_VAR_TYPE[l.type],
      defaultValue,
    });
  }
  return out;
}

// Merge auto-derived dynamic fields into the user-declared variable list.
// Dynamic-field entries take precedence when a name collision happens —
// they're the source of truth for layer-bound variables. User-declared
// variables that aren't layer-bound (free-form `{{myVar}}` inside a static
// text layer) pass through untouched so we stay backward-compatible.
export function mergeDynamicFieldsIntoVariables(
  declared: VariableDefinition[],
  layers: Layer[]
): VariableDefinition[] {
  const dynamicFields = collectDynamicFields(layers);
  const dynamicNames = new Set(dynamicFields.map((d) => d.fullName));

  const kept = declared.filter((v) => !dynamicNames.has(v.name));
  const derived: VariableDefinition[] = dynamicFields.map((d) => ({
    name: d.fullName,
    label: d.fieldName,
    type: d.varType,
    defaultValue: d.defaultValue,
    required: false,
  }));
  return [...kept, ...derived];
}
