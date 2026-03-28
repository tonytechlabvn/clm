// pg-boss handler for RSS feed crawling — fetches new articles and queues them for AI curation

import { prisma } from "@/lib/prisma-client";
import { fetchFeed, isDuplicate, matchesKeywords, normalizeUrl } from "../services/crawler-service";
import type { PgBoss } from "pg-boss";

interface CrawlJobData {
  feedId: string;
  orgId: string;
}

/** Handler for "cma:rss-crawl" pg-boss job */
export async function handleRssCrawl(
  data: CrawlJobData,
  pgBoss: PgBoss
): Promise<void> {
  const { feedId, orgId } = data;

  const feed = await prisma.cmaRssFeed.findUnique({ where: { id: feedId } });
  if (!feed || !feed.isActive) {
    console.log(`[crawler] Feed ${feedId} not found or inactive, skipping`);
    return;
  }

  console.log(`[crawler] Crawling feed: ${feed.name} (${feed.url})`);

  try {
    const { articles, errors } = await fetchFeed(feed.url, feed.lastFetchedAt);

    if (errors.length > 0) {
      console.warn(`[crawler] Feed ${feed.name} had ${errors.length} errors`);
    }

    let queued = 0;
    for (const article of articles) {
      // Check keyword filters
      if (!matchesKeywords(article, feed.keywords)) continue;

      // Dedup check
      if (await isDuplicate(orgId, article.url)) {
        console.log(`[crawler] Duplicate skipped: ${article.url}`);
        continue;
      }

      // Queue for AI curation
      await pgBoss.send("cma:curate", {
        orgId,
        feedId,
        articleUrl: article.url,
        articleTitle: article.title,
        articleContent: article.content,
        articleAuthor: article.author,
      });
      queued++;
    }

    // Update feed status
    await prisma.cmaRssFeed.update({
      where: { id: feedId },
      data: { lastFetchedAt: new Date(), errorCount: 0, lastError: null },
    });

    console.log(`[crawler] Feed ${feed.name}: ${articles.length} articles found, ${queued} queued`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const newErrorCount = feed.errorCount + 1;

    // Mark feed as inactive after 5 consecutive failures
    await prisma.cmaRssFeed.update({
      where: { id: feedId },
      data: {
        errorCount: newErrorCount,
        lastError: message,
        isActive: newErrorCount < 5,
      },
    });

    console.error(`[crawler] Feed ${feed.name} failed (${newErrorCount}/5): ${message}`);
    throw err; // let pg-boss retry
  }
}

/** Schedule crawl jobs for all active feeds of an org */
export async function scheduleOrgCrawls(
  orgId: string,
  pgBoss: PgBoss
): Promise<number> {
  const feeds = await prisma.cmaRssFeed.findMany({
    where: { orgId, isActive: true },
  });

  let scheduled = 0;
  for (const feed of feeds) {
    await pgBoss.send("cma:rss-crawl", { feedId: feed.id, orgId }, {
      singletonKey: feed.id, // prevent duplicate crawl jobs
    });
    scheduled++;
  }
  return scheduled;
}
