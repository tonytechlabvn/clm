// Markdown → sanitized HTML conversion for CMA publishing
// Uses unified/remark/rehype pipeline with rehype-sanitize (RT2#3)

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

// Strict allowlist per RT2#3: safe HTML tags only
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    "p", "h1", "h2", "h3", "h4", "h5", "h6",
    "img", "a", "code", "pre", "blockquote",
    "ul", "ol", "li", "em", "strong", "br", "hr",
    "table", "thead", "tbody", "tr", "th", "td",
  ],
  attributes: {
    ...defaultSchema.attributes,
    img: ["src", "alt", "title", "width", "height"],
    a: ["href", "title", "rel"],
    code: ["className"],
    th: ["align"],
    td: ["align"],
  },
  // Block javascript: URIs in href/src
  protocols: {
    href: ["http", "https", "mailto"],
    src: ["http", "https"],
  },
};

export async function markdownToSanitizedHtml(markdown: string): Promise<string> {
  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(markdown);

  return String(result);
}
