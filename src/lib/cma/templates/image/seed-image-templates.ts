// Seed script — upserts system image templates (orgId=null) into the database.
// Idempotent: safe to run multiple times via `prisma db seed`.
//
// Two generations of starters coexist here:
//   1. Legacy HTML-only templates (phase 1-6 MVP) — hand-written htmlContent
//      strings, no layerData. These can still be rendered and used from the
//      picker but are read-only in the visual editor.
//   2. LayerData starters (phase-13) — structured layer trees that are
//      compiled to htmlContent at seed time. Editing one in the visual
//      editor triggers the phase-12 fork flow to create an org-owned copy.
//
// The seed recompiles htmlContent from layerData on every run so the two
// columns never drift.

import { prisma } from "@/lib/prisma-client";
import { compileLayersToHtml } from "@/lib/cma/services/template-layer-compiler";
import { facebookPostTemplate } from "./facebook-post-template";
import { genericAnnouncementTemplate } from "./generic-announcement-template";
import { instagramPostStarter } from "./layerdata/instagram-post-layerdata";
import { twitterCardStarter } from "./layerdata/twitter-card-layerdata";
import { ogImageStarter } from "./layerdata/og-image-layerdata";
import { quoteCardStarter } from "./layerdata/quote-card-layerdata";
import { linkedinPostStarter } from "./layerdata/linkedin-post-layerdata";
import type { StarterTemplate } from "./layerdata/starter-template-type";

const LEGACY_HTML_TEMPLATES = [facebookPostTemplate, genericAnnouncementTemplate];

const LAYERDATA_STARTERS: StarterTemplate[] = [
  instagramPostStarter,
  twitterCardStarter,
  ogImageStarter,
  quoteCardStarter,
  linkedinPostStarter,
];

export async function seedImageTemplates(): Promise<void> {
  console.log("[seed] Upserting system image templates...");

  // ── Legacy HTML-only templates ───────────────────────────────────────
  for (const tpl of LEGACY_HTML_TEMPLATES) {
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

  // ── LayerData starters (phase-13) ────────────────────────────────────
  for (const starter of LAYERDATA_STARTERS) {
    const htmlContent = compileLayersToHtml(starter.layerData);
    await prisma.cmaImageTemplate.upsert({
      where: { id: starter.id },
      create: {
        id: starter.id,
        name: starter.name,
        description: starter.description,
        platform: starter.platform,
        width: starter.layerData.width,
        height: starter.layerData.height,
        htmlContent,
        layerData: starter.layerData as unknown as object,
        variableSchema: starter.variables as unknown as object[],
        isSystem: true,
        orgId: null,
      },
      update: {
        name: starter.name,
        description: starter.description,
        width: starter.layerData.width,
        height: starter.layerData.height,
        htmlContent,
        layerData: starter.layerData as unknown as object,
        variableSchema: starter.variables as unknown as object[],
      },
    });
  }

  const total = LEGACY_HTML_TEMPLATES.length + LAYERDATA_STARTERS.length;
  console.log(`[seed] Upserted ${total} image templates`);
}
