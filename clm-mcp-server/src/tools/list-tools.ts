// MCP tools for listing CLM resources — templates, accounts

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ClmApiClient } from "../clm-api-client.js";
import { errorResult } from "../tool-utils.js";

/** Register list/read-only MCP tools on the server */
export function registerListTools(server: McpServer, client: ClmApiClient) {
  // ─── clm_templates_list ───

  server.registerTool(
    "clm_templates_list",
    {
      title: "List CLM Templates",
      description: `List available content templates in CLM for formatting posts.

Args:
  - orgId (string): Organization ID (uses CLM_DEFAULT_ORG_ID if not set)
  - type (string): Filter by template type: "blocks" or "html-slots"

Returns: Array of templates with name, slug, type, category, and slot definitions.`,
      inputSchema: {
        orgId: z.string().optional().describe("Organization ID"),
        type: z
          .enum(["blocks", "html-slots"])
          .optional()
          .describe("Filter by template type"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (params) => {
      try {
        const orgId = client.resolveOrgId(params.orgId);
        const { templates } = await client.listTemplates(orgId);

        const filtered = params.type
          ? templates.filter((t) => t.templateType === params.type)
          : templates;

        const summary = filtered.map((t) => ({
          slug: t.slug,
          name: t.name,
          type: t.templateType,
          category: t.category,
          description: t.description || "",
          tags: t.tags,
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { count: summary.length, templates: summary },
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

  // ─── clm_accounts_list ───

  server.registerTool(
    "clm_accounts_list",
    {
      title: "List Connected Accounts",
      description: `List connected WordPress/platform accounts in CLM.

Args:
  - orgId (string): Organization ID (uses CLM_DEFAULT_ORG_ID if not set)

Returns: Array of accounts with ID, platform, label, and site URL.`,
      inputSchema: {
        orgId: z.string().optional().describe("Organization ID"),
      },
      annotations: {
        readOnlyHint: true,
        idempotentHint: true,
      },
    },
    async (params) => {
      try {
        // orgId validated but accounts endpoint returns all user accounts
        client.resolveOrgId(params.orgId);
        const { accounts } = await client.listAccounts();

        const filtered = params.orgId
          ? accounts.filter((a) => a.orgId === params.orgId)
          : accounts;

        const summary = filtered.map((a) => ({
          id: a.id,
          platform: a.platform,
          label: a.label,
          siteUrl: a.siteUrl || "",
          active: a.isActive,
        }));

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(
                { count: summary.length, accounts: summary },
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

