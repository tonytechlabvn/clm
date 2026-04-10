"use client";

// Main image template panel — orchestrates grid, form, preview, and generate actions

import { useState, useCallback } from "react";
import { Loader2, Download, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cmaFetch } from "@/lib/cma/use-cma-api";
import { CmaImageTemplateGrid } from "./cma-image-template-grid";
import { CmaImageTemplateVariableForm } from "./cma-image-template-variable-form";
import { CmaImageTemplatePreview } from "./cma-image-template-preview";
import type { CmaImageTemplate } from "@prisma/client";
import type { VariableDefinition } from "@/lib/cma/types/image-template-types";

interface PostData {
  title?: string;
  excerpt?: string;
  featuredImage?: string;
}

interface Props {
  orgId: string;
  postData?: PostData;
  onImageGenerated: (url: string) => void;
}

interface RenderResponse {
  data: { imageUrl: string; mediaId: string; width: number; height: number };
}

const PLATFORMS = ["all", "facebook", "generic"] as const;

export function CmaImageTemplatePanel({ orgId, postData, onImageGenerated }: Props) {
  const [platform, setPlatform] = useState<string>("all");
  const [selected, setSelected] = useState<CmaImageTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Parse variableSchema from JSON (stored as Json in Prisma)
  const schema: VariableDefinition[] = selected
    ? (selected.variableSchema as unknown as VariableDefinition[])
    : [];

  const handleSelect = useCallback((tpl: CmaImageTemplate) => {
    setSelected(tpl);
    setGeneratedUrl(null);
    setGenError(null);
    // Initialize variables with defaults
    const defs = tpl.variableSchema as unknown as VariableDefinition[];
    const initial: Record<string, string> = {};
    for (const v of defs) {
      initial[v.name] = v.defaultValue || "";
    }
    setVariables(initial);
  }, []);

  const handleAutoFill = useCallback(() => {
    if (!postData || !selected) return;
    const defs = selected.variableSchema as unknown as VariableDefinition[];
    const filled: Record<string, string> = { ...variables };
    for (const v of defs) {
      if (v.name === "title" && postData.title) filled[v.name] = postData.title;
      else if ((v.name === "subtitle" || v.name === "body") && postData.excerpt)
        filled[v.name] = postData.excerpt;
      else if (v.name === "imageUrl" && postData.featuredImage)
        filled[v.name] = postData.featuredImage;
    }
    setVariables(filled);
  }, [postData, selected, variables]);

  const handleGenerate = useCallback(async () => {
    if (!selected) return;
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await cmaFetch<RenderResponse>(
        `/api/cma/image-templates/${selected.id}/render?orgId=${orgId}`,
        { method: "POST", body: JSON.stringify({ variables }) }
      );
      setGeneratedUrl(res.data.imageUrl);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  }, [selected, orgId, variables]);

  const handleUseAsImage = useCallback(() => {
    if (generatedUrl) onImageGenerated(generatedUrl);
  }, [generatedUrl, onImageGenerated]);

  return (
    <div className="space-y-4">
      {/* Platform filter tabs */}
      <div className="flex gap-1">
        {PLATFORMS.map((p) => (
          <button
            key={p}
            onClick={() => setPlatform(p)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
              platform === p
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Template grid */}
      {!selected && (
        <CmaImageTemplateGrid
          orgId={orgId}
          platform={platform}
          selectedId={null}
          onSelect={handleSelect}
        />
      )}

      {/* Selected template: form + preview */}
      {selected && (
        <div className="space-y-4">
          {/* Back button + template name */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setSelected(null); setGeneratedUrl(null); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              &larr; Back to templates
            </button>
            <span className="text-sm font-medium">{selected.name}</span>
          </div>

          {/* Preview */}
          <CmaImageTemplatePreview
            templateId={selected.id}
            orgId={orgId}
            variables={variables}
            width={selected.width}
            height={selected.height}
          />

          {/* Variable form */}
          <CmaImageTemplateVariableForm
            schema={schema}
            values={variables}
            onChange={setVariables}
            onAutoFill={postData ? handleAutoFill : undefined}
          />

          {/* Action buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1"
              size="sm"
            >
              {isGenerating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <ImagePlus className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isGenerating ? "Generating..." : "Generate Image"}
            </Button>

            {generatedUrl && (
              <>
                <Button variant="outline" size="sm" onClick={handleUseAsImage}>
                  Use as Featured Image
                </Button>
                <a href={generatedUrl} download>
                  <Button variant="ghost" size="sm">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                </a>
              </>
            )}
          </div>

          {genError && <p className="text-xs text-destructive">{genError}</p>}
        </div>
      )}
    </div>
  );
}
