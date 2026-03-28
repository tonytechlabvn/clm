// POST /api/lms/ai/generate-quiz — generate quiz questions from lesson content

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { buildQuizGeneratorPrompt } from "@/lib/prompts/clm-quiz-generator-prompt";
import { callLmsAI } from "@/lib/lms/services/ai-helper-service";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { lessonContent, questionCount } = body;

    if (!lessonContent || typeof lessonContent !== "string") {
      return NextResponse.json(
        { error: "lessonContent is required" },
        { status: 400 }
      );
    }

    const count = typeof questionCount === "number" ? questionCount : 5;
    const prompt = buildQuizGeneratorPrompt(lessonContent, count);

    const result = await callLmsAI({
      userId: session.dbUserId as string,
      action: "quiz_generate",
      prompt,
      maxTokens: 2048,
    });

    // Parse AI JSON response safely
    let questions: unknown;
    try {
      const cleaned = result.text.trim().replace(/^```json\s*|```\s*$/g, "");
      questions = JSON.parse(cleaned);
    } catch {
      console.error("[lms-ai] Failed to parse quiz JSON:", result.text);
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ questions, usage: result.usage });
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
    console.error("[lms-ai] generate-quiz error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
