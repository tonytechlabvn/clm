// CMA Post detail — GET, PUT, DELETE

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { getPost, updatePost, deletePost } from "@/lib/cma/services/post-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/cma/posts/[id]?orgId=...
export async function GET(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const post = await getPost(id, auth.orgId);
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  return NextResponse.json(post);
}

// PUT /api/cma/posts/[id] — update post
export async function PUT(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { orgId, ...input } = body;
    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const post = await updatePost(id, auth.orgId, input);
    return NextResponse.json(post);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE /api/cma/posts/[id]?orgId=...
export async function DELETE(request: Request, { params }: RouteParams) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  try {
    await deletePost(id, auth.orgId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
