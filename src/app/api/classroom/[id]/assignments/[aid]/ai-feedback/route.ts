// POST /api/classroom/[id]/assignments/[aid]/ai-feedback
// Generate AI feedback for a specific submission — instructor only

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma-client";
import { buildSubmissionFeedbackPrompt } from "@/lib/prompts/clm-submission-feedback-prompt";
import { callLmsAI } from "@/lib/lms/services/ai-helper-service";

interface RouteParams {
  params: { id: string; aid: string };
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.dbUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: classroomId, aid: assignmentId } = params;

    // Verify caller is the classroom instructor
    const classroom = await prisma.classroom.findUnique({
      where: { id: classroomId },
      select: { instructorId: true },
    });
    if (!classroom) {
      return NextResponse.json({ error: "Classroom not found" }, { status: 404 });
    }
    if (classroom.instructorId !== session.dbUserId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { submissionId } = body;
    if (!submissionId || typeof submissionId !== "string") {
      return NextResponse.json(
        { error: "submissionId is required" },
        { status: 400 }
      );
    }

    // Load submission + assignment together
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: {
        assignment: {
          select: { id: true, classroomId: true, jobDescription: true },
        },
      },
    });

    if (!submission) {
      return NextResponse.json({ error: "Submission not found" }, { status: 404 });
    }
    if (
      submission.assignment.classroomId !== classroomId ||
      submission.assignment.id !== assignmentId
    ) {
      return NextResponse.json({ error: "Submission does not belong to this assignment" }, { status: 400 });
    }

    const jobDescription = submission.assignment.jobDescription || "";
    const submissionContent = submission.content || "";

    if (!submissionContent) {
      return NextResponse.json(
        { error: "Submission has no content to review" },
        { status: 400 }
      );
    }

    const prompt = buildSubmissionFeedbackPrompt(jobDescription, submissionContent);

    const result = await callLmsAI({
      userId: session.dbUserId as string,
      action: "submission_feedback",
      prompt,
      maxTokens: 1024,
    });

    // Parse AI JSON safely
    let feedbackData: unknown;
    try {
      const cleaned = result.text.trim().replace(/^```json\s*|```\s*$/g, "");
      feedbackData = JSON.parse(cleaned);
    } catch {
      console.error("[lms-ai] Failed to parse ai-feedback JSON:", result.text);
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    // Save aiFeedback — update existing record if present, else create
    const existing = await prisma.feedback.findFirst({
      where: { submissionId, instructorId: session.dbUserId as string },
      select: { id: true },
    });

    const feedback = existing
      ? await prisma.feedback.update({
          where: { id: existing.id },
          data: { aiFeedback: JSON.stringify(feedbackData) },
        })
      : await prisma.feedback.create({
          data: {
            submissionId,
            instructorId: session.dbUserId as string,
            aiFeedback: JSON.stringify(feedbackData),
          },
        });

    return NextResponse.json({ feedback, aiFeedback: feedbackData, usage: result.usage });
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
    console.error("[lms-ai] ai-feedback error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
