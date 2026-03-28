"use client";

// LMS landing — course catalog / student dashboard

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { BookOpen, Clock, Users, Search, GraduationCap } from "lucide-react";

interface CourseItem {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnailUrl: string | null;
  level: string;
  status: string;
  estimatedHours: number | null;
  tags: string[];
  instructor: { name: string | null };
  _count: { enrollments: number };
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: "bg-green-100 text-green-700",
  intermediate: "bg-blue-100 text-blue-700",
  advanced: "bg-purple-100 text-purple-700",
};

export default function LmsPage() {
  const { data: session } = useSession();
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [level, setLevel] = useState("all");

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ status: "published" });
    if (search) params.set("search", search);
    if (level !== "all") params.set("level", level);
    try {
      const res = await fetch(`/api/lms/courses?${params}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || data);
      }
    } catch { /* empty state handles */ }
    finally { setLoading(false); }
  }, [search, level]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  if (!session) {
    return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please sign in to browse courses.</p></div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><GraduationCap className="w-7 h-7" />Course Catalog</h1>
          <p className="text-muted-foreground">Browse and enroll in courses</p>
        </div>
        <Link href="/lms/courses">
          <Button variant="outline" size="sm"><BookOpen className="w-4 h-4 mr-1" />My Courses</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            className="w-full border rounded-md pl-9 pr-3 py-2 text-sm"
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select className="border rounded-md px-3 py-2 text-sm" value={level} onChange={e => setLevel(e.target.value)}>
          <option value="all">All Levels</option>
          <option value="beginner">Beginner</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>
      </div>

      {/* Course grid */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading courses...</div>
      ) : courses.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No courses found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((c) => (
            <Link key={c.id} href={`/lms/courses/${c.slug}`}>
              <Card className="cursor-pointer hover:shadow-md transition-shadow h-full">
                {c.thumbnailUrl && (
                  <div className="h-40 bg-muted rounded-t-lg overflow-hidden relative">
                    <Image src={c.thumbnailUrl} alt={c.title} fill className="object-cover" />
                  </div>
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={LEVEL_COLORS[c.level] || ""}>{c.level}</Badge>
                    {c.tags.slice(0, 2).map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{c.title}</CardTitle>
                  {c.description && <CardDescription className="line-clamp-2">{c.description}</CardDescription>}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" />{c._count.enrollments} enrolled</span>
                    {c.estimatedHours && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{c.estimatedHours}h</span>}
                    <span className="ml-auto">{c.instructor.name || "Instructor"}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
