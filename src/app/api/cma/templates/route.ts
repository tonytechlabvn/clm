// CMA Templates API — GET list (with favorites), POST create org template (blocks + html-slots)

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import {
  listTemplates,
  listTemplatesWithMeta,
  createTemplate,
} from "@/lib/cma/services/template-service";

// GET /api/cma/templates?orgId=...&userId=... (userId optional — includes isFavorite flag)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  try {
    // If userId provided (or from auth), include favorites metadata
    const userId = searchParams.get("userId") || auth.userId;
    if (userId) {
      const templates = await listTemplatesWithMeta(auth.orgId, userId);
      return NextResponse.json({ templates });
    }
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

// POST /api/cma/templates — create org-owned template (blocks or html-slots)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      orgId, name, slug, description, category, blocks, styleTheme, thumbnail,
      templateType, htmlTemplate, cssScoped, slotDefinitions, sourceUrl, tags,
    } = body;

    if (!orgId || !name || !category) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, name, category" },
        { status: 400 }
      );
    }

    // blocks required for blocks type, htmlTemplate for html-slots
    if (templateType !== "html-slots" && !blocks) {
      return NextResponse.json(
        { error: "blocks is required for blocks templates" },
        { status: 400 }
      );
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const template = await createTemplate(
      {
        name, slug, description, category, blocks, styleTheme, thumbnail,
        templateType, htmlTemplate, cssScoped, slotDefinitions, sourceUrl, tags,
      },
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
