"use client";
// Top-level editor shell. Composes the 3-panel layout (palette / canvas /
// inspector), wires keyboard shortcuts, and delegates template hydration
// to useTemplateLoader which handles blank/existing/system-fork cases.

import { useTemplateLoader } from "@/lib/cma/editor/use-template-loader";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
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
  const { org } = useCmaOrg();
  useEditorShortcuts();

  const { status, error } = useTemplateLoader({
    orgId: org?.id,
    templateId,
    initialPlatform,
  });

  return (
    <div className="h-screen flex flex-col bg-background">
      <EditorTopBar onCancel={onExit} onSaved={() => { /* keep editing in place */ }} />
      {status === "error" ? (
        <div className="flex-1 flex items-center justify-center text-sm text-destructive">
          {error ?? "Failed to load template"}
        </div>
      ) : status === "loading" ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Loading template…
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          <EditorLeftPalette />
          <EditorCanvasArea />
          <EditorRightPanel />
        </div>
      )}
    </div>
  );
}
