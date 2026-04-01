// Multi-step URL extraction wizard — enter URL → preview → edit slots → save

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Code2, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { TemplateSlotEditor } from "./template-slot-editor";
import { TemplateMetadataForm, type TemplateMetadata } from "./template-metadata-form";
import { TemplateHtmlPreview } from "./template-html-preview";
import type { SlotDefinition } from "@/types/cma-template-types";

type WizardStep = "url" | "loading" | "review" | "save" | "done";
type InputMode = "html" | "ai";

interface ExtractionResult {
  title: string;
  htmlTemplate: string;
  cssScoped: string;
  slotDefinitions: SlotDefinition[];
  sourceUrl: string;
}

interface TemplateExtractWizardProps {
  onBack: () => void;
  onComplete: () => void;
}

export function TemplateExtractWizard({ onBack, onComplete }: TemplateExtractWizardProps) {
  const { org } = useCmaOrg();
  const [inputMode, setInputMode] = useState<InputMode>("html");
  const [step, setStep] = useState<WizardStep>("url");
  const [pastedHtml, setPastedHtml] = useState("");
  const [pastedCss, setPastedCss] = useState("");
  const [aiDescription, setAiDescription] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [extraction, setExtraction] = useState<ExtractionResult | null>(null);
  const [slots, setSlots] = useState<SlotDefinition[]>([]);
  const [metadata, setMetadata] = useState<TemplateMetadata>({
    name: "",
    description: "",
    category: "article",
    tags: "",
  });

  function handlePasteHtmlCss() {
    if (!pastedHtml.trim()) { setError("HTML content is required"); return; }
    setError("");

    // Extract CSS from <style> tags in the pasted HTML if user included them
    let html = pastedHtml.trim();
    let css = pastedCss.trim();
    const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi);
    if (styleMatch) {
      // Extract CSS from <style> blocks and remove them from HTML
      const extractedCss = styleMatch.map(s => s.replace(/<\/?style[^>]*>/gi, "")).join("\n");
      if (!css) css = extractedCss;
      html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").trim();
    }
    // Remove <html>, <head>, <body> wrapper tags if present
    html = html.replace(/<\/?(?:html|head|body|!DOCTYPE)[^>]*>/gi, "").trim();

    const data: ExtractionResult = {
      title: "Custom Template",
      htmlTemplate: html,
      cssScoped: css,
      slotDefinitions: [{ name: "body_content", type: "richtext", label: "Body Content", placeholder: "Edit in HTML editor", maxLength: 50000, required: true }],
      sourceUrl: "",
    };
    setExtraction(data);
    setSlots(data.slotDefinitions);
    setMetadata((prev) => ({ ...prev, name: "Custom Template" }));
    setStep("review");
  }

  async function handleAiGenerate() {
    if (!org?.id || !aiDescription.trim()) return;
    setError("");
    setStep("loading");

    try {
      const res = await fetch("/api/cma/templates/ai-generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: org.id, description: aiDescription.trim() }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error || json.details || "Generation failed");

      const data = json.data as ExtractionResult;
      setExtraction(data);
      setSlots(data.slotDefinitions);
      setMetadata((prev) => ({ ...prev, name: data.title || "AI Generated Template" }));
      setStep("review");
    } catch (err) {
      setError((err as Error).message);
      setStep("url");
    }
  }

  async function handleSave() {
    if (!org?.id || !extraction || !metadata.name.trim() || !metadata.category) return;
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/cma/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: org.id,
          name: metadata.name.trim(),
          description: metadata.description || null,
          category: metadata.category,
          templateType: "html-slots",
          htmlTemplate: extraction.htmlTemplate,
          cssScoped: extraction.cssScoped,
          slotDefinitions: slots,
          sourceUrl: extraction.sourceUrl,
          tags: metadata.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Failed to save template");
      }

      setStep("done");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted cursor-pointer">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h2 className="text-lg font-bold">Create Template</h2>
          <p className="text-sm text-muted-foreground">
            {step === "url" && "Paste your tested HTML/CSS or generate with AI"}
            {step === "loading" && "Processing template..."}
            {step === "review" && "Review content and adjust slots"}
            {step === "save" && "Set template details and save"}
            {step === "done" && "Template saved successfully!"}
          </p>
        </div>
      </div>

      {/* Step: URL Input or AI Generation */}
      {step === "url" && (
        <div className="space-y-4">
          {/* Mode toggle */}
          <div className="flex gap-1 p-1 bg-muted/50 rounded-lg w-fit">
            <button
              onClick={() => setInputMode("html")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                inputMode === "html" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" /> Paste HTML/CSS
            </button>
            <button
              onClick={() => setInputMode("ai")}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                inputMode === "ai" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" /> Generate with AI
            </button>
          </div>

          {inputMode === "html" ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Paste your tested HTML and CSS from your blog. The system will convert it into a reusable template.
                You can include &lt;style&gt; tags in the HTML — CSS will be extracted automatically.
              </p>
              <div>
                <label className="block text-sm font-medium mb-1">HTML Content *</label>
                <Textarea
                  placeholder="<div class='my-wrapper'>&#10;  <h1>Title</h1>&#10;  <p>Content here...</p>&#10;</div>"
                  value={pastedHtml}
                  onChange={(e) => setPastedHtml(e.target.value)}
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CSS (optional — or include &lt;style&gt; in HTML above)</label>
                <Textarea
                  placeholder=".my-wrapper { max-width: 900px; margin: 0 auto; }&#10;.my-wrapper h1 { color: #2563eb; }"
                  value={pastedCss}
                  onChange={(e) => setPastedCss(e.target.value)}
                  rows={6}
                  className="font-mono text-sm"
                />
              </div>
              <Button onClick={handlePasteHtmlCss} disabled={!pastedHtml.trim()}>
                <Code2 className="h-4 w-4 mr-1" /> Create Template
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="Describe the template you want, e.g.: Tech blog post with hero image, introduction paragraph, 3 feature sections with icons, and a call-to-action button"
                value={aiDescription}
                onChange={(e) => setAiDescription(e.target.value)}
                rows={4}
              />
              <Button onClick={handleAiGenerate} disabled={!aiDescription.trim()}>
                <Sparkles className="h-4 w-4 mr-1" /> Generate Template
              </Button>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
      )}

      {/* Step: Loading */}
      {step === "loading" && (
        <div className="flex flex-col items-center py-16 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Fetching page, extracting content, detecting slots...
          </p>
          <p className="text-xs text-muted-foreground">This may take 10-15 seconds</p>
        </div>
      )}

      {/* Step: Review extraction + slots */}
      {step === "review" && extraction && (
        <div className="space-y-6">
          {/* HTML Preview */}
          <div>
            <h3 className="text-sm font-medium mb-2">Extracted Content Preview</h3>
            <div className="border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
              <TemplateHtmlPreview
                htmlTemplate={extraction.htmlTemplate}
                cssScoped={extraction.cssScoped}
                scopeClass="tpl-preview"
              />
            </div>
          </div>

          {/* Slot Editor */}
          <TemplateSlotEditor slots={slots} onChange={setSlots} />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("url")}>
              Back
            </Button>
            <Button onClick={() => setStep("save")} disabled={slots.length === 0}>
              Continue to Save
            </Button>
          </div>
        </div>
      )}

      {/* Step: Metadata + Save */}
      {step === "save" && (
        <div className="space-y-6">
          <TemplateMetadataForm value={metadata} onChange={setMetadata} />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setStep("review")}>
              Back
            </Button>
            <Button onClick={handleSave} disabled={saving || !metadata.name.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
              Save Template
            </Button>
          </div>
        </div>
      )}

      {/* Step: Done */}
      {step === "done" && (
        <div className="flex flex-col items-center py-16 gap-4">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="font-medium">Template saved successfully!</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { setStep("url"); setPastedHtml(""); setPastedCss(""); setExtraction(null); }}>
              Extract Another
            </Button>
            <Button onClick={onComplete}>Back to Gallery</Button>
          </div>
        </div>
      )}
    </div>
  );
}
