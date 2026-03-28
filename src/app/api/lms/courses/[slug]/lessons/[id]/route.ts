// LMS Lesson detail — GET content, PATCH update, DELETE remove

import { NextResponse } from "next/server";
import { withStudentAuth, withCourseInstructorAuth } from "@/lib/lms/services/lms-auth";
import { getLesson, updateLesson, deleteLesson } from "@/lib/lms/services/section-lesson-service";
import { prisma } from "@/lib/prisma-client";

interface RouteParams {
  params: Promise<{ slug: string; id: string }>;
}

// GET /api/lms/courses/[slug]/lessons/[id]
// Visible to: enrolled students OR course instructor OR admin/root
export async function GET(request: Request, { params }: RouteParams) {
  const { slug, id } = await params;

  const auth = await withStudentAuth();
  if (auth instanceof NextResponse) return auth;

  const lesson = await getLesson(id);
  if (!lesson || lesson.section.course.slug !== slug) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  const course = lesson.section.course;
  const isAdminOrRoot = auth.userRole === "admin" || auth.userRole === "root";
  const isInstructor = course.instructorId === auth.userId;

  if (!isInstructor && !isAdminOrRoot) {
    // Check enrollment
    const enrollment = await prisma.courseEnrollment.findUnique({
      where: { courseId_userId: { courseId: course.id, userId: auth.userId } },
    });
    if (!enrollment) {
      return NextResponse.json({ error: "Enrollment required to view lesson content" }, { status: 403 });
    }
  }

  return NextResponse.json({ data: lesson });
}

// PATCH /api/lms/courses/[slug]/lessons/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  const { slug, id } = await params;

  const auth = await withCourseInstructorAuth(slug);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { title, type, content, videoUrl, order, estimatedMinutes, isPublished } = body;

    const lesson = await updateLesson(id, auth.courseId, {
      title,
      type,
      content,
      videoUrl,
      order,
      estimatedMinutes,
      isPublished,
    });

    return NextResponse.json({ data: lesson });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[lms] PATCH /api/lms/courses/[slug]/lessons/[id]", message);
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE /api/lms/courses/[slug]/lessons/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  const { slug, id } = await params;

  const auth = await withCourseInstructorAuth(slug);
  if (auth instanceof NextResponse) return auth;

  try {
    await deleteLesson(id, auth.courseId);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[lms] DELETE /api/lms/courses/[slug]/lessons/[id]", message);
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
