// Direct URL image endpoint — URL IS the image
// GET /api/cma/image-templates/[id]/image?auth=xxx&var1=...&var2=...
// Returns: image/png (streamed directly, cache-friendly)
//
// Inspired by APITemplate.io's Direct URL approach:
// https://apitemplate.io/docs/image-generation/direct-url/
//
// Usage:
//   <img src="/api/cma/image-templates/abc/image?auth=xyz&title=Hello" />
//   <meta property="og:image" content="https://clm.../image-templates/abc/image?auth=xyz&..." />
//   Facebook fetches directly → no buffer upload hack needed

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { renderTemplate } from "@/lib/cma/services/image-template-renderer-service";
import { variableSchemaValidator } from "@/lib/cma/types/image-template-types";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Reserved query params that aren't template variables
const RESERVED_PARAMS = new Set(["auth", "_cb"]);

export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const authCode = url.searchParams.get("auth");

    if (!authCode) {
      return NextResponse.json({ error: "Missing auth parameter" }, { status: 401 });
    }

    // Fetch template — no org scoping here because auth is via authCode (URL-signed)
    const template = await prisma.cmaImageTemplate.findUnique({ where: { id } });
    if (!template) {
      return NextResponse.json({ error: "Template not found" }, { status: 404 });
    }

    // Verify auth code — constant-time compare to prevent timing attacks
    if (!timingSafeEqual(template.authCode, authCode)) {
      return NextResponse.json({ error: "Invalid auth code" }, { status: 401 });
    }

    // Validate stored variable schema
    const schemaResult = variableSchemaValidator.safeParse(template.variableSchema);
    if (!schemaResult.success) {
      return NextResponse.json({ error: "Invalid template schema" }, { status: 500 });
    }

    // Parse query params → variables (skip reserved params)
    const variables: Record<string, string> = {};
    for (const v of schemaResult.data) {
      const val = url.searchParams.get(v.name);
      variables[v.name] = val ?? v.defaultValue ?? "";
    }

    // Check required variables
    const missing = schemaResult.data
      .filter((v) => v.required && !variables[v.name])
      .map((v) => v.name);
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Missing required variables", details: missing },
        { status: 400 }
      );
    }

    // Render PNG via Puppeteer
    const result = await renderTemplate({
      htmlContent: template.htmlContent,
      variables,
      width: template.width,
      height: template.height,
    });

    // Increment usage (fire-and-forget, don't block response)
    prisma.cmaImageTemplate
      .update({
        where: { id },
        data: { usageCount: { increment: 1 }, lastUsedAt: new Date() },
      })
      .catch(() => {});

    // Return image with aggressive caching (URL is deterministic = same params = same image)
    return new Response(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(result.buffer.length),
        "Cache-Control": "public, max-age=86400, s-maxage=604800, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[api/cma/image-templates/[id]/image GET]", err);
    return NextResponse.json(
      { error: "Failed to render image", details: (err as Error).message },
      { status: 500 }
    );
  }
}

// Constant-time string comparison to prevent timing attacks on authCode verification
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}
