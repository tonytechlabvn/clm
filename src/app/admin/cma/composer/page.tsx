"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cmaFetch, useCmaGet } from "@/lib/cma/use-cma-api";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { CmaEditorSwitcher } from "@/components/cma/cma-editor-switcher";
import { CmaComposerSidebar } from "@/components/cma/cma-composer-sidebar";
import { CmaTemplatePicker } from "@/components/cma/cma-template-picker";
import { CmaFeaturedImagePicker } from "@/components/cma/cma-featured-image-picker";
import { CmaSlotForm } from "@/components/cma/cma-slot-form";
import { CmaHtmlLivePreview } from "@/components/cma/cma-html-live-preview";
import { renderSlotTemplate } from "@/lib/cma/utils/template-slot-renderer";
import { Loader2, Save, Send, Link2, Sparkles, FileCode2, Blocks, FileText } from "lucide-react";
import type { PartialBlock } from "@blocknote/core";
import type { SlotDefinition } from "@/types/cma-template-types";
import type { SlotValues } from "@/types/cma-template-types";

interface PlatformAccount {
  id: string;
  platform: string;
  label: string;
  siteUrl: string | null;
}

export default function CmaComposerPage() {
  const router = useRouter();
  const { org } = useCmaOrg();
  const { data: accountsData } = useCmaGet<{ accounts: PlatformAccount[] }>("/api/cma/accounts");

  // Template picker — shown by default for new posts until dismissed
  const [showTemplatePicker, setShowTemplatePicker] = useState(true);
  const [templateId, setTemplateId] = useState<string | undefined>(undefined);
  const [styleTheme, setStyleTheme] = useState<string>("default");
  const [initialBlocks, setInitialBlocks] = useState<PartialBlock[] | undefined>(undefined);
  // Key to force editor re-mount when template is applied
  const [editorKey, setEditorKey] = useState(0);
  // HTML-slot template state
  const [htmlSlotMode, setHtmlSlotMode] = useState(false);
  const [htmlTemplate, setHtmlTemplate] = useState("");
  const [cssScoped, setCssScoped] = useState("");
  const [slotDefinitions, setSlotDefinitions] = useState<SlotDefinition[]>([]);
  const [slotValues, setSlotValues] = useState<SlotValues>({});

  const [contentFormat, setContentFormat] = useState<"markdown" | "blocks" | "html">("blocks");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");
  const [accountId, setAccountId] = useState("");
  const [featuredImage, setFeaturedImage] = useState<string | undefined>(undefined);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [curateUrl, setCurateUrl] = useState("");
  const [curating, setCurating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContentChange = useCallback((val: string) => setContent(val), []);
  const accounts = accountsData?.accounts || [];

  function handleTemplateSelect(
    selection: {
      blocks: unknown[]; templateId: string; styleTheme: string;
      templateType?: string; htmlTemplate?: string; cssScoped?: string;
      slotDefinitions?: SlotDefinition[];
    } | null
  ) {
    setShowTemplatePicker(false);
    if (selection) {
      setTemplateId(selection.templateId);
      setStyleTheme(selection.styleTheme);

      if (selection.templateType === "html-slots") {
        const slots = selection.slotDefinitions || [];
        const hasSingleBodySlot = slots.length === 1 && slots[0].type === "richtext";

        if (hasSingleBodySlot && selection.htmlTemplate && selection.cssScoped) {
          // Style-only template: load HTML skeleton + CSS into the HTML editor directly
          // User edits the placeholder text in the HTML while CSS classes stay intact
          setHtmlSlotMode(false);
          setContentFormat("html");
          const htmlJson = JSON.stringify({
            html: selection.htmlTemplate,
            css: selection.cssScoped,
            js: "",
          });
          setContent(htmlJson);
        } else {
          // Multi-slot template: use slot form + live preview
          setHtmlSlotMode(true);
          setHtmlTemplate(selection.htmlTemplate || "");
          setCssScoped(selection.cssScoped || "");
          setSlotDefinitions(slots);
          setSlotValues({});
        }
      } else {
        // BlockNote mode
        setHtmlSlotMode(false);
        setInitialBlocks(selection.blocks as PartialBlock[]);
      }
    } else {
      // Blank post — reset
      setHtmlSlotMode(false);
      setInitialBlocks(undefined);
      setTemplateId(undefined);
      setStyleTheme("default");
    }
    setEditorKey((k) => k + 1);
  }

  async function handleSaveDraft() {
    if (!org?.id) {
      setError("No organization found. Go to Connections to set up your account first.");
      return;
    }
    // For html-slots mode, generate content from slot values
    const finalContent = htmlSlotMode && templateId
      ? renderSlotTemplate(htmlTemplate, cssScoped, slotValues, templateId, slotDefinitions)
      : content;
    const finalFormat = htmlSlotMode ? "html" : contentFormat;

    if (!title.trim() || (!htmlSlotMode && !content.trim())) {
      setError("Title and content are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const post = await cmaFetch<{ id: string }>("/api/cma/posts", {
        method: "POST",
        body: JSON.stringify({
          orgId: org.id,
          title,
          content: finalContent,
          contentFormat: finalFormat,
          templateId,
          styleTheme,
          featuredImage: featuredImage || undefined,
          excerpt: excerpt || undefined,
          categories: categories ? categories.split(",").map((s) => s.trim()) : [],
          tags: tags ? tags.split(",").map((s) => s.trim()) : [],
          ...(htmlSlotMode && { slotValues }),
        }),
      });
      router.push(`/admin/cma/posts/${post.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!org?.id) { setError("No organization found. Go to Connections to set up your account first."); return; }
    if (!accountId) { setError("Select a platform account first"); return; }
    const pubContent = htmlSlotMode && templateId
      ? renderSlotTemplate(htmlTemplate, cssScoped, slotValues, templateId, slotDefinitions)
      : content;
    const pubFormat = htmlSlotMode ? "html" : contentFormat;
    if (!title.trim() || (!htmlSlotMode && !content.trim())) { setError("Title and content are required"); return; }
    setPublishing(true);
    setError(null);
    try {
      const post = await cmaFetch<{ id: string }>("/api/cma/posts", {
        method: "POST",
        body: JSON.stringify({
          orgId: org.id,
          title,
          content: pubContent,
          contentFormat: pubFormat,
          templateId,
          styleTheme,
          featuredImage: featuredImage || undefined,
          excerpt: excerpt || undefined,
          categories: categories ? categories.split(",").map((s) => s.trim()) : [],
          tags: tags ? tags.split(",").map((s) => s.trim()) : [],
          ...(htmlSlotMode && { slotValues }),
        }),
      });
      await cmaFetch(`/api/cma/posts/${post.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ accountId, orgId: org.id }),
      });
      router.push("/admin/cma/posts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  async function handleCurateFromUrl() {
    if (!org?.id || !curateUrl.trim()) {
      setError("Paste a URL to curate");
      return;
    }
    setCurating(true);
    setError(null);
    try {
      const result = await cmaFetch<{
        title: string; blogDraft: string; fbExcerpt: string;
        linkedinExcerpt: string; tags: string[];
      }>("/api/cma/ai/curate", {
        method: "POST",
        body: JSON.stringify({ orgId: org.id, url: curateUrl.trim() }),
      });
      setTitle(result.title);
      setContent(result.blogDraft);
      setExcerpt(result.linkedinExcerpt);
      setTags(result.tags.join(", "));
      setCurateUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Curation failed");
    } finally {
      setCurating(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Template picker shown on initial load — only while org is available */}
      {org?.id && (
        <CmaTemplatePicker
          open={showTemplatePicker}
          onClose={() => setShowTemplatePicker(false)}
          onSelect={handleTemplateSelect}
          orgId={org.id}
        />
      )}
      {org?.id && (
        <CmaFeaturedImagePicker
          open={showImagePicker}
          onClose={() => setShowImagePicker(false)}
          onSelect={setFeaturedImage}
          orgId={org.id}
        />
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compose Post</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={saving || publishing}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Draft
          </Button>
          <Button onClick={handlePublish} disabled={saving || publishing || !accountId}>
            {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Publish
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">{error}</div>
      )}

      {/* Curate from URL + AI Generate */}
      <Card>
        <CardContent className="flex items-center gap-3 py-3">
          <Link2 className="h-4 w-4 text-muted-foreground shrink-0" />
          <input type="url" placeholder="Paste URL to curate with AI..." value={curateUrl}
            onChange={(e) => setCurateUrl(e.target.value)}
            className="flex-1 border-0 bg-transparent text-sm focus:outline-none"
            onKeyDown={(e) => e.key === "Enter" && handleCurateFromUrl()} />
          <Button size="sm" variant="outline" onClick={handleCurateFromUrl} disabled={curating || !curateUrl.trim()}>
            {curating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Curate"}
          </Button>
          <div className="border-l h-6" />
          <Button size="sm" variant="outline" onClick={() => {
            const params = templateId ? `?templateId=${templateId}` : "";
            window.location.href = `/admin/cma/composer/ai-generator${params}`;
          }}>
            <Sparkles className="h-4 w-4 mr-1" /> Generate with AI
          </Button>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Post title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl font-bold border-0 border-b bg-transparent px-0 py-2 focus:outline-none focus:border-primary"
          />

          {/* Content format toggle */}
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
            {([
              { key: "blocks" as const, label: "Visual", icon: Blocks },
              { key: "markdown" as const, label: "Markdown", icon: FileText },
              { key: "html" as const, label: "HTML/CSS/JS", icon: FileCode2 },
            ]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setContentFormat(key);
                  // Reset content when switching formats to avoid format mismatch
                  if (key !== contentFormat) setContent("");
                  setEditorKey((k) => k + 1);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  contentFormat === key
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {htmlSlotMode ? (
            <div className="grid gap-4 lg:grid-cols-2">
              <CmaSlotForm
                slotDefinitions={slotDefinitions}
                slotValues={slotValues}
                onChange={setSlotValues}
                orgId={org?.id}
              />
              {templateId && (
                <CmaHtmlLivePreview
                  htmlTemplate={htmlTemplate}
                  cssScoped={cssScoped}
                  slotValues={slotValues}
                  templateId={templateId}
                  slotDefinitions={slotDefinitions}
                />
              )}
            </div>
          ) : (
            <CmaEditorSwitcher
              key={editorKey}
              contentFormat={contentFormat}
              content={content}
              onContentChange={handleContentChange}
              initialBlocks={initialBlocks}
              orgId={org?.id}
            />
          )}
        </div>

        <CmaComposerSidebar
          featuredImage={featuredImage}
          onFeaturedImageClick={() => setShowImagePicker(true)}
          styleTheme={styleTheme}
          onStyleThemeChange={setStyleTheme}
          excerpt={excerpt}
          onExcerptChange={setExcerpt}
          categories={categories}
          onCategoriesChange={setCategories}
          tags={tags}
          onTagsChange={setTags}
          accountId={accountId}
          onAccountChange={setAccountId}
          accounts={accounts}
          contentFormat={contentFormat}
        />
      </div>
    </div>
  );
}
