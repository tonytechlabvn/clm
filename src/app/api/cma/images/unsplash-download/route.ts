// POST /api/cma/images/unsplash-download
// Downloads Unsplash photo server-side, saves to disk, creates CmaMedia record
// SSRF fix: photoId from client → server fetches canonical download_location via Unsplash API

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { getPhoto, downloadPhoto } from "@/lib/cma/services/unsplash-service";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "cma");

function contentTypeToExt(contentType: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
  };
  return map[contentType] ?? ".jpg";
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      photoId?: string;
      orgId?: string;
      postId?: string;
    };

    const { photoId, orgId, postId } = body;
    if (!photoId || !orgId) {
      return NextResponse.json({ error: "Missing required fields: photoId, orgId" }, { status: 400 });
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    // Fetch canonical photo data from Unsplash (prevents SSRF — no client-supplied URLs)
    const photo = await getPhoto(photoId);

    // Download image buffer via Unsplash-validated download_location
    const { buffer, contentType } = await downloadPhoto(photo.links.download_location);

    // Save to filesystem
    const uuid = randomUUID();
    const ext = contentTypeToExt(contentType);
    const fileName = `${uuid}${ext}`;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, fileName), buffer);

    // Unsplash photo page URL for attribution
    const sourceUrl = photo.user.links.html + "/photos/" + photoId;

    const media = await prisma.cmaMedia.create({
      data: {
        orgId,
        postId: postId ?? null,
        fileName,
        originalName: `unsplash-${photoId}${ext}`,
        mimeType: contentType,
        size: buffer.length,
        localPath: path.join(UPLOAD_DIR, fileName),
        source: "unsplash",
        sourceUrl,
      },
    });

    return NextResponse.json({
      mediaId: media.id,
      url: `/api/cma/media/${media.id}`,
      attribution: {
        name: photo.user.name,
        link: photo.user.links.html,
      },
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
