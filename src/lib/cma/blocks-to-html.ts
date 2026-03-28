// Block JSON → sanitized HTML conversion for CMA publishing
// Converts BlockNote block arrays to semantic HTML with XSS sanitization

import { unified } from "unified";
import rehypeParse from "rehype-parse";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { isCustomBlockType, renderCustomBlockHtml } from "./blocks/custom-blocks-to-html";

// Reuse same sanitization schema as markdown pipeline for consistency
const sanitizeSchema = {
  ...defaultSchema,
  tagNames: [
    "div", "p", "h1", "h2", "h3", "h4", "h5", "h6",
    "img", "a", "code", "pre", "blockquote",
    "ul", "ol", "li", "em", "strong", "br", "hr",
    "table", "thead", "tbody", "tr", "th", "td",
    "figure", "figcaption", "span",
    "nav", "section", "s", "u",
  ],
  attributes: {
    ...defaultSchema.attributes,
    img: ["src", "alt", "title", "width", "height"],
    a: ["href", "title", "rel", "target"],
    code: ["className"],
    th: ["align"],
    td: ["align"],
    // Allow style + class attrs for themed publishing and custom blocks
    "*": [...(defaultSchema.attributes?.["*"] || []), "style", "className", "id"],
  },
  protocols: {
    href: ["http", "https", "mailto"],
    src: ["http", "https"],
  },
};

// --- Inline content rendering ---

interface InlineContent {
  type: string;
  text?: string;
  href?: string;
  content?: InlineContent[];
  styles?: Record<string, boolean | string>;
}

