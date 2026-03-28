// LMS pg-boss service — job queues for async AI batch processing
// Uses the shared pg-boss singleton from CMA service

import { getPgBoss } from "@/lib/cma/services/pgboss-service";

export const QUEUE_QUIZ_GENERATE = "lms-quiz-generate";
export const QUEUE_BATCH_FEEDBACK = "classroom-batch-feedback";

type QuizGenerateData = {
  courseId: string;
  lessonId: string;
  userId: string;
  questionCount: number;
};

type BatchFeedbackData = {
  classroomId: string;
  assignmentId: string;
  instructorId: string;
};

/** Ensure LMS queues exist on the pg-boss instance */
async function ensureLmsQueues(): Promise<void> {
  const pgBoss = await getPgBoss();

  await Promise.all([
    pgBoss.createQueue(QUEUE_QUIZ_GENERATE, {
      retryLimit: 3,
      retryDelay: 30,
      retryBackoff: true,
      expireInSeconds: 600, // 10 min max
    }).catch(() => { /* queue may already exist */ }),

    pgBoss.createQueue(QUEUE_BATCH_FEEDBACK, {
      retryLimit: 2,
      retryDelay: 60,
      retryBackoff: true,
      expireInSeconds: 1800, // 30 min max for batch
    }).catch(() => { /* queue may already exist */ }),
  ]);
}

/** Enqueue a quiz generation job. Returns the pg-boss job ID. */
export async function enqueueQuizGeneration(data: QuizGenerateData): Promise<string> {
  await ensureLmsQueues();
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

/** Enqueue a batch feedback job. Returns the pg-boss job ID. */
export async function enqueueBatchFeedback(data: BatchFeedbackData): Promise<string> {
  await ensureLmsQueues();
  const pgBoss = await getPgBoss();

  const jobId = await pgBoss.send(QUEUE_BATCH_FEEDBACK, data, {
    singletonKey: `${data.assignmentId}:batch`,
  });

  if (!jobId) {
    throw new Error("Failed to enqueue batch feedback job");
  }
  console.log(`[lms-ai] Enqueued batch feedback: assignmentId=${data.assignmentId} jobId=${jobId}`);
  return jobId;
}

/** Register LMS workers. Call once at app startup from instrumentation.ts. */
export async function registerLmsWorkers(handlers: {
  quizHandler: (data: QuizGenerateData) => Promise<void>;
  feedbackHandler: (data: BatchFeedbackData) => Promise<void>;
}): Promise<void> {
  await ensureLmsQueues();
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

  await pgBoss.work<BatchFeedbackData>(
    QUEUE_BATCH_FEEDBACK,
    async (jobs) => {
      for (const job of jobs) {
        console.log(`[lms-ai] Processing batch feedback: assignmentId=${job.data.assignmentId}`);
        await handlers.feedbackHandler(job.data);
      }
    }
  );

  console.log("[lms-ai] Workers registered:", QUEUE_QUIZ_GENERATE, QUEUE_BATCH_FEEDBACK);
}
