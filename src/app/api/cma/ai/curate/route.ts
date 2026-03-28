// AI Curate from URL — extract article content and generate blog draft + social excerpts

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { extractContent, isDuplicate } from "@/lib/cma/services/crawler-service";
import { curateContent } from "@/lib/cma/services/content-ai-service";

// Simple in-memory rate limiter (5 req/min/user)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

// POST /api/cma/ai/curate { orgId, url }
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, url } = body;

    if (!orgId || !url) {
      return NextResponse.json({ error: "orgId and url required" }, { status: 400 });
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    // Rate limit
    if (!checkRateLimit(auth.userId)) {
      return NextResponse.json({ error: "Rate limit exceeded (5/min)" }, { status: 429 });
    }

    // Check for duplicates
    if (await isDuplicate(orgId, url)) {
      return NextResponse.json({ error: "This URL has already been curated" }, { status: 409 });
    }

    // Extract article content
    const article = await extractContent(url);

    // AI curation
    const result = await curateContent(article.content, url, orgId);

    return NextResponse.json({
      title: article.title,
      sourceUrl: url,
      author: article.author,
      blogDraft: result.blogDraft,
      fbExcerpt: result.fbExcerpt,
      linkedinExcerpt: result.linkedinExcerpt,
      tags: result.tags,
      tokensUsed: result.tokensUsed,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("budget exceeded") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
