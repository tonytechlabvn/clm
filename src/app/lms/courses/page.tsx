"use client";

// My enrolled courses — shows progress for each course

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen, CheckCircle } from "lucide-react";

interface EnrolledCourse {
  id: string;
  progress: number;
  completedAt: string | null;
  course: {
    title: string;
    slug: string;
    level: string;
    estimatedHours: number | null;
    instructor: { name: string | null };
  };
}

export default function MyCoursesPage() {
  const { data: session } = useSession();
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/lms/courses?enrolled=true")
      .then(r => r.ok ? r.json() : { enrollments: [] })
      .then(d => setEnrollments(d.enrollments || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (!session) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Please sign in.</p></div>;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/lms"><Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button></Link>
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-muted-foreground">Track your learning progress</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Loading...</div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>You haven&apos;t enrolled in any courses yet.</p>
          <Link href="/lms"><Button className="mt-4" size="sm">Browse Courses</Button></Link>
        </div>
      ) : (
        <div className="space-y-3">
          {enrollments.map((e) => (
            <Link key={e.id} href={`/lms/courses/${e.course.slug}`}>
              <Card className="cursor-pointer hover:shadow-sm transition-shadow">
                <CardContent className="py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {e.completedAt ? <CheckCircle className="w-5 h-5 text-green-600" /> : <BookOpen className="w-5 h-5 text-blue-600" />}
                      <span className="font-medium">{e.course.title}</span>
                      <Badge variant="outline" className="text-xs">{e.course.level}</Badge>
                    </div>
                    <span className="text-sm font-mono">{Math.round(e.progress)}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div className="bg-primary rounded-full h-2 transition-all" style={{ width: `${e.progress}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{e.course.instructor.name || "Instructor"}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
