// POST /api/cma/approval/[id]/quick — one-click approval via signed token (no login required)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { verifyApprovalToken } from "@/lib/cma/services/approval-token-service";
import { enqueueScheduledPublish } from "@/lib/cma/services/pgboss-service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: postId } = await params;
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
    const action = searchParams.get("action");

    if (!token || !action) {
      return NextResponse.json({ error: "Missing token or action" }, { status: 400 });
    }

    // Verify HMAC-signed token (includes userId binding + expiry)
    const payload = verifyApprovalToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Invalid or expired approval token" }, { status: 401 });
    }

    // Validate token matches this post
    if (payload.postId !== postId) {
      return NextResponse.json({ error: "Token does not match this post" }, { status: 403 });
    }

    // Atomic status check — only process if still pending_review (prevents double-approval)
    const newStatus = payload.action === "approve" ? "approved" : "draft";
    const result = await prisma.cmaPost.updateMany({
      where: { id: postId, orgId: payload.orgId, status: "pending_review" },
      data: { status: newStatus },
    });

    if (result.count === 0) {
      return NextResponse.json({ success: false, message: "Post already processed or not found" });
    }

    // If approved, enqueue immediate publish
    if (payload.action === "approve") {
      const account = await prisma.cmaPlatformAccount.findFirst({
        where: { orgId: payload.orgId, isActive: true },
        select: { id: true },
      });
      if (account) {
        await enqueueScheduledPublish(postId, account.id, payload.orgId, new Date());
      }
    }

    const actionLabel = payload.action === "approve" ? "approved" : "rejected";
    return NextResponse.json({ success: true, message: `Post ${actionLabel} successfully` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approval failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
