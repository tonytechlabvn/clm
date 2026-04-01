// Org-scoped auth middleware for CMA API routes — validates session + role + org membership
// Supports both session auth (browser) and API key auth (external services like MCP)

import { getServerSession } from "next-auth";
import { prisma } from "@/lib/prisma-client";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";
import { validateApiKey, RateLimitError } from "./api-key-service";

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

/**
 * Dual auth — checks API key first (via x-auth-method header set by middleware),
 * then falls back to session auth. Use this on CMA routes that external services need.
 */
export async function withApiKeyOrSessionAuth(
  orgId: string,
  request: Request
): Promise<OrgAuthContext | NextResponse> {
  const authMethod = request.headers.get("x-auth-method");

  if (authMethod === "api-key") {
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.replace("Bearer ", "");
    if (!bearerToken) {
      return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
    }

    let apiKeyAuth;
    try {
      apiKeyAuth = await validateApiKey(bearerToken);
    } catch (err) {
      if (err instanceof RateLimitError) {
        return NextResponse.json(
          { error: "Rate limit exceeded" },
          { status: 429, headers: { "Retry-After": "60" } }
        );
      }
      throw err;
    }
    if (!apiKeyAuth) {
      return NextResponse.json({ error: "Invalid or expired API key" }, { status: 401 });
    }

    // Ensure the API key's org matches the requested org
    if (apiKeyAuth.orgId !== orgId) {
      return NextResponse.json(
        { error: "API key not authorized for this organization" },
        { status: 403 }
      );
    }

    return {
      userId: apiKeyAuth.userId,
      orgId: apiKeyAuth.orgId,
      orgRole: apiKeyAuth.orgRole,
      userRole: apiKeyAuth.userRole,
    };
  }

  // Fall back to session auth
  return withOrgAuth(orgId);
}
