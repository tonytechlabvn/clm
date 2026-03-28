// Classroom CRUD service — create, list, join, archive, member management

import { prisma } from "@/lib/prisma-client";

/** Generates a unique 6-char uppercase alphanumeric join code */
export async function generateJoinCode(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code: string;
  let attempts = 0;
  do {
    code = Array.from({ length: 6 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
    const existing = await prisma.classroom.findUnique({ where: { joinCode: code } });
    if (!existing) return code;
    attempts++;
  } while (attempts < 10);
  throw new Error("[classroom] Failed to generate unique join code after 10 attempts");
}

export interface CreateClassroomInput {
  orgId: string;
  instructorId: string;
  name: string;
  description?: string;
}

/** Creates classroom + adds instructor as ClassroomMember (atomic) */
export async function createClassroom(data: CreateClassroomInput) {
  const joinCode = await generateJoinCode();
  return prisma.$transaction(async (tx) => {
    const classroom = await tx.classroom.create({
      data: {
        orgId: data.orgId,
        instructorId: data.instructorId,
        name: data.name,
        description: data.description,
        joinCode,
      },
    });
    await tx.classroomMember.create({
      data: {
        userId: data.instructorId,
        classroomId: classroom.id,
        role: "instructor",
      },
    });
    return classroom;
  });
}

/** Lists classrooms where the user is a member, with member counts */
export async function listClassrooms(userId: string) {
  const memberships = await prisma.classroomMember.findMany({
    where: { userId },
    include: {
      classroom: {
        include: {
          _count: { select: { members: true } },
        },
      },
    },
  });
  return memberships.map((m) => ({
    ...m.classroom,
    memberCount: m.classroom._count.members,
    myRole: m.role,
  }));
}

/** Returns classroom detail with members list, scoped by orgId */
export async function getClassroom(classroomId: string, orgId: string) {
  const classroom = await prisma.classroom.findFirst({
    where: { id: classroomId, orgId },
    include: {
      members: {
        include: {
          user: { select: { id: true, name: true, email: true, image: true } },
        },
      },
      _count: { select: { assignments: true } },
    },
  });
  if (!classroom) throw new Error("[classroom] Classroom not found");
  return classroom;
}

export interface UpdateClassroomInput {
  name?: string;
  description?: string;
  isActive?: boolean;
}

/** Updates classroom fields, scoped by orgId */
export async function updateClassroom(
  classroomId: string,
  orgId: string,
  data: UpdateClassroomInput
) {
  const existing = await prisma.classroom.findFirst({ where: { id: classroomId, orgId } });
  if (!existing) throw new Error("[classroom] Classroom not found");
  return prisma.classroom.update({ where: { id: classroomId }, data });
}

/** Archives classroom by setting isActive=false */
export async function archiveClassroom(classroomId: string, orgId: string) {
  const existing = await prisma.classroom.findFirst({ where: { id: classroomId, orgId } });
  if (!existing) throw new Error("[classroom] Classroom not found");
  return prisma.classroom.update({ where: { id: classroomId }, data: { isActive: false } });
}

/** Joins classroom by join code — adds user as student member */
export async function joinClassroom(joinCode: string, userId: string) {
  const classroom = await prisma.classroom.findUnique({ where: { joinCode } });
  if (!classroom) throw new Error("[classroom] Invalid join code");
  if (!classroom.isActive) throw new Error("[classroom] Classroom is not active");

  // upsert to handle re-join gracefully
  return prisma.classroomMember.upsert({
    where: { userId_classroomId: { userId, classroomId: classroom.id } },
    create: { userId, classroomId: classroom.id, role: "student" },
    update: {}, // already a member — no change
  });
}

/** Removes a member from classroom — cannot remove the instructor */
export async function removeMember(
  classroomId: string,
  orgId: string,
  userId: string
) {
  const classroom = await prisma.classroom.findFirst({ where: { id: classroomId, orgId } });
  if (!classroom) throw new Error("[classroom] Classroom not found");
  if (classroom.instructorId === userId) {
    throw new Error("[classroom] Cannot remove the classroom instructor");
  }
  const member = await prisma.classroomMember.findUnique({
    where: { userId_classroomId: { userId, classroomId } },
  });
  if (!member) throw new Error("[classroom] Member not found");
  return prisma.classroomMember.delete({
    where: { userId_classroomId: { userId, classroomId } },
  });
}
