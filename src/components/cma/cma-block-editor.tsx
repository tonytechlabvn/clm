"use client";

import { useEffect } from "react";
import type { Block, PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";
import { SuggestionMenuController, getDefaultReactSlashMenuItems } from "@blocknote/react";
import { cmaSchema } from "@/lib/cma/blocks/custom-block-schema";
import { getCustomSlashMenuItems } from "./cma-custom-block-toolbar";

// Scoped CSS import — only loaded when this component renders
import "@blocknote/core/fonts/inter.css";
import "@blocknote/shadcn/style.css";

interface CmaBlockEditorProps {
  initialContent?: PartialBlock[];
  onChange: (blocks: Block[]) => void;
  orgId?: string;
}

// Custom upload handler — uploads images to CMA media API
async function uploadFile(file: File, orgId?: string): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  if (orgId) formData.append("orgId", orgId);

  const res = await fetch("/api/cma/media", { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");

  const data = await res.json();
  return data.url;
}

export function CmaBlockEditor({ initialContent, onChange, orgId }: CmaBlockEditorProps) {
  const editor = useCreateBlockNote({
    schema: cmaSchema,
    uploadFile: (file: File) => uploadFile(file, orgId),
  });

  // Apply initialContent when it changes (e.g. template selection)
  useEffect(() => {
    if (!initialContent || initialContent.length === 0) return;
    editor.replaceBlocks(editor.document, initialContent);
  }, [editor, initialContent]);

  // Notify parent when content changes
  useEffect(() => {
    const handler = () => {
      onChange(editor.document as any);
    };
    editor.onEditorContentChange(handler);
  }, [editor, onChange]);

  return (
    <div className="bn-container" data-color-mode="light">
      <BlockNoteView editor={editor} theme="light" slashMenu={false}>
        <SuggestionMenuController
          triggerCharacter="/"
          getItems={async (query) =>
            [...getDefaultReactSlashMenuItems(editor), ...getCustomSlashMenuItems(editor)]
              .filter((item) =>
                item.title.toLowerCase().includes(query.toLowerCase()) ||
                item.aliases?.some((a: string) => a.includes(query.toLowerCase()))
              )
          }
        />
      </BlockNoteView>
    </div>
  );
}
