// POST /api/cma/templates/ai-generate — Generate template from natural language description

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { generateTemplateFromDescription } from "@/lib/cma/services/template-ai-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, description } = body;

    if (!orgId || !description?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, description" },
        { status: 400 }
      );
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const result = await generateTemplateFromDescription(description.trim(), auth.orgId);
    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[api/cma/templates/ai-generate POST]", err);
    return NextResponse.json(
      { error: "AI generation failed", details: (err as Error).message },
      { status: 500 }
    );
  }
}
