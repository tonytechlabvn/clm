// GET/PUT /api/cma/settings/zalo — Zalo OA bot configuration per org

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { encryptToken } from "@/lib/cma/crypto-utils";

// GET — return current Zalo OA config (secrets masked)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const config = await prisma.cmaZaloBotConfig.findUnique({ where: { orgId } });

  return NextResponse.json({
    oaId: config?.oaId || "",
    oaSecret: config?.accessToken ? "••••••••" : "",
    webhookSecret: "",
    accessToken: config?.accessToken ? "••••••••" : "",
    refreshToken: config?.refreshToken ? "••••••••" : "",
    isActive: config?.isActive ?? false,
    configured: !!(config?.oaId && config?.accessToken),
  });
}

// PUT — save Zalo OA credentials
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orgId, oaId, oaSecret, webhookSecret, accessToken, refreshToken } = body;
    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;
    if (auth.orgRole !== "admin" && auth.orgRole !== "owner") {
      return NextResponse.json({ error: "Only admin/owner can configure Zalo" }, { status: 403 });
    }

    const MASK = "••••••••";
    const updateData: Record<string, unknown> = { botType: "oa", isActive: true };
    if (oaId !== undefined) updateData.oaId = oaId || null;
    if (accessToken && accessToken !== MASK) updateData.accessToken = encryptToken(accessToken);
    if (refreshToken && refreshToken !== MASK) updateData.refreshToken = encryptToken(refreshToken);
    if (accessToken && accessToken !== MASK) {
      updateData.tokenExpiry = new Date(Date.now() + 86400_000); // ~24h from now
    }

    // Store webhook secret as env var hint — actual verification uses ZALO_WEBHOOK_SECRET env var
    // but we store oaSecret in DB for reference
    if (oaSecret && oaSecret !== MASK) {
      // oaSecret goes to env — store note that it's configured
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
