// GET/PUT /api/cma/settings/facebook — Facebook App credentials per org

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { encryptToken, decryptToken } from "@/lib/cma/crypto-utils";

// GET — return current FB config (secret masked)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const settings = await prisma.cmaOrgSettings.findUnique({ where: { orgId } });

  return NextResponse.json({
    fbAppId: settings?.fbAppId || "",
    fbAppSecret: settings?.fbAppSecret ? "••••••••" : "",
    fbRedirectUri: settings?.fbRedirectUri || "",
    configured: !!(settings?.fbAppId && settings?.fbAppSecret),
  });
}

// PUT — save FB App credentials
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orgId, fbAppId, fbAppSecret, fbRedirectUri } = body;
    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;
    if (auth.orgRole !== "admin" && auth.orgRole !== "owner") {
      return NextResponse.json({ error: "Only admin/owner can configure Facebook" }, { status: 403 });
    }

    // Build update data — only update fields that are provided
    const updateData: Record<string, string | null> = {};
    if (fbAppId !== undefined) updateData.fbAppId = fbAppId || null;
    if (fbRedirectUri !== undefined) updateData.fbRedirectUri = fbRedirectUri || null;
    // Only update secret if a new value is provided (not the masked placeholder)
    if (fbAppSecret && fbAppSecret !== "••••••••") {
      updateData.fbAppSecret = encryptToken(fbAppSecret);
    }

    await prisma.cmaOrgSettings.upsert({
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
