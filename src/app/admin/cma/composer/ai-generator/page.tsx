"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cmaFetch } from "@/lib/cma/use-cma-api";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { TopicInputStep } from "@/components/cma/ai-generator/ai-generator-step-topic-input";
import { OutlineReviewStep } from "@/components/cma/ai-generator/ai-generator-step-outline-review";
import { ContentReviewStep } from "@/components/cma/ai-generator/ai-generator-step-content-review";
import { ArrowLeft, Sparkles, Globe, Facebook } from "lucide-react";

type Tone = "professional" | "casual" | "technical" | "educational";
type SourceType = "url" | "text" | "image" | "video";
type TargetPlatform = "blog" | "facebook" | "both";
interface OutlineSection { heading: string; keyPoints: string[] }

interface SourceExtractionResult {
  sourceType: SourceType;
  title: string;
  summary: string;
  keyInsights: string[];
  suggestedTopics: string[];
  suggestedKeywords: string[];
  originalContent?: string;
}

export default function CmaAiGeneratorPage() {
  const router = useRouter();
  const { org } = useCmaOrg();
  const [step, setStep] = useState(1);
  const [targetPlatform, setTargetPlatform] = useState<TargetPlatform>("blog");

  // Template context — loaded when templateId is in URL params
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateHtml, setTemplateHtml] = useState<string | null>(null);
  const [templateCss, setTemplateCss] = useState<string | null>(null);

  // Load template data if templateId is provided via URL query param
  useEffect(() => {
    if (typeof window === "undefined" || !org?.id) return;
    const params = new URLSearchParams(window.location.search);
    const tplId = params.get("templateId");
    if (!tplId) return;
    setTemplateId(tplId);
    fetch(`/api/cma/templates/${tplId}?orgId=${org.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.htmlTemplate) setTemplateHtml(data.htmlTemplate);
        if (data?.cssScoped) setTemplateCss(data.cssScoped);
      })
      .catch(() => {}); // silently fail — will use default if template load fails
  }, [org?.id]);

  // Step 1 state
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [language, setLanguage] = useState("en");
  const [wordCount, setWordCount] = useState(1500);
  // Source extraction state
  const [sourceContext, setSourceContext] = useState("");
  const [extracting, setExtracting] = useState(false);

  // Step 2 state
  const [title, setTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [sections, setSections] = useState<OutlineSection[]>([]);
  const [imagePrompts, setImagePrompts] = useState<string[]>([]);

  // Step 3 state
  const [blogContent, setBlogContent] = useState("");
  const [blogCss, setBlogCss] = useState("");
  const [fbExcerpt, setFbExcerpt] = useState("");
  const [linkedinExcerpt, setLinkedinExcerpt] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Extract and summarize source material via AI */
  async function handleExtractSource(
    input: string,
    sourceType?: SourceType
  ): Promise<SourceExtractionResult | null> {
    if (!org?.id) { setError("No organization found"); return null; }
    setExtracting(true);
    setError(null);
    try {
      const result = await cmaFetch<SourceExtractionResult>(
        "/api/cma/ai/extract-source",
        {
          method: "POST",
          body: JSON.stringify({ orgId: org.id, input, sourceType }),
        }
      );
      // Store the summary as source context for outline generation
      const context = [
        `Source: ${result.title}`,
        `Summary: ${result.summary}`,
        `Key Insights: ${result.keyInsights.join("; ")}`,
      ].join("\n");
      setSourceContext(context);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Source extraction failed");
      return null;
    } finally {
      setExtracting(false);
    }
  }

  async function handleGenerateOutline() {
    if (!org?.id || !topic.trim()) { setError("Topic is required"); return; }
    setLoading(true); setError(null);
    try {
      const result = await cmaFetch<{
        title: string; metaDescription: string;
        sections: OutlineSection[]; suggestedImagePrompts: string[];
      }>("/api/cma/ai/generate-outline", {
        method: "POST",
        body: JSON.stringify({
          orgId: org.id, topic, tone, language, targetWordCount: wordCount,
          keywords: keywords ? keywords.split(",").map((k) => k.trim()) : [],
          sourceContext: sourceContext || undefined,
          targetPlatform,
        }),
      });
      setTitle(result.title); setMetaDesc(result.metaDescription);
      setSections(result.sections); setImagePrompts(result.suggestedImagePrompts);
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Outline generation failed");
    } finally { setLoading(false); }
  }

  async function handleGenerateContent() {
    if (!org?.id) return;
    setLoading(true); setError(null);
    try {
      const result = await cmaFetch<{
        blogContent: string; blogCss: string; fbExcerpt: string; linkedinExcerpt: string; suggestedImagePrompts: string[];
      }>("/api/cma/ai/generate-content", {
        method: "POST",
        body: JSON.stringify({
          orgId: org.id, outline: { title, sections }, tone, language, targetWordCount: wordCount,
          sourceContext: sourceContext || undefined,
          templateId: templateId || undefined,
          targetPlatform,
        }),
      });
      setBlogContent(result.blogContent); setBlogCss(result.blogCss || "");
      setFbExcerpt(result.fbExcerpt); setLinkedinExcerpt(result.linkedinExcerpt);
      if (result.suggestedImagePrompts.length) setImagePrompts(result.suggestedImagePrompts);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Content generation failed");
    } finally { setLoading(false); }
  }

  async function handleSaveAsDraft() {
    if (!org?.id) return;
    setLoading(true); setError(null);
    try {
      const posts: string[] = [];

      // Save blog post (if target is blog or both)
      if ((targetPlatform === "blog" || targetPlatform === "both") && blogContent) {
        let finalHtml = blogContent;
        let finalCss = blogCss;
        if (templateCss) finalCss = `${templateCss}\n${blogCss}`;

        const htmlContent = JSON.stringify({ html: finalHtml, css: finalCss, js: "" });
        const post = await cmaFetch<{ id: string }>("/api/cma/posts", {
          method: "POST",
          body: JSON.stringify({
            orgId: org.id, title, content: htmlContent,
            contentFormat: "html",
            templateId: templateId || undefined,
            excerpt: linkedinExcerpt || undefined,
            tags: [], categories: [],
          }),
        });
        posts.push(post.id);
      }

      // Save Facebook post (if target is facebook or both)
      if ((targetPlatform === "facebook" || targetPlatform === "both") && fbExcerpt) {
        const fbTitle = targetPlatform === "facebook" ? title : `[FB] ${title}`;
        const post = await cmaFetch<{ id: string }>("/api/cma/posts", {
          method: "POST",
          body: JSON.stringify({
            orgId: org.id, title: fbTitle, content: fbExcerpt,
            contentFormat: "markdown",
            source: "web",
          }),
        });
        posts.push(post.id);
      }

      if (posts.length > 0) {
        router.push(`/admin/cma/posts/${posts[0]}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally { setLoading(false); }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6" /> AI Content Generator
          </h1>
          <p className="text-sm text-muted-foreground">Step {step} of 3</p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/cma/composer")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Composer
        </Button>
      </div>

      <div className="flex gap-1">
        {[1, 2, 3].map((s) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
        ))}
      </div>

      {/* Target platform selector */}
      <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg w-fit">
        {([
          { key: "blog" as const, label: "Blog Post", icon: Globe },
          { key: "facebook" as const, label: "Facebook Post", icon: Facebook },
          { key: "both" as const, label: "Blog + Facebook", icon: Sparkles },
        ]).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTargetPlatform(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              targetPlatform === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="h-3.5 w-3.5" /> {label}
          </button>
        ))}
      </div>

      {targetPlatform === "facebook" && (
        <div className="rounded-md bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 text-sm">
          Facebook mode: AI will generate short, engaging plain text optimized for Facebook. No HTML formatting.
        </div>
      )}

      {templateId && (
        <div className="rounded-md bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Template applied: AI content will be merged into the selected template style when saved.
        </div>
      )}

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">{error}</div>
      )}

      {step === 1 && (
        <TopicInputStep
          topic={topic} onTopicChange={setTopic} keywords={keywords} onKeywordsChange={setKeywords}
          tone={tone} onToneChange={setTone} language={language} onLanguageChange={setLanguage}
          wordCount={wordCount} onWordCountChange={setWordCount} onGenerate={handleGenerateOutline} loading={loading}
          sourceContext={sourceContext} onSourceContextChange={setSourceContext}
          onExtractSource={handleExtractSource} extracting={extracting}
        />
      )}
      {step === 2 && (
        <OutlineReviewStep title={title} onTitleChange={setTitle} metaDesc={metaDesc} onMetaDescChange={setMetaDesc}
          sections={sections} onSectionsChange={setSections} onBack={() => setStep(1)}
          onGenerate={handleGenerateContent} loading={loading} />
      )}
      {step === 3 && (
        <ContentReviewStep blogContent={blogContent} blogCss={blogCss}
          onBlogContentChange={setBlogContent} onBlogCssChange={setBlogCss}
          fbExcerpt={fbExcerpt} onFbExcerptChange={setFbExcerpt}
          linkedinExcerpt={linkedinExcerpt} onLinkedinExcerptChange={setLinkedinExcerpt}
          imagePrompts={imagePrompts} onBack={() => setStep(2)} onSave={handleSaveAsDraft} loading={loading}
          templateHtml={templateHtml} templateCss={templateCss} />
      )}
    </div>
  );
}
