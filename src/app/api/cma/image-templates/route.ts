// CMA Image Templates API — GET list (system + org-owned), POST create new template

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withApiKeyOrSessionAuth } from "@/lib/cma/services/org-auth";
import { createImageTemplateSchema } from "@/lib/cma/types/image-template-types";

// GET /api/cma/image-templates?orgId=...&platform=... (optional filter)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const auth = await withApiKeyOrSessionAuth(orgId, request);
  if (auth instanceof NextResponse) return auth;

  try {
    const platform = searchParams.get("platform");

    const templates = await prisma.cmaImageTemplate.findMany({
      where: {
        OR: [{ isSystem: true }, { orgId: auth.orgId }],
        ...(platform && platform !== "all" ? { platform } : {}),
      },
      orderBy: [{ isSystem: "desc" }, { usageCount: "desc" }],
    });

    return NextResponse.json({ data: templates });
  } catch (err) {
    console.error("[api/cma/image-templates GET]", err);
    return NextResponse.json(
      { error: "Failed to list image templates", details: (err as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/cma/image-templates — create org-owned image template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, ...templateData } = body;

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    const auth = await withApiKeyOrSessionAuth(orgId, request);
    if (auth instanceof NextResponse) return auth;

    const parsed = createImageTemplateSchema.safeParse(templateData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const template = await prisma.cmaImageTemplate.create({
      data: {
        ...parsed.data,
        variableSchema: parsed.data.variableSchema as unknown as object[],
        orgId: auth.orgId,
        isSystem: false,
      },
    });

    return NextResponse.json({ data: template }, { status: 201 });
  } catch (err) {
    console.error("[api/cma/image-templates POST]", err);
    return NextResponse.json(
      { error: "Failed to create image template", details: (err as Error).message },
      { status: 500 }
    );
  }
}
