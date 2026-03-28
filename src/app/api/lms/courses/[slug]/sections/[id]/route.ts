// LMS Section detail — PATCH update, DELETE remove section

import { NextResponse } from "next/server";
import { withCourseInstructorAuth } from "@/lib/lms/services/lms-auth";
import { updateSection, deleteSection } from "@/lib/lms/services/section-lesson-service";

interface RouteParams {
  params: Promise<{ slug: string; id: string }>;
}

// PATCH /api/lms/courses/[slug]/sections/[id]
export async function PATCH(request: Request, { params }: RouteParams) {
  const { slug, id } = await params;

  const auth = await withCourseInstructorAuth(slug);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { title, order, isPublished } = body;

    const section = await updateSection(id, auth.courseId, { title, order, isPublished });
    return NextResponse.json({ data: section });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[lms] PATCH /api/lms/courses/[slug]/sections/[id]", message);
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE /api/lms/courses/[slug]/sections/[id]
export async function DELETE(request: Request, { params }: RouteParams) {
  const { slug, id } = await params;

  const auth = await withCourseInstructorAuth(slug);
  if (auth instanceof NextResponse) return auth;

  try {
    await deleteSection(id, auth.courseId);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[lms] DELETE /api/lms/courses/[slug]/sections/[id]", message);
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
