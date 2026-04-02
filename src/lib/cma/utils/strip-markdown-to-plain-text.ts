// Strips markdown syntax to plain text for platforms that don't support rich formatting (e.g. Facebook)

export function stripMarkdownToPlainText(markdown: string): string {
  let text = markdown;

  // Remove images: ![alt](url) → alt
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1");
  // Convert links: [text](url) → text (url)
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)");
  // Remove headers: ### heading → heading
  text = text.replace(/^#{1,6}\s+/gm, "");
  // Remove bold/italic markers: **text** or __text__ → text
  text = text.replace(/(\*{1,3}|_{1,3})(.+?)\1/g, "$2");
  // Remove strikethrough: ~~text~~ → text
  text = text.replace(/~~(.+?)~~/g, "$1");
  // Remove inline code backticks: `code` → code
  text = text.replace(/`([^`]+)`/g, "$1");
  // Remove code blocks (fenced): ```lang\ncode\n``` → code
  text = text.replace(/```[^\n]*\n([\s\S]*?)```/g, "$1");
  // Remove blockquote markers: > text → text
  text = text.replace(/^>\s?/gm, "");
  // Remove horizontal rules: --- or *** or ___
  text = text.replace(/^[-*_]{3,}\s*$/gm, "");
  // Clean up list markers: - item or * item or 1. item → item
  text = text.replace(/^[\s]*[-*+]\s+/gm, "• ");
  text = text.replace(/^[\s]*\d+\.\s+/gm, "");
  // Remove HTML tags (simple)
  text = text.replace(/<[^>]+>/g, "");
  // Collapse multiple blank lines into double newline
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}
