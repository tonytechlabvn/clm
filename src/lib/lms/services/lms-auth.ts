// LMS auth helpers — validates session for instructor/student actions

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma-client";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";

export interface CourseAuthContext {
  userId: string;
  userRole: string;
  courseId: string;
  orgId: string;
  instructorId: string;
  isInstructor: boolean;
  isAdminOrRoot: boolean;
}

export interface StudentAuthContext {
  userId: string;
  userRole: string;
}

/**
 * Validates session for any authenticated user (student-level access).
 * Returns StudentAuthContext or 401 NextResponse.
 */
export async function withStudentAuth(): Promise<StudentAuthContext | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.dbUserId, userRole: session.role || "user" };
}

/**
 * Validates session for course instructor-level access.
 * User must be session-authenticated AND either:
 *   - The course's instructorId, OR
 *   - A global admin/root user
 *
 * Returns CourseAuthContext or an error NextResponse.
 */
export async function withCourseInstructorAuth(
  slug: string
): Promise<CourseAuthContext | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({
    where: { slug },
    select: { id: true, orgId: true, instructorId: true },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const userId = session.dbUserId;
  const userRole = session.role || "user";
  const isAdminOrRoot = userRole === "admin" || userRole === "root";
  const isInstructor = course.instructorId === userId;

  if (!isInstructor && !isAdminOrRoot) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return {
    userId,
    userRole,
    courseId: course.id,
    orgId: course.orgId,
    instructorId: course.instructorId,
    isInstructor,
    isAdminOrRoot,
  };
}

/**
 * Validates session for course instructor-level access by courseId (not slug).
 * Used in section/lesson routes that only have courseId context.
 */
export async function withCourseInstructorAuthById(
  courseId: string
): Promise<CourseAuthContext | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, slug: true, orgId: true, instructorId: true },
  });

  if (!course) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }

  const userId = session.dbUserId;
  const userRole = session.role || "user";
  const isAdminOrRoot = userRole === "admin" || userRole === "root";
  const isInstructor = course.instructorId === userId;

  if (!isInstructor && !isAdminOrRoot) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return {
    userId,
    userRole,
    courseId: course.id,
    orgId: course.orgId,
    instructorId: course.instructorId,
    isInstructor,
    isAdminOrRoot,
  };
}
