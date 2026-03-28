// POST /api/cma/images/generate
// DALL-E 3 image generation — rate-limited per org (10/day default)

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import {
  generateWithDalle,
  checkImageRateLimit,
  type DalleOptions,
} from "@/lib/cma/services/image-generation-service";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(process.cwd(), "uploads", "cma");

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      prompt?: string;
      orgId?: string;
      postId?: string;
      size?: DalleOptions["size"];
      quality?: DalleOptions["quality"];
    };

    const { prompt, orgId, postId, size, quality } = body;
    if (!prompt?.trim() || !orgId) {
      return NextResponse.json(
        { error: "Missing required fields: prompt, orgId" },
        { status: 400 }
      );
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    // Pre-flight rate limit check (returns friendly error before hitting OpenAI)
    const { allowed, remaining } = await checkImageRateLimit(orgId);
    if (!allowed) {
      return NextResponse.json(
        { error: "Daily image generation limit reached. Try again tomorrow.", remaining: 0 },
        { status: 429 }
      );
    }

    // Generate — service increments usage counter after successful download
    const { imageBuffer, revisedPrompt } = await generateWithDalle(
      prompt.trim(),
      orgId,
      { size, quality }
    );

    // Save to filesystem
    const uuid = randomUUID();
    const fileName = `${uuid}.png`;
    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    await fs.writeFile(path.join(UPLOAD_DIR, fileName), imageBuffer);

    const media = await prisma.cmaMedia.create({
      data: {
        orgId,
        postId: postId ?? null,
        fileName,
        originalName: `ai-generated-${uuid}.png`,
        mimeType: "image/png",
        size: imageBuffer.length,
        localPath: path.join(UPLOAD_DIR, fileName),
        source: "ai-generated",
        aiPrompt: prompt.trim(),
        aiProvider: "openai",
      },
    });

    return NextResponse.json({
      mediaId: media.id,
      url: `/api/cma/media/${media.id}`,
      revisedPrompt,
      remaining: remaining - 1,
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const status = message.includes("limit reached") ? 429 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
