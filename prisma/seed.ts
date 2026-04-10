// Prisma seed entry point — run via `npx prisma db seed`

import { seedSystemTemplates } from "../src/lib/cma/templates/seed-system-templates";
import { seedImageTemplates } from "../src/lib/cma/templates/image/seed-image-templates";

async function main() {
  await seedSystemTemplates();
  await seedImageTemplates();
}

main().catch((err) => {
  console.error("[seed] Fatal error:", err);
  process.exit(1);
});
