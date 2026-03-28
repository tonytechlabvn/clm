// CMA Platform Account detail — GET, DELETE, PATCH (validate connection)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withAdminAuth } from "@/lib/cma/services/org-auth";
import { getAdapter } from "@/lib/cma/adapters/adapter-registry";
import { decryptToken } from "@/lib/cma/crypto-utils";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/cma/accounts/[id] — get account details
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const account = await prisma.cmaPlatformAccount.findFirst({
    where: { id, userId: auth.userId },
    select: {
      id: true,
      orgId: true,
      platform: true,
      label: true,
      siteUrl: true,
      username: true,
      isActive: true,
      createdAt: true,
      org: { select: { id: true, name: true } },
    },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  return NextResponse.json(account);
}

// DELETE /api/cma/accounts/[id] — disconnect platform account
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const account = await prisma.cmaPlatformAccount.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  // Call adapter disconnect (no-op for WP, needed for OAuth platforms)
  const adapter = getAdapter(account.platform);
  await adapter.disconnect(account.id);

  await prisma.cmaPlatformAccount.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

// PATCH /api/cma/accounts/[id] — validate connection status
export async function PATCH(_request: Request, { params }: RouteParams) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const account = await prisma.cmaPlatformAccount.findFirst({
    where: { id, userId: auth.userId },
  });

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const adapter = getAdapter(account.platform);
  const token = decryptToken(account.accessToken);
  const valid = await adapter.validateConnection(
    account.siteUrl || "",
    account.username || "",
    token
  );

  if (!valid) {
    await prisma.cmaPlatformAccount.update({
      where: { id },
      data: { isActive: false },
    });
  }

  return NextResponse.json({ valid, isActive: valid });
}
