// CMA API Keys — GET list, POST create, DELETE revoke (session-auth only)

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import {
  generateApiKey,
  revokeApiKey,
  listApiKeys,
} from "@/lib/cma/services/api-key-service";

// GET /api/cma/api-keys?orgId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const keys = await listApiKeys(auth.userId, auth.orgId);
  return NextResponse.json({ keys });
}

// POST /api/cma/api-keys — create a new API key (returns plaintext once)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, expiresAt } = body;
    const name = typeof body.name === "string" ? body.name.trim().slice(0, 64) : "";

    if (!orgId || !name) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, name" },
        { status: 400 }
      );
    }

    // Validate expiresAt if provided
    let parsedExpiry: Date | undefined;
    if (expiresAt) {
      parsedExpiry = new Date(expiresAt);
      if (isNaN(parsedExpiry.getTime()) || parsedExpiry <= new Date()) {
        return NextResponse.json(
          { error: "expiresAt must be a valid future date" },
          { status: 400 }
        );
      }
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const result = await generateApiKey(
      auth.userId,
      auth.orgId,
      name,
      parsedExpiry
    );

    return NextResponse.json(
      {
        key: result.key, // plaintext — shown only this once
        keyId: result.keyId,
        keyPrefix: result.keyPrefix,
        message: "Save this key now — it will not be shown again.",
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// DELETE /api/cma/api-keys?keyId=...
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyId = searchParams.get("keyId");
  const orgId = searchParams.get("orgId");

  if (!keyId || !orgId) {
    return NextResponse.json(
      { error: "keyId and orgId are required" },
      { status: 400 }
    );
  }

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const revoked = await revokeApiKey(keyId, auth.userId, auth.orgId);
  if (!revoked) {
    return NextResponse.json({ error: "Key not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
