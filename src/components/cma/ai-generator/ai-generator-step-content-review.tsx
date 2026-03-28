"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CmaMarkdownEditor } from "@/components/cma/cma-markdown-editor";
import { Loader2, ArrowLeft, Save } from "lucide-react";

interface ContentReviewStepProps {
  blogContent: string;
  onBlogContentChange: (v: string) => void;
  fbExcerpt: string;
  onFbExcerptChange: (v: string) => void;
  linkedinExcerpt: string;
  onLinkedinExcerptChange: (v: string) => void;
  imagePrompts: string[];
  onBack: () => void;
  onSave: () => void;
  loading: boolean;
}

export function ContentReviewStep({
  blogContent, onBlogContentChange, fbExcerpt, onFbExcerptChange,
  linkedinExcerpt, onLinkedinExcerptChange, imagePrompts, onBack, onSave, loading,
}: ContentReviewStepProps) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Generated Blog Post</CardTitle></CardHeader>
        <CardContent>
          <CmaMarkdownEditor value={blogContent} onChange={onBlogContentChange} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm">Facebook Excerpt</CardTitle></CardHeader>
          <CardContent>
            <textarea value={fbExcerpt} onChange={(e) => onFbExcerptChange(e.target.value)}
              maxLength={200} className="w-full rounded border px-3 py-2 text-sm min-h-[80px]" />
            <span className="text-xs text-muted-foreground">{fbExcerpt.length}/200</span>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm">LinkedIn Excerpt</CardTitle></CardHeader>
          <CardContent>
            <textarea value={linkedinExcerpt} onChange={(e) => onLinkedinExcerptChange(e.target.value)}
              maxLength={300} className="w-full rounded border px-3 py-2 text-sm min-h-[80px]" />
            <span className="text-xs text-muted-foreground">{linkedinExcerpt.length}/300</span>
          </CardContent>
        </Card>
      </div>

      {imagePrompts.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Suggested Images</CardTitle></CardHeader>
          <CardContent>
            <ul className="text-sm space-y-1">
              {imagePrompts.map((p, i) => (
                <li key={i} className="text-muted-foreground">• {p}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Edit Outline
        </Button>
        <Button onClick={onSave} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save as Draft & Review
        </Button>
      </div>
    </div>
  );
}
