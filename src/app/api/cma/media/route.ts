// CMA Media upload — POST upload image with UUID filename, MIME validation, auth-gated

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join, extname } from "path";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const UPLOAD_DIR = join(process.cwd(), "uploads", "cma");

// MIME magic bytes signatures for validation
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/gif": [0x47, 0x49, 0x46],
  "image/webp": [0x52, 0x49, 0x46, 0x46], // RIFF header
};

function validateMimeByBytes(buffer: Buffer, claimedMime: string): boolean {
  const expected = MAGIC_BYTES[claimedMime];
  if (!expected) return false;
  for (let i = 0; i < expected.length; i++) {
    if (buffer[i] !== expected[i]) return false;
  }
  // H5 fix: WebP needs additional check — bytes 8-11 must be "WEBP"
  if (claimedMime === "image/webp") {
    const webpSig = [0x57, 0x45, 0x42, 0x50]; // "WEBP"
    for (let i = 0; i < webpSig.length; i++) {
      if (buffer[8 + i] !== webpSig[i]) return false;
    }
  }
  return true;
}

function mimeToExtension(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/gif": ".gif",
    "image/webp": ".webp",
  };
  return map[mime] || ".bin";
}

// POST /api/cma/media — upload an image file
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const orgId = formData.get("orgId") as string | null;
    const postId = formData.get("postId") as string | null;

    if (!file || !orgId) {
      return NextResponse.json(
        { error: "Missing required fields: file, orgId" },
        { status: 400 }
      );
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    // Validate MIME type from Content-Type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${ALLOWED_MIME_TYPES.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max size: ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Read file buffer and validate MIME via magic bytes
    const buffer = Buffer.from(await file.arrayBuffer());
    if (!validateMimeByBytes(buffer, file.type)) {
      return NextResponse.json(
        { error: "File content does not match declared MIME type" },
        { status: 400 }
      );
    }

    // Generate UUID filename — never use original filename
    const uuid = randomUUID();
    const ext = extname(file.name) || mimeToExtension(file.type);
    const safeFileName = `${uuid}${ext}`;
    const localPath = join(UPLOAD_DIR, safeFileName);

    // Ensure upload directory exists
    await mkdir(UPLOAD_DIR, { recursive: true });
    await writeFile(localPath, buffer);

    // Store media record in DB
    const media = await prisma.cmaMedia.create({
      data: {
        orgId,
        postId: postId || null,
        fileName: safeFileName,
        originalName: file.name,
        mimeType: file.type,
        size: file.size,
        localPath,
      },
    });

    return NextResponse.json({
      id: media.id,
      fileName: media.fileName,
      originalName: media.originalName,
      mimeType: media.mimeType,
      size: media.size,
      url: `/api/cma/media/${media.id}`,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
