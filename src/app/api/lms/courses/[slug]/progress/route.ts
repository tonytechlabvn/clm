// LMS Student Progress — GET enrollment + lesson progress for authenticated user

import { NextResponse } from "next/server";
import { withStudentAuth } from "@/lib/lms/services/lms-auth";
import { getStudentProgress } from "@/lib/lms/services/enrollment-service";
import { getCourse } from "@/lib/lms/services/course-service";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/lms/courses/[slug]/progress
export async function GET(request: Request, { params }: RouteParams) {
  const { slug } = await params;

  const auth = await withStudentAuth();
  if (auth instanceof NextResponse) return auth;

  const course = await getCourse(slug);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const result = await getStudentProgress(course.id, auth.userId);
  if (!result) {
    return NextResponse.json({ error: "Not enrolled in this course" }, { status: 404 });
  }

  return NextResponse.json({ data: result });
}
