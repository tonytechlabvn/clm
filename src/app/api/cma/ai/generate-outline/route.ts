// AI Outline Generation — POST generates structured outline from topic/keywords

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { generateOutline } from "@/lib/cma/services/content-generation-service";
import type { ContentTone } from "@/lib/cma/services/content-generation-service";

// Simple rate limiter: 10 outlines/hour/user
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

// POST /api/cma/ai/generate-outline
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, topic, keywords, tone, language, targetWordCount, sourceContext } = body;

    if (!orgId || !topic) {
      return NextResponse.json({ error: "orgId and topic required" }, { status: 400 });
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    if (!checkRateLimit(auth.userId)) {
      return NextResponse.json({ error: "Rate limit: 10 outlines/hour" }, { status: 429 });
    }

    const validTones: ContentTone[] = ["professional", "casual", "technical", "educational"];
    const safeTone = validTones.includes(tone) ? tone : "professional";

    const outline = await generateOutline(
      orgId,
      topic,
      Array.isArray(keywords) ? keywords : [],
      safeTone,
      language || "en",
      Math.min(Math.max(targetWordCount || 1500, 500), 5000),
      typeof sourceContext === "string" ? sourceContext : undefined
    );

    return NextResponse.json(outline);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("budget exceeded") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
