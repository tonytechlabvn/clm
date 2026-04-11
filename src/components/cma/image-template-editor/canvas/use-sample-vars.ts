"use client";
// Memoized derivation of sample variable values from the editor store.
// Used by the canvas to substitute {{tokens}} in text/image/rect layers for
// live preview. Falls back to the variable label when no default is provided
// so authors see something meaningful instead of raw tokens.

import { useMemo } from "react";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";

export function useSampleVars(): Record<string, string> {
  const variables = useEditorStore((s) => s.variables);

  return useMemo(() => {
    const map: Record<string, string> = {};
    for (const v of variables) {
      map[v.name] =
        v.defaultValue && v.defaultValue !== "" ? v.defaultValue : v.label;
    }
    return map;
  }, [variables]);
}
