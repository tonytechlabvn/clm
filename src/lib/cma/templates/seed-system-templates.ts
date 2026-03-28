// Seed script — upserts the 3 system templates (orgId=null) into the database
// Idempotent: safe to run multiple times via `prisma db seed`

import { prisma } from "@/lib/prisma-client";
import { SYSTEM_TEMPLATES } from "./template-definitions";

export async function seedSystemTemplates(): Promise<void> {
  console.log("[seed] Upserting system templates...");

  for (const tpl of SYSTEM_TEMPLATES) {
    await prisma.cmaTemplate.upsert({
      where: { slug: tpl.slug },
      update: {
        name: tpl.name,
        description: tpl.description,
        category: tpl.category,
        blocks: tpl.blocks,
        styleTheme: tpl.styleTheme,
      },
      create: {
        orgId: null,
        name: tpl.name,
        slug: tpl.slug,
        description: tpl.description,
        category: tpl.category,
        blocks: tpl.blocks,
        styleTheme: tpl.styleTheme,
        isDefault: true,
      },
    });
    console.log(`[seed] Upserted template: ${tpl.slug}`);
  }

  console.log(`[seed] Done — ${SYSTEM_TEMPLATES.length} system templates seeded.`);
}
