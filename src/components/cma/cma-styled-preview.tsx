"use client";

import { useState, useEffect } from "react";

interface CmaStyledPreviewProps {
  content: string;
  contentFormat: "markdown" | "blocks";
  theme?: string;
}

// Renders a live styled preview of post content via the preview API
export function CmaStyledPreview({ content, contentFormat, theme }: CmaStyledPreviewProps) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!content) {
      setHtml("");
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetch("/api/cma/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, contentFormat, theme }),
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => setHtml(data.html || ""))
      .catch((err) => {
        if (err.name !== "AbortError") setHtml("<p>Preview unavailable</p>");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [content, contentFormat, theme]);

  if (loading) {
    return (
      <div className="min-h-[300px] border rounded-md p-4 flex items-center justify-center bg-muted/20">
        <span className="text-sm text-muted-foreground">Generating preview...</span>
      </div>
    );
  }

  return (
    <div
      className="min-h-[300px] border rounded-md p-4 bg-white overflow-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
