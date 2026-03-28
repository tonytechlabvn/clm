"use client";

import dynamic from "next/dynamic";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

// Dynamic import — @uiw/react-md-editor uses browser APIs
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function CmaMarkdownEditor({ value, onChange }: Props) {
  return (
    <div data-color-mode="light">
      <MDEditor
        value={value}
        onChange={(val) => onChange(val || "")}
        height={500}
        preview="live"
        visibleDragbar={false}
      />
    </div>
  );
}
