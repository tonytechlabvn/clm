// LMS pg-boss worker handlers — processes async AI jobs
// Called by registerLmsWorkers in lms-pgboss-service.ts

import { prisma } from "@/lib/prisma-client";
import { buildQuizGeneratorPrompt } from "@/lib/prompts/clm-quiz-generator-prompt";
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
