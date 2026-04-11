"use client";
// Left-side element palette. Phase-10 wires drag-drop for Text / Image / Rect
// layer creation; phase-08 only renders a disabled scaffold so the 3-panel
// layout takes its final shape.

import { Type, Image as ImageIcon, Square } from "lucide-react";

interface PaletteEntry {
  key: string;
  label: string;
  Icon: typeof Type;
}

const ENTRIES: PaletteEntry[] = [
  { key: "text", label: "Text", Icon: Type },
  { key: "image", label: "Image", Icon: ImageIcon },
  { key: "rect", label: "Rectangle", Icon: Square },
];

export function EditorLeftPalette() {
  return (
    <aside className="w-16 shrink-0 border-r bg-background flex flex-col items-center py-3 gap-1">
      {ENTRIES.map(({ key, label, Icon }) => (
        <button
          key={key}
          type="button"
          disabled
          title={`${label} (phase-10)`}
          className="w-12 h-12 flex flex-col items-center justify-center gap-0.5 rounded-md text-muted-foreground cursor-not-allowed opacity-60"
        >
          <Icon className="h-4 w-4" />
          <span className="text-[10px] leading-none">{label}</span>
        </button>
      ))}
    </aside>
  );
}
