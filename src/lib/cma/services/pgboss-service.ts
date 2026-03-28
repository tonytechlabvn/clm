// pg-boss singleton — Postgres-backed job queue for CMA scheduled publishing
// Manages lifecycle: init once, reuse globally. Handles scheduled-publish jobs.

import { PgBoss } from "pg-boss";

const QUEUE_SCHEDULED_PUBLISH = "cma-scheduled-publish";

let boss: PgBoss | null = null;
let initPromise: Promise<PgBoss> | null = null;

/** Get or initialize the pg-boss singleton. Safe to call multiple times. */
export async function getPgBoss(): Promise<PgBoss> {
  if (boss) return boss;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error("DATABASE_URL is required for pg-boss");
    }

    const instance = new PgBoss({ connectionString, schema: "pgboss" });

    instance.on("error", (err) => {
      console.error("[pg-boss] Error:", err);
    });

    await instance.start();

    // Create queue with retry config (3x exponential backoff)
    await instance.createQueue(QUEUE_SCHEDULED_PUBLISH, {
      retryLimit: 3,
      retryDelay: 30,
      retryBackoff: true,
      expireInSeconds: 900, // 15 min max processing time
    }).catch(() => {
      // Queue may already exist — safe to ignore
    });

    boss = instance;
    console.log("[pg-boss] Started successfully");
    return instance;
  })();

  return initPromise;
}

/** Enqueue a scheduled publish job. Returns the pg-boss job ID. */
export async function enqueueScheduledPublish(
  postId: string,
  accountId: string,
  orgId: string,
  startAfter: Date
): Promise<string> {
  const pgBoss = await getPgBoss();
  const jobId = await pgBoss.send(QUEUE_SCHEDULED_PUBLISH, {
    postId,
    accountId,
    orgId,
  }, {
    startAfter,
    singletonKey: postId, // prevent duplicate jobs for same post
  });

  if (!jobId) {
    throw new Error("Failed to enqueue scheduled publish job");
  }
  return jobId;
}

/** Cancel a scheduled publish job by its pg-boss job ID. */
export async function cancelScheduledJob(jobId: string): Promise<void> {
  const pgBoss = await getPgBoss();
  await pgBoss.cancel(QUEUE_SCHEDULED_PUBLISH, jobId);
}

/** Register the scheduled-publish worker. Call once at app startup. */
export async function registerScheduledPublishWorker(
  handler: (data: { postId: string; accountId: string; orgId: string }) => Promise<void>
): Promise<void> {
  const pgBoss = await getPgBoss();
  await pgBoss.work<{ postId: string; accountId: string; orgId: string }>(
    QUEUE_SCHEDULED_PUBLISH,
    async (jobs) => {
      for (const job of jobs) {
        console.log(`[pg-boss] Processing scheduled publish: postId=${job.data.postId}`);
        await handler(job.data);
      }
    }
  );
  console.log(`[pg-boss] Worker registered for ${QUEUE_SCHEDULED_PUBLISH}`);
}

export { QUEUE_SCHEDULED_PUBLISH };
