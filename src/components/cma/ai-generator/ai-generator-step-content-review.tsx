"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Save, Eye, Code2 } from "lucide-react";
import { TONYTECHLAB_CUSTOM_CSS } from "@/lib/cma/themes/tonytechlab-custom-css";

interface ContentReviewStepProps {
  blogContent: string;
  blogCss: string;
  onBlogContentChange: (v: string) => void;
  onBlogCssChange: (v: string) => void;
  fbExcerpt: string;
  onFbExcerptChange: (v: string) => void;
  linkedinExcerpt: string;
  onLinkedinExcerptChange: (v: string) => void;
  imagePrompts: string[];
  onBack: () => void;
  onSave: () => void;
  loading: boolean;
  /** Template HTML skeleton — if provided, AI content is wrapped inside it */
  templateHtml?: string | null;
  /** Template CSS — merged with blog CSS when template is active */
  templateCss?: string | null;
}

// Build a full preview document with TonyTechLab template CSS + any custom CSS
function buildPreviewDoc(html: string, css: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{margin:16px;font-family:system-ui,-apple-system,sans-serif;color:#1a1a1a;line-height:1.6}img{max-width:100%;height:auto}
${TONYTECHLAB_CUSTOM_CSS}
${css}</style>
</head><body>${html}</body></html>`;
}

export function ContentReviewStep({
  blogContent, blogCss, onBlogContentChange, onBlogCssChange,
  fbExcerpt, onFbExcerptChange, linkedinExcerpt, onLinkedinExcerptChange,
  imagePrompts, onBack, onSave, loading, templateHtml, templateCss,
}: ContentReviewStepProps) {
  const [viewMode, setViewMode] = useState<"preview" | "html" | "css">("preview");

  // When template is loaded, wrap AI content inside template structure for preview
  const previewHtml = useMemo(() => {
    if (!templateHtml) return blogContent;
    // Replace title placeholders for preview
    let html = templateHtml
      .replace(/\[Tiêu đề bài viết\]/g, "Generated Content")
      .replace(/\[Phụ đề\]/g, "")
      .replace(/\[Mô tả ngắn gọn[^\]]*\]/g, "");
    // Replace content area with AI-generated blog content
    const contentAreaRegex = /(<div[^>]*display:\s*flex;\s*flex-direction:\s*column;\s*gap:\s*35px[^>]*>)([\s\S]*?)(<\/div>\s*<footer)/;
    const match = html.match(contentAreaRegex);
    if (match) {
      html = html.replace(contentAreaRegex,
        '<div style="padding: 20px;">' + blogContent + '</div>$3');
    } else {
      const footerIdx = html.indexOf('<footer');
      if (footerIdx !== -1) {
        html = html.slice(0, footerIdx) +
          '<div style="padding: 20px;">' + blogContent + '</div>' +
          html.slice(footerIdx);
      }
    }
    return html;
  }, [blogContent, templateHtml]);

  const previewCssAll = useMemo(
    () => templateCss ? `${templateCss}\n${blogCss}` : blogCss,
    [blogCss, templateCss]
  );

  // Use srcdoc for reliable cross-origin iframe rendering
  const previewSrcdoc = useMemo(
    () => buildPreviewDoc(previewHtml, previewCssAll),
    [previewHtml, previewCssAll]
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Generated Blog Post</CardTitle>
            <div className="flex gap-1">
              <button
                onClick={() => setViewMode("preview")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  viewMode === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Eye className="h-3.5 w-3.5 inline mr-1" />Preview
              </button>
              <button
                onClick={() => setViewMode("html")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  viewMode === "html" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Code2 className="h-3.5 w-3.5 inline mr-1" />HTML
              </button>
              <button
                onClick={() => setViewMode("css")}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  viewMode === "css" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                CSS
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "preview" ? (
            <iframe
              srcDoc={previewSrcdoc}
              title="Content Preview"
              className="w-full min-h-[500px] rounded-md border bg-white"
            />
          ) : viewMode === "html" ? (
            <textarea
              value={blogContent}
              onChange={(e) => onBlogContentChange(e.target.value)}
              spellCheck={false}
              className="w-full min-h-[500px] resize-none p-4 font-mono text-sm leading-relaxed bg-[#1e1e1e] text-[#d4d4d4] rounded-md focus:outline-none"
            />
          ) : (
            <textarea
              value={blogCss}
              onChange={(e) => onBlogCssChange(e.target.value)}
              spellCheck={false}
              className="w-full min-h-[300px] resize-none p-4 font-mono text-sm leading-relaxed bg-[#1e1e1e] text-[#d4d4d4] rounded-md focus:outline-none"
            />
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Facebook Excerpt</CardTitle></CardHeader>
          <CardContent>
            <textarea value={fbExcerpt} onChange={(e) => onFbExcerptChange(e.target.value)}
              maxLength={200} className="w-full rounded border px-3 py-2 text-sm min-h-[80px]" />
            <span className="text-xs text-muted-foreground">{fbExcerpt.length}/200</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">LinkedIn Excerpt</CardTitle></CardHeader>
          <CardContent>
            <textarea value={linkedinExcerpt} onChange={(e) => onLinkedinExcerptChange(e.target.value)}
              maxLength={300} className="w-full rounded border px-3 py-2 text-sm min-h-[80px]" />
            <span className="text-xs text-muted-foreground">{linkedinExcerpt.length}/300</span>
          </CardContent>
        </Card>
      </div>

      {imagePrompts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Suggested Images</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {imagePrompts.map((p, i) => (
                <li key={i} className="text-muted-foreground">• {p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Edit Outline
        </Button>
        <Button onClick={onSave} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save as Draft & Review
        </Button>
      </div>
    </div>
  );
}
