// Next.js instrumentation — runs once on server startup
// Registers pg-boss workers for CMA scheduled publishing

export async function register() {
  // Only run on server side, not edge runtime
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { registerScheduledPublishWorker } = await import(
      "@/lib/cma/services/pgboss-service"
    );
    const { handleScheduledPublish } = await import(
      "@/lib/cma/services/scheduling-service"
    );

    try {
      await registerScheduledPublishWorker(handleScheduledPublish);
      console.log("[instrumentation] CMA scheduled-publish worker registered");
    } catch (err) {
      console.error("[instrumentation] Failed to register pg-boss worker:", err);
    }
  }
}
