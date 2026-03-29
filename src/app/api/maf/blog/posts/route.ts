// Public blog API — fetches published CMA posts without authentication
// GET /api/maf/blog/posts?page=1&limit=9&category=...&search=...

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import type { Prisma } from "@prisma/client";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1);
    const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "9", 10), 1), 50);
    const category = searchParams.get("category") || undefined;
    const search = searchParams.get("search") || undefined;

    const where: Prisma.CmaPostWhereInput = {
      status: "published",
      parentPostId: null, // exclude social excerpt children
    };

    if (category) {
      where.categories = { has: category };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { excerpt: { contains: search, mode: "insensitive" } },
      ];
    }

    const [posts, total] = await Promise.all([
      prisma.cmaPost.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          title: true,
          slug: true,
          excerpt: true,
          featuredImage: true,
          categories: true,
          tags: true,
          publishedAt: true,
          author: { select: { id: true, name: true, image: true } },
        },
      }),
      prisma.cmaPost.count({ where }),
    ]);

    return NextResponse.json({
      posts,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[MAF Blog API] Error fetching posts:", error);
    return NextResponse.json({ error: "Failed to fetch posts" }, { status: 500 });
  }
}
