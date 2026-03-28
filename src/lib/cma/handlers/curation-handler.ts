// pg-boss handler for AI content curation — processes articles queued by crawler

import { prisma } from "@/lib/prisma-client";
import { curateContent } from "../services/content-ai-service";
import { normalizeUrl } from "../services/crawler-service";

interface CurateJobData {
  orgId: string;
  feedId: string;
  articleUrl: string;
  articleTitle: string;
  articleContent: string;
  articleAuthor?: string;
}

/** Handler for "cma:curate" pg-boss job */
export async function handleCuration(data: CurateJobData): Promise<void> {
  const { orgId, feedId, articleUrl, articleTitle, articleContent, articleAuthor } = data;

  console.log(`[curation] Processing: ${articleTitle}`);

  try {
    // AI curation — generates blog draft + social excerpts
    const result = await curateContent(articleContent, articleUrl, orgId);

    // Get first admin user for this org as author
    const orgMember = await prisma.orgMember.findFirst({
      where: { orgId, role: { in: ["owner", "admin"] } },
      select: { userId: true },
    });
    if (!orgMember) {
      throw new Error(`No admin user found for org ${orgId}`);
    }

    const normalized = normalizeUrl(articleUrl);

    // Create main blog post (pending_review)
    const mainPost = await prisma.cmaPost.create({
      data: {
        orgId,
        authorId: orgMember.userId,
        title: articleTitle,
        content: result.blogDraft,
        excerpt: result.linkedinExcerpt,
        tags: result.tags,
        status: "pending_review",
        aiGenerated: true,
        sourceUrl: articleUrl,
        normalizedSourceUrl: normalized,
        originalAiDraft: result.blogDraft,
      },
    });

    // Create social excerpt child posts
    const socialExcerpts = [
      { platform: "facebook", content: result.fbExcerpt },
      { platform: "linkedin", content: result.linkedinExcerpt },
    ];

    for (const excerpt of socialExcerpts) {
      if (!excerpt.content) continue;
      await prisma.cmaPost.create({
        data: {
          orgId,
          authorId: orgMember.userId,
          title: `[${excerpt.platform}] ${articleTitle}`,
          content: excerpt.content,
          status: "pending_review",
          aiGenerated: true,
          sourceUrl: articleUrl,
          normalizedSourceUrl: normalized,
          parentPostId: mainPost.id,
        },
      });
    }

    console.log(`[curation] Created post ${mainPost.id} from: ${articleUrl}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[curation] Failed for ${articleUrl}: ${message}`);
    throw err; // let pg-boss retry
  }
}
