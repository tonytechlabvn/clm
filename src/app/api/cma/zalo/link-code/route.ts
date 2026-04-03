// GET/POST /api/cma/zalo/link-code — admin generates link codes for Zalo user mapping

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { generateLinkCode } from "@/lib/zalo/zalo-user-mapping";

// GET /api/cma/zalo/link-code?orgId=xxx — list existing user mappings
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const mappings = await prisma.cmaZaloUserMapping.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ mappings });
}

// POST /api/cma/zalo/link-code — generate a link code for a CLM user
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, userId } = body;

    if (!orgId) {
      return NextResponse.json({ error: "orgId required" }, { status: 400 });
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    // Only admin/owner can generate link codes
    if (auth.orgRole !== "admin" && auth.orgRole !== "owner") {
      return NextResponse.json({ error: "Only org admin/owner can generate link codes" }, { status: 403 });
    }

    // __self__ = generate for the authenticated user
    const targetUserId = (!userId || userId === "__self__") ? auth.userId : userId;
    const code = await generateLinkCode(orgId, targetUserId);

    return NextResponse.json({ code, instruction: `Send this to the Zalo user: /link ${code}` });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
