// Seed script — upserts system image templates (orgId=null) into the database
// Idempotent: safe to run multiple times via `prisma db seed`

import { prisma } from "@/lib/prisma-client";
import { facebookPostTemplate } from "./facebook-post-template";
import { genericAnnouncementTemplate } from "./generic-announcement-template";

const SYSTEM_IMAGE_TEMPLATES = [facebookPostTemplate, genericAnnouncementTemplate];

export async function seedImageTemplates(): Promise<void> {
  console.log("[seed] Upserting system image templates...");

  for (const tpl of SYSTEM_IMAGE_TEMPLATES) {
    // Deterministic ID for system templates so upsert works across re-seeds
    const id = `system-img-${tpl.platform}`;
    await prisma.cmaImageTemplate.upsert({
      where: { id },
      create: {
        id,
        name: tpl.name,
        description: tpl.description,
        platform: tpl.platform,
        width: tpl.width,
        height: tpl.height,
        htmlContent: tpl.htmlContent,
        variableSchema: tpl.variableSchema,
        isSystem: true,
        orgId: null,
      },
      update: {
        name: tpl.name,
        description: tpl.description,
        width: tpl.width,
        height: tpl.height,
        htmlContent: tpl.htmlContent,
        variableSchema: tpl.variableSchema,
      },
    });
  }

  console.log(`[seed] Upserted ${SYSTEM_IMAGE_TEMPLATES.length} image templates`);
}
