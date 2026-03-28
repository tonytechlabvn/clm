// AI Source Extraction — POST extracts and summarizes content from URL, text, image, or video
// Returns structured summary with key insights and suggested topics for content generation

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import {
  extractAndSummarizeSource,
  detectSourceType,
  type SourceType,
} from "@/lib/cma/services/source-extraction-service";

// Rate limiter: 10 extractions/hour/user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= 10) return false;
  entry.count++;
  return true;
}

// POST /api/cma/ai/extract-source { orgId, input, sourceType? }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, input, sourceType } = body;

    if (!orgId || !input?.trim()) {
      return NextResponse.json(
        { error: "orgId and input are required" },
        { status: 400 }
      );
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    if (!checkRateLimit(auth.userId)) {
      return NextResponse.json(
        { error: "Rate limit: 10 extractions/hour" },
        { status: 429 }
      );
    }

    const validTypes: SourceType[] = ["url", "text", "image", "video"];
    const safeType = validTypes.includes(sourceType) ? sourceType : undefined;

    const result = await extractAndSummarizeSource(
      input.trim(),
      orgId,
      safeType
    );

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("budget exceeded") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
