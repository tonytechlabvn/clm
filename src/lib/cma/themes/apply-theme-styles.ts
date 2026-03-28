// Applies theme inline styles to block-generated HTML for WordPress publishing
// Generates styled HTML directly by re-rendering blocks with inline CSS

import type { ThemeStyles } from "./theme-definitions";
import { getTheme, sanitizeStyleString } from "./theme-definitions";

interface InlineContent {
  type: string;
  text?: string;
  href?: string;
  content?: InlineContent[];
  styles?: Record<string, boolean | string>;
}

interface BlockNode {
  id?: string;
  type: string;
  props?: Record<string, unknown>;
  content?: InlineContent[];
  children?: BlockNode[];
}

function esc(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function escAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function s(style: string): string {
  const sanitized = sanitizeStyleString(style);
  return sanitized ? ` style="${escAttr(sanitized)}"` : "";
}

function renderInline(items: InlineContent[] | undefined, theme: ThemeStyles): string {
  if (!items?.length) return "";
  return items.map((item) => {
    if (item.type === "text") {
      let text = esc(item.text || "");
      if (item.styles?.bold) text = `<strong>${text}</strong>`;
      if (item.styles?.italic) text = `<em>${text}</em>`;
      if (item.styles?.code) text = `<code${s(theme.code)}>${text}</code>`;
      if (item.styles?.strikethrough) text = `<s>${text}</s>`;
      if (item.styles?.underline) text = `<u>${text}</u>`;
      return text;
    }
    if (item.type === "link") {
      const href = escAttr(item.href || "");
      return `<a href="${href}"${s(theme.a)} rel="noopener noreferrer">${renderInline(item.content, theme)}</a>`;
    }
    return esc(item.text || "");
  }).join("");
}

function renderStyledBlock(block: BlockNode, theme: ThemeStyles): string {
  const content = renderInline(block.content, theme);
  const props = block.props || {};

  switch (block.type) {
    case "heading": {
      const level = Math.min(Math.max(Number(props.level) || 1, 1), 6);
      const hKey = `h${level}` as keyof ThemeStyles;
      const hStyle = (theme[hKey] as string) || theme.h3;
      return `<h${level}${s(hStyle)}>${content}</h${level}>`;
    }
    case "paragraph":
      return `<p${s(theme.p)}>${content || "<br>"}</p>`;
    case "bulletListItem":
      return `<li${s(theme.li)}>${content}${renderStyledChildren(block.children, theme)}</li>`;
    case "numberedListItem":
      return `<li${s(theme.li)}>${content}${renderStyledChildren(block.children, theme)}</li>`;
    case "checkListItem": {
      const checked = props.checked ? " checked" : "";
      return `<li${s(theme.li)}><input type="checkbox"${checked} disabled> ${content}</li>`;
    }
    case "image": {
      const src = escAttr(String(props.url || ""));
      const alt = escAttr(String(props.name || props.caption || ""));
      const caption = String(props.caption || "");
      if (caption) {
        return `<figure${s(theme.figure)}><img src="${src}" alt="${alt}"${s(theme.img)}><figcaption${s(theme.figcaption)}>${esc(caption)}</figcaption></figure>`;
      }
      return `<img src="${src}" alt="${alt}"${s(theme.img)}>`;
    }
    case "codeBlock": {
      const lang = props.language ? ` class="language-${escAttr(String(props.language))}"` : "";
      return `<pre${s(theme.pre)}><code${lang}>${content || esc(String(props.code || ""))}</code></pre>`;
    }
    case "table": {
      if (!block.children?.length) return "";
      const rows = block.children.map((row, i) => {
        const cells = (row.children || []).map((cell) => {
          const cellContent = renderInline(cell.content, theme);
          if (i === 0) return `<th${s(theme.th)}>${cellContent}</th>`;
          return `<td${s(theme.td)}>${cellContent}</td>`;
        });
        return `<tr>${cells.join("")}</tr>`;
      });
      const thead = rows.length > 0 ? `<thead>${rows[0]}</thead>` : "";
      const tbody = rows.length > 1 ? `<tbody>${rows.slice(1).join("")}</tbody>` : "";
      return `<table${s(theme.table)}>${thead}${tbody}</table>`;
    }
    default:
      return content ? `<p${s(theme.p)}>${content}</p>` : "";
  }
}

function renderStyledChildren(children: BlockNode[] | undefined, theme: ThemeStyles): string {
  if (!children?.length) return "";
  return children.map((b) => renderStyledBlock(b, theme)).join("");
}

// Wraps consecutive list items with styled <ul>/<ol>
function wrapStyledListItems(blocks: BlockNode[], theme: ThemeStyles): string {
  const result: string[] = [];
  let listType: string | null = null;
  let items: string[] = [];

  function flush() {
    if (items.length && listType) {
      const tag = listType === "numberedListItem" ? "ol" : "ul";
      const style = listType === "numberedListItem" ? theme.ol : theme.ul;
      result.push(`<${tag}${s(style)}>${items.join("")}</${tag}>`);
      items = [];
    }
    listType = null;
  }

  for (const block of blocks) {
    const isList = ["bulletListItem", "numberedListItem", "checkListItem"].includes(block.type);
    if (isList) {
      const lt = block.type === "numberedListItem" ? "numberedListItem" : "bulletListItem";
      if (listType && listType !== lt) flush();
      listType = lt;
      items.push(renderStyledBlock(block, theme));
    } else {
      flush();
      result.push(renderStyledBlock(block, theme));
    }
  }
  flush();
  return result.join("\n");
}

// Converts BlockNote blocks to themed inline-styled HTML for WordPress
export function blocksToStyledHtml(blocks: BlockNode[], themeName: string): string {
  const theme = getTheme(themeName);
  const body = wrapStyledListItems(blocks, theme);
  return `<div${s(theme.wrapper)}>\n${body}\n</div>`;
}
