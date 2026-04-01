// Markdown frontmatter parser — extracts metadata from .md content using gray-matter + Zod

import matter from "gray-matter";
import { FrontmatterSchema, type ParsedMarkdown } from "./types.js";

const MAX_CONTENT_SIZE = 1_048_576; // 1MB

/**
 * Parse markdown string with frontmatter. Validates frontmatter fields via Zod.
 * Throws descriptive errors for invalid input.
 */
export function parseMarkdown(raw: string): ParsedMarkdown {
  if (raw.length > MAX_CONTENT_SIZE) {
    throw new Error(
      `Content too large: ${(raw.length / 1024).toFixed(0)}KB exceeds 1MB limit`
    );
  }

  const { data, content } = matter(raw);

  if (!data || Object.keys(data).length === 0) {
    throw new Error(
      "No frontmatter found. Add YAML frontmatter between --- delimiters at the top of your markdown."
    );
  }

  const result = FrontmatterSchema.safeParse(data);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join("; ");
    throw new Error(`Invalid frontmatter: ${issues}`);
  }

  const trimmed = content.trim();
  if (!trimmed) {
    throw new Error("Markdown body is empty. Add content after the frontmatter.");
  }

  return { frontmatter: result.data, content: trimmed };
}
