// CMA Media serve — org-scoped, auth-gated file serving with security headers

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withAdminAuth } from "@/lib/cma/services/org-auth";
import { readFile, unlink } from "fs/promises";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/cma/media/[id] — serve uploaded media file (org-scoped via user's membership)
export async function GET(_request: Request, { params }: RouteParams) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  // Org-scope: join through user's org memberships to verify access
  const media = await prisma.cmaMedia.findFirst({
    where: {
      id,
      orgId: { in: auth.userRole === "root"
        ? (await prisma.organization.findMany({ select: { id: true } })).map(o => o.id)
        : (await prisma.orgMember.findMany({ where: { userId: auth.userId }, select: { orgId: true } })).map(m => m.orgId)
      },
    },
  });
  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  try {
    const buffer = await readFile(media.localPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": media.mimeType,
        "Content-Disposition": `inline; filename="${media.fileName}"`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found on disk" }, { status: 404 });
  }
}

// DELETE /api/cma/media/[id] — delete media record and file from disk
export async function DELETE(_request: Request, { params }: RouteParams) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  // Org-scope: same membership check as GET
  const media = await prisma.cmaMedia.findFirst({
    where: {
      id,
      orgId: { in: auth.userRole === "root"
        ? (await prisma.organization.findMany({ select: { id: true } })).map(o => o.id)
        : (await prisma.orgMember.findMany({ where: { userId: auth.userId }, select: { orgId: true } })).map(m => m.orgId)
      },
    },
  });
  if (!media) {
    return NextResponse.json({ error: "Media not found" }, { status: 404 });
  }

  // Delete file from disk, then DB record
  await unlink(media.localPath).catch(() => {});
  await prisma.cmaMedia.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
