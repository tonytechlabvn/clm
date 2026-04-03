// GET/PUT /api/cma/zalo/users — list linked Zalo users + manage platform permissions

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withOrgAuth } from "@/lib/cma/services/org-auth";

// GET — list linked users with their CLM user info + allowed platforms
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const mappings = await prisma.cmaZaloUserMapping.findMany({
    where: { orgId, zaloUserId: { not: { startsWith: "__pending_" } } },
    orderBy: { createdAt: "desc" },
  });

  // Fetch CLM user info for each mapping
  const userIds = mappings.map((m) => m.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  // Fetch platform accounts for permission display
  const accounts = await prisma.cmaPlatformAccount.findMany({
    where: { orgId, isActive: true },
    select: { id: true, platform: true, label: true },
  });

  const linkedUsers = mappings.map((m) => ({
    id: m.id,
    userId: m.userId,
    userName: userMap[m.userId]?.name || "Unknown",
    userEmail: userMap[m.userId]?.email || "",
    zaloUserId: m.zaloUserId,
    zaloName: m.zaloName || "",
    allowedAccountIds: m.allowedAccountIds, // empty = all
    isActive: m.isActive,
    createdAt: m.createdAt,
  }));

  return NextResponse.json({ linkedUsers, accounts });
}

// PUT — update linked user's allowed platform accounts
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orgId, mappingId, allowedAccountIds, isActive } = body;
    if (!orgId || !mappingId) return NextResponse.json({ error: "orgId and mappingId required" }, { status: 400 });

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;
    if (auth.orgRole !== "admin" && auth.orgRole !== "owner") {
      return NextResponse.json({ error: "Only admin/owner can manage users" }, { status: 403 });
    }

    const update: Record<string, unknown> = {};
    if (allowedAccountIds !== undefined) update.allowedAccountIds = allowedAccountIds;
    if (isActive !== undefined) update.isActive = isActive;

    await prisma.cmaZaloUserMapping.update({ where: { id: mappingId }, data: update });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Update failed" }, { status: 500 });
  }
}
