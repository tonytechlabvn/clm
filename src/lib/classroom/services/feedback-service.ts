// Feedback service — give feedback, dashboard stats, CSV export

import { prisma } from "@/lib/prisma-client";

/** Sanitize a value for safe CSV export — prevents formula injection and handles commas */
function csvSafe(value: string): string {
  // Escape quotes by doubling them, wrap in quotes
  const escaped = value.replace(/"/g, '""');
  // Prefix with single quote if starts with formula-trigger characters
  const prefix = /^[=+\-@\t\r]/.test(escaped) ? "'" : "";
  return `"${prefix}${escaped}"`;
}

export interface GiveFeedbackInput {
  submissionId: string;
  instructorId: string;
  comment?: string;
  score?: number;
}

/** Creates feedback for a submission and updates submission status to "graded" */
export async function giveFeedback(data: GiveFeedbackInput) {
  const submission = await prisma.submission.findUnique({
    where: { id: data.submissionId },
  });
  if (!submission) throw new Error("[feedback] Submission not found");

  return prisma.$transaction(async (tx) => {
    const feedback = await tx.feedback.create({
      data: {
        submissionId: data.submissionId,
        instructorId: data.instructorId,
        comment: data.comment,
        score: data.score,
      },
    });
    await tx.submission.update({
      where: { id: data.submissionId },
      data: {
        status: "graded",
        score: data.score ?? submission.score,
      },
    });
    return feedback;
  });
}

export interface ClassroomDashboardStats {
  memberCount: number;
  assignmentCount: number;
  submissionCount: number;
  avgScore: number | null;
  completionRate: number;
}

/** Aggregates classroom stats for the instructor dashboard */
export async function getClassroomDashboard(
  classroomId: string
): Promise<ClassroomDashboardStats> {
  const [memberCount, assignmentCount, submissions] = await Promise.all([
    prisma.classroomMember.count({ where: { classroomId } }),
    prisma.assignment.count({ where: { classroomId } }),
    prisma.submission.findMany({
      where: { assignment: { classroomId } },
      select: { score: true, status: true },
    }),
  ]);

  const submissionCount = submissions.length;
  const gradedSubmissions = submissions.filter((s) => s.score !== null);
  const avgScore =
    gradedSubmissions.length > 0
      ? gradedSubmissions.reduce((sum, s) => sum + (s.score ?? 0), 0) /
        gradedSubmissions.length
      : null;

  // Completion rate: submitted or graded / total expected (members * assignments)
  // Exclude instructor from member count for completion calculation
  const studentCount = await prisma.classroomMember.count({
    where: { classroomId, role: "student" },
  });
  const expectedTotal = studentCount * assignmentCount;
  const completedSubmissions = submissions.filter(
    (s) => s.status === "submitted" || s.status === "graded" || s.status === "returned"
  ).length;
  const completionRate =
    expectedTotal > 0
      ? Math.round((completedSubmissions / expectedTotal) * 100)
      : 0;

  return { memberCount, assignmentCount, submissionCount, avgScore, completionRate };
}

/** Exports all submissions for a classroom as a CSV string */
export async function exportClassroomCsv(classroomId: string): Promise<string> {
  const submissions = await prisma.submission.findMany({
    where: { assignment: { classroomId } },
    include: {
      student: { select: { name: true, email: true } },
      assignment: { select: { title: true } },
    },
    orderBy: [{ assignment: { title: "asc" } }, { student: { name: "asc" } }],
  });

  const header = "Student Name,Email,Assignment Title,Score,Status,Submitted At";
  const rows = submissions.map((s) => {
    const name = csvSafe(s.student.name ?? "");
    const email = csvSafe(s.student.email ?? "");
    const title = csvSafe(s.assignment.title ?? "");
    const score = s.score !== null ? String(s.score) : "";
    const status = s.status;
    const submittedAt = s.submittedAt ? s.submittedAt.toISOString() : "";
    return `${name},${email},${title},${score},${status},${submittedAt}`;
  });

  return [header, ...rows].join("\n");
}