function renderInlineContent(items: InlineContent[] | undefined): string {
  if (!items || items.length === 0) return "";
  return items
    .map((item) => {
      if (item.type === "text") {
        let text = escapeHtml(item.text || "");
        if (item.styles?.bold) text = `<strong>${text}</strong>`;
        if (item.styles?.italic) text = `<em>${text}</em>`;
        if (item.styles?.code) text = `<code>${text}</code>`;
        if (item.styles?.strikethrough) text = `<s>${text}</s>`;
        if (item.styles?.underline) text = `<u>${text}</u>`;
        return text;
      }
      if (item.type === "link") {
        const href = escapeAttr(item.href || "");
        const inner = renderInlineContent(item.content);
        return `<a href="${href}" rel="noopener noreferrer">${inner}</a>`;
      }
      return escapeHtml(item.text || "");
    })
    .join("");
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// --- Block rendering ---

interface BlockNode {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  content?: InlineContent[];
  children?: BlockNode[];
}

function renderBlock(block: BlockNode, allBlocks: BlockNode[]): string {
  const content = renderInlineContent(block.content);
  const props = block.props || {};

  switch (block.type) {
    case "heading": {
      const level = Math.min(Math.max(Number(props.level) || 1, 1), 6);
      const id = slugify(stripInlineToText(block.content));
      const idAttr = id ? ` id="${id}"` : "";
      return `<h${level}${idAttr}>${content}</h${level}>`;
    }
    case "paragraph":
      return `<p>${content || "<br>"}</p>`;

    case "bulletListItem":
      return `<li>${content}${renderChildren(block.children, allBlocks)}</li>`;

    case "numberedListItem":
      return `<li>${content}${renderChildren(block.children, allBlocks)}</li>`;

    case "checkListItem": {
      const checked = props.checked ? " checked" : "";
      return `<li><input type="checkbox"${checked} disabled> ${content}</li>`;
    }

    case "image": {
      const src = escapeAttr(String(props.url || ""));
      const alt = escapeAttr(String(props.name || props.caption || ""));
      const caption = String(props.caption || "");
      if (caption) {
        return `<figure><img src="${src}" alt="${alt}"><figcaption>${escapeHtml(caption)}</figcaption></figure>`;
      }
      return `<img src="${src}" alt="${alt}">`;
    }

    case "codeBlock": {
      const lang = props.language ? ` class="language-${escapeAttr(String(props.language))}"` : "";
      return `<pre><code${lang}>${content || escapeHtml(String(props.code || ""))}</code></pre>`;
    }

    case "table": {
      if (!block.children?.length) return "";
      const rows = block.children.map((row, i) => {
        const cells = (row.children || []).map((cell) => {
          const cellContent = renderInlineContent(cell.content);
          const tag = i === 0 ? "th" : "td";
          return `<${tag}>${cellContent}</${tag}>`;
        });
        return `<tr>${cells.join("")}</tr>`;
      });
      const thead = rows.length > 0 ? `<thead>${rows[0]}</thead>` : "";
      const tbody = rows.length > 1 ? `<tbody>${rows.slice(1).join("")}</tbody>` : "";
      return `<table>${thead}${tbody}</table>`;
    }

    default:
      // Custom blocks (callout, step, conclusion, toc)
      if (isCustomBlockType(block.type)) {
        return renderCustomBlockHtml(
          block,
          { escapeHtml, renderInline: (c) => renderInlineContent(c as InlineContent[] | undefined) },
          allBlocks
        );
      }
      return content ? `<p>${content}</p>` : "";
  }
}

function renderChildren(children: BlockNode[] | undefined, allBlocks: BlockNode[]): string {
  if (!children?.length) return "";
  return children.map((b) => renderBlock(b, allBlocks)).join("");
}

// Extract plain text from inline content for slug generation
function stripInlineToText(items: InlineContent[] | undefined): string {
  if (!items?.length) return "";
  return items.map((item) => item.text || "").join("");
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// Groups consecutive list items into <ul>/<ol> wrappers
function wrapListItems(blocks: BlockNode[]): string {
  const result: string[] = [];
  let currentListType: string | null = null;
  let listItems: string[] = [];

  function flushList() {
    if (listItems.length > 0 && currentListType) {
      const tag = currentListType === "numberedListItem" ? "ol" : "ul";
      result.push(`<${tag}>${listItems.join("")}</${tag}>`);
      listItems = [];
    }
    currentListType = null;
  }

  for (const block of blocks) {
    const isListItem = ["bulletListItem", "numberedListItem", "checkListItem"].includes(block.type);
    if (isListItem) {
      const listType = block.type === "numberedListItem" ? "numberedListItem" : "bulletListItem";
      if (currentListType && currentListType !== listType) {
        flushList();
      }
      currentListType = listType;
      listItems.push(renderBlock(block, blocks));
    } else {
      flushList();
      result.push(renderBlock(block, blocks));
    }
  }
  flushList();
  return result.join("\n");
}

// --- Public API ---

// Converts BlockNote JSON blocks to semantic HTML
export function blocksToHtml(blocks: BlockNode[]): string {
  return wrapListItems(blocks);
}

// Converts blocks to sanitized HTML (safe for publishing)
export async function blocksToSanitizedHtml(blocks: BlockNode[]): Promise<string> {
  const rawHtml = blocksToHtml(blocks);
  const result = await unified()
    .use(rehypeParse, { fragment: true })
    .use(rehypeSanitize, sanitizeSchema)
    .use(rehypeStringify)
    .process(rawHtml);
  return String(result);
}

// Validates content matches declared format
export function validateContentFormat(content: string, format: string): boolean {
  if (format === "blocks") {
    try {
      const parsed = JSON.parse(content);
      return Array.isArray(parsed);
    } catch {
      return false;
    }
  }
  if (format === "html") {
    // HTML format stores JSON with { html, css, js } fields
    try {
      const parsed = JSON.parse(content);
      return typeof parsed === "object" && !Array.isArray(parsed) && typeof parsed.html === "string";
    } catch {
      // Also accept raw HTML strings
      return typeof content === "string" && content.trim().length > 0;
    }
  }
  if (format === "markdown") {
    // Markdown is plain string — ensure it's not a JSON array
    try {
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed)) return false;
    } catch {
      // Not JSON — valid markdown
    }
    return typeof content === "string";
  }
  return false;
}
