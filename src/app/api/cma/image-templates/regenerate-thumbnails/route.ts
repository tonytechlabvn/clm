// POST /api/cma/image-templates/regenerate-thumbnails?orgId=X
// Batch thumbnail regeneration for system + org templates. Runs SEQUENTIALLY
// (not concurrent) so Puppeteer doesn't deadlock under a stampede — the
// gallery triggers 8 live renders at once on a cold browser and that's
// enough to wedge the protocol timeout.
//
// Admin-only: session-gated via the same org-auth helper every other CMA
// endpoint uses. Returns a summary with how many succeeded / failed and
// which template ids produced a thumbnail URL. No concurrency because one
// hung render would otherwise block siblings.

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withApiKeyOrSessionAuth } from "@/lib/cma/services/org-auth";
import { generateAndStoreThumbnail } from "@/lib/cma/services/template-thumbnail-service";
import { compileLayersToHtml } from "@/lib/cma/services/template-layer-compiler";
import { templateLayerDataSchema } from "@/lib/cma/types/image-template-layer-types";

interface RegenerateResult {
  id: string;
  name: string;
  ok: boolean;
  thumbnail?: string | null;
  error?: string;
}

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) {
    return NextResponse.json({ error: "orgId is required" }, { status: 400 });
  }

  const auth = await withApiKeyOrSessionAuth(orgId, request);
  if (auth instanceof NextResponse) return auth;

  // Scope: system templates + the caller's org-owned templates. Never walks
  // other orgs because we query with explicit orgId filter.
  const templates = await prisma.cmaImageTemplate.findMany({
    where: {
      OR: [{ isSystem: true }, { orgId: auth.orgId }],
    },
    select: { id: true, name: true, layerData: true },
    orderBy: { id: "asc" },
  });

  const results: RegenerateResult[] = [];

  // Sequential loop — crucial. Parallel regeneration hangs Puppeteer when the
  // browser is cold and the renderer semaphore queue saturates.
  for (const t of templates) {
    try {
      // Recompile htmlContent from layerData on the fly so the thumbnail
      // reflects the latest compiler output. Legacy templates without
      // layerData keep their hand-written htmlContent unchanged.
      if (t.layerData) {
        const parsed = templateLayerDataSchema.safeParse(t.layerData);
        if (parsed.success) {
          const htmlContent = compileLayersToHtml(parsed.data);
          await prisma.cmaImageTemplate.update({
            where: { id: t.id },
            data: { htmlContent },
          });
        }
      }

      const thumbnail = await generateAndStoreThumbnail(t.id);
      results.push({ id: t.id, name: t.name, ok: thumbnail !== null, thumbnail });
    } catch (err) {
      results.push({
        id: t.id,
        name: t.name,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const succeeded = results.filter((r) => r.ok).length;
  return NextResponse.json({
    total: results.length,
    succeeded,
    failed: results.length - succeeded,
    results,
  });
}
