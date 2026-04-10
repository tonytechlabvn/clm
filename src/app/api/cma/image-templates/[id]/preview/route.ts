// CMA Image Template Preview — POST returns base64 PNG at reduced scale for instant UI feedback

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withApiKeyOrSessionAuth } from "@/lib/cma/services/org-auth";
import { z } from "zod";
import { renderPreview } from "@/lib/cma/services/image-template-renderer-service";
import { variableSchemaValidator } from "@/lib/cma/types/image-template-types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/cma/image-templates/[id]/preview
export async function POST(request: Request, { params }: RouteParams) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const auth = await withApiKeyOrSessionAuth(orgId, request);
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const variables = z.record(z.string(), z.string()).catch({}).parse(body.variables ?? {});
    const { id } = await params;

    const template = await prisma.cmaImageTemplate.findFirst({
      where: {
        id,
        OR: [{ isSystem: true }, { orgId: auth.orgId }],
      },
    });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Validate stored schema
    const schemaResult = variableSchemaValidator.safeParse(template.variableSchema);
    if (!schemaResult.success) {
      return NextResponse.json({ error: "Invalid template schema" }, { status: 500 });
    }

    // Fill missing variables with defaults for preview
    const filledVars: Record<string, string> = {};
    for (const v of schemaResult.data) {
      filledVars[v.name] = variables[v.name] || v.defaultValue || "";
    }

    const buffer = await renderPreview({
      htmlContent: template.htmlContent,
      variables: filledVars,
      width: template.width,
      height: template.height,
    });

    const base64 = `data:image/png;base64,${buffer.toString("base64")}`;
    return NextResponse.json({
      data: { base64, width: template.width, height: template.height },
    });
  } catch (err) {
    console.error("[api/cma/image-templates/[id]/preview POST]", err);
    return NextResponse.json(
      { error: "Failed to generate preview", details: (err as Error).message },
      { status: 500 }
    );
  }
}
