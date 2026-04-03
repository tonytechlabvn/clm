// GET/PUT /api/cma/settings/zalo — Zalo bot configuration per org (OA + Personal modes)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { encryptToken } from "@/lib/cma/crypto-utils";

const MASK = "••••••••";

// GET — return current Zalo config (secrets masked)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const config = await prisma.cmaZaloBotConfig.findUnique({ where: { orgId } });

  return NextResponse.json({
    botType: config?.botType || "oa",
    oaId: config?.oaId || "",
    accessToken: config?.accessToken ? MASK : "",
    refreshToken: config?.refreshToken ? MASK : "",
    // Personal mode fields
    selfId: config?.selfId || "",
    cookies: config?.cookies ? MASK : "",
    imei: config?.imei || "",
    userAgent: config?.userAgent || "",
    isActive: config?.isActive ?? false,
    configured: config?.botType === "personal"
      ? !!(config?.cookies && config?.selfId)
      : !!(config?.oaId && config?.accessToken),
  });
}

// PUT — save Zalo bot credentials (OA or Personal mode)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orgId, botType, oaId, accessToken, refreshToken, selfId, cookies, imei, userAgent } = body;
    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;
    if (auth.orgRole !== "admin" && auth.orgRole !== "owner") {
      return NextResponse.json({ error: "Only admin/owner can configure Zalo" }, { status: 403 });
    }

    const updateData: Record<string, unknown> = {
      botType: botType || "oa",
      isActive: true,
    };

    if (botType === "personal") {
      // Personal mode fields
      if (selfId !== undefined) updateData.selfId = selfId || null;
      if (cookies && cookies !== MASK) updateData.cookies = encryptToken(cookies);
      if (imei !== undefined) updateData.imei = imei || null;
      if (userAgent !== undefined) updateData.userAgent = userAgent || null;
      if (cookies && cookies !== MASK) {
        updateData.cookieExpiry = new Date(Date.now() + 30 * 86400_000); // ~30 days
      }
    } else {
      // OA mode fields
      if (oaId !== undefined) updateData.oaId = oaId || null;
      if (accessToken && accessToken !== MASK) updateData.accessToken = encryptToken(accessToken);
      if (refreshToken && refreshToken !== MASK) updateData.refreshToken = encryptToken(refreshToken);
      if (accessToken && accessToken !== MASK) {
        updateData.tokenExpiry = new Date(Date.now() + 86400_000); // ~24h
      }
    }

    await prisma.cmaZaloBotConfig.upsert({
      where: { orgId },
      create: { orgId, ...updateData },
      update: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Save failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
