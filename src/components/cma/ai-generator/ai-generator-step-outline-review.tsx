"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, Plus, Trash2, GripVertical } from "lucide-react";

interface OutlineSection { heading: string; keyPoints: string[] }

interface OutlineReviewStepProps {
  title: string;
  onTitleChange: (v: string) => void;
  metaDesc: string;
  onMetaDescChange: (v: string) => void;
  sections: OutlineSection[];
  onSectionsChange: (v: OutlineSection[]) => void;
  onBack: () => void;
  onGenerate: () => void;
  loading: boolean;
  targetPlatform?: "blog" | "facebook" | "both";
  // Facebook-specific fields
  fbDraft?: string;
  onFbDraftChange?: (v: string) => void;
}

export function OutlineReviewStep({
  title, onTitleChange, metaDesc, onMetaDescChange,
  sections, onSectionsChange, onBack, onGenerate, loading,
  targetPlatform = "blog", fbDraft, onFbDraftChange,
}: OutlineReviewStepProps) {
  const isFacebook = targetPlatform === "facebook";
  function updateSection(idx: number, field: keyof OutlineSection, value: string | string[]) {
    onSectionsChange(sections.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  }
  function removeSection(idx: number) { onSectionsChange(sections.filter((_, i) => i !== idx)); }
  function addSection() { onSectionsChange([...sections, { heading: "New Section", keyPoints: [""] }]); }
  function moveSection(from: number, to: number) {
    if (to < 0 || to >= sections.length) return;
    const copy = [...sections];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    onSectionsChange(copy);
  }

  // Facebook mode: simple post editor instead of blog outline
  if (isFacebook) {
    const charCount = (fbDraft || "").length;
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader><CardTitle>Review & Edit Facebook Post</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Post Content</label>
              <textarea
                value={fbDraft || ""}
                onChange={(e) => onFbDraftChange?.(e.target.value)}
                rows={10}
                placeholder="Write your Facebook post here... Use hooks, emojis, and a call to action."
                className="w-full mt-1 rounded-md border px-3 py-2 text-sm resize-none"
              />
              <div className="flex justify-between mt-1">
                <p className="text-xs text-muted-foreground">Tips: Start with a hook, keep it concise, end with a question or CTA</p>
                <span className={`text-xs ${charCount > 63206 ? "text-destructive" : "text-muted-foreground"}`}>
                  {charCount.toLocaleString()} / 63,206
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Hashtags</label>
              <input type="text" value={metaDesc} onChange={(e) => onMetaDescChange(e.target.value)}
                placeholder="#AI #TonyTechLab #Education"
                className="w-full mt-1 rounded-md border px-3 py-2 text-sm" />
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-between">
          <Button variant="outline" onClick={onBack}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          <Button onClick={onGenerate} disabled={loading || !(fbDraft || "").trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ArrowRight className="h-4 w-4 mr-1" />}
            Save as Draft
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Review & Edit Outline</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Title</label>
            <input type="text" value={title} onChange={(e) => onTitleChange(e.target.value)}
              className="w-full mt-1 rounded-md border px-3 py-2 font-medium" />
          </div>
          <div>
            <label className="text-sm font-medium">Meta Description</label>
            <input type="text" value={metaDesc} onChange={(e) => onMetaDescChange(e.target.value)}
              maxLength={160} className="w-full mt-1 rounded-md border px-3 py-2 text-sm" />
            <span className="text-xs text-muted-foreground">{metaDesc.length}/160</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Sections ({sections.length})</CardTitle>
            <Button size="sm" variant="outline" onClick={addSection}>
              <Plus className="h-4 w-4 mr-1" /> Add Section
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {sections.map((section, idx) => (
            <div key={idx} className="flex gap-2 p-3 border rounded-md">
              <div className="flex flex-col gap-1 pt-2">
                <button onClick={() => moveSection(idx, idx - 1)} className="text-muted-foreground hover:text-foreground text-xs">▲</button>
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <button onClick={() => moveSection(idx, idx + 1)} className="text-muted-foreground hover:text-foreground text-xs">▼</button>
              </div>
              <div className="flex-1 space-y-2">
                <input type="text" value={section.heading}
                  onChange={(e) => updateSection(idx, "heading", e.target.value)}
                  className="w-full rounded border px-2 py-1 text-sm font-medium" />
                <textarea value={section.keyPoints.join("\n")}
                  onChange={(e) => updateSection(idx, "keyPoints", e.target.value.split("\n"))}
                  className="w-full rounded border px-2 py-1 text-sm min-h-[60px]"
                  placeholder="Key points (one per line)" />
              </div>
              <Button size="sm" variant="ghost" onClick={() => removeSection(idx)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Edit Topic
        </Button>
        <Button onClick={onGenerate} disabled={loading || sections.length === 0}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
          Generate Full Content
        </Button>
      </div>
    </div>
  );
}
