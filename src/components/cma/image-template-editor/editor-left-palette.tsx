"use client";
// Left-side element palette — Phase 10 wiring. Click-to-add pattern (no
// drag-drop for MVP, per plan YAGNI). Each button constructs a fully-valid
// layer via the default-layer factories and hands it to the store.

import { Type, Image as ImageIcon, Square } from "lucide-react";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import {
  makeTextLayer,
  makeImageLayer,
  makeRectLayer,
  nextZIndex,
} from "./palette/default-layers";

type IconComponent = typeof Type;

interface PaletteButtonProps {
  label: string;
  Icon: IconComponent;
  onClick: () => void;
}

function PaletteButton({ label, Icon, onClick }: PaletteButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Add ${label}`}
      className="w-12 h-12 flex flex-col items-center justify-center gap-0.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
    >
      <Icon className="h-4 w-4" />
      <span className="text-[10px] leading-none">{label}</span>
    </button>
  );
}

export function EditorLeftPalette() {
  const width = useEditorStore((s) => s.meta.width);
  const height = useEditorStore((s) => s.meta.height);
  const addLayer = useEditorStore((s) => s.addLayer);

  const addText = () => {
    const layers = useEditorStore.getState().layers;
    addLayer(makeTextLayer(width, height, nextZIndex(layers)));
  };

  const addImage = () => {
    const layers = useEditorStore.getState().layers;
    addLayer(makeImageLayer(width, height, nextZIndex(layers)));
  };

  const addRect = () => {
    const layers = useEditorStore.getState().layers;
    addLayer(makeRectLayer(width, height, nextZIndex(layers)));
  };

  return (
    <aside className="w-16 shrink-0 border-r bg-background flex flex-col items-center py-3 gap-1">
      <PaletteButton label="Text" Icon={Type} onClick={addText} />
      <PaletteButton label="Image" Icon={ImageIcon} onClick={addImage} />
      <PaletteButton label="Rect" Icon={Square} onClick={addRect} />
    </aside>
  );
}
