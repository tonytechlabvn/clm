// CMA Image Templates [id] API — GET single, PUT update, DELETE (org-owned only)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withApiKeyOrSessionAuth } from "@/lib/cma/services/org-auth";
import { updateImageTemplateSchema } from "@/lib/cma/types/image-template-types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/cma/image-templates/[id]?orgId=...
export async function GET(request: Request, { params }: RouteParams) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const auth = await withApiKeyOrSessionAuth(orgId, request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    // orgId scoping: system templates visible to all, org templates to owner only
    const template = await prisma.cmaImageTemplate.findFirst({
      where: {
        id,
        OR: [{ isSystem: true }, { orgId: auth.orgId }],
      },
    });

    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json({ data: template });
  } catch (err) {
    console.error("[api/cma/image-templates/[id] GET]", err);
    return NextResponse.json(
      { error: "Failed to get image template", details: (err as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/cma/image-templates/[id] — update org-owned template only (not system)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { orgId, ...updateData } = body;

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    const auth = await withApiKeyOrSessionAuth(orgId, request);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;

    // Only org-owned templates can be updated (not system)
    const existing = await prisma.cmaImageTemplate.findFirst({
      where: { id, orgId: auth.orgId, isSystem: false },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Template not found or cannot be modified" },
        { status: 404 }
      );
    }

    const parsed = updateImageTemplateSchema.safeParse(updateData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const template = await prisma.cmaImageTemplate.update({
      where: { id },
      data: {
        ...parsed.data,
        ...(parsed.data.variableSchema
          ? { variableSchema: parsed.data.variableSchema as unknown as object[] }
          : {}),
      },
    });

    return NextResponse.json({ data: template });
  } catch (err) {
    console.error("[api/cma/image-templates/[id] PUT]", err);
    return NextResponse.json(
      { error: "Failed to update image template", details: (err as Error).message },
      { status: 500 }
    );
  }
}

// DELETE /api/cma/image-templates/[id] — delete org-owned template only
export async function DELETE(request: Request, { params }: RouteParams) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const auth = await withApiKeyOrSessionAuth(orgId, request);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;

    const existing = await prisma.cmaImageTemplate.findFirst({
      where: { id, orgId: auth.orgId, isSystem: false },
    });
    if (!existing) {
      return NextResponse.json(
        { error: "Template not found or cannot be deleted" },
        { status: 404 }
      );
    }

    await prisma.cmaImageTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/cma/image-templates/[id] DELETE]", err);
    return NextResponse.json(
      { error: "Failed to delete image template", details: (err as Error).message },
      { status: 500 }
    );
  }
}
