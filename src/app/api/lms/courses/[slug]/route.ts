// LMS Course detail — GET, PATCH update, DELETE archive

import { NextResponse } from "next/server";
import { withStudentAuth, withCourseInstructorAuth } from "@/lib/lms/services/lms-auth";
import { getCourse, updateCourse, archiveCourse } from "@/lib/lms/services/course-service";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// GET /api/lms/courses/[slug] — published courses visible to all authenticated users
export async function GET(request: Request, { params }: RouteParams) {
  const { slug } = await params;

  const auth = await withStudentAuth();
  if (auth instanceof NextResponse) return auth;

  const course = await getCourse(slug);
  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  // Non-instructors/admins may only view published courses
  const isAdminOrRoot = auth.userRole === "admin" || auth.userRole === "root";
  const isInstructor = course.instructorId === auth.userId;
  if (course.status !== "published" && !isInstructor && !isAdminOrRoot) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  return NextResponse.json({ data: course });
}

// PATCH /api/lms/courses/[slug] — instructor/admin updates course
export async function PATCH(request: Request, { params }: RouteParams) {
  const { slug } = await params;

  const auth = await withCourseInstructorAuth(slug);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const { title, description, thumbnailUrl, level, status, estimatedHours, tags } = body;

    const course = await updateCourse(slug, auth.orgId, {
      title,
      description,
      thumbnailUrl,
      level,
      status,
      estimatedHours,
      tags,
    });

    return NextResponse.json({ data: course });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[lms] PATCH /api/lms/courses/[slug]", message);
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE /api/lms/courses/[slug] — instructor/admin archives course
export async function DELETE(request: Request, { params }: RouteParams) {
  const { slug } = await params;

  const auth = await withCourseInstructorAuth(slug);
  if (auth instanceof NextResponse) return auth;

  try {
    await archiveCourse(slug, auth.orgId);
    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[lms] DELETE /api/lms/courses/[slug]", message);
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
