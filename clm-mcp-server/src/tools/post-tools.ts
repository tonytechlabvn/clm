// MCP tools for post operations — publish, draft, status

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ClmApiClient } from "../clm-api-client.js";
import { parseMarkdown } from "../markdown-parser.js";
import { errorResult } from "../tool-utils.js";

/** Register post-related MCP tools on the server */
export function registerPostTools(server: McpServer, client: ClmApiClient) {
  // ─── clm_post_publish ───

  server.registerTool(
    "clm_post_publish",
    {
      title: "Publish Post to WordPress",
      description: `Parse markdown with frontmatter → create post in CLM → publish to WordPress.

Frontmatter format (YAML between --- delimiters):
  title: (required) Post title
  template: (optional) CLM template slug
  account: (optional) WordPress account ID
  tags: (optional) Array of tag strings
  category: (optional) Category name
  featured_image: (optional) URL to featured image
  excerpt: (optional) Post excerpt

Args:
  - content (string): Full markdown with frontmatter (max 1MB)
  - accountId (string): WordPress account ID (overrides frontmatter)
  - orgId (string): Organization ID (uses CLM_DEFAULT_ORG_ID if not set)

Returns: Published post URL, post ID, and any warnings.`,
      inputSchema: {
        content: z.string().min(1).describe("Full markdown with YAML frontmatter"),
        accountId: z.string().optional().describe("WordPress account ID (overrides frontmatter)"),
        orgId: z.string().optional().describe("Organization ID"),
      },
      annotations: {
        destructiveHint: false,
        idempotentHint: false,
        openWorldHint: true,
      },
    },
    async (params) => {
      return handlePostCreate(client, params, true);
    }
  );

  // ─── clm_post_draft ───

  server.registerTool(
    "clm_post_draft",
    {
      title: "Create Draft Post",
      description: `Parse markdown with frontmatter → create draft post in CLM (no auto-publish).

Same frontmatter format as clm_post_publish. Post is saved as draft for review before publishing.

Args:
  - content (string): Full markdown with YAML frontmatter (max 1MB)
  - accountId (string): WordPress account ID for future publishing
  - orgId (string): Organization ID

Returns: Draft post ID and status.`,
      inputSchema: {
        content: z.string().min(1).describe("Full markdown with YAML frontmatter"),
        accountId: z.string().optional().describe("WordPress account ID for future publishing"),
        orgId: z.string().optional().describe("Organization ID"),
      },
      annotations: {
        destructiveHint: false,
        idempotentHint: false,
      },
    },
    async (params) => {
      return handlePostCreate(client, params, false);
    }
  );

  // ─── clm_post_status ───

  server.registerTool(
    "clm_post_status",
    {
      title: "Check Post Status",
      description: `Check the publish status of a CLM post.

Args:
  - postId (string): The CLM post ID
  - orgId (string): Organization ID

Returns: Post status, published URL (if published), error message (if failed).`,
      inputSchema: {
        postId: z.string().min(1).describe("CLM post ID"),
        orgId: z.string().optional().describe("Organization ID"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (params) => {
      try {
        const orgId = client.resolveOrgId(params.orgId);
        const post = await client.getPost(params.postId, orgId);

        const platformInfo = post.platforms?.map((p) => ({
          status: p.status,
          url: p.platformUrl || "N/A",
          error: p.publishError || undefined,
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                {
                  postId: post.id,
                  title: post.title,
                  status: post.status,
                  publishedAt: post.publishedAt,
                  platforms: platformInfo || [],
                },
                null,
                2
              ),
            },
          ],
        };
      } catch (err) {
        return errorResult(err);
      }
    }
  );
}

// ─── Shared handler for publish + draft ───

async function handlePostCreate(
  client: ClmApiClient,
  params: { content: string; accountId?: string; orgId?: string },
  autoPublish: boolean
) {
  const warnings: string[] = [];

  try {
    // 1. Parse markdown frontmatter
    const { frontmatter, content } = parseMarkdown(params.content);
    const orgId = client.resolveOrgId(params.orgId);
    const accountId = params.accountId || frontmatter.account;

    if (autoPublish && !accountId) {
      return errorResult(
        new Error(
          "accountId is required for publishing. Pass it as a parameter or set 'account' in frontmatter."
        )
      );
    }

    // 2. Resolve template slug to ID if provided
    let templateId: string | undefined;
    if (frontmatter.template) {
      templateId = await client.resolveTemplateSlug(frontmatter.template, orgId);
      if (!templateId) {
        warnings.push(`Template "${frontmatter.template}" not found — posting without template`);
      }
    }

    // 3. Create post in CLM
    const post = await client.createPost({
      orgId,
      title: frontmatter.title,
      content,
      templateId,
      excerpt: frontmatter.excerpt,
      categories: frontmatter.category ? [frontmatter.category] : undefined,
      tags: frontmatter.tags,
      featuredImage: frontmatter.featured_image,
    });

    // 3. Auto-publish if requested
    if (autoPublish && accountId) {
      const publishResult = await client.publishPost(post.id, accountId, orgId);
      if (!publishResult.success) {
        return errorResult(
          new Error(`Post created (${post.id}) but publish failed: ${publishResult.error}`)
        );
      }

      // 4. Verify publish status
      const verified = await client.getPost(post.id, orgId);
      const platformEntry = verified.platforms?.find((p) => p.accountId === accountId);
      const publishedUrl = platformEntry?.platformUrl;

      return {
        content: [
          {
            type: "text" as const,
            text: JSON.stringify(
              {
                postId: post.id,
                title: frontmatter.title,
                status: "published",
                url: publishedUrl || "Publishing in progress...",

                warnings: warnings.length > 0 ? warnings : undefined,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Draft-only response
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              postId: post.id,
              title: frontmatter.title,
              status: "draft",
              warnings: warnings.length > 0 ? warnings : undefined,
            },
            null,
            2
          ),
        },
      ],
    };
  } catch (err) {
    return errorResult(err);
  }
}

