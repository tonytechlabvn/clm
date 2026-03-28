// Approval Queue — GET pending posts, POST approve/reject

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { prisma } from "@/lib/prisma-client";

// GET /api/cma/approval?orgId=...&page=1&limit=20
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 100);

  const [posts, total] = await Promise.all([
    prisma.cmaPost.findMany({
      where: { orgId: auth.orgId, status: "pending_review", parentPostId: null },
      include: {
        children: { select: { id: true, title: true, content: true, status: true } },
        author: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.cmaPost.count({
      where: { orgId: auth.orgId, status: "pending_review", parentPostId: null },
    }),
  ]);

  return NextResponse.json({ posts, total, page, pages: Math.ceil(total / limit) });
}

// POST /api/cma/approval — approve or reject post(s)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, postIds, action, selfApprovalAck } = body;

    if (!orgId || !postIds?.length || !action) {
      return NextResponse.json({ error: "orgId, postIds[], action required" }, { status: 400 });
    }
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json({ error: "action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    // Self-approval check: for orgs with 2+ CMA users, require different userId
    if (action === "approve") {
      const adminCount = await prisma.orgMember.count({
        where: { orgId, role: { in: ["owner", "admin"] } },
      });

      if (adminCount >= 2) {
        // Check if any of the posts were authored by current user
        const selfAuthored = await prisma.cmaPost.findFirst({
          where: { id: { in: postIds }, authorId: auth.userId },
          select: { id: true },
        });
        if (selfAuthored) {
          return NextResponse.json(
            { error: "Self-approval not allowed when org has 2+ admins" },
            { status: 403 }
          );
        }
      } else if (!selfApprovalAck) {
        // Single admin — require explicit acknowledgment
        return NextResponse.json(
          { error: "Self-approval requires acknowledgment (selfApprovalAck: true)" },
          { status: 400 }
        );
      }
    }

    const newStatus = action === "approve" ? "approved" : "draft";

    // Update main posts + their children
    await prisma.cmaPost.updateMany({
      where: {
        orgId: auth.orgId,
        status: "pending_review",
        OR: [
          { id: { in: postIds } },
          { parentPostId: { in: postIds } },
        ],
      },
      data: { status: newStatus },
    });

    return NextResponse.json({ success: true, action, count: postIds.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
