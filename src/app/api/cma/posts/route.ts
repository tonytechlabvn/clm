// CMA Posts — GET list, POST create draft

import { NextResponse } from "next/server";
import { withApiKeyOrSessionAuth } from "@/lib/cma/services/org-auth";
import { createPost, listPosts } from "@/lib/cma/services/post-service";

// GET /api/cma/posts?orgId=...&status=...&page=...&search=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const auth = await withApiKeyOrSessionAuth(orgId, request);
  if (auth instanceof NextResponse) return auth;

  const result = await listPosts({
    orgId: auth.orgId,
    status: searchParams.get("status") || undefined,
    page: parseInt(searchParams.get("page") || "1", 10),
    limit: Math.min(Math.max(parseInt(searchParams.get("limit") || "20", 10), 1), 100),
    search: searchParams.get("search") || undefined,
  });

  return NextResponse.json(result);
}

// POST /api/cma/posts — create a new draft post
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, title, content, contentFormat, templateId, styleTheme, excerpt, categories, tags, featuredImage, source } = body;

    if (!orgId || !title || !content) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, title, content" },
        { status: 400 }
      );
    }

    const auth = await withApiKeyOrSessionAuth(orgId, request);
    if (auth instanceof NextResponse) return auth;

    const post = await createPost({
      orgId: auth.orgId,
      authorId: auth.userId,
      title,
      content,
      contentFormat,
      templateId,
      styleTheme,
      excerpt,
      categories,
      tags,
      featuredImage,
      source,
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
