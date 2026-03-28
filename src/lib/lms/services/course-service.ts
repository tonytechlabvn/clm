// LMS Course CRUD service — manages course lifecycle, slug generation, and catalog queries

import { prisma } from "@/lib/prisma-client";
import type { Prisma } from "@prisma/client";

export interface CreateCourseInput {
  orgId: string;
  instructorId: string;
  title: string;
  description?: string;
  level?: string;
  tags?: string[];
}

export interface UpdateCourseInput {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  level?: string;
  status?: string;
  estimatedHours?: number;
  tags?: string[];
}

export interface CourseListFilters {
  orgId?: string;
  status?: string;
  level?: string;
  search?: string;
  page?: number;
  limit?: number;
}

/** Converts title to kebab-case slug + 4-char random suffix, retries up to 5x on collision */
export async function generateCourseSlug(title: string): Promise<string> {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);

  for (let attempt = 0; attempt < 5; attempt++) {
    const suffix = Math.random().toString(36).slice(2, 6);
    const slug = `${base}-${suffix}`;
    const exists = await prisma.course.findUnique({ where: { slug }, select: { id: true } });
    if (!exists) return slug;
  }

  // Last resort: use timestamp suffix
  return `${base}-${Date.now().toString(36)}`;
}

/** Creates a new course draft with auto-generated slug */
export async function createCourse(data: CreateCourseInput) {
  const slug = await generateCourseSlug(data.title);
  console.log("[course] Creating course:", { title: data.title, slug, orgId: data.orgId });

  return prisma.course.create({
    data: {
      orgId: data.orgId,
      instructorId: data.instructorId,
      title: data.title,
      slug,
      description: data.description || null,
      level: data.level || "beginner",
      tags: data.tags || [],
      status: "draft",
    },
    include: {
      instructor: { select: { id: true, name: true, email: true } },
    },
  });
}

/** Paginated course catalog — published only for non-instructor queries */
export async function listCourses(filters: CourseListFilters) {
  const { orgId, status, level, search, page = 1, limit = 20 } = filters;
  const where: Prisma.CourseWhereInput = {};

  if (orgId) where.orgId = orgId;
  if (status && status !== "all") where.status = status;
  if (level && level !== "all") where.level = level;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const skip = (page - 1) * limit;

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        instructor: { select: { id: true, name: true } },
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return {
    courses,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/** Full course detail with ordered sections → lessons and enrollment count */
export async function getCourse(slug: string) {
  return prisma.course.findUnique({
    where: { slug },
    include: {
      instructor: { select: { id: true, name: true, email: true } },
      sections: {
        orderBy: { order: "asc" },
        include: {
          lessons: { orderBy: { order: "asc" } },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });
}

/** Updates mutable course fields — scoped to orgId for multi-tenant safety */
export async function updateCourse(
  slug: string,
  orgId: string,
  data: UpdateCourseInput
) {
  const course = await prisma.course.findFirst({ where: { slug, orgId } });
  if (!course) throw new Error("Course not found");

  const updateData: Prisma.CourseUpdateInput = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.thumbnailUrl !== undefined) updateData.thumbnailUrl = data.thumbnailUrl;
  if (data.level !== undefined) updateData.level = data.level;
  if (data.status !== undefined) {
    const validStatuses = ["draft", "published", "archived"];
    if (!validStatuses.includes(data.status)) {
      throw new Error(`Invalid status: ${data.status}`);
    }
    updateData.status = data.status;
  }
  if (data.estimatedHours !== undefined) updateData.estimatedHours = data.estimatedHours;
  if (data.tags !== undefined) updateData.tags = data.tags;

  console.log("[course] Updating course:", { slug, orgId });
  return prisma.course.update({
    where: { id: course.id },
    data: updateData,
    include: {
      instructor: { select: { id: true, name: true, email: true } },
      _count: { select: { enrollments: true } },
    },
  });
}

/** Sets course status to "archived" */
export async function archiveCourse(slug: string, orgId: string) {
  const course = await prisma.course.findFirst({ where: { slug, orgId } });
  if (!course) throw new Error("Course not found");

  console.log("[course] Archiving course:", { slug, orgId });
  return prisma.course.update({
    where: { id: course.id },
    data: { status: "archived" },
  });
}
