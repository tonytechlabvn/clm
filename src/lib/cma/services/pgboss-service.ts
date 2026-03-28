// pg-boss singleton — Postgres-backed job queue for CMA scheduled publishing
// Manages lifecycle: init once, reuse globally. Handles scheduled-publish jobs.

import { PgBoss } from "pg-boss";

const QUEUE_SCHEDULED_PUBLISH = "cma-scheduled-publish";
const QUEUE_RSS_CRAWL = "cma:rss-crawl";
const QUEUE_CURATE = "cma:curate";
const QUEUE_METRICS_SYNC = "cma:metrics-sync";

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

    // Create queues with retry config (safe to call if already exists)
    const queues = [
      { name: QUEUE_SCHEDULED_PUBLISH, opts: { retryLimit: 3, retryDelay: 30, retryBackoff: true, expireInSeconds: 900 } },
      { name: QUEUE_RSS_CRAWL, opts: { retryLimit: 3, retryDelay: 60, retryBackoff: true, expireInSeconds: 300 } },
      { name: QUEUE_CURATE, opts: { retryLimit: 2, retryDelay: 30, retryBackoff: true, expireInSeconds: 120 } },
      { name: QUEUE_METRICS_SYNC, opts: { retryLimit: 2, retryDelay: 60, retryBackoff: true, expireInSeconds: 600 } },
    ];
    for (const q of queues) {
      await instance.createQueue(q.name, q.opts).catch(() => {});
    }

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

/** Register the RSS crawl worker. */
export async function registerCrawlWorker(
  handler: (data: { feedId: string; orgId: string }, pgBoss: PgBoss) => Promise<void>
): Promise<void> {
  const pgBoss = await getPgBoss();
  await pgBoss.work<{ feedId: string; orgId: string }>(
    QUEUE_RSS_CRAWL,
    async (jobs) => {
      for (const job of jobs) {
        console.log(`[pg-boss] Processing RSS crawl: feedId=${job.data.feedId}`);
        await handler(job.data, pgBoss);
      }
    }
  );
  console.log(`[pg-boss] Worker registered for ${QUEUE_RSS_CRAWL}`);
}

/** Register the AI curation worker. */
type CurateData = { orgId: string; feedId: string; articleUrl: string; articleTitle: string; articleContent: string; articleAuthor?: string };
export async function registerCurationWorker(
  handler: (data: CurateData) => Promise<void>
): Promise<void> {
  const pgBoss = await getPgBoss();
  await pgBoss.work<CurateData>(QUEUE_CURATE, async (jobs) => {
    for (const job of jobs) {
      console.log(`[pg-boss] Processing curation: ${job.data.articleTitle}`);
      await handler(job.data);
    }
  });
  console.log(`[pg-boss] Worker registered for ${QUEUE_CURATE}`);
}

/** Register the metrics sync worker. */
type MetricsSyncData = { orgId?: string };
export async function registerMetricsSyncWorker(
  handler: (data: MetricsSyncData) => Promise<void>
): Promise<void> {
  const pgBoss = await getPgBoss();
  await pgBoss.work<MetricsSyncData>(QUEUE_METRICS_SYNC, async (jobs) => {
    for (const job of jobs) {
      console.log(`[pg-boss] Processing metrics sync`);
      await handler(job.data);
    }
  });
  console.log(`[pg-boss] Worker registered for ${QUEUE_METRICS_SYNC}`);
}

/** Schedule a daily metrics sync job (call once at startup). */
export async function scheduleMetricsSync(): Promise<void> {
  const pgBoss = await getPgBoss();
  await pgBoss.schedule(QUEUE_METRICS_SYNC, "0 3 * * *", {}); // daily at 03:00 UTC
  console.log(`[pg-boss] Metrics sync scheduled daily at 03:00 UTC`);
}

export { QUEUE_SCHEDULED_PUBLISH, QUEUE_RSS_CRAWL, QUEUE_CURATE, QUEUE_METRICS_SYNC };
