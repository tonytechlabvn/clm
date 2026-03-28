// LMS Lessons — POST create lesson under a course section

import { NextResponse } from "next/server";
import { withCourseInstructorAuth } from "@/lib/lms/services/lms-auth";
import { createLesson } from "@/lib/lms/services/section-lesson-service";
import { prisma } from "@/lib/prisma-client";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// POST /api/lms/courses/[slug]/lessons
export async function POST(request: Request, { params }: RouteParams) {
  const { slug } = await params;

  const auth = await withCourseInstructorAuth(slug);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { sectionId, title, type, content, videoUrl, order, estimatedMinutes } = body;

    if (!sectionId || !title) {
      return NextResponse.json(
        { error: "Missing required fields: sectionId, title" },
        { status: 400 }
      );
    }

    // Verify section belongs to this course
    const section = await prisma.section.findFirst({
      where: { id: sectionId, courseId: auth.courseId },
    });
    if (!section) {
      return NextResponse.json({ error: "Section not found in this course" }, { status: 404 });
    }

    const lesson = await createLesson({
      sectionId,
      title,
      type,
      content,
      videoUrl,
      order,
      estimatedMinutes,
    });

    return NextResponse.json({ data: lesson }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[lms] POST /api/lms/courses/[slug]/lessons", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
