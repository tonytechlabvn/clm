"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cmaFetch } from "@/lib/cma/use-cma-api";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { TopicInputStep } from "@/components/cma/ai-generator/ai-generator-step-topic-input";
import { OutlineReviewStep } from "@/components/cma/ai-generator/ai-generator-step-outline-review";
import { ContentReviewStep } from "@/components/cma/ai-generator/ai-generator-step-content-review";
import { ArrowLeft, Sparkles } from "lucide-react";

type Tone = "professional" | "casual" | "technical" | "educational";
interface OutlineSection { heading: string; keyPoints: string[] }

export default function CmaAiGeneratorPage() {
  const router = useRouter();
  const { org } = useCmaOrg();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [language, setLanguage] = useState("en");
  const [wordCount, setWordCount] = useState(1500);

  // Step 2 state
  const [title, setTitle] = useState("");
  const [metaDesc, setMetaDesc] = useState("");
  const [sections, setSections] = useState<OutlineSection[]>([]);
  const [imagePrompts, setImagePrompts] = useState<string[]>([]);

  // Step 3 state
  const [blogContent, setBlogContent] = useState("");
  const [fbExcerpt, setFbExcerpt] = useState("");
  const [linkedinExcerpt, setLinkedinExcerpt] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        blogContent: string; fbExcerpt: string; linkedinExcerpt: string; suggestedImagePrompts: string[];
      }>("/api/cma/ai/generate-content", {
        method: "POST",
        body: JSON.stringify({ orgId: org.id, outline: { title, sections }, tone, language, targetWordCount: wordCount }),
      });
      setBlogContent(result.blogContent); setFbExcerpt(result.fbExcerpt);
      setLinkedinExcerpt(result.linkedinExcerpt);
      if (result.suggestedImagePrompts.length) setImagePrompts(result.suggestedImagePrompts);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Content generation failed");
    } finally { setLoading(false); }
  }

  async function handleSaveAsDraft() {
    if (!org?.id || !blogContent) return;
    setLoading(true); setError(null);
    try {
      // Save already-generated content as draft — no re-generation needed
      const post = await cmaFetch<{ id: string }>("/api/cma/posts", {
        method: "POST",
        body: JSON.stringify({
          orgId: org.id, title, content: blogContent,
          excerpt: linkedinExcerpt || undefined,
          tags: [], categories: [],
        }),
      });
      router.push(`/admin/cma/posts/${post.id}`);
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

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">{error}</div>
      )}

      {step === 1 && (
        <TopicInputStep topic={topic} onTopicChange={setTopic} keywords={keywords} onKeywordsChange={setKeywords}
          tone={tone} onToneChange={setTone} language={language} onLanguageChange={setLanguage}
          wordCount={wordCount} onWordCountChange={setWordCount} onGenerate={handleGenerateOutline} loading={loading} />
      )}
      {step === 2 && (
        <OutlineReviewStep title={title} onTitleChange={setTitle} metaDesc={metaDesc} onMetaDescChange={setMetaDesc}
          sections={sections} onSectionsChange={setSections} onBack={() => setStep(1)}
          onGenerate={handleGenerateContent} loading={loading} />
      )}
      {step === 3 && (
        <ContentReviewStep blogContent={blogContent} onBlogContentChange={setBlogContent}
          fbExcerpt={fbExcerpt} onFbExcerptChange={setFbExcerpt}
          linkedinExcerpt={linkedinExcerpt} onLinkedinExcerptChange={setLinkedinExcerpt}
          imagePrompts={imagePrompts} onBack={() => setStep(2)} onSave={handleSaveAsDraft} loading={loading} />
      )}
    </div>
  );
}
