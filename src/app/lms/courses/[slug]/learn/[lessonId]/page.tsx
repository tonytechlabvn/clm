"use client";

// Lesson viewer — renders lesson content, tracks progress, navigation

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, Clock,
  Play, FileText, Code, HelpCircle,
} from "lucide-react";

interface LessonData {
  id: string;
  title: string;
  type: string;
  content: string | null;
  videoUrl: string | null;
  estimatedMinutes: number | null;
  section: { id: string; title: string; course: { slug: string; title: string } };
  progress: { status: string; completedAt: string | null; timeSpent: number } | null;
  prevLessonId: string | null;
  nextLessonId: string | null;
}

const TYPE_ICONS: Record<string, React.ElementType> = { text: FileText, video: Play, code: Code, quiz: HelpCircle };

export default function LessonViewerPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const lessonId = params.lessonId as string;
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const startTime = useRef(Date.now());

  const fetchLesson = useCallback(async () => {
    setLoading(true);
    startTime.current = Date.now();
    try {
      const res = await fetch(`/api/lms/courses/${slug}/lessons/${lessonId}`);
      if (res.ok) setLesson(await res.json());
      else router.push(`/lms/courses/${slug}`);
    } catch { router.push(`/lms/courses/${slug}`); }
    finally { setLoading(false); }
  }, [slug, lessonId, router]);

  useEffect(() => { fetchLesson(); }, [fetchLesson]);

  // Mark in-progress on mount
  useEffect(() => {
    if (!lesson || lesson.progress?.status === "completed") return;
    fetch(`/api/lms/lessons/${lessonId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "in_progress" }),
    }).catch(() => {});
  }, [lesson, lessonId]);

  const markComplete = async () => {
    setCompleting(true);
    const timeSpent = Math.round((Date.now() - startTime.current) / 1000);
    try {
      const res = await fetch(`/api/lms/lessons/${lessonId}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed", timeSpent }),
      });
      if (res.ok) fetchLesson();
    } catch { /* handled */ }
    finally { setCompleting(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!lesson) return null;

  const Icon = TYPE_ICONS[lesson.type] || FileText;
  const isCompleted = lesson.progress?.status === "completed";

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/lms/courses/${slug}`}>
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">{lesson.section.course.title} &gt; {lesson.section.title}</p>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Icon className="w-5 h-5" />{lesson.title}
            {isCompleted && <CheckCircle className="w-5 h-5 text-green-600" />}
          </h1>
        </div>
        {lesson.estimatedMinutes && (
          <Badge variant="outline" className="flex items-center gap-1"><Clock className="w-3 h-3" />{lesson.estimatedMinutes}min</Badge>
        )}
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6">
          {lesson.type === "video" && lesson.videoUrl && (
            <div className="aspect-video mb-4 rounded-lg overflow-hidden bg-black">
              <iframe src={lesson.videoUrl} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
            </div>
          )}
          {lesson.content && (
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: renderMarkdown(lesson.content) }} />
          )}
          {!lesson.content && !lesson.videoUrl && (
            <p className="text-muted-foreground text-center py-8">No content available for this lesson.</p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div>
          {lesson.prevLessonId && (
            <Link href={`/lms/courses/${slug}/learn/${lesson.prevLessonId}`}>
              <Button variant="outline" size="sm"><ChevronLeft className="w-4 h-4 mr-1" />Previous</Button>
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isCompleted && (
            <Button size="sm" onClick={markComplete} disabled={completing}>
              <CheckCircle className="w-4 h-4 mr-1" />{completing ? "Saving..." : "Mark Complete"}
            </Button>
          )}
          {lesson.nextLessonId && (
            <Link href={`/lms/courses/${slug}/learn/${lesson.nextLessonId}`}>
              <Button variant={isCompleted ? "default" : "outline"} size="sm">Next<ChevronRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple markdown-to-HTML (code blocks, bold, italic, headers, links, lists)
function renderMarkdown(md: string): string {
  return md
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-muted p-4 rounded-md overflow-x-auto"><code>$2</code></pre>')
    .replace(/`([^`]+)`/g, '<code class="bg-muted px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-semibold mt-6 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-3">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-primary underline" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^(?!<)(.+)$/gm, "<p>$1</p>");
}
