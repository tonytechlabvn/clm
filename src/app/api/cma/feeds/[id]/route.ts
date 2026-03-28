// RSS Feed — PUT update, DELETE remove

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { prisma } from "@/lib/prisma-client";

interface RouteParams { params: Promise<{ id: string }> }

// PUT /api/cma/feeds/[id]
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { orgId, name, url, keywords, language, fetchFrequency, isActive } = body;

    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const feed = await prisma.cmaRssFeed.findUnique({ where: { id } });
    if (!feed || feed.orgId !== auth.orgId) {
      return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }

    const updated = await prisma.cmaRssFeed.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(url !== undefined && { url }),
        ...(keywords !== undefined && { keywords }),
        ...(language !== undefined && { language }),
        ...(fetchFrequency !== undefined && { fetchFrequency }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/cma/feeds/[id]?orgId=...
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const orgId = searchParams.get("orgId");
    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const feed = await prisma.cmaRssFeed.findUnique({ where: { id } });
    if (!feed || feed.orgId !== auth.orgId) {
      return NextResponse.json({ error: "Feed not found" }, { status: 404 });
    }

    await prisma.cmaRssFeed.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
