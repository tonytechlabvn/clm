// CMA Post CRUD service — manages post lifecycle and status transitions

import { prisma } from "@/lib/prisma-client";
import type { Prisma } from "@prisma/client";
import { validateContentFormat } from "../blocks-to-html";

export interface CreatePostInput {
  orgId: string;
  authorId: string;
  title: string;
  content: string;
  contentFormat?: "markdown" | "blocks";
  templateId?: string;
  styleTheme?: string;
  excerpt?: string;
  categories?: string[];
  tags?: string[];
  featuredImage?: string;
}

export interface UpdatePostInput {
  title?: string;
  content?: string;
  contentFormat?: "markdown" | "blocks";
  styleTheme?: string;
  excerpt?: string;
  categories?: string[];
  tags?: string[];
  featuredImage?: string;
  status?: string;
}

export interface PostListParams {
  orgId: string;
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export async function createPost(input: CreatePostInput) {
  const format = input.contentFormat || "markdown";

  // Validate content matches declared format
  if (!validateContentFormat(input.content, format)) {
    throw new Error(`Content does not match declared format "${format}"`);
  }

  return prisma.cmaPost.create({
    data: {
      orgId: input.orgId,
      authorId: input.authorId,
      title: input.title,
      content: input.content,
      contentFormat: format,
      templateId: input.templateId || null,
      styleTheme: input.styleTheme || "default",
      excerpt: input.excerpt || null,
      categories: input.categories || [],
      tags: input.tags || [],
      featuredImage: input.featuredImage || null,
      status: "draft",
    },
    include: { author: { select: { id: true, name: true, email: true } } },
  });
}

export async function getPost(id: string, orgId: string) {
  return prisma.cmaPost.findFirst({
    where: { id, orgId },
    include: {
      author: { select: { id: true, name: true, email: true } },
      platforms: { include: { account: { select: { id: true, platform: true, label: true } } } },
      media: true,
    },
  });
}

export async function listPosts(params: PostListParams) {
  const { orgId, status, page = 1, limit = 20, search } = params;
  const where: Prisma.CmaPostWhereInput = { orgId };
  if (status && status !== "all") where.status = status;
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { content: { contains: search, mode: "insensitive" } },
    ];
  }

  const [posts, total] = await Promise.all([
    prisma.cmaPost.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        author: { select: { id: true, name: true } },
        platforms: { select: { id: true, status: true, platformUrl: true, account: { select: { platform: true, label: true } } } },
      },
    }),
    prisma.cmaPost.count({ where }),
  ]);

  return { posts, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function updatePost(id: string, orgId: string, input: UpdatePostInput) {
  // Only allow editing drafts or failed posts
  const post = await prisma.cmaPost.findFirst({ where: { id, orgId } });
  if (!post) throw new Error("Post not found");
  if (post.status === "publishing") throw new Error("Cannot edit while publishing");

  const data: Prisma.CmaPostUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.content !== undefined) {
    // Validate content matches format (use new format if changing, else existing)
    const format = input.contentFormat || post.contentFormat;
    if (!validateContentFormat(input.content, format)) {
      throw new Error(`Content does not match declared format "${format}"`);
    }
    data.content = input.content;
  }
  if (input.contentFormat !== undefined) data.contentFormat = input.contentFormat;
  if (input.styleTheme !== undefined) data.styleTheme = input.styleTheme;
  if (input.excerpt !== undefined) data.excerpt = input.excerpt;
  if (input.categories !== undefined) data.categories = input.categories;
  if (input.tags !== undefined) data.tags = input.tags;
  if (input.featuredImage !== undefined) data.featuredImage = input.featuredImage;
  if (input.status !== undefined) {
    // Allowed transitions: draft→approved/scheduled, scheduled→draft, failed→draft, approved→draft
    const allowed: Record<string, string[]> = {
      draft: ["approved", "scheduled"],
      approved: ["draft", "scheduled"],
      scheduled: ["draft"],
      failed: ["draft"],
      published: ["draft"], // allows re-editing after publish
    };
    if (!allowed[post.status]?.includes(input.status)) {
      throw new Error(`Cannot transition from ${post.status} to ${input.status}`);
    }
    data.status = input.status;
  }

  return prisma.cmaPost.update({
    where: { id },
    data,
    include: { author: { select: { id: true, name: true, email: true } } },
  });
}

export async function deletePost(id: string, orgId: string) {
  const post = await prisma.cmaPost.findFirst({ where: { id, orgId } });
  if (!post) throw new Error("Post not found");
  if (post.status === "publishing") throw new Error("Cannot delete while publishing");
  return prisma.cmaPost.delete({ where: { id } });
}
