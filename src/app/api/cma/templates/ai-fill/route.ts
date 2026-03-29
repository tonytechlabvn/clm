// POST /api/cma/templates/ai-fill — Generate content for template slots

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { fillTemplateSlots } from "@/lib/cma/services/template-ai-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, slotDefinitions, topic, tone } = body;

    if (!orgId || !slotDefinitions || !topic?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, slotDefinitions, topic" },
        { status: 400 }
      );
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const slotValues = await fillTemplateSlots(
      slotDefinitions,
      topic.trim(),
      tone || "professional",
      auth.orgId
    );

    return NextResponse.json({ data: { slotValues } });
  } catch (err) {
    console.error("[api/cma/templates/ai-fill POST]", err);
    return NextResponse.json(
      { error: "AI content fill failed", details: (err as Error).message },
      { status: 500 }
    );
  }
}
