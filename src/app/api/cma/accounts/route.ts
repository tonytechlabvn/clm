// CMA Platform Accounts — GET list, POST connect new account

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withAdminAuth, withApiKeyOrSessionAuth } from "@/lib/cma/services/org-auth";
import { validateApiKey, RateLimitError } from "@/lib/cma/services/api-key-service";
import { getAdapter } from "@/lib/cma/adapters/adapter-registry";
import { encryptToken } from "@/lib/cma/crypto-utils";

// GET /api/cma/accounts — list connected platform accounts for user's orgs
export async function GET(request: Request) {
  // Support API key auth — resolve user from Bearer token
  const authMethod = request.headers.get("x-auth-method");
  let userId: string;

  if (authMethod === "api-key") {
    const bearerToken = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!bearerToken) {
      return NextResponse.json({ error: "Missing Bearer token" }, { status: 401 });
    }
    try {
      const apiKeyAuth = await validateApiKey(bearerToken);
      if (!apiKeyAuth) {
        return NextResponse.json({ error: "Invalid or expired API key" }, { status: 401 });
      }
      userId = apiKeyAuth.userId;
    } catch (err) {
      if (err instanceof RateLimitError) {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": "60" } });
      }
      throw err;
    }
  } else {
    const auth = await withAdminAuth();
    if (auth instanceof NextResponse) return auth;
    userId = auth.userId;
  }

  const accounts = await prisma.cmaPlatformAccount.findMany({
    where: { user: { id: userId } },
    select: {
      id: true,
      orgId: true,
      platform: true,
      label: true,
      siteUrl: true,
      username: true,
      isActive: true,
      createdAt: true,
      org: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ accounts });
}

// POST /api/cma/accounts �� connect a new platform account
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, platform, siteUrl, username, accessToken, label } = body;

    if (!orgId || !platform || !accessToken || !label) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, platform, accessToken, label" },
        { status: 400 }
      );
    }

    // C2 fix: verify org membership before creating account
    const auth = await withApiKeyOrSessionAuth(orgId, request);
    if (auth instanceof NextResponse) return auth;

    // Validate connection via adapter
    const adapter = getAdapter(platform);
    const connectResult = await adapter.connect({
      platform,
      siteUrl,
      username,
      accessToken,
      label,
    });

    if (!connectResult.valid) {
      return NextResponse.json(
        { error: "Failed to connect: invalid credentials" },
        { status: 400 }
      );
    }

    // Store with encrypted token
    const account = await prisma.cmaPlatformAccount.create({
      data: {
        orgId,
        userId: auth.userId,
        platform,
        label: label || connectResult.displayName,
        siteUrl: siteUrl || null,
        username: username || null,
        accessToken: encryptToken(accessToken),
      },
      select: {
        id: true,
        orgId: true,
        platform: true,
        label: true,
        siteUrl: true,
        username: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json(account, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
