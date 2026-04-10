"use client";

// Live preview — calls preview API with debounced variables, displays base64 PNG

import { useState, useEffect, useRef, useMemo } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { cmaFetch } from "@/lib/cma/use-cma-api";

interface Props {
  templateId: string;
  orgId: string;
  variables: Record<string, string>;
  width: number;
  height: number;
}

interface PreviewResponse {
  data: { base64: string; width: number; height: number };
}

export function CmaImageTemplatePreview({ templateId, orgId, variables, width, height }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  // Serialize variables for stable dependency comparison (avoids infinite re-render loop)
  const variablesKey = useMemo(() => JSON.stringify(variables), [variables]);

  useEffect(() => {
    // Debounce preview requests — 500ms after last variable change
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await cmaFetch<PreviewResponse>(
          `/api/cma/image-templates/${templateId}/preview?orgId=${orgId}`,
          { method: "POST", body: JSON.stringify({ variables }) }
        );
        setPreview(res.data.base64);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Preview failed");
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, orgId, variablesKey]);

  return (
    <div
      className="relative bg-muted rounded-lg overflow-hidden border"
      style={{ aspectRatio: `${width}/${height}` }}
    >
      {preview && (
        <img
          src={preview}
          alt="Template preview"
          className="w-full h-full object-contain"
        />
      )}

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && !loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-1">
          <AlertCircle className="h-5 w-5" />
          <p className="text-xs">{error}</p>
        </div>
      )}

      {!preview && !loading && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
          <p className="text-xs">Fill in variables to see preview</p>
        </div>
      )}
    </div>
  );
}
