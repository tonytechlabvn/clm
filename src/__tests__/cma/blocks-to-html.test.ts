import { describe, it, expect } from "vitest";
import { blocksToHtml, validateContentFormat } from "@/lib/cma/blocks-to-html";

describe("blocksToHtml", () => {
  describe("headings", () => {
    it("renders h1 heading", () => {
      const blocks = [{ type: "heading", props: { level: 1 }, content: [{ type: "text", text: "Title" }] }];
      const html = blocksToHtml(blocks);
      expect(html).toMatch(/<h1[^>]*>Title<\/h1>/);
    });

    it("renders h2 heading", () => {
      const blocks = [{ type: "heading", props: { level: 2 }, content: [{ type: "text", text: "Section" }] }];
      const html = blocksToHtml(blocks);
      expect(html).toMatch(/<h2[^>]*>Section<\/h2>/);
    });

    it("renders h3 heading", () => {
      const blocks = [{ type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Subsection" }] }];
      const html = blocksToHtml(blocks);
      expect(html).toMatch(/<h3[^>]*>Subsection<\/h3>/);
    });

    it("clamps heading level to valid range", () => {
      const blocks = [{ type: "heading", props: { level: 10 }, content: [{ type: "text", text: "Text" }] }];
      const html = blocksToHtml(blocks);
      expect(html).toMatch(/<h6[^>]*>/);
    });
  });

  describe("paragraphs", () => {
    it("renders paragraph with text", () => {
      const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Hello world" }] }];
      const html = blocksToHtml(blocks);
      expect(html).toContain("<p>Hello world</p>");
    });

    it("renders empty paragraph with br", () => {
      const blocks = [{ type: "paragraph", content: [] }];
      const html = blocksToHtml(blocks);
      expect(html).toContain("<p><br></p>");
    });
  });

  describe("inline formatting", () => {
    it("renders bold text", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [{ type: "text", text: "bold", styles: { bold: true } }],
        },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain("<strong>bold</strong>");
    });

    it("renders italic text", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [{ type: "text", text: "italic", styles: { italic: true } }],
        },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain("<em>italic</em>");
    });

    it("renders code text", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [{ type: "text", text: "const x = 1", styles: { code: true } }],
        },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain("<code>const x = 1</code>");
    });

    it("renders strikethrough text", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [{ type: "text", text: "deleted", styles: { strikethrough: true } }],
        },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain("<s>deleted</s>");
    });

    it("renders underline text", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [{ type: "text", text: "underlined", styles: { underline: true } }],
        },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain("<u>underlined</u>");
    });

    it("renders combined formatting", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [{ type: "text", text: "bold italic", styles: { bold: true, italic: true } }],
        },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain("<em><strong>bold italic</strong></em>");
    });
  });

  describe("links", () => {
    it("renders link with href", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [
            {
              type: "link",
              href: "https://example.com",
              content: [{ type: "text", text: "Example" }],
            },
          ],
        },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain('<a href="https://example.com" rel="noopener noreferrer">Example</a>');
    });

    it("escapes quotes in href", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [
            {
              type: "link",
              href: 'https://example.com?q="test"',
              content: [{ type: "text", text: "Link" }],
            },
          ],
        },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain('href="https://example.com?q=&quot;test&quot;"');
    });
  });

  describe("lists", () => {
    it("wraps bullet list items in ul", () => {
      const blocks = [
        { type: "bulletListItem", content: [{ type: "text", text: "Item 1" }] },
        { type: "bulletListItem", content: [{ type: "text", text: "Item 2" }] },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain("<ul>");
      expect(html).toContain("<li>Item 1</li>");
      expect(html).toContain("<li>Item 2</li>");
      expect(html).toContain("</ul>");
    });

    it("wraps numbered list items in ol", () => {
      const blocks = [
        { type: "numberedListItem", content: [{ type: "text", text: "First" }] },
        { type: "numberedListItem", content: [{ type: "text", text: "Second" }] },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain("<ol>");
      expect(html).toContain("<li>First</li>");
      expect(html).toContain("<li>Second</li>");
      expect(html).toContain("</ol>");
    });

    it("handles mixed list types separately", () => {
      const blocks = [
        { type: "bulletListItem", content: [{ type: "text", text: "Bullet" }] },
        { type: "numberedListItem", content: [{ type: "text", text: "Numbered" }] },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain("<ul>");
      expect(html).toContain("<ol>");
    });

    it("renders checkbox list items", () => {
      const blocks = [
        { type: "checkListItem", props: { checked: true }, content: [{ type: "text", text: "Done" }] },
        { type: "checkListItem", props: { checked: false }, content: [{ type: "text", text: "Todo" }] },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain('<input type="checkbox" checked disabled>');
      expect(html).toContain('<input type="checkbox" disabled>');
    });
  });

  describe("images", () => {
    it("renders image without caption", () => {
      const blocks = [{ type: "image", props: { url: "https://example.com/img.jpg", name: "alt text" } }];
      const html = blocksToHtml(blocks);
      expect(html).toContain('<img src="https://example.com/img.jpg" alt="alt text">');
    });

    it("renders image with caption as figure", () => {
      const blocks = [
        { type: "image", props: { url: "https://example.com/img.jpg", caption: "My image" } },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain("<figure>");
      expect(html).toContain("<figcaption>My image</figcaption>");
      expect(html).toContain("</figure>");
    });

    it("escapes special chars in image attributes", () => {
      const blocks = [
        { type: "image", props: { url: 'https://example.com/img.jpg?q="test"', caption: '<script>' } },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain("&quot;");
      expect(html).toContain("&lt;script&gt;");
    });
  });

  describe("code blocks", () => {
    it("renders code block with language", () => {
      const blocks = [
        { type: "codeBlock", props: { language: "typescript", code: "const x = 1;" } },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain('<pre><code class="language-typescript">const x = 1;</code></pre>');
    });

    it("renders code block without language", () => {
      const blocks = [
        { type: "codeBlock", props: { code: "plain code" } },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain("<pre><code>plain code</code></pre>");
    });
  });

  describe("edge cases", () => {
    it("handles empty blocks array", () => {
      const html = blocksToHtml([]);
      expect(html).toBe("");
    });

    it("escapes HTML entities in text", () => {
      const blocks = [
        { type: "paragraph", content: [{ type: "text", text: '<script>alert("xss")</script>' }] },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain("&lt;script&gt;");
      expect(html).toContain("&quot;");
      expect(html).toContain("&lt;/script&gt;");
    });

    it("handles unknown block types as paragraph", () => {
      const blocks = [
        { type: "unknownType", content: [{ type: "text", text: "fallback text" }] },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain("<p>fallback text</p>");
    });

    it("handles missing content", () => {
      const blocks = [{ type: "paragraph" }];
      const html = blocksToHtml(blocks);
      expect(html).toContain("<p><br></p>");
    });
  });

  describe("complex structures", () => {
    it("renders nested list items", () => {
      const blocks = [
        {
          type: "bulletListItem",
          content: [{ type: "text", text: "Parent" }],
          children: [
            {
              type: "bulletListItem",
              content: [{ type: "text", text: "Child" }],
            },
          ],
        },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toContain("Parent");
      expect(html).toContain("Child");
    });

    it("renders multiple blocks in sequence", () => {
      const blocks = [
        { type: "heading", props: { level: 1 }, content: [{ type: "text", text: "Title" }] },
        { type: "paragraph", content: [{ type: "text", text: "Content" }] },
        { type: "bulletListItem", content: [{ type: "text", text: "Item" }] },
      ];
      const html = blocksToHtml(blocks);
      expect(html).toMatch(/<h1[^>]*>Title<\/h1>/);
      expect(html).toContain("<p>Content</p>");
      expect(html).toContain("<li>Item</li>");
    });
  });
});

describe("validateContentFormat", () => {
  describe("blocks format", () => {
    it("returns true for valid JSON array", () => {
      const result = validateContentFormat('[{"type":"heading"}]', "blocks");
      expect(result).toBe(true);
    });

    it("returns true for empty JSON array", () => {
      const result = validateContentFormat("[]", "blocks");
      expect(result).toBe(true);
    });

    it("returns false for markdown string", () => {
      const result = validateContentFormat("# Heading", "blocks");
      expect(result).toBe(false);
    });

    it("returns false for JSON object", () => {
      const result = validateContentFormat('{"type":"heading"}', "blocks");
      expect(result).toBe(false);
    });

    it("returns false for invalid JSON", () => {
      const result = validateContentFormat("{invalid json}", "blocks");
      expect(result).toBe(false);
    });
  });

  describe("markdown format", () => {
    it("returns true for markdown string", () => {
      const result = validateContentFormat("# Hello", "markdown");
      expect(result).toBe(true);
    });

    it("returns true for plain text", () => {
      const result = validateContentFormat("Just plain text", "markdown");
      expect(result).toBe(true);
    });

    it("returns false for JSON array", () => {
      const result = validateContentFormat('[{"type":"heading"}]', "markdown");
      expect(result).toBe(false);
    });

    it("returns true for plain JSON object text (when not parsed)", () => {
      // JSON objects starting with { are treated as text, not JSON arrays
      // so they're valid markdown strings
      const result = validateContentFormat('{"type":"heading"}', "markdown");
      expect(result).toBe(true);
    });
  });

  describe("invalid format", () => {
    it("returns false for unknown format", () => {
      const result = validateContentFormat("any content", "unknown");
      expect(result).toBe(false);
    });
  });
});
