// GET /api/cma/image-templates/assets/{orgId}/{filename}
// Serves an image uploaded to this template from the orgId-scoped asset
// directory. Exempted from session auth in middleware so Puppeteer and
// the editor <img> tags can reach it without cookies. Security is via
// UUID filenames + orgId path segment — same model as Direct URL.
//
// Aggressive cache headers (1 year immutable) because uploaded asset
// files are UUID-named and never mutate once written. If a user wants a
// different image they upload a new file and replace the `src` field.

import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

interface RouteParams {
  params: Promise<{ orgId: string; filename: string }>;
}

const EXT_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

// Strict allowlist for path segments so an attacker can't walk up with
// `../` or inject path separators through the URL. Next.js normalizes
// traversal sequences before routing, but we keep this as defense in depth.
// `.` and `..` alone are rejected explicitly because the base regex would
// otherwise match them (all chars in the allowed set).
const SAFE_SEGMENT = /^[\w.-]+$/;

function isSafeSegment(segment: string): boolean {
  if (segment === "." || segment === "..") return false;
  return SAFE_SEGMENT.test(segment);
}

export async function GET(_request: Request, { params }: RouteParams) {
  const { orgId, filename } = await params;

  if (!isSafeSegment(orgId) || !isSafeSegment(filename)) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  const ext = (filename.split(".").pop() ?? "").toLowerCase();
  const mime = EXT_MIME[ext];
  if (!mime) {
    return NextResponse.json({ error: "Unsupported extension" }, { status: 415 });
  }

  const filepath = path.join(
    process.cwd(),
    "uploads",
    "cma",
    "image-templates",
    "assets",
    orgId,
    filename
  );

  try {
    const buf = await readFile(filepath);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": mime,
        // 1 year; UUID filenames never change under us
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Asset not found" }, { status: 404 });
  }
}
