"use client";

// Live preview — uses Direct URL as <img src>
// No API calls needed — the URL IS the image. Browser caches by URL.

import { useState, useMemo, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { buildImageUrl } from "@/lib/cma/types/image-template-types";

interface Props {
  templateId: string;
  authCode: string;
  variables: Record<string, string>;
  width: number;
  height: number;
}

export function CmaImageTemplatePreview({ templateId, authCode, variables, width, height }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  // Serialize variables for stable debounce dependency
  const variablesKey = useMemo(() => JSON.stringify(variables), [variables]);

  // Debounce URL updates: only build new URL 500ms after last variable change
  const [debouncedUrl, setDebouncedUrl] = useState<string>("");
  useEffect(() => {
    const timer = setTimeout(() => {
      const url = buildImageUrl({ id: templateId, authCode }, variables);
      setDebouncedUrl(url);
      setLoading(true);
      setError(false);
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, authCode, variablesKey]);

  return (
    <div
      className="relative bg-muted rounded-lg overflow-hidden border"
      style={{ aspectRatio: `${width}/${height}` }}
    >
      {debouncedUrl && (
        <img
          key={debouncedUrl}
          src={debouncedUrl}
          alt="Template preview"
          className="w-full h-full object-contain"
          onLoad={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
        />
      )}

      {loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/40">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-1 bg-background/80">
          <AlertCircle className="h-5 w-5" />
          <p className="text-xs">Preview failed</p>
        </div>
      )}

      {!debouncedUrl && !loading && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <p className="text-xs">Loading...</p>
        </div>
      )}
    </div>
  );
}
