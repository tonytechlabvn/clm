// Shared types and Zod schemas for CLM MCP server

import { z } from "zod";

// ─── Frontmatter schema (parsed from markdown files) ───

export const FrontmatterSchema = z.object({
  title: z.string().min(1, "Title is required"),
  template: z.string().optional(),
  account: z.string().optional(),
  status: z.enum(["publish", "draft"]).default("publish"),
  featured_image: z.string().url("Invalid featured_image URL").optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  excerpt: z.string().optional(),
});

export type Frontmatter = z.infer<typeof FrontmatterSchema>;

// ─── CLM API response types ───

export interface ClmPost {
  id: string;
  orgId: string;
  title: string;
  status: string;
  slug?: string;
  content: string;
  excerpt?: string;
  categories: string[];
  tags: string[];
  featuredImage?: string;
  templateId?: string;
  contentFormat: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  platforms?: ClmPostPlatform[];
}

export interface ClmPostPlatform {
  id: string;
  accountId: string;
  platformPostId?: string;
  platformUrl?: string;
  status: string;
  publishError?: string;
  publishedAt?: string;
}

export interface ClmTemplate {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: string;
  templateType: string;
  slotDefinitions?: unknown;
  tags: string[];
}

export interface ClmAccount {
  id: string;
  orgId: string;
  platform: string;
  label: string;
  siteUrl?: string;
  username?: string;
  isActive: boolean;
}

// ─── API error shape ───

export interface ClmApiError {
  error: string;
  details?: string;
}

// ─── Parsed markdown result ───

export interface ParsedMarkdown {
  frontmatter: Frontmatter;
  content: string; // markdown body without frontmatter
}
