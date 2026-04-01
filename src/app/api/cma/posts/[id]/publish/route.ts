// CMA Publish endpoint — POST triggers publish to platform

import { NextResponse } from "next/server";
import { withApiKeyOrSessionAuth } from "@/lib/cma/services/org-auth";
import { publishPost } from "@/lib/cma/services/publishing-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/cma/posts/[id]/publish — publish post to a platform account
export async function POST(request: Request, { params }: RouteParams) {
  const { id } = await params;
  try {
    const body = await request.json();
    const { accountId, orgId } = body;

    if (!accountId || !orgId) {
      return NextResponse.json(
        { error: "Missing required fields: accountId, orgId" },
        { status: 400 }
      );
    }

    const auth = await withApiKeyOrSessionAuth(orgId, request);
    if (auth instanceof NextResponse) return auth;

    const result = await publishPost({ postId: id, accountId, orgId: auth.orgId });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Publish failed" },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
