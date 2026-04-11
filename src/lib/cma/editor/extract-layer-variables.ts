// Pure helpers to analyze variable usage across an editor's layer tree.
// Used by:
//   - Phase-11 variables panel: surface undeclared tokens as warnings
//   - Phase-12 save flow: block saves until all used tokens are declared
//   - Phase-14 tests: token extraction regression coverage
//
// Keep these pure — no store access, no React — so they can be called from
// both client and server (save-time validation) without duplication.

import type { Layer } from "@/lib/cma/types/image-template-layer-types";
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
