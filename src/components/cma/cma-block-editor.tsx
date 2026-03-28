"use client";

import { useEffect, useMemo } from "react";
import { BlockNoteEditor, type Block, type PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/shadcn";

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
      onChange(editor.document);
    };
    editor.onEditorContentChange(handler);
  }, [editor, onChange]);

  return (
    <div className="bn-container" data-color-mode="light">
      <BlockNoteView editor={editor} theme="light" />
    </div>
  );
}
