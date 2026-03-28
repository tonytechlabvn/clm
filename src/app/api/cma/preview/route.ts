// CMA Preview — POST convert content to sanitized HTML for preview (dual pipeline)

import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/cma/services/org-auth";
import { markdownToSanitizedHtml } from "@/lib/cma/markdown-to-html";
import { blocksToSanitizedHtml } from "@/lib/cma/blocks-to-html";
import { blocksToStyledHtml } from "@/lib/cma/themes/apply-theme-styles";

// POST /api/cma/preview — render content to sanitized HTML (supports themes)
export async function POST(request: Request) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { content, contentFormat, theme } = await request.json();
    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    let html: string;
    if (contentFormat === "blocks") {
      const blocks = typeof content === "string" ? JSON.parse(content) : content;
      // Use styled output if theme specified, otherwise plain sanitized HTML
      html = theme ? blocksToStyledHtml(blocks, theme) : await blocksToSanitizedHtml(blocks);
    } else {
      html = await markdownToSanitizedHtml(content);
    }

    return NextResponse.json({ html });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
