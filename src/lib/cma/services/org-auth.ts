// Org-scoped auth middleware for CMA API routes — validates session + role + org membership

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma-client";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";

export interface OrgAuthContext {
  userId: string;
  orgId: string;
  orgRole: string; // OrgMember role: "owner" | "admin" | "member"
  userRole: string; // User global role: "root" | "admin" | "user"
}

/**
 * Validates that the requesting user:
 * 1. Has a valid session with admin/root global role
 * 2. Is a member of the specified organization
 * Returns auth context or a 401/403 NextResponse error.
 */
export async function withOrgAuth(
  orgId: string
): Promise<OrgAuthContext | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const role = session.role;
  if (role !== "admin" && role !== "root") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Root users bypass org membership check
  if (role === "root") {
    return {
      userId: session.dbUserId,
      orgId,
      orgRole: "owner",
      userRole: "root",
    };
  }

  // Admin must be org member
  const membership = await prisma.orgMember.findUnique({
    where: { userId_orgId: { userId: session.dbUserId, orgId } },
  });
  if (!membership) {
    return NextResponse.json(
      { error: "Not a member of this organization" },
      { status: 403 }
    );
  }

  return {
    userId: session.dbUserId,
    orgId,
    orgRole: membership.role,
    userRole: role,
  };
}

/**
 * Simplified auth check — just validates session + admin/root role.
 * Used when orgId is not yet known (e.g., listing accounts across orgs).
 */
export async function withAdminAuth(): Promise<
  { userId: string; userRole: string } | NextResponse
> {
  const session = await getServerSession(authOptions);
  if (!session?.dbUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.role !== "admin" && session.role !== "root") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { userId: session.dbUserId, userRole: session.role };
}
