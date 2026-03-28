// LMS Enrollment — POST enroll authenticated student in a course

import { NextResponse } from "next/server";
import { withStudentAuth } from "@/lib/lms/services/lms-auth";
import { enrollStudent } from "@/lib/lms/services/enrollment-service";
import { getCourse } from "@/lib/lms/services/course-service";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// POST /api/lms/courses/[slug]/enroll
export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;

  const auth = await withStudentAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const course = await getCourse(slug);
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    const enrollment = await enrollStudent(course.id, auth.userId);
    return NextResponse.json({ data: enrollment }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[lms] POST /api/lms/courses/[slug]/enroll", message);
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
