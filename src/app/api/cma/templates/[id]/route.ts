// CMA Templates [id] API — GET single, PUT update, DELETE (org-owned only)

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { getTemplate, updateTemplate, deleteTemplate } from "@/lib/cma/services/template-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/cma/templates/[id]?orgId=...
export async function GET(request: Request, { params }: RouteParams) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    const template = await getTemplate(id, auth.orgId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    return NextResponse.json(template);
  } catch (err) {
    console.error("[api/cma/templates/[id] GET]", err);
    return NextResponse.json(
      { error: "Failed to get template", details: (err as Error).message },
      { status: 500 }
    );
  }
}

// PUT /api/cma/templates/[id] — update org-owned template (blocks or html-slots)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const {
      orgId, name, description, category, blocks, styleTheme, thumbnail,
      templateType, htmlTemplate, cssScoped, slotDefinitions, sourceUrl, tags,
    } = body;

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    const template = await updateTemplate(
      id,
      {
        name, description, category, blocks, styleTheme, thumbnail,
        templateType, htmlTemplate, cssScoped, slotDefinitions, sourceUrl, tags,
      },
      auth.orgId
    );
    return NextResponse.json(template);
  } catch (err) {
    console.error("[api/cma/templates/[id] PUT]", err);
    const message = (err as Error).message;
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { error: "Failed to update template", details: message },
      { status }
    );
  }
}

// DELETE /api/cma/templates/[id]?orgId=...
export async function DELETE(request: Request, { params }: RouteParams) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  try {
    const { id } = await params;
    await deleteTemplate(id, auth.orgId);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[api/cma/templates/[id] DELETE]", err);
    const message = (err as Error).message;
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json(
      { error: "Failed to delete template", details: message },
      { status }
    );
  }
}
