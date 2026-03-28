// Next.js instrumentation — runs once on server startup
// Registers pg-boss workers for CMA scheduled publishing and LMS AI batch ops

export async function register() {
  // Only run on server side, not edge runtime
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // CMA workers
    try {
      const { registerScheduledPublishWorker } = await import(
        "@/lib/cma/services/pgboss-service"
      );
      const { handleScheduledPublish } = await import(
        "@/lib/cma/services/scheduling-service"
      );
      await registerScheduledPublishWorker(handleScheduledPublish);
      console.log("[instrumentation] CMA scheduled-publish worker registered");
    } catch (err) {
      console.error("[instrumentation] Failed to register CMA worker:", err);
    }

    // LMS workers (quiz generation, batch feedback)
    try {
      const { registerLmsWorkers } = await import(
        "@/lib/lms/services/lms-pgboss-service"
      );
      const { handleQuizGeneration } = await import(
        "@/lib/lms/services/lms-worker-handlers"
      );
      await registerLmsWorkers({
        quizHandler: handleQuizGeneration,
      });
      console.log("[instrumentation] LMS AI workers registered");
    } catch (err) {
      console.error("[instrumentation] Failed to register LMS workers:", err);
    }
  }
}
