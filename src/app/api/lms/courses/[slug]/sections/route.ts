// LMS Sections — POST create section for a course

import { NextResponse } from "next/server";
import { withCourseInstructorAuth } from "@/lib/lms/services/lms-auth";
import { createSection } from "@/lib/lms/services/section-lesson-service";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// POST /api/lms/courses/[slug]/sections
export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;

  const auth = await withCourseInstructorAuth(slug);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { title, order } = body;

    if (!title) {
      return NextResponse.json({ error: "Missing required field: title" }, { status: 400 });
    }

    const section = await createSection({ courseId: auth.courseId, title, order });
    return NextResponse.json({ data: section }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[lms] POST /api/lms/courses/[slug]/sections", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
