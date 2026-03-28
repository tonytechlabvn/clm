// LMS Enrollment service — manages course enrollment, lesson progress, and completion tracking

import { prisma } from "@/lib/prisma-client";

export interface UpdateLessonProgressInput {
  status: string; // "not_started" | "in_progress" | "completed"
  timeSpent?: number; // seconds
}

/** Enrolls a student — course must be published */
export async function enrollStudent(courseId: string, userId: string) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, status: true, title: true },
  });
  if (!course) throw new Error("Course not found");
  if (course.status !== "published") {
    throw new Error("Cannot enroll in an unpublished course");
  }

  // Upsert to handle idempotent re-enrollment attempts
  const existing = await prisma.courseEnrollment.findUnique({
    where: { courseId_userId: { courseId, userId } },
  });
  if (existing) throw new Error("Already enrolled in this course");

  console.log("[lms] Enrolling student:", { courseId, userId });
  return prisma.courseEnrollment.create({
    data: { courseId, userId, progress: 0 },
    include: {
      course: { select: { id: true, slug: true, title: true } },
    },
  });
}

/** Gets enrollment record + all lesson progress for the course */
export async function getStudentProgress(courseId: string, userId: string) {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { courseId_userId: { courseId, userId } },
    include: {
      course: {
        select: {
          id: true,
          slug: true,
          title: true,
          sections: {
            orderBy: { order: "asc" },
            include: {
              lessons: { orderBy: { order: "asc" }, select: { id: true, title: true, type: true, order: true } },
            },
          },
        },
      },
    },
  });

  if (!enrollment) return null;

  // Fetch all lesson progress for this user in the course
  const lessonIds = enrollment.course.sections.flatMap((s) =>
    s.lessons.map((l) => l.id)
  );

  const lessonProgress = await prisma.lessonProgress.findMany({
    where: { userId, lessonId: { in: lessonIds } },
  });

  return { enrollment, lessonProgress };
}

/**
 * Upserts LessonProgress — sets completedAt when status="completed".
 * Recalculates CourseEnrollment.progress after update.
 * Sets enrollment.completedAt if all lessons completed.
 */
export async function updateLessonProgress(
  lessonId: string,
  userId: string,
  data: UpdateLessonProgressInput
) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: {
        include: { course: { select: { id: true } } },
      },
    },
  });
  if (!lesson) throw new Error("Lesson not found");

  const courseId = lesson.section.course.id;
  const validStatuses = ["not_started", "in_progress", "completed"];
  if (!validStatuses.includes(data.status)) {
    throw new Error(`Invalid status: ${data.status}`);
  }

  console.log("[lms] Updating lesson progress:", { lessonId, userId, status: data.status });

  // Upsert lesson progress record
  const progress = await prisma.lessonProgress.upsert({
    where: { lessonId_userId: { lessonId, userId } },
    create: {
      lessonId,
      userId,
      status: data.status,
      timeSpent: data.timeSpent || 0,
      completedAt: data.status === "completed" ? new Date() : null,
    },
    update: {
      status: data.status,
      ...(data.timeSpent !== undefined && { timeSpent: data.timeSpent }),
      ...(data.status === "completed" && { completedAt: new Date() }),
    },
  });

  // Recalculate course enrollment progress
  await recalculateCourseProgress(courseId, userId);

  return progress;
}

/** Recalculates enrollment progress % and sets completedAt if 100% */
async function recalculateCourseProgress(courseId: string, userId: string) {
  // Count all lessons in the course
  const totalLessons = await prisma.lesson.count({
    where: { section: { courseId } },
  });

  if (totalLessons === 0) return;

  // Count completed lessons for this user
  const completedLessons = await prisma.lessonProgress.count({
    where: {
      userId,
      status: "completed",
      lesson: { section: { courseId } },
    },
  });

  const progressPct = Math.round((completedLessons / totalLessons) * 100);
  const isComplete = progressPct === 100;

  await prisma.courseEnrollment.updateMany({
    where: { courseId, userId },
    data: {
      progress: progressPct,
      ...(isComplete && { completedAt: new Date() }),
    },
  });

  console.log("[lms] Recalculated progress:", { courseId, userId, progressPct });
}

/** Lists all enrolled students with their progress for a course */
export async function getCourseStudents(courseId: string) {
  return prisma.courseEnrollment.findMany({
    where: { courseId },
    orderBy: { enrolledAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });
}
