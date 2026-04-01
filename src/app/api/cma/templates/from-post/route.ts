// POST /api/cma/templates/from-post — Extract structure from a post and save as reusable template

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { createTemplate } from "@/lib/cma/services/template-service";
import { extractBlocksStructure } from "@/lib/cma/utils/extract-blocks-structure";
import { extractMarkdownStructure } from "@/lib/cma/utils/extract-markdown-structure";
import { extractHtmlStructure } from "@/lib/cma/utils/extract-html-structure";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, postId, name, category, description } = body;

    if (!orgId || !postId || !name || !category) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, postId, name, category" },
        { status: 400 }
      );
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    const post = await prisma.cmaPost.findFirst({
      where: { id: postId, orgId: auth.orgId },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    const autoDescription = description || `Structure extracted from: ${post.title}`;

    // Branch on content format — extract real structure from post content
    if (post.contentFormat === "html") {
      // HTML → html-slots template
      const { htmlTemplate, cssScoped, slotDefinitions } = extractHtmlStructure(post.content);
      const template = await createTemplate(
        { name, category, description: autoDescription, templateType: "html-slots", htmlTemplate, cssScoped, slotDefinitions },
        auth.orgId
      );
      return NextResponse.json({ data: template }, { status: 201 });
    }

    // blocks or markdown → blocks template
    let templateBlocks: unknown[];
    if (post.contentFormat === "blocks") {
      try {
        const parsed = JSON.parse(post.content);
        templateBlocks = extractBlocksStructure(Array.isArray(parsed) ? parsed : []);
      } catch {
        // Malformed blocks JSON — fallback to markdown extraction
        templateBlocks = extractMarkdownStructure(post.content);
      }
    } else {
      // markdown (default)
      templateBlocks = extractMarkdownStructure(post.content);
    }

    const template = await createTemplate(
      { name, category, description: autoDescription, blocks: templateBlocks, templateType: "blocks" },
      auth.orgId
    );
    return NextResponse.json({ data: template }, { status: 201 });
  } catch (err) {
    console.error("[api/cma/templates/from-post POST]", err);
    return NextResponse.json(
      { error: "Failed to create template from post", details: (err as Error).message },
      { status: 500 }
    );
  }
}
