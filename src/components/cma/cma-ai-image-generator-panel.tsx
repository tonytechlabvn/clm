"use client";

// DALL-E 3 image generation panel — prompt, size, quality, preview, use

import { useState } from "react";
import { Loader2, Sparkles, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DalleOptions } from "@/lib/cma/services/image-generation-service";

interface Props {
  orgId: string;
  onSelect: (url: string) => void;
}

const SIZE_OPTIONS: { label: string; value: DalleOptions["size"] }[] = [
  { label: "Square (1024×1024)", value: "1024x1024" },
  { label: "Portrait (1024×1792)", value: "1024x1792" },
  { label: "Landscape (1792×1024)", value: "1792x1024" },
];

interface GenerateResponse {
  url?: string;
  mediaId?: string;
  revisedPrompt?: string;
  remaining?: number;
  error?: string;
}

export function CmaAiImageGeneratorPanel({ orgId, onSelect }: Props) {
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<DalleOptions["size"]>("1024x1024");
  const [quality, setQuality] = useState<DalleOptions["quality"]>("standard");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [revisedPrompt, setRevisedPrompt] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setError(null);
    setPreviewUrl(null);
    setRevisedPrompt(null);

    try {
      const res = await fetch("/api/cma/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), orgId, size, quality }),
      });
      const data = (await res.json()) as GenerateResponse;
      if (!res.ok) throw new Error(data.error ?? "Generation failed");

      setPreviewUrl(data.url ?? null);
      setRevisedPrompt(data.revisedPrompt ?? null);
      if (data.remaining !== undefined) setRemaining(data.remaining);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  function handleUse() {
    if (previewUrl) onSelect(previewUrl);
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Prompt</label>
        <textarea
          rows={3}
          placeholder="Describe the image you want to generate..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm bg-background resize-none focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Size</label>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value as DalleOptions["size"])}
            className="w-full rounded-md border px-3 py-2 text-sm bg-background focus:outline-none"
          >
            {SIZE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Quality</label>
          <div className="flex rounded-md border overflow-hidden">
            {(["standard", "hd"] as const).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setQuality(q)}
                className={`flex-1 py-2 text-sm capitalize transition-colors ${
                  quality === q
                    ? "bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {q === "hd" ? "HD" : "Standard"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {remaining !== null && (
        <p className="text-xs text-muted-foreground">
          {remaining} generation{remaining !== 1 ? "s" : ""} remaining today
        </p>
      )}

      <Button
        className="w-full"
        disabled={generating || !prompt.trim()}
        onClick={handleGenerate}
      >
        {generating
          ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Generating...</>
          : <><Sparkles className="h-4 w-4 mr-2" />Generate Image</>}
      </Button>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {previewUrl && (
        <div className="space-y-3">
          <div className="rounded-md overflow-hidden border bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Generated" className="w-full object-contain max-h-64" />
          </div>
          {revisedPrompt && revisedPrompt !== prompt && (
            <p className="text-xs text-muted-foreground italic">
              Revised: {revisedPrompt}
            </p>
          )}
          <Button className="w-full" variant="default" onClick={handleUse}>
            <ImageIcon className="h-4 w-4 mr-2" />
            Use This Image
          </Button>
        </div>
      )}
    </div>
  );
}
