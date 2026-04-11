"use client";
// Right-side panel hosting the layer tree + properties inspector + variables.
// Phase-08 renders empty tabs as a scaffold; phases 10-11 fill them with
// real content. Kept as a single file with tab switching to avoid prop drilling
// section visibility state through a wrapper.

import { useState } from "react";
import { Layers, SlidersHorizontal, Braces } from "lucide-react";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";

type Tab = "layers" | "properties" | "variables";

const TABS: Array<{ key: Tab; label: string; Icon: typeof Layers }> = [
  { key: "layers", label: "Layers", Icon: Layers },
  { key: "properties", label: "Properties", Icon: SlidersHorizontal },
  { key: "variables", label: "Variables", Icon: Braces },
];

export function EditorRightPanel() {
  const [tab, setTab] = useState<Tab>("layers");
  const layerCount = useEditorStore((s) => s.layers.length);
  const variableCount = useEditorStore((s) => s.variables.length);

  return (
    <aside className="w-72 shrink-0 border-l bg-background flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b">
        {TABS.map(({ key, label, Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`flex-1 h-10 flex items-center justify-center gap-1.5 text-xs border-b-2 transition-colors ${
                active
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab content — phase 10/11 stubs */}
      <div className="flex-1 overflow-y-auto p-3 text-sm">
        {tab === "layers" && (
          <div className="text-muted-foreground text-xs">
            {layerCount === 0
              ? "No layers yet. Drag an element from the palette (phase-10)."
              : `${layerCount} layer${layerCount === 1 ? "" : "s"} — tree view in phase-10`}
          </div>
        )}
        {tab === "properties" && (
          <div className="text-muted-foreground text-xs">
            Select a layer to edit its properties (phase-10).
          </div>
        )}
        {tab === "variables" && (
          <div className="text-muted-foreground text-xs">
            {variableCount === 0
              ? "No variables defined — add them in phase-11."
              : `${variableCount} variable${variableCount === 1 ? "" : "s"}`}
          </div>
        )}
      </div>
    </aside>
  );
}
