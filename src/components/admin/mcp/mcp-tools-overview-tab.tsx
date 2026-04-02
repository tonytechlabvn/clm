"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const MCP_TOOLS = [
  {
    name: "clm_post_publish",
    title: "Publish Post to WordPress",
    description:
      "Parse markdown with frontmatter, create post in CLM, and auto-publish to WordPress.",
    params: [
      "content (string, required)",
      "accountId (string, optional)",
      "orgId (string, optional)",
    ],
    badge: "write" as const,
  },
  {
    name: "clm_post_draft",
    title: "Create Draft Post",
    description:
      "Parse markdown with frontmatter and save as draft for review before publishing.",
    params: [
      "content (string, required)",
      "accountId (string, optional)",
      "orgId (string, optional)",
    ],
    badge: "write" as const,
  },
  {
    name: "clm_post_status",
    title: "Check Post Status",
    description:
      "Check the publish status of a CLM post, including platform URLs and errors.",
    params: ["postId (string, required)", "orgId (string, optional)"],
    badge: "read" as const,
  },
  {
    name: "clm_templates_list",
    title: "List CLM Templates",
    description:
      "List available content templates for formatting posts. Filterable by type.",
    params: [
      "orgId (string, optional)",
      "type (string, optional: 'blocks' | 'html-slots')",
    ],
    badge: "read" as const,
  },
  {
    name: "clm_accounts_list",
    title: "List Connected Accounts",
    description:
      "List connected WordPress/platform accounts with ID, label, and site URL.",
    params: ["orgId (string, optional)"],
    badge: "read" as const,
  },
];

const FRONTMATTER_EXAMPLE = `---
title: "My Blog Post"
template: "neo-brutalism"
account: "my-wordpress-site"
tags: ["tech", "tutorial"]
category: "Engineering"
featured_image: "https://example.com/image.jpg"
excerpt: "A brief summary of the post"
---

Your markdown content here...`;

export function McpToolsOverviewTab() {
  return (
    <div className="space-y-4">
      {/* Tool Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {MCP_TOOLS.map((tool) => (
          <Card key={tool.name}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{tool.title}</CardTitle>
                <Badge variant={tool.badge === "write" ? "default" : "secondary"}>
                  {tool.badge}
                </Badge>
              </div>
              <p className="font-mono text-xs text-muted-foreground">{tool.name}</p>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">{tool.description}</p>
              <div>
                <p className="text-xs font-medium mb-1">Parameters</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {tool.params.map((p) => (
                    <li key={p} className="font-mono">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Frontmatter Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Frontmatter Reference</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Posts use YAML frontmatter for metadata. Only <code className="bg-muted px-1 rounded">title</code> is required.
          </p>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Field</th>
                  <th className="text-left px-4 py-2 font-medium">Required</th>
                  <th className="text-left px-4 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ["title", "Yes", "Post title"],
                  ["template", "No", "Template slug for formatting"],
                  ["account", "No", "WordPress account ID or label"],
                  ["tags", "No", "Array of tag strings"],
                  ["category", "No", "Post category name"],
                  ["featured_image", "No", "URL for the featured image"],
                  ["excerpt", "No", "Short summary / excerpt"],
                ].map(([field, required, desc]) => (
                  <tr key={field} className="border-t">
                    <td className="px-4 py-2 font-mono text-xs">{field}</td>
                    <td className="px-4 py-2">{required}</td>
                    <td className="px-4 py-2 text-muted-foreground">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <pre className="bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto select-text whitespace-pre">
            {FRONTMATTER_EXAMPLE}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
