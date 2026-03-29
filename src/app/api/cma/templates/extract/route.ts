// POST /api/cma/templates/extract — Extract template preview from URL (not saved yet)

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { extractTemplateFromUrl } from "@/lib/cma/services/template-extraction-service";

// Simple in-memory rate limiter: orgId → timestamps of recent extractions
const extractionLog = new Map<string, number[]>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(orgId: string): boolean {
  const now = Date.now();
  const timestamps = (extractionLog.get(orgId) || []).filter(
    (t) => now - t < RATE_WINDOW_MS
  );
  extractionLog.set(orgId, timestamps);
  return timestamps.length < RATE_LIMIT;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, url } = body;

    if (!orgId || !url) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, url" },
        { status: 400 }
      );
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    // Rate limit check
    if (!checkRateLimit(auth.orgId)) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Maximum 10 extractions per hour." },
        { status: 429 }
      );
    }

    // Log this extraction attempt
    const timestamps = extractionLog.get(auth.orgId) || [];
    timestamps.push(Date.now());
    extractionLog.set(auth.orgId, timestamps);

    // Run extraction pipeline (may take 10-15s)
    const result = await extractTemplateFromUrl(url, auth.orgId);

    return NextResponse.json({ data: result });
  } catch (err) {
    console.error("[api/cma/templates/extract POST]", err);
    return NextResponse.json(
      { error: "Extraction failed", details: (err as Error).message },
      { status: 500 }
    );
  }
}
