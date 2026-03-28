// POST /api/lms/ai/review-code — AI code review against a rubric

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildCodeReviewerPrompt } from "@/lib/prompts/clm-code-reviewer-prompt";
import { callLmsAI } from "@/lib/lms/services/ai-helper-service";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { code, rubric } = body;

    if (!code || typeof code !== "string") {
      return NextResponse.json({ error: "code is required" }, { status: 400 });
    }
    if (!rubric || typeof rubric !== "string") {
      return NextResponse.json({ error: "rubric is required" }, { status: 400 });
    }

    const prompt = buildCodeReviewerPrompt(code, rubric);

    const result = await callLmsAI({
      userId: session.dbUserId as string,
      action: "code_review",
      prompt,
      maxTokens: 1024,
    });

    // Parse AI JSON response safely
    let review: unknown;
    try {
      const cleaned = result.text.trim().replace(/^```json\s*|```\s*$/g, "");
      review = JSON.parse(cleaned);
    } catch {
      console.error("[lms-ai] Failed to parse review-code JSON:", result.text);
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ review, usage: result.usage });
  } catch (error) {
    const err = error as Error & { code?: string; retryAfterMs?: number };
    if (err.code === "RATE_LIMITED") {
      return NextResponse.json(
        { error: err.message },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil((err.retryAfterMs ?? 60000) / 1000)),
          },
        }
      );
    }
    if (err.code === "QUOTA_EXHAUSTED") {
      return NextResponse.json({ error: err.message }, { status: 402 });
    }
    console.error("[lms-ai] review-code error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
