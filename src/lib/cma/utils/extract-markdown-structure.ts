// Extract structure from markdown content — convert to BlockNote blocks with placeholders
// Simple line-by-line parser (not full AST) — covers ~80% of common markdown structures

interface BlockNode {
  type: string;
  props?: Record<string, unknown>;
  content?: { type: string; text: string; styles?: Record<string, boolean> }[];
  children: BlockNode[];
}

function textContent(text: string, styles?: Record<string, boolean>): BlockNode["content"] {
  return [{ type: "text", text, ...(styles ? { styles } : {}) }];
}

/**
 * Parse markdown into BlockNote-compatible blocks with placeholder content.
 * Preserves structure (headings, lists, code blocks, images) but replaces text.
 */
export function extractMarkdownStructure(markdown: string): unknown[] {
  const lines = markdown.split("\n");
  const blocks: BlockNode[] = [];
  let inCodeBlock = false;
  let codeLanguage = "";
  let lastWasParagraph = false;
  let numberedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code block fence toggle
    if (line.trimStart().startsWith("```")) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeLanguage = line.trimStart().slice(3).trim();
      } else {
        // End of code block — emit one placeholder block
        blocks.push({
          type: "codeBlock",
          props: { language: codeLanguage || "plaintext" },
          content: textContent("// Your code here"),
          children: [],
        });
        inCodeBlock = false;
        codeLanguage = "";
        lastWasParagraph = false;
      }
      continue;
    }
    if (inCodeBlock) continue; // skip code content lines

    const trimmed = line.trim();
    if (!trimmed) { lastWasParagraph = false; continue; } // blank line

    // Headings: # ## ###
    const headingMatch = trimmed.match(/^(#{1,6})\s+/);
    if (headingMatch) {
      blocks.push({
        type: "heading",
        props: { level: headingMatch[1].length },
        content: textContent("Your Heading Here"),
        children: [],
      });
      lastWasParagraph = false;
      numberedCount = 0;
      continue;
    }

    // Image: ![alt](url)
    if (trimmed.match(/^!\[.*\]\(.*\)/)) {
      blocks.push({
        type: "image",
        props: { url: "", caption: "Image description" },
        children: [],
      });
      lastWasParagraph = false;
      continue;
    }

    // Bullet list: - item or * item
    if (trimmed.match(/^[-*]\s+/)) {
      blocks.push({
        type: "bulletListItem",
        content: textContent("List item"),
        children: [],
      });
      lastWasParagraph = false;
      numberedCount = 0;
      continue;
    }

    // Numbered list: 1. item
    if (trimmed.match(/^\d+\.\s+/)) {
      numberedCount++;
      blocks.push({
        type: "numberedListItem",
        content: textContent(`Step ${numberedCount}`),
        children: [],
      });
      lastWasParagraph = false;
      continue;
    }

    // Blockquote: > text
    if (trimmed.startsWith("> ")) {
      blocks.push({
        type: "paragraph",
        content: textContent("Your quote here...", { italic: true }),
        children: [],
      });
      lastWasParagraph = false;
      continue;
    }

    // Regular paragraph — collapse consecutive into one placeholder
    if (!lastWasParagraph) {
      blocks.push({
        type: "paragraph",
        content: textContent("Write your content here..."),
        children: [],
      });
      lastWasParagraph = true;
      numberedCount = 0;
    }
  }

  return blocks;
}
