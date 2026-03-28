// POST /api/lms/ai/summarize — summarize educational content

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildContentSummarizerPrompt } from "@/lib/prompts/clm-content-summarizer-prompt";
import { callLmsAI } from "@/lib/lms/services/ai-helper-service";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, maxLength } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json(
        { error: "content is required" },
        { status: 400 }
      );
    }

    const prompt = buildContentSummarizerPrompt(
      content,
      typeof maxLength === "number" ? maxLength : undefined
    );

    const result = await callLmsAI({
      userId: session.dbUserId as string,
      action: "summarize",
      prompt,
      maxTokens: 1024,
    });

    // Parse AI JSON response safely
    let summary: unknown;
    try {
      const cleaned = result.text.trim().replace(/^```json\s*|```\s*$/g, "");
      summary = JSON.parse(cleaned);
    } catch {
      console.error("[lms-ai] Failed to parse summarize JSON:", result.text);
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ summary, usage: result.usage });
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
    console.error("[lms-ai] summarize error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
