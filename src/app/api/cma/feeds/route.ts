// RSS Feeds — GET list, POST create feed

import { NextResponse } from "next/server";
import { withOrgAuth } from "@/lib/cma/services/org-auth";
import { prisma } from "@/lib/prisma-client";
import { validateUrlSafety } from "@/lib/cma/services/url-safety";
import Parser from "rss-parser";

// GET /api/cma/feeds?orgId=...
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = searchParams.get("orgId");
  if (!orgId) return NextResponse.json({ error: "orgId required" }, { status: 400 });

  const auth = await withOrgAuth(orgId);
  if (auth instanceof NextResponse) return auth;

  const feeds = await prisma.cmaRssFeed.findMany({
    where: { orgId: auth.orgId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ feeds });
}

// POST /api/cma/feeds — add new RSS feed
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orgId, name, url, keywords, language, fetchFrequency } = body;

    if (!orgId || !name || !url) {
      return NextResponse.json({ error: "orgId, name, url required" }, { status: 400 });
    }

    const auth = await withOrgAuth(orgId);
    if (auth instanceof NextResponse) return auth;

    // Validate URL safety (SSRF prevention)
    await validateUrlSafety(url);

    // Validate feed is parseable
    const parser = new Parser({ timeout: 10_000 });
    try {
      await parser.parseURL(url);
    } catch {
      return NextResponse.json({ error: "Invalid RSS feed URL — could not parse" }, { status: 400 });
    }

    const feed = await prisma.cmaRssFeed.create({
      data: {
        orgId: auth.orgId,
        name,
        url,
        keywords: keywords || [],
        language: language || "en",
        fetchFrequency: fetchFrequency || "daily",
      },
    });

    return NextResponse.json(feed, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
