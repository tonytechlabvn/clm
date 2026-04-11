"use client";
// Right-side panel hosting the layer tree + properties inspector + variables
// tab stub. Phase-10 fills the Layers + Properties tabs with real content;
// Variables stays a stub until phase-11.

import { useState } from "react";
import { Layers, SlidersHorizontal, Braces } from "lucide-react";
import { LayerTree } from "./panels/layer-tree";
import { PropertiesInspector } from "./panels/properties-inspector";
import { VariablesPanel } from "./panels/variables-panel";

type Tab = "layers" | "properties" | "variables";

const TABS: Array<{ key: Tab; label: string; Icon: typeof Layers }> = [
  { key: "layers", label: "Layers", Icon: Layers },
  { key: "properties", label: "Properties", Icon: SlidersHorizontal },
  { key: "variables", label: "Variables", Icon: Braces },
];

export function EditorRightPanel() {
  const [tab, setTab] = useState<Tab>("layers");

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

      {/* Tab content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {tab === "layers" && <LayerTree />}
        {tab === "properties" && <PropertiesInspector />}
        {tab === "variables" && <VariablesPanel />}
      </div>
    </aside>
  );
}
