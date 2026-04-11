"use client";
// One editable row in the variables panel. Name field is validated against
// a strict identifier regex (letter/underscore start, alphanum/underscore body)
// so tokens compile cleanly. Label + default value accept any string.
//
// Rename UX: the name field is buffered in local state so the user can clear
// and retype freely without every keystroke hitting the store. The rename
// commits on blur or Enter, and bounces invalid/colliding names back to the
// stored value so the field never stays in an invalid state. Previously,
// committing on every keystroke caused React to remount the <input> (because
// the panel used `key={v.name}`) and focus was lost after the first character.

import { useEffect, useState, type KeyboardEvent } from "react";
import { Trash2 } from "lucide-react";
import type { VariableDefinition } from "@/lib/cma/types/image-template-types";

const NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

interface Props {
  variable: VariableDefinition;
  isUsed: boolean;
  onChange: (patch: Partial<VariableDefinition>) => void;
  onRename: (nextName: string) => void;
  onDelete: () => void;
  takenNames: Set<string>;
}

export function VariableRow({
  variable,
  isUsed,
  onChange,
  onRename,
  onDelete,
  takenNames,
}: Props) {
  const [draftName, setDraftName] = useState(variable.name);

  // Keep the local draft in sync when the underlying variable changes from
  // outside (e.g., another row renamed, or the store was reset).
  useEffect(() => {
    setDraftName(variable.name);
  }, [variable.name]);

  const isValid =
    draftName === variable.name ||
    (NAME_RE.test(draftName) && !takenNames.has(draftName));

  const commitName = () => {
    if (draftName === variable.name) return;
    if (!isValid) {
      // Roll back the draft on invalid commit so the UI never stays stuck.
      setDraftName(variable.name);
      return;
    }
    onRename(draftName);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      (e.target as HTMLInputElement).blur();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setDraftName(variable.name);
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="p-2 border rounded-md bg-muted/30 space-y-1.5">
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={draftName}
          placeholder="var_name"
          onChange={(e) => setDraftName(e.target.value)}
          onBlur={commitName}
          onKeyDown={handleKeyDown}
          aria-invalid={!isValid}
          className={`text-xs border rounded px-1.5 py-1 flex-1 bg-background font-mono ${
            isValid ? "" : "border-destructive text-destructive"
          }`}
        />
        {!isUsed && (
          <span
            title="Not referenced by any layer"
            className="text-[10px] text-amber-600 font-mono"
          >
            unused
          </span>
        )}
        <button
          type="button"
          onClick={onDelete}
          aria-label="Delete variable"
          title="Delete variable"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
      <input
        type="text"
        value={variable.label}
        placeholder="Display label"
        onChange={(e) => onChange({ label: e.target.value })}
        className="text-xs border rounded px-1.5 py-1 w-full bg-background"
      />
      <input
        type="text"
        value={variable.defaultValue ?? ""}
        placeholder="Default value (sample for preview)"
        onChange={(e) => onChange({ defaultValue: e.target.value })}
        className="text-xs border rounded px-1.5 py-1 w-full bg-background"
      />
    </div>
  );
}
