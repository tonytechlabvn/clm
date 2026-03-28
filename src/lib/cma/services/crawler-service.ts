// RSS feed crawling — fetch feeds, extract article content, dedup via normalized URLs

import Parser from "rss-parser";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { prisma } from "@/lib/prisma-client";
import { validateUrlSafety } from "./url-safety";

const rssParser = new Parser({ timeout: 10_000, maxRedirects: 3 });

export interface ExtractedArticle {
  title: string;
  url: string;
  content: string; // clean text
  author?: string;
  publishedAt?: Date;
}

export interface FeedFetchResult {
  articles: ExtractedArticle[];
  errors: string[];
}

/** Strip tracking params, normalize URL for dedup comparison */
export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove tracking params
    const trackingParams = [
      "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content",
      "fbclid", "gclid", "ref", "source", "mc_cid", "mc_eid",
    ];
    trackingParams.forEach((p) => parsed.searchParams.delete(p));
    // Normalize to https, strip trailing slash
    parsed.protocol = "https:";
    let normalized = parsed.toString();
    if (normalized.endsWith("/")) normalized = normalized.slice(0, -1);
    return normalized;
  } catch {
    return url;
  }
}

/** Sanitize extracted text — strip HTML comments, invisible chars, injection patterns */
export function sanitizeExtractedText(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, "") // HTML comments
    .replace(/[\u200B-\u200F\u2028-\u202F\uFEFF]/g, "") // invisible chars
    .replace(/<script[\s\S]*?<\/script>/gi, "") // script tags
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, "") // iframe tags
    .replace(/<style[\s\S]*?<\/style>/gi, "") // style tags
    .trim();
}

/** Fetch and parse an RSS feed, return new articles since lastFetchedAt */
export async function fetchFeed(
  feedUrl: string,
  lastFetchedAt: Date | null
): Promise<FeedFetchResult> {
  await validateUrlSafety(feedUrl);

  const feed = await rssParser.parseURL(feedUrl);
  const articles: ExtractedArticle[] = [];
  const errors: string[] = [];

  for (const item of feed.items || []) {
    if (!item.link) continue;

    // Skip old articles if we have a lastFetchedAt
    if (lastFetchedAt && item.isoDate) {
      const pubDate = new Date(item.isoDate);
      if (pubDate <= lastFetchedAt) continue;
    }

    articles.push({
      title: item.title || "Untitled",
      url: item.link,
      content: item.contentSnippet || item.content || "",
      author: item.creator || item.author,
      publishedAt: item.isoDate ? new Date(item.isoDate) : undefined,
    });
  }

  return { articles, errors };
}

/** Extract clean article text from a URL using Readability */
export async function extractContent(url: string): Promise<ExtractedArticle> {
  await validateUrlSafety(url);

  const response = await fetch(url, {
    headers: { "User-Agent": "TonyTechLab-CMA/1.0" },
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) throw new Error(`Failed to fetch URL: ${response.status}`);

  // Enforce 5MB size limit (handles both Content-Length header and chunked responses)
  const MAX_SIZE = 5 * 1024 * 1024;
  const contentLength = response.headers.get("content-length");
  if (contentLength && parseInt(contentLength) > MAX_SIZE) {
    throw new Error("Response exceeds 5MB size limit");
  }

  const buffer = await response.arrayBuffer();
  if (buffer.byteLength > MAX_SIZE) {
    throw new Error("Response exceeds 5MB size limit");
  }
  const html = new TextDecoder().decode(buffer);
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article) throw new Error("Could not extract article content");

  return {
    title: article.title || "Untitled",
    url,
    content: sanitizeExtractedText(article.textContent || ""),
    author: article.byline || undefined,
  };
}

/** Check if a source URL has already been curated for this org */
export async function isDuplicate(
  orgId: string,
  sourceUrl: string
): Promise<boolean> {
  const normalized = normalizeUrl(sourceUrl);
  const existing = await prisma.cmaPost.findFirst({
    where: { orgId, normalizedSourceUrl: normalized },
    select: { id: true },
  });
  return !!existing;
}

/** Check if an article matches feed keyword filters */
export function matchesKeywords(
  article: ExtractedArticle,
  keywords: string[]
): boolean {
  if (keywords.length === 0) return true; // no filter = match all
  const text = `${article.title} ${article.content}`.toLowerCase();
  return keywords.some((kw) => text.includes(kw.toLowerCase()));
}
