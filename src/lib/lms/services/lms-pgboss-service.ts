// LMS pg-boss service — job queue for async AI quiz generation
// Uses the shared pg-boss singleton from CMA service

import { getPgBoss } from "@/lib/cma/services/pgboss-service";

export const QUEUE_QUIZ_GENERATE = "lms-quiz-generate";

type QuizGenerateData = {
  courseId: string;
  lessonId: string;
  userId: string;
  questionCount: number;
};

/** Ensure LMS queue exists on the pg-boss instance */
async function ensureLmsQueue(): Promise<void> {
  const pgBoss = await getPgBoss();
  await pgBoss.createQueue(QUEUE_QUIZ_GENERATE, {
    retryLimit: 3,
    retryDelay: 30,
    retryBackoff: true,
    expireInSeconds: 600, // 10 min max
  }).catch(() => { /* queue may already exist */ });
}

/** Enqueue a quiz generation job. Returns the pg-boss job ID. */
export async function enqueueQuizGeneration(data: QuizGenerateData): Promise<string> {
  await ensureLmsQueue();
  const pgBoss = await getPgBoss();

  const jobId = await pgBoss.send(QUEUE_QUIZ_GENERATE, data, {
    singletonKey: `${data.lessonId}:${data.userId}`,
  });

  if (!jobId) {
    throw new Error("Failed to enqueue quiz generation job");
  }
  console.log(`[lms-ai] Enqueued quiz generation: lessonId=${data.lessonId} jobId=${jobId}`);
  return jobId;
}

/** Register LMS quiz worker. Call once at app startup from instrumentation.ts. */
export async function registerLmsWorkers(handlers: {
  quizHandler: (data: QuizGenerateData) => Promise<void>;
}): Promise<void> {
  await ensureLmsQueue();
  const pgBoss = await getPgBoss();

  await pgBoss.work<QuizGenerateData>(
    QUEUE_QUIZ_GENERATE,
    async (jobs) => {
      for (const job of jobs) {
        console.log(`[lms-ai] Processing quiz generation: lessonId=${job.data.lessonId}`);
        await handlers.quizHandler(job.data);
      }
    }
  );

  console.log("[lms-ai] Quiz worker registered:", QUEUE_QUIZ_GENERATE);
}
