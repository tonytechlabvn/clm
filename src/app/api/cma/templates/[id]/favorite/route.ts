// POST /api/cma/templates/[id]/favorite — Toggle favorite status for a template

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { getTemplate, toggleFavorite } from "@/lib/cma/services/template-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    // Verify template is visible to this org
    const template = await getTemplate(id, auth.orgId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    const isFavorite = await toggleFavorite(id, auth.userId);

    return NextResponse.json({ data: { isFavorite } });
  } catch (err) {
    console.error("[api/cma/templates/[id]/favorite POST]", err);
    return NextResponse.json(
      { error: "Failed to toggle favorite", details: (err as Error).message },
      { status: 500 }
    );
  }
}
