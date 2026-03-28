"use client";

// Course builder — instructor tool to manage sections and lessons

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save,
  FileText, Play, Code, HelpCircle, ChevronDown, ChevronRight,
} from "lucide-react";

interface LessonItem {
  id: string; title: string; type: string; content: string | null;
  videoUrl: string | null; order: number; estimatedMinutes: number | null; isPublished: boolean;
}
interface SectionItem { id: string; title: string; order: number; isPublished: boolean; lessons: LessonItem[] }
interface CourseData {
  id: string; title: string; slug: string; description: string | null;
  level: string; status: string; estimatedHours: number | null; tags: string[];
  sections: SectionItem[];
}

const TYPE_ICONS: Record<string, React.ElementType> = { text: FileText, video: Play, code: Code, quiz: HelpCircle };

export default function CourseBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [course, setCourse] = useState<CourseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingLesson, setEditingLesson] = useState<string | null>(null);

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lms/courses/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
        setExpandedSections(new Set(data.sections.map((s: SectionItem) => s.id)));
      } else router.push("/lms");
    } catch { router.push("/lms"); }
    finally { setLoading(false); }
  }, [slug, router]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!course) return null;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push(`/lms/courses/${slug}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Course Builder</h1>
          <p className="text-muted-foreground">{course.title}</p>
        </div>
        <Badge variant={course.status === "published" ? "default" : "secondary"}>{course.status}</Badge>
      </div>

      {/* Course metadata editor */}
      <CourseMetaEditor course={course} onUpdated={fetchCourse} />

      {/* Sections */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sections & Lessons</h2>
          <AddSectionButton slug={slug} courseId={course.id} onAdded={fetchCourse} />
        </div>

        {course.sections.sort((a, b) => a.order - b.order).map((section) => (
          <Card key={section.id}>
            <div className="flex items-center px-4 py-3 gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              <button className="flex-1 text-left flex items-center gap-2" onClick={() => {
                setExpandedSections(prev => { const n = new Set(prev); n.has(section.id) ? n.delete(section.id) : n.add(section.id); return n; });
              }}>
                {expandedSections.has(section.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-medium">{section.title}</span>
                <span className="text-xs text-muted-foreground">({section.lessons.length} lessons)</span>
              </button>
              <DeleteButton url={`/api/lms/courses/${slug}/sections/${section.id}`} onDeleted={fetchCourse} label="section" />
            </div>

            {expandedSections.has(section.id) && (
              <div className="border-t">
                {section.lessons.sort((a, b) => a.order - b.order).map((lesson) => {
                  const Icon = TYPE_ICONS[lesson.type] || FileText;
                  return (
                    <div key={lesson.id}>
                      <div className="flex items-center gap-3 px-6 py-2.5 hover:bg-muted/30 text-sm">
                        <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                        <Icon className="w-4 h-4 text-muted-foreground" />
                        <button className="flex-1 text-left" onClick={() => setEditingLesson(editingLesson === lesson.id ? null : lesson.id)}>
                          {lesson.title}
                        </button>
                        <Badge variant="outline" className="text-xs">{lesson.type}</Badge>
                        <DeleteButton url={`/api/lms/courses/${slug}/lessons/${lesson.id}`} onDeleted={fetchCourse} label="lesson" />
                      </div>
                      {editingLesson === lesson.id && (
                        <LessonEditor lesson={lesson} slug={slug} onUpdated={() => { fetchCourse(); setEditingLesson(null); }} />
                      )}
                    </div>
                  );
                })}
                <AddLessonButton slug={slug} sectionId={section.id} onAdded={fetchCourse} />
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function CourseMetaEditor({ course, onUpdated }: { course: CourseData; onUpdated: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(course.title);
  const [description, setDescription] = useState(course.description || "");
  const [level, setLevel] = useState(course.level);
  const [status, setStatus] = useState(course.status);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/lms/courses/${course.slug}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: description || undefined, level, status }),
      });
      if (res.ok) { onUpdated(); setEditing(false); }
    } catch { /* handled */ }
    finally { setSaving(false); }
  };

  if (!editing) return (
    <Button variant="outline" size="sm" onClick={() => setEditing(true)}>Edit Course Info</Button>
  );

  return (
    <Card><CardContent className="pt-6 space-y-3">
      <input className="w-full border rounded-md px-3 py-2 text-sm" value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" />
      <textarea className="w-full border rounded-md px-3 py-2 text-sm" rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Description" />
      <div className="flex gap-2">
        <select className="border rounded-md px-3 py-2 text-sm" value={level} onChange={e => setLevel(e.target.value)}>
          <option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option>
        </select>
        <select className="border rounded-md px-3 py-2 text-sm" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option>
        </select>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={() => setEditing(false)}>Cancel</Button>
        <Button size="sm" onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" />{saving ? "Saving..." : "Save"}</Button>
      </div>
    </CardContent></Card>
  );
}

function AddSectionButton({ slug, courseId, onAdded }: { slug: string; courseId: string; onAdded: () => void }) {
  const [title, setTitle] = useState(""); const [adding, setAdding] = useState(false); const [open, setOpen] = useState(false);
  const add = async () => {
    if (!title.trim()) return; setAdding(true);
    try {
      const res = await fetch(`/api/lms/courses/${slug}/sections`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: title.trim() }) });
      if (res.ok) { onAdded(); setTitle(""); setOpen(false); }
    } catch {} finally { setAdding(false); }
  };
  if (!open) return <Button variant="outline" size="sm" onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-1" />Add Section</Button>;
  return (
    <div className="flex gap-2 items-center">
      <input className="border rounded-md px-3 py-1.5 text-sm" placeholder="Section title" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
      <Button size="sm" onClick={add} disabled={adding || !title.trim()}>Add</Button>
      <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
    </div>
  );
}

function AddLessonButton({ slug, sectionId, onAdded }: { slug: string; sectionId: string; onAdded: () => void }) {
  const [title, setTitle] = useState(""); const [type, setType] = useState("text"); const [adding, setAdding] = useState(false); const [open, setOpen] = useState(false);
  const add = async () => {
    if (!title.trim()) return; setAdding(true);
    try {
      const res = await fetch(`/api/lms/courses/${slug}/lessons`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sectionId, title: title.trim(), type }) });
      if (res.ok) { onAdded(); setTitle(""); setOpen(false); }
    } catch {} finally { setAdding(false); }
  };
  if (!open) return <button className="w-full text-left px-6 py-2 text-sm text-muted-foreground hover:bg-muted/30 flex items-center gap-1" onClick={() => setOpen(true)}><Plus className="w-3.5 h-3.5" />Add lesson</button>;
  return (
    <div className="flex gap-2 items-center px-6 py-2">
      <input className="border rounded-md px-3 py-1.5 text-sm flex-1" placeholder="Lesson title" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === "Enter" && add()} />
      <select className="border rounded-md px-2 py-1.5 text-sm" value={type} onChange={e => setType(e.target.value)}>
        <option value="text">Text</option><option value="video">Video</option><option value="code">Code</option><option value="quiz">Quiz</option>
      </select>
      <Button size="sm" onClick={add} disabled={adding || !title.trim()}>Add</Button>
      <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>X</Button>
    </div>
  );
}

function LessonEditor({ lesson, slug, onUpdated }: { lesson: LessonItem; slug: string; onUpdated: () => void }) {
  const [content, setContent] = useState(lesson.content || "");
  const [videoUrl, setVideoUrl] = useState(lesson.videoUrl || "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    try {
      await fetch(`/api/lms/courses/${slug}/lessons/${lesson.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: content || undefined, videoUrl: videoUrl || undefined }) });
      onUpdated();
    } catch {} finally { setSaving(false); }
  };
  return (
    <div className="px-6 py-3 bg-muted/20 border-t space-y-2">
      {(lesson.type === "text" || lesson.type === "code" || lesson.type === "quiz") && (
        <textarea className="w-full border rounded-md px-3 py-2 text-sm font-mono" rows={8} placeholder="Lesson content (markdown)" value={content} onChange={e => setContent(e.target.value)} />
      )}
      {lesson.type === "video" && (
        <input className="w-full border rounded-md px-3 py-2 text-sm" placeholder="Video URL (YouTube/Vimeo embed)" value={videoUrl} onChange={e => setVideoUrl(e.target.value)} />
      )}
      <div className="flex justify-end"><Button size="sm" onClick={save} disabled={saving}><Save className="w-4 h-4 mr-1" />{saving ? "Saving..." : "Save"}</Button></div>
    </div>
  );
}

function DeleteButton({ url, onDeleted, label }: { url: string; onDeleted: () => void; label: string }) {
  const [confirming, setConfirming] = useState(false);
  const del = async () => {
    try { const res = await fetch(url, { method: "DELETE" }); if (res.ok) onDeleted(); } catch {} finally { setConfirming(false); }
  };
  if (confirming) return (
    <div className="flex gap-1">
      <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={del}>Delete</Button>
      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setConfirming(false)}>No</Button>
    </div>
  );
  return <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setConfirming(true)}><Trash2 className="w-3.5 h-3.5 text-muted-foreground" /></Button>;
}
