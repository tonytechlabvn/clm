// GET/PUT /api/cma/settings/publishing — org publishing mode configuration

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withOrgAuth } from "@/lib/cma/services/org-auth";

const VALID_MODES = ["auto", "human_in_loop"];
const VALID_SOURCES = ["web", "zalo_bot", "mcp", "scheduler"];

// GET /api/cma/settings/publishing?orgId=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const settings = await prisma.cmaOrgSettings.upsert({
    where: { orgId },
    create: { orgId },
    update: {},
  });

  return NextResponse.json({ settings });
}

// PUT /api/cma/settings/publishing — update publishing mode
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { orgId, publishingMode, autoPublishSources, requireApprovalSources } = body;

    if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    // Only admin/owner can change publishing settings
    if (auth.orgRole !== "admin" && auth.orgRole !== "owner") {
      return NextResponse.json({ error: "Only org admin/owner can change publishing settings" }, { status: 403 });
    }

    // Validate inputs
    if (publishingMode && !VALID_MODES.includes(publishingMode)) {
      return NextResponse.json({ error: `Invalid mode. Must be: ${VALID_MODES.join(", ")}` }, { status: 400 });
    }
    if (autoPublishSources && !autoPublishSources.every((s: string) => VALID_SOURCES.includes(s))) {
      return NextResponse.json({ error: `Invalid sources. Must be: ${VALID_SOURCES.join(", ")}` }, { status: 400 });
    }
    if (requireApprovalSources && !requireApprovalSources.every((s: string) => VALID_SOURCES.includes(s))) {
      return NextResponse.json({ error: `Invalid sources. Must be: ${VALID_SOURCES.join(", ")}` }, { status: 400 });
    }

    const settings = await prisma.cmaOrgSettings.upsert({
      where: { orgId },
      create: {
        orgId,
        publishingMode: publishingMode || "human_in_loop",
        autoPublishSources: autoPublishSources || ["scheduler"],
        requireApprovalSources: requireApprovalSources || ["zalo_bot"],
      },
      update: {
        ...(publishingMode && { publishingMode }),
        ...(autoPublishSources && { autoPublishSources }),
        ...(requireApprovalSources && { requireApprovalSources }),
      },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
