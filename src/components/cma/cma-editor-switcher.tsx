"use client";

import dynamic from "next/dynamic";
import type { Block, PartialBlock } from "@blocknote/core";

// Lazy-load both editors — BlockNote is client-only, markdown editor uses browser APIs
const CmaBlockEditor = dynamic(
  () => import("./cma-block-editor").then((m) => ({ default: m.CmaBlockEditor })),
  { ssr: false, loading: () => <EditorSkeleton /> }
);
const CmaMarkdownEditor = dynamic(
  () => import("./cma-markdown-editor").then((m) => ({ default: m.CmaMarkdownEditor })),
  { ssr: false, loading: () => <EditorSkeleton /> }
);

function EditorSkeleton() {
  return (
    <div className="h-[500px] rounded-md border bg-muted/30 animate-pulse flex items-center justify-center">
      <span className="text-sm text-muted-foreground">Loading editor...</span>
    </div>
  );
}

interface CmaEditorSwitcherProps {
  contentFormat: "markdown" | "blocks";
  content: string;
  onContentChange: (content: string) => void;
  onBlocksChange?: (blocks: Block[]) => void;
  initialBlocks?: PartialBlock[];
  orgId?: string;
}

export function CmaEditorSwitcher({
  contentFormat,
  content,
  onContentChange,
  onBlocksChange,
  initialBlocks,
  orgId,
}: CmaEditorSwitcherProps) {
  if (contentFormat === "blocks") {
    return (
      <CmaBlockEditor
        initialContent={initialBlocks}
        onChange={(blocks) => {
          // Store serialized JSON for persistence
          onContentChange(JSON.stringify(blocks));
          onBlocksChange?.(blocks);
        }}
        orgId={orgId}
      />
    );
  }

  return <CmaMarkdownEditor value={content} onChange={onContentChange} />;
}
