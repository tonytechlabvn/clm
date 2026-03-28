// Assignment & submission service — create assignments, list, submit work

import { prisma } from "@/lib/prisma-client";

export interface CreateAssignmentInput {
  classroomId: string;
  title: string;
  description?: string;
  jobDescription?: string;
  dueDate?: Date;
  type: string;
  createdById: string;
}

/** Creates an assignment for a classroom */
export async function createAssignment(data: CreateAssignmentInput) {
  const classroom = await prisma.classroom.findUnique({
    where: { id: data.classroomId },
  });
  if (!classroom) throw new Error("[assignment] Classroom not found");

  return prisma.assignment.create({
    data: {
      classroomId: data.classroomId,
      title: data.title,
      description: data.description,
      jobDescription: data.jobDescription,
      dueDate: data.dueDate,
      type: data.type,
      createdById: data.createdById,
    },
  });
}

/** Lists assignments for a classroom with submission counts */
export async function listAssignments(classroomId: string) {
  return prisma.assignment.findMany({
    where: { classroomId },
    include: {
      _count: { select: { submissions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/** Returns assignment detail with all submissions */
export async function getAssignment(assignmentId: string, classroomId: string) {
  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, classroomId },
    include: {
      submissions: {
        include: {
          student: { select: { id: true, name: true, email: true } },
          feedback: true,
        },
      },
      createdBy: { select: { id: true, name: true } },
    },
  });
  if (!assignment) throw new Error("[assignment] Assignment not found");
  return assignment;
}

export interface SubmitWorkInput {
  assignmentId: string;
  studentId: string;
  content: string;
}

/** Creates or updates a submission, sets status=submitted, submittedAt=now */
export async function submitWork(data: SubmitWorkInput) {
  const assignment = await prisma.assignment.findUnique({
    where: { id: data.assignmentId },
  });
  if (!assignment) throw new Error("[assignment] Assignment not found");
  if (assignment.status === "closed") {
    throw new Error("[assignment] Assignment is closed for submissions");
  }

  // Verify student is a member of the classroom
  const membership = await prisma.classroomMember.findUnique({
    where: {
      userId_classroomId: {
        userId: data.studentId,
        classroomId: assignment.classroomId,
      },
    },
  });
  if (!membership) throw new Error("[assignment] Not a member of this classroom");

  return prisma.submission.upsert({
    where: { assignmentId_studentId: { assignmentId: data.assignmentId, studentId: data.studentId } },
    create: {
      assignmentId: data.assignmentId,
      studentId: data.studentId,
      content: data.content,
      status: "submitted",
      submittedAt: new Date(),
    },
    update: {
      content: data.content,
      status: "submitted",
      submittedAt: new Date(),
    },
  });
}

/** Returns a submission with its feedback */
export async function getSubmission(submissionId: string) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: {
      feedback: {
        include: {
          instructor: { select: { id: true, name: true } },
        },
      },
      student: { select: { id: true, name: true, email: true } },
      assignment: { select: { id: true, title: true, classroomId: true } },
    },
  });
  if (!submission) throw new Error("[assignment] Submission not found");
  return submission;
}
