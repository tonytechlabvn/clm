// Custom block -> HTML rendering (shared between plain and styled pipelines)
// Both blocksToHtml and blocksToStyledHtml call these functions

interface BlockNode {
  type: string;
  props?: Record<string, unknown>;
  content?: unknown[];
  children?: BlockNode[];
}

interface RenderContext {
  escapeHtml: (s: string) => string;
  renderInline: (content: unknown[] | undefined) => string;
}

const CALLOUT_VARIANT_CLASS: Record<string, string> = {
  info: "tn-highlight-box",
  warning: "tn-warning-box",
  success: "tn-success-box",
};

const CALLOUT_VARIANT_ICON: Record<string, string> = {
  info: "&#x1F4A1;",
  warning: "&#x26A0;&#xFE0F;",
  success: "&#x2705;",
};

export function renderCalloutHtml(block: BlockNode, ctx: RenderContext): string {
  const variant = String(block.props?.variant || "info");
  const title = ctx.escapeHtml(String(block.props?.title || ""));
  const className = CALLOUT_VARIANT_CLASS[variant] || CALLOUT_VARIANT_CLASS.info;
  const icon = CALLOUT_VARIANT_ICON[variant] || CALLOUT_VARIANT_ICON.info;
  const content = ctx.renderInline(block.content);
  const titleText = title || "Note";
  return `<div class="${className}"><strong>${icon} ${titleText}</strong><p>${content}</p></div>`;
}

export function renderStepHtml(block: BlockNode, ctx: RenderContext): string {
  const num = Number(block.props?.stepNumber) || 1;
  const content = ctx.renderInline(block.content);
  return `<div class="tn-step-container"><span class="tn-step-number">${num}</span><div class="tn-step-content">${content}</div></div>`;
}

export function renderConclusionHtml(block: BlockNode, ctx: RenderContext): string {
  const content = ctx.renderInline(block.content);
  return `<section class="tn-conclusion"><h2>Conclusion</h2><p>${content}</p></section>`;
}

export function renderTocHtml(allBlocks: BlockNode[], ctx: RenderContext): string {
  const headings = allBlocks
    .filter((b) => b.type === "heading" && b.content?.length)
    .map((b) => ({
      level: Number(b.props?.level) || 2,
      text: ctx.renderInline(b.content),
      id: slugify(plainText(b.content)),
    }));

  if (headings.length === 0) return "";

  const items = headings
    .map((h) => `<li style="margin-left:${(h.level - 2) * 1.2}em"><a href="#${h.id}">${h.text}</a></li>`)
    .join("\n");

  return `<nav class="tn-cf-toc"><strong>Table of Contents</strong><ul>${items}</ul></nav>`;
}

export function isCustomBlockType(type: string): boolean {
  return ["callout", "step", "conclusion", "toc"].includes(type);
}

// Dispatch to the correct custom block renderer
export function renderCustomBlockHtml(
  block: BlockNode,
  ctx: RenderContext,
  allBlocks: BlockNode[]
): string {
  switch (block.type) {
    case "callout": return renderCalloutHtml(block, ctx);
    case "step": return renderStepHtml(block, ctx);
    case "conclusion": return renderConclusionHtml(block, ctx);
    case "toc": return renderTocHtml(allBlocks, ctx);
    default: return "";
  }
}

// Extract plain text from inline content array (for slugification)
function plainText(content: unknown[] | undefined): string {
  if (!content) return "";
  return content.map((item: any) => item.text || "").join("");
}

// Generate URL-safe slug from text
function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
