// AI Content Generation — POST generates full blog post from approved outline

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { generateFullContent } from "@/lib/cma/services/content-generation-service";
import { prisma } from "@/lib/prisma-client";
import { normalizeUrl } from "@/lib/cma/services/crawler-service";
import type { ContentTone } from "@/lib/cma/services/content-generation-service";

// Rate limiter: 5 full generations/hour/user
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + 3_600_000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

// POST /api/cma/ai/generate-content
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, outline, tone, language, targetWordCount, saveAsDraft } = body;

    if (!orgId || !outline?.title || !outline?.sections?.length) {
      return NextResponse.json(
        { error: "orgId, outline.title, and outline.sections required" },
        { status: 400 }
      );
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    if (!checkRateLimit(auth.userId)) {
      return NextResponse.json({ error: "Rate limit: 5 generations/hour" }, { status: 429 });
    }

    const validTones: ContentTone[] = ["professional", "casual", "technical", "educational"];
    const safeTone = validTones.includes(tone) ? tone : "professional";

    const result = await generateFullContent(
      orgId,
      outline,
      safeTone,
      language || "en",
      Math.min(Math.max(targetWordCount || 1500, 500), 5000)
    );

    // Optionally save as draft post with pending_review status
    let postId: string | null = null;
    if (saveAsDraft) {
      const post = await prisma.cmaPost.create({
        data: {
          orgId,
          authorId: auth.userId,
          title: outline.title,
          content: result.blogContent,
          excerpt: result.metaDescription,
          status: "pending_review",
          aiGenerated: true,
          outlineData: outline,
          originalAiDraft: result.blogContent,
          generationStatus: "generated",
        },
      });
      postId = post.id;

      // Create social excerpt child posts
      const excerpts = [
        { platform: "facebook", content: result.fbExcerpt },
        { platform: "linkedin", content: result.linkedinExcerpt },
      ];
      for (const ex of excerpts) {
        if (!ex.content) continue;
        await prisma.cmaPost.create({
          data: {
            orgId,
            authorId: auth.userId,
            title: `[${ex.platform}] ${outline.title}`,
            content: ex.content,
            status: "pending_review",
            aiGenerated: true,
            parentPostId: post.id,
          },
        });
      }
    }

    return NextResponse.json({ ...result, postId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("budget exceeded") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
