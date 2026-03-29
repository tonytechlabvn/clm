// POST /api/cma/templates/from-post — Save a template from an existing post

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma-client";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { createTemplate } from "@/lib/cma/services/template-service";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, postId, name, category } = body;

    if (!orgId || !postId || !name || !category) {
      return NextResponse.json(
        { error: "Missing required fields: orgId, postId, name, category" },
        { status: 400 }
      );
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    // Load post and verify org scope
    const post = await prisma.cmaPost.findFirst({
      where: { id: postId, orgId: auth.orgId },
    });
    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Save as blocks template — extract block structure with placeholder content
    // Content is markdown, we store it as a single richtext block template
    const blocks = [
      { type: "heading", props: { level: 1 }, content: [{ type: "text", text: "{{title}}" }] },
      { type: "paragraph", content: [{ type: "text", text: "{{body}}" }] },
    ];

    const template = await createTemplate(
      {
        name,
        category,
        blocks,
        templateType: "blocks",
        description: `Created from post: ${post.title}`,
      },
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
