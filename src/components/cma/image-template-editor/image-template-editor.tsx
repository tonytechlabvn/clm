"use client";
// Top-level editor shell. Composes the 3-panel layout (palette / canvas /
// inspector) and wires keyboard shortcuts. Data loading lives in a separate
// effect so phase-08 can render with a blank template while phase-12 swaps in
// the real API hook.

import { useEffect } from "react";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import { createBlankTemplatePayload } from "@/lib/cma/editor/image-template-editor-defaults";
import { EditorTopBar } from "./editor-top-bar";
import { EditorCanvasArea } from "./editor-canvas-area";
import { EditorLeftPalette } from "./editor-left-palette";
import { EditorRightPanel } from "./editor-right-panel";
import { useEditorShortcuts } from "./use-editor-shortcuts";

interface Props {
  templateId: string | null;
  initialPlatform?: string;
  onExit: () => void;
}

export function ImageTemplateEditor({ templateId, initialPlatform, onExit }: Props) {
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const reset = useEditorStore((s) => s.reset);

  useEditorShortcuts();

  useEffect(() => {
    // Phase-12 will fetch the real template when templateId is set. For now
    // every mount seeds a blank doc so the canvas renders immediately.
    if (templateId) {
      // Placeholder: in phase-12, call useCmaGet<CmaImageTemplate>(templateId)
      // and feed into loadTemplate.
      loadTemplate(createBlankTemplatePayload({ platform: initialPlatform }));
    } else {
      loadTemplate(createBlankTemplatePayload({ platform: initialPlatform }));
    }
    // Clear the undo stack after loading so the first Ctrl+Z can't wipe the
    // freshly-loaded template back to the empty default state. Critical once
    // phase-12 wires real API loading — without this, the user's real layers
    // become a single undo-step away from being replaced with an empty doc.
    useEditorStore.temporal.getState().clear();
    return () => {
      reset();
    };
  }, [templateId, initialPlatform, loadTemplate, reset]);

  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorTopBar onCancel={onExit} />
      <div className="flex-1 flex overflow-hidden">
        <EditorLeftPalette />
        <EditorCanvasArea />
        <EditorRightPanel />
      </div>
    </div>
  );
}
