// LMS pg-boss worker handlers — processes async AI jobs
// Called by registerLmsWorkers in lms-pgboss-service.ts

import { prisma } from "@/lib/prisma-client";
import { buildQuizGeneratorPrompt } from "@/lib/prompts/clm-quiz-generator-prompt";
import { buildSubmissionFeedbackPrompt } from "@/lib/prompts/clm-submission-feedback-prompt";
import { callLmsAI } from "./ai-helper-service";

/** Parse AI JSON response, stripping markdown fences if present */
function parseAIJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```json\s*|```\s*$/g, "");
  return JSON.parse(cleaned);
}

/**
 * Handle async quiz generation for a lesson.
 * Loads lesson content, generates questions, stores result as lesson content update.
 */
export async function handleQuizGeneration(data: {
  courseId: string;
  lessonId: string;
  userId: string;
  questionCount: number;
}): Promise<void> {
  const { lessonId, userId, questionCount } = data;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    select: { id: true, content: true, title: true },
  });

  if (!lesson) {
    console.error(`[lms-ai] handleQuizGeneration: lesson not found lessonId=${lessonId}`);
    return;
  }

  if (!lesson.content) {
    console.warn(`[lms-ai] handleQuizGeneration: lesson has no content lessonId=${lessonId}`);
    return;
  }

  const prompt = buildQuizGeneratorPrompt(lesson.content, questionCount);

  const result = await callLmsAI({
    userId,
    action: "quiz_generate",
    prompt,
    maxTokens: 2048,
  });

  let questions: unknown;
  try {
    questions = parseAIJson(result.text);
  } catch {
    console.error(`[lms-ai] handleQuizGeneration: invalid JSON lessonId=${lessonId}`, result.text);
    return;
  }

  // Store generated quiz questions as JSON in lesson content (appended block)
  const quizBlock = `\n\n<!-- AI_QUIZ_DATA\n${JSON.stringify(questions, null, 2)}\nAI_QUIZ_DATA -->`;
  const updatedContent = (lesson.content || "") + quizBlock;

  await prisma.lesson.update({
    where: { id: lessonId },
    data: { content: updatedContent },
  });

  console.log(`[lms-ai] handleQuizGeneration: stored ${questionCount} questions for lessonId=${lessonId}`);
}

/**
 * Handle batch AI feedback for all ungraded submissions of an assignment.
 * Generates feedback for each submission without one, saves to Feedback record.
 */
export async function handleBatchFeedback(data: {
  classroomId: string;
  assignmentId: string;
  instructorId: string;
}): Promise<void> {
  const { assignmentId, instructorId } = data;

  const assignment = await prisma.assignment.findUnique({
    where: { id: assignmentId },
    select: { id: true, jobDescription: true },
  });

  if (!assignment) {
    console.error(`[lms-ai] handleBatchFeedback: assignment not found assignmentId=${assignmentId}`);
    return;
  }

  // Load submissions without AI feedback
  const submissions = await prisma.submission.findMany({
    where: {
      assignmentId,
      content: { not: null },
      feedback: { none: { aiFeedback: { not: null } } },
    },
    select: { id: true, content: true },
  });

  if (submissions.length === 0) {
    console.log(`[lms-ai] handleBatchFeedback: no pending submissions assignmentId=${assignmentId}`);
    return;
  }

  console.log(`[lms-ai] handleBatchFeedback: processing ${submissions.length} submissions`);

  const jobDescription = assignment.jobDescription || "";

  for (const submission of submissions) {
    if (!submission.content) continue;

    try {
      const prompt = buildSubmissionFeedbackPrompt(jobDescription, submission.content);
      const result = await callLmsAI({
        userId: instructorId,
        action: "submission_feedback",
        prompt,
        maxTokens: 1024,
      });

      let feedbackData: unknown;
      try {
        feedbackData = parseAIJson(result.text);
      } catch {
        console.error(`[lms-ai] handleBatchFeedback: invalid JSON submissionId=${submission.id}`);
        continue;
      }

      // Save feedback — update existing or create new
      const existing = await prisma.feedback.findFirst({
        where: { submissionId: submission.id, instructorId },
        select: { id: true },
      });

      if (existing) {
        await prisma.feedback.update({
          where: { id: existing.id },
          data: { aiFeedback: JSON.stringify(feedbackData) },
        });
      } else {
        await prisma.feedback.create({
          data: {
            submissionId: submission.id,
            instructorId,
            aiFeedback: JSON.stringify(feedbackData),
          },
        });
      }

      console.log(`[lms-ai] handleBatchFeedback: feedback saved submissionId=${submission.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`[lms-ai] handleBatchFeedback: failed submissionId=${submission.id} err=${message}`);
      // Continue processing remaining submissions
    }
  }

  console.log(`[lms-ai] handleBatchFeedback: completed assignmentId=${assignmentId}`);
}
