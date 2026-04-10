// CMA Image Template Render — POST generates full-quality PNG, creates CmaMedia + GeneratedImage records

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withApiKeyOrSessionAuth } from "@/lib/cma/services/org-auth";
import { renderAndSave } from "@/lib/cma/services/image-template-renderer-service";
import {
  renderRequestSchema,
  variableSchemaValidator,
  validateRequiredVariables,
} from "@/lib/cma/types/image-template-types";
import path from "path";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// POST /api/cma/image-templates/[id]/render
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
    const parsed = renderRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { variables, postId } = parsed.data;
    const { id } = await params;

    // Fetch template with orgId scoping
    const template = await prisma.cmaImageTemplate.findFirst({
      where: {
        id,
        OR: [{ isSystem: true }, { orgId: auth.orgId }],
      },
    });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Validate variableSchema from DB (runtime safety)
    const schemaResult = variableSchemaValidator.safeParse(template.variableSchema);
    if (!schemaResult.success) {
      return NextResponse.json({ error: "Invalid template schema" }, { status: 500 });
    }

    // Check required variables are provided
    const missing = validateRequiredVariables(schemaResult.data, variables);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Missing required variables", details: missing },
        { status: 400 }
      );
    }

    // Render synchronously (MVP — async via pg-boss for batch later)
    const result = await renderAndSave({
      htmlContent: template.htmlContent,
      variables,
      width: template.width,
      height: template.height,
      orgId: auth.orgId,
    });

    // Create CmaMedia record so image is served via existing /api/cma/media/[id] pipeline
    const media = await prisma.cmaMedia.create({
      data: {
        orgId: auth.orgId,
        postId,
        fileName: path.basename(result.filePath),
        originalName: `${template.name}-${template.platform}.png`,
        mimeType: "image/png",
        size: result.fileSize,
        localPath: result.filePath,
        source: "template-generated",
      },
    });

    // Create GeneratedImage record for provenance tracking
    const generated = await prisma.generatedImage.create({
      data: {
        templateId: template.id,
        variables,
        imagePath: result.filePath,
        width: result.width,
        height: result.height,
        fileSize: result.fileSize,
        orgId: auth.orgId,
        createdById: auth.userId,
        postId,
        mediaId: media.id,
      },
    });

    // Increment template usage stats
    await prisma.cmaImageTemplate.update({
      where: { id: template.id },
      data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
    });

    return NextResponse.json({
      data: {
        generatedImageId: generated.id,
        mediaId: media.id,
        imageUrl: `/api/cma/media/${media.id}`,
        width: result.width,
        height: result.height,
      },
    });
  } catch (err) {
    console.error("[api/cma/image-templates/[id]/render POST]", err);
    return NextResponse.json(
      { error: "Failed to render image", details: (err as Error).message },
      { status: 500 }
    );
  }
}
