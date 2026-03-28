"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Loader2, Sparkles, Link2, FileText, Image, Video,
  ChevronRight, Lightbulb, CheckCircle2,
} from "lucide-react";

type Tone = "professional" | "casual" | "technical" | "educational";
type InputMode = "source" | "topic";
type SourceType = "url" | "text" | "image" | "video";

interface SourceExtractionResult {
  sourceType: SourceType;
  title: string;
  summary: string;
  keyInsights: string[];
  suggestedTopics: string[];
  suggestedKeywords: string[];
}

interface TopicInputStepProps {
  topic: string;
  onTopicChange: (v: string) => void;
  keywords: string;
  onKeywordsChange: (v: string) => void;
  tone: Tone;
  onToneChange: (v: Tone) => void;
  language: string;
  onLanguageChange: (v: string) => void;
  wordCount: number;
  onWordCountChange: (v: number) => void;
  onGenerate: () => void;
  loading: boolean;
  // Source extraction props
  sourceContext?: string;
  onSourceContextChange?: (v: string) => void;
  onExtractSource?: (input: string, sourceType?: SourceType) => Promise<SourceExtractionResult | null>;
  extracting?: boolean;
}

const SOURCE_TABS: { key: SourceType; label: string; icon: typeof Link2; placeholder: string }[] = [
  { key: "url", label: "Blog / Article", icon: Link2, placeholder: "Paste a blog post or article URL..." },
  { key: "video", label: "Video", icon: Video, placeholder: "Paste a YouTube or Vimeo URL..." },
  { key: "image", label: "Image", icon: Image, placeholder: "Paste an image URL..." },
  { key: "text", label: "Paste Text", icon: FileText, placeholder: "Paste your content, notes, or any text here..." },
];

export function TopicInputStep({
  topic, onTopicChange, keywords, onKeywordsChange, tone, onToneChange,
  language, onLanguageChange, wordCount, onWordCountChange, onGenerate, loading,
  sourceContext, onSourceContextChange, onExtractSource, extracting,
}: TopicInputStepProps) {
  const [inputMode, setInputMode] = useState<InputMode>("source");
  const [sourceTab, setSourceTab] = useState<SourceType>("url");
  const [sourceInput, setSourceInput] = useState("");
  const [extractionResult, setExtractionResult] = useState<SourceExtractionResult | null>(null);

  const hasSourceSupport = !!onExtractSource;

  async function handleExtract() {
    if (!onExtractSource || !sourceInput.trim()) return;
    const result = await onExtractSource(sourceInput.trim(), sourceTab);
    if (result) {
      setExtractionResult(result);
      // Auto-fill topic and keywords from extraction
      if (!topic.trim()) onTopicChange(result.suggestedTopics[0] || result.title);
      if (!keywords.trim()) onKeywordsChange(result.suggestedKeywords.join(", "));
    }
  }

  function handleSelectTopic(suggestedTopic: string) {
    onTopicChange(suggestedTopic);
  }

  const canGenerate = topic.trim() && !loading && !extracting;

  return (
    <div className="space-y-4">
      {/* Input mode toggle */}
      {hasSourceSupport && (
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
          <button
            onClick={() => setInputMode("source")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              inputMode === "source"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="h-4 w-4" /> From Source
          </button>
          <button
            onClick={() => setInputMode("topic")}
            className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
              inputMode === "topic"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="h-4 w-4" /> From Topic
          </button>
        </div>
      )}

      {/* Source input section */}
      {inputMode === "source" && hasSourceSupport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Provide your source material
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Paste a URL, video link, image, or text. AI will analyze it and generate enhanced content.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Source type tabs */}
            <div className="flex gap-1 p-1 bg-muted/30 rounded-lg">
              {SOURCE_TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setSourceTab(key); setSourceInput(""); setExtractionResult(null); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer flex-1 justify-center ${
                    sourceTab === key
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </button>
              ))}
            </div>

            {/* Source input */}
            {sourceTab === "text" ? (
              <textarea
                value={sourceInput}
                onChange={(e) => setSourceInput(e.target.value)}
                placeholder={SOURCE_TABS.find((t) => t.key === sourceTab)?.placeholder}
                rows={6}
                className="w-full rounded-md border px-3 py-2 text-sm resize-none"
              />
            ) : (
              <div className="flex gap-2">
                <input
                  type="url"
                  value={sourceInput}
                  onChange={(e) => setSourceInput(e.target.value)}
                  placeholder={SOURCE_TABS.find((t) => t.key === sourceTab)?.placeholder}
                  className="flex-1 rounded-md border px-3 py-2 text-sm"
                  onKeyDown={(e) => e.key === "Enter" && handleExtract()}
                />
              </div>
            )}

            <Button
              onClick={handleExtract}
              disabled={extracting || !sourceInput.trim()}
              className="w-full"
            >
              {extracting ? (
                <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Analyzing source...</>
              ) : (
                <><Sparkles className="h-4 w-4 mr-2" /> Analyze &amp; Extract</>
              )}
            </Button>

            {/* Extraction result */}
            {extractionResult && (
              <div className="rounded-lg border bg-muted/20 p-4 space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Source analyzed successfully
                </div>

                <div>
                  <h4 className="text-sm font-medium">{extractionResult.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                    {extractionResult.summary}
                  </p>
                </div>

                {extractionResult.keyInsights.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Key Insights:</p>
                    <ul className="text-xs space-y-0.5">
                      {extractionResult.keyInsights.slice(0, 5).map((insight, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <Lightbulb className="h-3 w-3 text-yellow-500 mt-0.5 shrink-0" />
                          <span>{insight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {extractionResult.suggestedTopics.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Suggested blog topics (click to use):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {extractionResult.suggestedTopics.map((t, i) => (
                        <button
                          key={i}
                          onClick={() => handleSelectTopic(t)}
                          className={`text-xs px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${
                            topic === t
                              ? "bg-primary text-primary-foreground border-primary"
                              : "hover:bg-muted"
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Topic & generation settings — always visible */}
      <Card>
        <CardHeader>
          <CardTitle>
            {inputMode === "source" && extractionResult
              ? "Customize your content"
              : "What do you want to write about?"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Topic *</label>
            <input type="text" value={topic} onChange={(e) => onTopicChange(e.target.value)}
              placeholder="e.g., Best practices for online course design"
              className="w-full mt-1 rounded-md border px-3 py-2" />
          </div>
          <div>
            <label className="text-sm font-medium">Keywords (comma-separated)</label>
            <input type="text" value={keywords} onChange={(e) => onKeywordsChange(e.target.value)}
              placeholder="e.g., edtech, course design, LMS"
              className="w-full mt-1 rounded-md border px-3 py-2" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Tone</label>
              <select value={tone} onChange={(e) => onToneChange(e.target.value as Tone)}
                className="w-full mt-1 rounded-md border px-3 py-2">
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="technical">Technical</option>
                <option value="educational">Educational</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Language</label>
              <select value={language} onChange={(e) => onLanguageChange(e.target.value)}
                className="w-full mt-1 rounded-md border px-3 py-2">
                <option value="en">English</option>
                <option value="vi">Vietnamese</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Word Count</label>
              <input type="range" min={500} max={3000} step={100} value={wordCount}
                onChange={(e) => onWordCountChange(parseInt(e.target.value))}
                className="w-full mt-3" />
              <span className="text-xs text-muted-foreground">{wordCount} words</span>
            </div>
          </div>
          <Button onClick={onGenerate} disabled={!canGenerate} className="w-full">
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Generating Outline...</>
            ) : (
              <><ChevronRight className="h-4 w-4 mr-2" /> Generate Outline</>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
