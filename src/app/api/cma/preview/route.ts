// CMA Preview — POST convert markdown to sanitized HTML for preview

import { NextResponse } from "next/server";
import { withAdminAuth } from "@/lib/cma/services/org-auth";
import { markdownToSanitizedHtml } from "@/lib/cma/markdown-to-html";

// POST /api/cma/preview — render markdown to sanitized HTML
export async function POST(request: Request) {
  const auth = await withAdminAuth();
  if (auth instanceof NextResponse) return auth;

  try {
    const { content } = await request.json();
    if (!content) {
      return NextResponse.json({ error: "content is required" }, { status: 400 });
    }

    const html = await markdownToSanitizedHtml(content);
    return NextResponse.json({ html });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
