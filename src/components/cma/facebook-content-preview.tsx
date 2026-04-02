"use client";

import { stripMarkdownToPlainText } from "@/lib/cma/utils/strip-markdown-to-plain-text";

const FB_MAX_CHARS = 63_206;

interface Props {
  content: string;
  contentFormat?: string;
  image?: string;
}

// Preview how content will appear on Facebook (plain text, no HTML)
export function FacebookContentPreview({ content, contentFormat, image }: Props) {
  const plainText = contentFormat === "markdown"
    ? stripMarkdownToPlainText(content)
    : content.replace(/<[^>]+>/g, "").trim();

  const charCount = plainText.length;
  const overLimit = charCount > FB_MAX_CHARS;

  return (
    <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Facebook Preview</span>
        <span className={`text-xs ${overLimit ? "text-destructive font-bold" : "text-muted-foreground"}`}>
          {charCount.toLocaleString()} / {FB_MAX_CHARS.toLocaleString()} chars
        </span>
      </div>

      {image && (
        <img src={image} alt="Featured" className="w-full rounded-md max-h-48 object-cover" />
      )}

      <div className="whitespace-pre-wrap text-sm leading-relaxed max-h-60 overflow-y-auto">
        {plainText || <span className="text-muted-foreground italic">No content</span>}
      </div>

      {overLimit && (
        <p className="text-xs text-destructive">Content exceeds Facebook&apos;s character limit.</p>
      )}
    </div>
  );
}
