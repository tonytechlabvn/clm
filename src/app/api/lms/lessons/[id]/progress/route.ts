// LMS Lesson Progress — POST mark lesson progress for authenticated student

import { NextResponse } from "next/server";
import { withStudentAuth } from "@/lib/lms/services/lms-auth";
import { updateLessonProgress } from "@/lib/lms/services/enrollment-service";
import { prisma } from "@/lib/prisma-client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/lms/lessons/[id]/progress
export async function POST(request: Request, { params }: RouteParams) {
  const { id: lessonId } = await params;

  const auth = await withStudentAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { status, timeSpent } = body;

    if (!status) {
      return NextResponse.json({ error: "Missing required field: status" }, { status: 400 });
    }

    // Verify lesson exists and user is enrolled in its course
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { section: { select: { courseId: true } } },
    });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const courseId = lesson.section.courseId;
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { courseId_userId: { courseId, userId: auth.userId } },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "Must be enrolled to track progress" }, { status: 403 });
    }

    const progress = await updateLessonProgress(lessonId, auth.userId, { status, timeSpent });
    return NextResponse.json({ data: progress });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[lms] POST /api/lms/lessons/[id]/progress", message);
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
