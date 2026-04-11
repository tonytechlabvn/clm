// POST /api/cma/image-templates/assets
// Uploads an image used inside a visual template. Writes to
// uploads/cma/image-templates/assets/{orgId}/{uuid}.{ext} and returns a
// public URL that Puppeteer can fetch during render.
//
// Security model: session auth required for upload; GET is exempted in
// middleware so both the editor <img> tags and the Puppeteer renderer
// can reach the file without cookies. UUID filenames + orgId prefix
// make enumeration impractical — same model as the Direct URL endpoint.
//
// SVG is explicitly blocked: even sanitized SVG is a large script-execution
// surface when rendered in a Chromium context, so the MVP allowlist is
// PNG/JPEG/WebP only.

import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { randomUUID } from "crypto";
import path from "path";
import { withApiKeyOrSessionAuth } from "@/lib/cma/services/org-auth";

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const file = form.get("file");
    const orgId = form.get("orgId");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
    if (typeof orgId !== "string" || orgId.length === 0) {
      return NextResponse.json({ error: "Missing orgId" }, { status: 400 });
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type "${file.type}" — use PNG, JPEG, or WebP` },
        { status: 415 }
      );
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large (max 10MB)" },
        { status: 413 }
      );
    }

    const auth = await withApiKeyOrSessionAuth(orgId, request);
    if (auth instanceof NextResponse) return auth;

    const ext = EXT_BY_MIME[file.type] ?? "bin";
    const filename = `${randomUUID()}.${ext}`;
    const dir = path.join(
      process.cwd(),
      "uploads",
      "cma",
      "image-templates",
      "assets",
      auth.orgId
    );
    await mkdir(dir, { recursive: true });

    const filepath = path.join(dir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filepath, buffer);

    const publicUrl = `/api/cma/image-templates/assets/${auth.orgId}/${filename}`;
    return NextResponse.json({ url: publicUrl }, { status: 201 });
  } catch (err) {
    console.error("[api/cma/image-templates/assets POST]", err);
    return NextResponse.json(
      { error: "Upload failed", details: (err as Error).message },
      { status: 500 }
    );
  }
}
