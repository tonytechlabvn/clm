"use client";
// Client hook for uploading images used inside a visual template.
// Wraps the asset POST route with client-side type/size guards so the UI
// can show errors immediately and avoid a round-trip for obviously bad
// files. Server-side checks still run as the authoritative validator.

import { useState } from "react";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024;

interface UploadState {
  upload: (file: File, orgId: string) => Promise<string | null>;
  uploading: boolean;
  error: string | null;
  clearError: () => void;
}

export function useTemplateAssetUpload(): UploadState {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upload = async (file: File, orgId: string): Promise<string | null> => {
    setError(null);

    if (!ALLOWED.has(file.type)) {
      setError("Unsupported file type — use PNG, JPEG, or WebP");
      return null;
    }
    if (file.size > MAX_BYTES) {
      setError("File too large (max 10MB)");
      return null;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("orgId", orgId);
      const res = await fetch("/api/cma/image-templates/assets", {
        method: "POST",
        body: fd,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(err.error ?? `Upload failed (${res.status})`);
      }
      const { url } = (await res.json()) as { url: string };
      return url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
      return null;
    } finally {
      setUploading(false);
    }
  };

  return { upload, uploading, error, clearError: () => setError(null) };
}
