// PATCH /api/cma/templates/[id]/usage — Increment usage count

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { getTemplate, incrementUsageCount } from "@/lib/cma/services/template-service";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json();
    const { orgId } = body;

    if (!orgId) {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const { id } = await params;
    // Verify template is visible to this org (system or org-owned)
    const template = await getTemplate(id, auth.orgId);
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }
    await incrementUsageCount(id);

    return NextResponse.json({ data: { success: true } });
  } catch (err) {
    console.error("[api/cma/templates/[id]/usage PATCH]", err);
    return NextResponse.json(
      { error: "Failed to update usage", details: (err as Error).message },
      { status: 500 }
    );
  }
}
