// POST /api/integration/classroom-courses — link a CLM course to a classroom assignment

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma-client";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { classroomId, assignmentId, courseId } = body;

    if (!classroomId || typeof classroomId !== "string") {
      return NextResponse.json({ error: "classroomId is required" }, { status: 400 });
    }
    if (!assignmentId || typeof assignmentId !== "string") {
      return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });
    }
    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    }

    // Verify caller is instructor of the classroom
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { instructorId: true },
    });
    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }
    if (classroom.instructorId !== (session.dbUserId as string)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verify assignment belongs to this classroom
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      select: { id: true, classroomId: true },
    });
    if (!assignment || assignment.classroomId !== classroomId) {
      return NextResponse.json({ error: "Assignment not found in this classroom" }, { status: 404 });
    }

    // Verify course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true },
    });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Link course to assignment
    const updated = await prisma.assignment.update({
      where: { id: assignmentId },
      data: { linkedCourseId: courseId },
    });

    return NextResponse.json({ assignment: updated });
  } catch (error) {
    console.error("[integration] classroom-courses error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
