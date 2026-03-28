// Classroom-scoped auth middleware — validates session + classroom membership

import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { authOptions } from "@/lib/auth-options";

export interface ClassroomAuthContext {
  userId: string;
  classroomId: string;
  memberRole: string; // "student" | "instructor"
  classroom: {
    id: string;
    orgId: string;
    instructorId: string;
    name: string;
    isActive: boolean;
  };
}

/**
 * Validates that the requesting user:
 * 1. Has a valid session
 * 2. Is a ClassroomMember of the specified classroom
 * Returns ClassroomAuthContext or a 401/403 NextResponse.
 */
export async function withClassroomAuth(
  classroomId: string
): Promise<ClassroomAuthContext | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const member = await prisma.classroomMember.findUnique({
    where: { userId_classroomId: { userId: session.dbUserId, classroomId } },
    include: {
      classroom: {
        select: { id: true, orgId: true, instructorId: true, name: true, isActive: true },
      },
    },
  });

  if (!member) {
    return NextResponse.json({ error: "Not a member of this classroom" }, { status: 403 });
  }

  return {
    userId: session.dbUserId,
    classroomId,
    memberRole: member.role,
    classroom: member.classroom,
  };
}

/**
 * Validates instructor-level access to a classroom.
 * Allows: classroom instructor OR org admin/owner/root.
 * Returns ClassroomAuthContext (with memberRole="instructor") or 401/403.
 */
export async function withInstructorAuth(
  classroomId: string
): Promise<ClassroomAuthContext | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const classroom = await prisma.classroom.findUnique({
    where: { id: classroomId },
    select: { id: true, orgId: true, instructorId: true, name: true, isActive: true },
  });

  if (!classroom) {
    return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
  }

  // Root users bypass membership check
  if (session.role === "root") {
    return { userId: session.dbUserId, classroomId, memberRole: "instructor", classroom };
  }

  // Check if user is the classroom instructor or org admin/owner
  const isInstructor = classroom.instructorId === session.dbUserId;
  if (isInstructor) {
    return { userId: session.dbUserId, classroomId, memberRole: "instructor", classroom };
  }

  // Check org membership for admin/owner fallback
  const orgMember = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId: session.dbUserId, orgId: classroom.orgId } },
  });
  if (orgMember && (orgMember.role === "admin" || orgMember.role === "owner")) {
    return { userId: session.dbUserId, classroomId, memberRole: "instructor", classroom };
  }

  return NextResponse.json({ error: "Instructor access required" }, { status: 403 });
}

/** Simple session-only auth — any authenticated user */
export async function withSessionAuth(): Promise<{ userId: string } | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return { userId: session.dbUserId };
}
