"use client";
// Variables panel — CRUD for template variables. Auto-derives warnings from
// `extractUsedVariableNames` so authors can see which tokens in text/image/rect
// layers still need declarations and which declared variables aren't used
// anywhere. Rename keeps identity stable by calling store.updateVariable with
// the old name.

import { useMemo } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import {
  extractUsedVariableNames,
  diffDeclaredVsUsed,
} from "@/lib/cma/editor/extract-layer-variables";
import type { VariableDefinition } from "@/lib/cma/types/image-template-types";
import { VariableRow } from "./variable-row";

function nextVarName(existing: string[]): string {
  let i = 1;
  while (existing.includes(`var${i}`)) i++;
  return `var${i}`;
}

export function VariablesPanel() {
  const variables = useEditorStore((s) => s.variables);
  const layers = useEditorStore((s) => s.layers);
  const addVariable = useEditorStore((s) => s.addVariable);
  const updateVariable = useEditorStore((s) => s.updateVariable);
  const deleteVariable = useEditorStore((s) => s.deleteVariable);

  const usedNames = useMemo(() => extractUsedVariableNames(layers), [layers]);
  const { missing, unused } = useMemo(
    () => diffDeclaredVsUsed(variables, usedNames),
    [variables, usedNames]
  );

  const unusedSet = useMemo(() => new Set(unused), [unused]);
  const declaredNames = useMemo(
    () => new Set(variables.map((v) => v.name)),
    [variables]
  );

  const handleAdd = (prefill?: string) => {
    const name = prefill ?? nextVarName(variables.map((v) => v.name));
    const newVar: VariableDefinition = {
      name,
      label: name,
      type: "text",
      defaultValue: "",
      required: false,
    };
    addVariable(newVar);
  };

  const handleRename = (oldName: string, nextName: string) => {
    // store.updateVariable patches the row in place — {name} is a valid patch.
    updateVariable(oldName, { name: nextName });
  };

  return (
    <div className="p-3 space-y-3 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-semibold text-foreground">Variables</h4>
        <button
          type="button"
          onClick={() => handleAdd()}
          className="text-xs flex items-center gap-1 text-primary hover:underline"
        >
          <Plus className="h-3 w-3" /> Add
        </button>
      </div>

      {missing.length > 0 && (
        <div className="p-2 border border-amber-300 bg-amber-50 rounded-md space-y-1">
          <div className="flex items-center gap-1 text-[11px] font-medium text-amber-800">
            <AlertTriangle className="h-3 w-3" />
            Used but not declared
          </div>
          <div className="flex flex-wrap gap-1">
            {missing.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => handleAdd(name)}
                className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-200"
                title={`Create "${name}" variable`}
              >
                {name}
              </button>
            ))}
          </div>
          <div className="text-[10px] text-amber-700">
            Click a name to auto-create the declaration.
          </div>
        </div>
      )}

      {variables.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No variables yet — declare one above or embed a {`{{token}}`} in a
          text layer to get a suggestion.
        </p>
      ) : (
        <div className="space-y-2">
          {variables.map((v) => (
            <VariableRow
              key={v.name}
              variable={v}
              isUsed={!unusedSet.has(v.name)}
              takenNames={declaredNames}
              onChange={(patch) => updateVariable(v.name, patch)}
              onRename={(nextName) => handleRename(v.name, nextName)}
              onDelete={() => deleteVariable(v.name)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
