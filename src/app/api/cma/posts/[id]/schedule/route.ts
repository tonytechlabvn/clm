// CMA Post Schedule API — PATCH reschedule, POST schedule, DELETE cancel

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { schedulePost, reschedulePost, cancelScheduledPost } from "@/lib/cma/services/scheduling-service";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// POST /api/cma/posts/[id]/schedule — schedule a post for future publishing
export async function POST(request: Request, context: RouteContext) {
  try {
    const { id: postId } = await context.params;
    const body = await request.json();
    const { orgId, accountId, scheduledAt } = body;

    if (!orgId || !accountId || !scheduledAt) {
      return NextResponse.json(
        { error: "orgId, accountId, and scheduledAt are required" },
        { status: 400 }
      );
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const result = await schedulePost(postId, accountId, auth.orgId, new Date(scheduledAt));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// PATCH /api/cma/posts/[id]/schedule — reschedule a post
export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id: postId } = await context.params;
    const body = await request.json();
    const { orgId, scheduledAt } = body;

    if (!orgId || !scheduledAt) {
      return NextResponse.json(
        { error: "orgId and scheduledAt are required" },
        { status: 400 }
      );
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const result = await reschedulePost(postId, auth.orgId, new Date(scheduledAt));
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

// DELETE /api/cma/posts/[id]/schedule — cancel a scheduled post
export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id: postId } = await context.params;
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    await cancelScheduledPost(postId, auth.orgId);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
