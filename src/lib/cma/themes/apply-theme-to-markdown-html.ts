// Converts markdown → themed HTML with inline CSS from theme definitions
// Uses unified/remark/rehype pipeline with a custom rehype plugin for style injection

import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { visit } from "unist-util-visit";
import type { Element, Root } from "hast";
import { getTheme, sanitizeStyleString } from "./theme-definitions";
import type { ThemeStyles } from "./theme-definitions";

// Map HTML tag names to ThemeStyles keys
const TAG_TO_THEME_KEY: Record<string, keyof ThemeStyles> = {
  h1: "h1", h2: "h2", h3: "h3", h4: "h3", h5: "h3", h6: "h3",
  p: "p", a: "a", img: "img",
  code: "code", pre: "pre", blockquote: "blockquote",
  ul: "ul", ol: "ol", li: "li",
  table: "table", th: "th", td: "td", hr: "hr",
  figure: "figure", figcaption: "figcaption",
};

// Sanitize schema that allows style attribute (for theme injection)
const themedSanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    "p", "h1", "h2", "h3", "h4", "h5", "h6",
    "img", "a", "code", "pre", "blockquote",
    "ul", "ol", "li", "em", "strong", "br", "hr",
    "table", "thead", "tbody", "tr", "th", "td",
    "figure", "figcaption",
  ],
  attributes: {
    ...defaultSchema.attributes,
    img: ["src", "alt", "title", "width", "height", "style"],
    a: ["href", "title", "rel", "style"],
    code: ["className", "style"],
    th: ["align", "style"],
    td: ["align", "style"],
    "*": [...(defaultSchema.attributes?.["*"] ?? []), "style"],
  },
  protocols: {
    href: ["http", "https", "mailto"],
    src: ["http", "https"],
  },
};

// Rehype plugin: injects theme inline styles into HAST elements
function rehypeInjectThemeStyles(theme: ThemeStyles) {
  return () => (tree: Root) => {
    visit(tree, "element", (node: Element, _index: number | undefined, parent: Root | Element | null | undefined) => {
      const themeKey = TAG_TO_THEME_KEY[node.tagName];
      if (!themeKey) return;

      const styleStr = theme[themeKey] as string;
      if (!styleStr) return;

      // Skip inline code style when inside pre (fenced code blocks keep pre style only)
      if (node.tagName === "code" && (parent as Element)?.tagName === "pre") {
        return;
      }

      const sanitized = sanitizeStyleString(styleStr);
      if (sanitized) {
        node.properties = node.properties ?? {};
        node.properties.style = sanitized;
      }
    });
  };
}

/**
 * Convert markdown to themed HTML with inline CSS from the specified theme.
 * Sanitizes content first, then injects trusted theme styles.
 */
export async function markdownToThemedHtml(
  markdown: string,
  themeName: string
): Promise<string> {
  const theme = getTheme(themeName);

  const result = await unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: false })
    .use(rehypeSanitize, themedSanitizeSchema as Parameters<typeof rehypeSanitize>[0])
    .use(rehypeInjectThemeStyles(theme))
    .use(rehypeStringify)
    .process(markdown);

  const wrapperStyle = sanitizeStyleString(theme.wrapper);
  return `<div style="${wrapperStyle}">\n${String(result)}\n</div>`;
}
