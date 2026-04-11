// Generates a small PNG thumbnail for an image template and writes it to
// the public asset directory so the phase-13 gallery can show previews
// without re-rendering on every page load. Fire-and-forget by design —
// callers should await the returned promise only if they need the URL;
// typical save flow discards it so a slow render can never block persist.
//
// The thumbnail is served via the same public GET route used for editor
// assets (/api/cma/image-templates/assets/thumbnails/{id}.png). Middleware
// already exempts GETs under that prefix.

import { promises as fs } from "fs";
import path from "path";
import { prisma } from "@/lib/prisma-client";
import { renderTemplate } from "./image-template-renderer-service";

const LOG = "[template-thumbnail]";

// Target ≈ 300×158 for a 1200×630 template. Scale is shared across all
// templates so gallery thumbnails have a consistent visual weight.
const THUMBNAIL_SCALE = 0.25;

export async function generateAndStoreThumbnail(
  templateId: string
): Promise<string | null> {
  try {
    const template = await prisma.cmaImageTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      console.warn(`${LOG} template ${templateId} not found, skipping thumbnail`);
      return null;
    }

    // Render the template's own HTML at a reduced viewport — `{{width}}`
    // and `{{height}}` in the body CSS will automatically pick up the
    // smaller numbers we pass in, so the output is a faithful small version.
    const thumbnailWidth = Math.max(1, Math.round(template.width * THUMBNAIL_SCALE));
    const thumbnailHeight = Math.max(1, Math.round(template.height * THUMBNAIL_SCALE));

    const result = await renderTemplate({
      htmlContent: template.htmlContent,
      variables: {},
      width: thumbnailWidth,
      height: thumbnailHeight,
    });

    // Thumbnails live alongside regular assets under a dedicated `thumbnails`
    // sub-folder so the same public GET route can serve them.
    const dir = path.join(
      process.cwd(),
      "uploads",
      "cma",
      "image-templates",
      "assets",
      "thumbnails"
    );
    await fs.mkdir(dir, { recursive: true });

    const filename = `${templateId}.png`;
    const filepath = path.join(dir, filename);
    await fs.writeFile(filepath, result.buffer);

    const publicUrl = `/api/cma/image-templates/assets/thumbnails/${filename}`;
    await prisma.cmaImageTemplate.update({
      where: { id: templateId },
      data: { thumbnail: publicUrl },
    });

    return publicUrl;
  } catch (err) {
    // Fire-and-forget: log and move on so a rendering failure never blocks
    // the save response.
    console.error(`${LOG} failed to generate thumbnail for ${templateId}:`, err);
    return null;
  }
}
