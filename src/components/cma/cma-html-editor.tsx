"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Code2, Eye, EyeOff, Maximize2, Minimize2 } from "lucide-react";

// Content stored as JSON with separate html/css/js sections
export interface HtmlEditorContent {
  html: string;
  css: string;
  js: string;
}

interface Props {
  value: string; // JSON string of HtmlEditorContent
  onChange: (value: string) => void;
}

type TabKey = "html" | "css" | "js";

const TAB_LABELS: Record<TabKey, string> = {
  html: "HTML",
  css: "CSS",
  js: "JavaScript",
};

const TAB_PLACEHOLDERS: Record<TabKey, string> = {
  html: '<article>\n  <h1>My Post Title</h1>\n  <p>Write your content here...</p>\n</article>',
  css: "/* Custom styles for your post */\narticle {\n  max-width: 800px;\n  margin: 0 auto;\n  font-family: system-ui, sans-serif;\n}",
  js: "// Optional: Add interactivity\n// This runs after your post HTML loads",
};

function parseContent(value: string): HtmlEditorContent {
  try {
    const parsed = JSON.parse(value);
    return {
      html: parsed.html || "",
      css: parsed.css || "",
      js: parsed.js || "",
    };
  } catch {
    // If content is a plain HTML string (e.g. pasted), put it in html field
    return { html: value || "", css: "", js: "" };
  }
}

// Build combined HTML document for preview iframe
function buildPreviewDoc(content: HtmlEditorContent): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { margin: 16px; font-family: system-ui, -apple-system, sans-serif; color: #1a1a1a; line-height: 1.6; }
    img { max-width: 100%; height: auto; }
    ${content.css}
  </style>
</head>
<body>
  ${content.html}
  ${content.js ? `<script>${content.js}<\/script>` : ""}
</body>
</html>`;
}

export function CmaHtmlEditor({ value, onChange }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("html");
  const [showPreview, setShowPreview] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const content = useMemo(() => parseContent(value), [value]);

  const updateField = useCallback(
    (field: TabKey, fieldValue: string) => {
      const updated = { ...content, [field]: fieldValue };
      onChange(JSON.stringify(updated));
    },
    [content, onChange]
  );

  // Update iframe preview when content changes
  useEffect(() => {
    if (!iframeRef.current || !showPreview) return;
    const doc = iframeRef.current.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(buildPreviewDoc(content));
    doc.close();
  }, [content, showPreview]);

  // Handle tab key in textarea for indentation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const val = ta.value;
        const updated = val.substring(0, start) + "  " + val.substring(end);
        updateField(activeTab, updated);
        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
          ta.selectionStart = ta.selectionEnd = start + 2;
        });
      }
    },
    [activeTab, updateField]
  );

  const containerClass = isFullscreen
    ? "fixed inset-0 z-50 bg-background flex flex-col"
    : "rounded-md border bg-background flex flex-col";

  const editorHeight = isFullscreen ? "flex-1" : "h-[500px]";

  return (
    <div className={containerClass}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border-b px-2 py-1 bg-muted/30">
        {/* Tabs */}
        <div className="flex gap-1">
          {(Object.keys(TAB_LABELS) as TabKey[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === tab
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {TAB_LABELS[tab]}
              {/* Dot indicator if tab has content */}
              {content[tab].trim() && activeTab !== tab && (
                <span className="ml-1 inline-block w-1.5 h-1.5 bg-blue-400 rounded-full" />
              )}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
            title={showPreview ? "Hide preview" : "Show preview"}
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-muted transition-colors cursor-pointer"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Editor + Preview split */}
      <div className={`flex ${editorHeight} min-h-0`}>
        {/* Code editor */}
        <div className={`flex flex-col ${showPreview ? "w-1/2 border-r" : "w-full"}`}>
          <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/20">
            <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs text-muted-foreground font-medium">
              {TAB_LABELS[activeTab]}
            </span>
          </div>
          <textarea
            ref={textareaRef}
            value={content[activeTab]}
            onChange={(e) => updateField(activeTab, e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={TAB_PLACEHOLDERS[activeTab]}
            spellCheck={false}
            className="flex-1 w-full resize-none p-4 font-mono text-sm leading-relaxed bg-[#1e1e1e] text-[#d4d4d4] focus:outline-none placeholder:text-[#555]"
          />
        </div>

        {/* Live preview */}
        {showPreview && (
          <div className="w-1/2 flex flex-col">
            <div className="flex items-center gap-2 px-3 py-1.5 border-b bg-muted/20">
              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Preview</span>
            </div>
            <iframe
              ref={iframeRef}
              title="HTML Preview"
              sandbox="allow-scripts"
              className="flex-1 w-full bg-white"
            />
          </div>
        )}
      </div>
    </div>
  );
}
