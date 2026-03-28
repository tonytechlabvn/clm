"use client";

// Course detail — overview, sections/lessons, enroll button, progress

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft, BookOpen, Clock, Users, ChevronDown, ChevronRight,
  Play, FileText, Code, HelpCircle, Settings,
} from "lucide-react";

interface LessonItem { id: string; title: string; type: string; estimatedMinutes: number | null; isPublished: boolean; order: number }
interface SectionItem { id: string; title: string; order: number; isPublished: boolean; lessons: LessonItem[] }
interface CourseDetail {
  id: string; title: string; slug: string; description: string | null;
  thumbnailUrl: string | null; level: string; status: string;
  estimatedHours: number | null; tags: string[];
  instructor: { id: string; name: string | null };
  sections: SectionItem[];
  _count: { enrollments: number };
  isEnrolled: boolean;
  isInstructor: boolean;
  enrollment: { progress: number; completedAt: string | null } | null;
}

const TYPE_ICONS: Record<string, React.ElementType> = { text: FileText, video: Play, code: Code, quiz: HelpCircle };

export default function CourseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;
  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  const fetchCourse = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/lms/courses/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setCourse(data);
        // Auto-expand all sections
        setExpandedSections(new Set(data.sections.map((s: SectionItem) => s.id)));
      } else router.push("/lms");
    } catch { router.push("/lms"); }
    finally { setLoading(false); }
  }, [slug, router]);

  useEffect(() => { fetchCourse(); }, [fetchCourse]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      const res = await fetch(`/api/lms/courses/${slug}/enroll`, { method: "POST" });
      if (res.ok) fetchCourse();
    } catch { /* handled */ }
    finally { setEnrolling(false); }
  };

  const toggleSection = (id: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading...</div>;
  if (!course) return null;

  const totalLessons = course.sections.reduce((sum, s) => sum + s.lessons.length, 0);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/lms")}><ArrowLeft className="w-4 h-4" /></Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline">{course.level}</Badge>
            {course.tags.slice(0, 3).map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
          </div>
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-sm text-muted-foreground mt-1">by {course.instructor.name || "Instructor"}</p>
        </div>
        {course.isInstructor && (
          <Link href={`/lms/courses/${slug}/builder`}>
            <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-1" />Edit</Button>
          </Link>
        )}
      </div>

      {/* Stats + Enroll */}
      <Card>
        <CardContent className="py-4 flex items-center justify-between">
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><Users className="w-4 h-4" />{course._count.enrollments} enrolled</span>
            <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" />{totalLessons} lessons</span>
            {course.estimatedHours && <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{course.estimatedHours}h</span>}
          </div>
          {!course.isInstructor && (
            course.isEnrolled ? (
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium">{Math.round(course.enrollment?.progress || 0)}% complete</p>
                  <div className="w-32 bg-muted rounded-full h-2 mt-1">
                    <div className="bg-primary rounded-full h-2" style={{ width: `${course.enrollment?.progress || 0}%` }} />
                  </div>
                </div>
                <Link href={`/lms/courses/${slug}/learn/${course.sections[0]?.lessons[0]?.id || ""}`}>
                  <Button size="sm">Continue</Button>
                </Link>
              </div>
            ) : (
              <Button size="sm" onClick={handleEnroll} disabled={enrolling}>{enrolling ? "Enrolling..." : "Enroll Now"}</Button>
            )
          )}
        </CardContent>
      </Card>

      {/* Description */}
      {course.description && (
        <Card><CardContent className="pt-6"><p className="text-sm whitespace-pre-wrap">{course.description}</p></CardContent></Card>
      )}

      {/* Curriculum */}
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Curriculum</h2>
        {course.sections.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No content yet.</p>
        ) : (
          course.sections.sort((a, b) => a.order - b.order).map((section) => (
            <Card key={section.id}>
              <button className="w-full text-left px-4 py-3 flex items-center gap-2 hover:bg-muted/50" onClick={() => toggleSection(section.id)}>
                {expandedSections.has(section.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <span className="font-medium">{section.title}</span>
                <span className="text-xs text-muted-foreground ml-auto">{section.lessons.length} lessons</span>
              </button>
              {expandedSections.has(section.id) && (
                <div className="border-t">
                  {section.lessons.sort((a, b) => a.order - b.order).map((lesson) => {
                    const Icon = TYPE_ICONS[lesson.type] || FileText;
                    const href = course.isEnrolled || course.isInstructor
                      ? `/lms/courses/${slug}/learn/${lesson.id}`
                      : "#";
                    return (
                      <Link key={lesson.id} href={href} className={!course.isEnrolled && !course.isInstructor ? "pointer-events-none opacity-50" : ""}>
                        <div className="flex items-center gap-3 px-6 py-2.5 hover:bg-muted/30 text-sm">
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          <span>{lesson.title}</span>
                          {lesson.estimatedMinutes && <span className="text-xs text-muted-foreground ml-auto">{lesson.estimatedMinutes}min</span>}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
