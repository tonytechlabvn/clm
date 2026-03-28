"use client";

// Featured image picker modal — 3 tabs: Upload | Unsplash | AI Generate

import { useState, useRef, useCallback } from "react";
import { X, Upload, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CmaUnsplashSearchPanel } from "./cma-unsplash-search-panel";
import { CmaAiImageGeneratorPanel } from "./cma-ai-image-generator-panel";

type Tab = "upload" | "unsplash" | "ai";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (url: string) => void;
  orgId: string;
}

const TABS: { id: Tab; label: string }[] = [
  { id: "upload", label: "Upload" },
  { id: "unsplash", label: "Unsplash" },
  { id: "ai", label: "AI Generate" },
];

export function CmaFeaturedImagePicker({ open, onClose, onSelect, orgId }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("upload");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = useCallback((url: string) => {
    onSelect(url);
    onClose();
  }, [onSelect, onClose]);

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orgId", orgId);
      formData.append("source", "upload");

      const res = await fetch("/api/cma/media", { method: "POST", body: formData });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      if (data.url) handleSelect(data.url);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h2 className="text-base font-semibold">Select Featured Image</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b px-5">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "upload" && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
                  dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/50"
                }`}
              >
                {uploading ? (
                  <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto mb-3 text-muted-foreground" />
                    <p className="text-sm font-medium">Drop image here or click to browse</p>
                    <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP, GIF — max 10MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                className="hidden"
                onChange={handleFileChange}
              />
              {uploadError && <p className="text-xs text-destructive">{uploadError}</p>}
              <Button
                variant="outline"
                className="w-full"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon className="h-4 w-4 mr-2" />
                Browse Files
              </Button>
            </div>
          )}

          {activeTab === "unsplash" && (
            <CmaUnsplashSearchPanel orgId={orgId} onSelect={handleSelect} />
          )}

          {activeTab === "ai" && (
            <CmaAiImageGeneratorPanel orgId={orgId} onSelect={handleSelect} />
          )}
        </div>
      </div>
    </div>
  );
}
