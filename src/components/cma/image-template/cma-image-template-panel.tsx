"use client";

// Main image template panel — Direct URL approach (APITemplate.io-style)
// The image URL IS the image — no "generate then use" step, just build URL and set

import { useState, useCallback } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CmaImageTemplateGrid } from "./cma-image-template-grid";
import { CmaImageTemplateVariableForm } from "./cma-image-template-variable-form";
import { CmaImageTemplatePreview } from "./cma-image-template-preview";
import type { CmaImageTemplate } from "@prisma/client";
import {
  type VariableDefinition,
  buildImageUrl,
} from "@/lib/cma/types/image-template-types";

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

const PLATFORMS = ["all", "facebook", "generic"] as const;

export function CmaImageTemplatePanel({ orgId, postData, onImageGenerated }: Props) {
  const [platform, setPlatform] = useState<string>("all");
  const [selected, setSelected] = useState<CmaImageTemplate | null>(null);
  const [variables, setVariables] = useState<Record<string, string>>({});

  // Parse variableSchema from JSON (stored as Json in Prisma)
  const schema: VariableDefinition[] = selected
    ? (selected.variableSchema as unknown as VariableDefinition[])
    : [];

  // Build the Direct URL for this template + current variables
  // This is the exact URL that will be set as the featured image
  const directUrl = selected ? buildImageUrl(selected, variables) : null;

  const handleSelect = useCallback((tpl: CmaImageTemplate) => {
    setSelected(tpl);
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

  // Set the direct URL as the post's featured image — that's it.
  // Facebook and other adapters will fetch the image from this URL when publishing.
  const handleUseAsImage = useCallback(() => {
    if (directUrl) {
      // Convert relative URL to absolute (Facebook needs a public URL)
      const absoluteUrl = directUrl.startsWith("http")
        ? directUrl
        : `${window.location.origin}${directUrl}`;
      onImageGenerated(absoluteUrl);
    }
  }, [directUrl, onImageGenerated]);

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

      {/* Selected template: form + preview + actions */}
      {selected && (
        <div className="space-y-4">
          {/* Back button + template name */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setSelected(null)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              &larr; Back to templates
            </button>
            <span className="text-sm font-medium">{selected.name}</span>
          </div>

          {/* Preview — uses the direct URL via <img src> */}
          <CmaImageTemplatePreview
            templateId={selected.id}
            authCode={selected.authCode}
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

          {/* Action buttons — no "generate" step, URL IS the image */}
          <div className="flex gap-2">
            <Button
              onClick={handleUseAsImage}
              className="flex-1"
              size="sm"
            >
              <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              Use as Featured Image
            </Button>

            {directUrl && (
              <a href={directUrl} download={`${selected.name}.png`} target="_blank" rel="noopener">
                <Button variant="ghost" size="sm" title="Download">
                  <Download className="h-3.5 w-3.5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
