// LMS Section & Lesson CRUD service — manages course structure, ordering, and content

import { prisma } from "@/lib/prisma-client";

export interface CreateSectionInput {
  courseId: string;
  title: string;
  order?: number;
}

export interface UpdateSectionInput {
  title?: string;
  order?: number;
  isPublished?: boolean;
}

export interface CreateLessonInput {
  sectionId: string;
  title: string;
  type?: string;
  content?: string;
  videoUrl?: string;
  order?: number;
  estimatedMinutes?: number;
}

export interface UpdateLessonInput {
  title?: string;
  type?: string;
  content?: string;
  videoUrl?: string;
  order?: number;
  estimatedMinutes?: number;
  isPublished?: boolean;
}

// ─── Sections ───

/** Creates a section — auto-assigns order to max+1 if not provided */
export async function createSection(data: CreateSectionInput) {
  let order = data.order;

  if (order === undefined) {
    const last = await prisma.section.findFirst({
      where: { courseId: data.courseId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    order = last ? last.order + 1 : 0;
  }

  console.log("[course] Creating section:", { courseId: data.courseId, title: data.title, order });
  return prisma.section.create({
    data: {
      courseId: data.courseId,
      title: data.title,
      order,
    },
  });
}

/** Updates section metadata — verifies section belongs to courseId to prevent IDOR */
export async function updateSection(sectionId: string, courseId: string, data: UpdateSectionInput) {
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section || section.courseId !== courseId) throw new Error("Section not found");

  return prisma.section.update({
    where: { id: sectionId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
    },
  });
}

/** Deletes a section — verifies ownership, cascades to all lessons */
export async function deleteSection(sectionId: string, courseId: string) {
  const section = await prisma.section.findUnique({ where: { id: sectionId } });
  if (!section || section.courseId !== courseId) throw new Error("Section not found");

  console.log("[course] Deleting section:", { sectionId });
  return prisma.section.delete({ where: { id: sectionId } });
}

/** Bulk-reorders sections by updating each section's order to its array index */
export async function reorderSections(courseId: string, sectionIds: string[]) {
  console.log("[course] Reordering sections for courseId:", courseId);
  const updates = sectionIds.map((id, index) =>
    prisma.section.update({
      where: { id },
      data: { order: index },
    })
  );
  return prisma.$transaction(updates);
}

// ─── Lessons ───

/** Creates a lesson — auto-assigns order to max+1 within section if not provided */
export async function createLesson(data: CreateLessonInput) {
  let order = data.order;

  if (order === undefined) {
    const last = await prisma.lesson.findFirst({
      where: { sectionId: data.sectionId },
      orderBy: { order: "desc" },
      select: { order: true },
    });
    order = last ? last.order + 1 : 0;
  }

  console.log("[course] Creating lesson:", { sectionId: data.sectionId, title: data.title, order });
  return prisma.lesson.create({
    data: {
      sectionId: data.sectionId,
      title: data.title,
      type: data.type || "text",
      content: data.content || null,
      videoUrl: data.videoUrl || null,
      order,
      estimatedMinutes: data.estimatedMinutes || null,
    },
  });
}

/** Gets lesson with section info and parent course slug */
export async function getLesson(lessonId: string) {
  return prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      section: {
        include: {
          course: { select: { id: true, slug: true, orgId: true, instructorId: true } },
        },
      },
    },
  });
}

/** Updates lesson content and metadata — verifies lesson belongs to courseId via section */
export async function updateLesson(lessonId: string, courseId: string, data: UpdateLessonInput) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { select: { courseId: true } } },
  });
  if (!lesson || lesson.section.courseId !== courseId) throw new Error("Lesson not found");

  return prisma.lesson.update({
    where: { id: lessonId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.videoUrl !== undefined && { videoUrl: data.videoUrl }),
      ...(data.order !== undefined && { order: data.order }),
      ...(data.estimatedMinutes !== undefined && { estimatedMinutes: data.estimatedMinutes }),
      ...(data.isPublished !== undefined && { isPublished: data.isPublished }),
    },
  });
}

/** Deletes a lesson — verifies ownership via section → courseId */
export async function deleteLesson(lessonId: string, courseId: string) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { section: { select: { courseId: true } } },
  });
  if (!lesson || lesson.section.courseId !== courseId) throw new Error("Lesson not found");

  console.log("[course] Deleting lesson:", { lessonId });
  return prisma.lesson.delete({ where: { id: lessonId } });
}

/** Bulk-reorders lessons within a section by array index */
export async function reorderLessons(sectionId: string, lessonIds: string[]) {
  console.log("[course] Reordering lessons for sectionId:", sectionId);
  const updates = lessonIds.map((id, index) =>
    prisma.lesson.update({
      where: { id },
      data: { order: index },
    })
  );
  return prisma.$transaction(updates);
}
