// CMA Org — returns the user's primary org for CMA context

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withAdminAuth } from "@/lib/cma/services/org-auth";

// GET /api/cma/org — get user's first org (MVP: single-org)
export async function GET() {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  // Root sees first org; admin sees their membership org
  let org;
  if (auth.userRole === "root") {
    org = await prisma.organization.findFirst({
      where: { isActive: true },
      select: { id: true, name: true, slug: true },
      orderBy: { createdAt: "asc" },
    });
  } else {
    const membership = await prisma.orgMember.findFirst({
      where: { userId: auth.userId },
      include: { org: { select: { id: true, name: true, slug: true } } },
      orderBy: { joinedAt: "asc" },
    });
    org = membership?.org;
  }

  if (!org) {
    return NextResponse.json({ error: "No organization found" }, { status: 404 });
  }

  return NextResponse.json(org);
}
