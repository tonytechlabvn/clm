// Prisma seed entry point — run via `npx prisma db seed`

import { seedSystemTemplates } from "../src/lib/cma/templates/seed-system-templates";

async function main() {
  await seedSystemTemplates();
}

main().catch((err) => {
  console.error("[seed] Fatal error:", err);
  process.exit(1);
});
