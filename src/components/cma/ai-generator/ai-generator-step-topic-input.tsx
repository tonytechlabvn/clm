"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";

type Tone = "professional" | "casual" | "technical" | "educational";

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
}

export function TopicInputStep({
  topic, onTopicChange, keywords, onKeywordsChange, tone, onToneChange,
  language, onLanguageChange, wordCount, onWordCountChange, onGenerate, loading,
}: TopicInputStepProps) {
  return (
    <Card>
      <CardHeader><CardTitle>What do you want to write about?</CardTitle></CardHeader>
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
        <Button onClick={onGenerate} disabled={loading || !topic.trim()}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Generate Outline
        </Button>
      </CardContent>
    </Card>
  );
}
