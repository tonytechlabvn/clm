// CMA Templates API — GET list, POST create org template

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { listTemplates, createTemplate } from "@/lib/cma/services/template-service";

// GET /api/cma/templates?orgId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  try {
    const templates = await listTemplates(auth.orgId);
    return NextResponse.json({ templates });
  } catch (err) {
    console.error("[api/cma/templates GET]", err);
    return NextResponse.json(
      { error: "Failed to list templates", details: (err as Error).message },
      { status: 500 }
    );
  }
}

// POST /api/cma/templates — create org-owned template
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, name, slug, description, category, blocks, styleTheme, thumbnail } = body;

    if (!orgId || !name || !category || !blocks) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, name, category, blocks" },
        { status: 400 }
      );
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const template = await createTemplate(
      { name, slug, description, category, blocks, styleTheme, thumbnail },
      auth.orgId
    );
    return NextResponse.json(template, { status: 201 });
  } catch (err) {
    console.error("[api/cma/templates POST]", err);
    return NextResponse.json(
      { error: "Failed to create template", details: (err as Error).message },
      { status: 500 }
    );
  }
}
