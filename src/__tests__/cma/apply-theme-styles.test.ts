import { describe, it, expect } from "vitest";
import { blocksToStyledHtml } from "@/lib/cma/themes/apply-theme-styles";

describe("blocksToStyledHtml", () => {
  describe("wrapper container", () => {
    it("wraps output in div with style", () => {
      const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Text" }] }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/^<div style="[^"]*">/);
      expect(html).toContain("</div>");
    });

    it("includes wrapper styles from theme", () => {
      const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Text" }] }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toContain("font-family");
      expect(html).toContain("max-width");
    });

    it("applies different wrapper for different themes", () => {
      const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Text" }] }];
      const defaultHtml = blocksToStyledHtml(blocks, "default");
      const editorialHtml = blocksToStyledHtml(blocks, "editorial");
      // Extract style attribute content
      const defaultStyle = defaultHtml.match(/style="([^"]*)"/)?.[1] || "";
      const editorialStyle = editorialHtml.match(/style="([^"]*)"/)?.[1] || "";
      expect(defaultStyle).not.toBe(editorialStyle);
    });
  });

  describe("heading styles", () => {
    it("applies h1 theme styles", () => {
      const blocks = [{ type: "heading", props: { level: 1 }, content: [{ type: "text", text: "Title" }] }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/<h1 style="[^"]*">Title<\/h1>/);
    });

    it("applies h2 theme styles", () => {
      const blocks = [{ type: "heading", props: { level: 2 }, content: [{ type: "text", text: "Section" }] }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/<h2 style="[^"]*">Section<\/h2>/);
    });

    it("applies h3 theme styles", () => {
      const blocks = [{ type: "heading", props: { level: 3 }, content: [{ type: "text", text: "Subsection" }] }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/<h3 style="[^"]*">Subsection<\/h3>/);
    });

    it("includes font-size in heading styles", () => {
      const blocks = [{ type: "heading", props: { level: 1 }, content: [{ type: "text", text: "Title" }] }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toContain("font-size");
    });
  });

  describe("paragraph styles", () => {
    it("applies paragraph theme styles", () => {
      const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Content" }] }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/<p style="[^"]*">Content<\/p>/);
    });

    it("includes line-height in paragraph styles", () => {
      const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Content" }] }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toContain("line-height");
    });

    it("different themes apply different paragraph styles", () => {
      const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Text" }] }];
      const defaultHtml = blocksToStyledHtml(blocks, "default");
      const editorialHtml = blocksToStyledHtml(blocks, "editorial");
      const defaultPStyle = defaultHtml.match(/<p style="([^"]*)"/)?.[1] || "";
      const editorialPStyle = editorialHtml.match(/<p style="([^"]*)"/)?.[1] || "";
      expect(defaultPStyle).not.toBe(editorialPStyle);
    });
  });

  describe("link styles", () => {
    it("applies link theme styles", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [
            {
              type: "link",
              href: "https://example.com",
              content: [{ type: "text", text: "Link" }],
            },
          ],
        },
      ];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/<a[^>]*style="[^"]*"[^>]*>Link<\/a>/);
    });

    it("includes color in link styles", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [
            {
              type: "link",
              href: "https://example.com",
              content: [{ type: "text", text: "Link" }],
            },
          ],
        },
      ];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toContain("color");
    });

    it("default theme has blue link color", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [
            {
              type: "link",
              href: "https://example.com",
              content: [{ type: "text", text: "Link" }],
            },
          ],
        },
      ];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toContain("#2563eb");
    });

    it("editorial theme has red link color", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [
            {
              type: "link",
              href: "https://example.com",
              content: [{ type: "text", text: "Link" }],
            },
          ],
        },
      ];
      const html = blocksToStyledHtml(blocks, "editorial");
      expect(html).toContain("#b91c1c");
    });
  });

  describe("image styles", () => {
    it("applies img theme styles", () => {
      const blocks = [{ type: "image", props: { url: "https://example.com/img.jpg", name: "alt" } }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/<img[^>]*style="[^"]*"[^>]*>/);
    });

    it("includes max-width in image styles", () => {
      const blocks = [{ type: "image", props: { url: "https://example.com/img.jpg", name: "alt" } }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toContain("max-width");
    });

    it("applies figure styles when caption present", () => {
      const blocks = [{ type: "image", props: { url: "https://example.com/img.jpg", caption: "Caption" } }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/<figure[^>]*style="[^"]*">/);
    });

    it("applies figcaption styles when caption present", () => {
      const blocks = [{ type: "image", props: { url: "https://example.com/img.jpg", caption: "Caption" } }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/<figcaption[^>]*style="[^"]*">/);
    });
  });

  describe("code styles", () => {
    it("applies code inline styles within paragraphs", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [{ type: "text", text: "const x = 1", styles: { code: true } }],
        },
      ];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/<code[^>]*style="[^"]*">/);
    });

    it("includes background in code styles", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [{ type: "text", text: "code", styles: { code: true } }],
        },
      ];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toContain("background");
    });

    it("applies pre and code block styles", () => {
      const blocks = [{ type: "codeBlock", props: { language: "js", code: "const x = 1;" } }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/<pre[^>]*style="[^"]*">/);
      expect(html).toMatch(/<code[^>]*>/);
    });
  });

  describe("list styles", () => {
    it("applies ul styles for bullet lists", () => {
      const blocks = [
        { type: "bulletListItem", content: [{ type: "text", text: "Item 1" }] },
        { type: "bulletListItem", content: [{ type: "text", text: "Item 2" }] },
      ];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/<ul[^>]*style="[^"]*">/);
    });

    it("applies ol styles for numbered lists", () => {
      const blocks = [
        { type: "numberedListItem", content: [{ type: "text", text: "First" }] },
        { type: "numberedListItem", content: [{ type: "text", text: "Second" }] },
      ];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/<ol[^>]*style="[^"]*">/);
    });

    it("applies li styles for list items", () => {
      const blocks = [{ type: "bulletListItem", content: [{ type: "text", text: "Item" }] }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/<li[^>]*style="[^"]*">/);
    });

    it("includes padding in list styles", () => {
      const blocks = [{ type: "bulletListItem", content: [{ type: "text", text: "Item" }] }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toContain("padding");
    });
  });

  describe("theme application", () => {
    it("uses default theme when no theme specified", () => {
      const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Text" }] }];
      const html = blocksToStyledHtml(blocks, "nonexistent");
      expect(html).toContain("sans-serif");
    });

    it("applies default theme sans-serif font", () => {
      const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Text" }] }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toContain("sans-serif");
    });

    it("applies editorial theme serif font", () => {
      const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Text" }] }];
      const html = blocksToStyledHtml(blocks, "editorial");
      expect(html.includes("Georgia") || html.includes("serif")).toBe(true);
    });

    it("applies consistent theme throughout document", () => {
      const blocks = [
        { type: "heading", props: { level: 1 }, content: [{ type: "text", text: "Title" }] },
        { type: "paragraph", content: [{ type: "text", text: "Content" }] },
        { type: "bulletListItem", content: [{ type: "text", text: "Item" }] },
      ];
      const html = blocksToStyledHtml(blocks, "editorial");
      const georgiaCount = (html.match(/Georgia/g) || []).length;
      expect(georgiaCount).toBeGreaterThan(0);
    });
  });

  describe("edge cases", () => {
    it("handles empty blocks array", () => {
      const html = blocksToStyledHtml([], "default");
      expect(html).toMatch(/^<div style="[^"]*">/);
      expect(html).toContain("</div>");
    });

    it("handles blocks with no content", () => {
      const blocks = [{ type: "paragraph" }];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toContain("<p");
      expect(html).toContain("</p>");
    });

    it("escapes quotes in style attributes", () => {
      const blocks = [{ type: "paragraph", content: [{ type: "text", text: "Text" }] }];
      const html = blocksToStyledHtml(blocks, "default");
      // Verify no unescaped quotes in style attributes
      const styleMatches = html.match(/style="[^"]*"/g) || [];
      styleMatches.forEach((match) => {
        expect(match).not.toContain('\\"');
      });
    });

    it("handles special characters in text", () => {
      const blocks = [
        { type: "paragraph", content: [{ type: "text", text: '<script>alert("xss")</script>' }] },
      ];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toContain("&lt;");
      expect(html).toContain("&gt;");
    });

    it("handles multiple paragraphs with styles", () => {
      const blocks = [
        { type: "paragraph", content: [{ type: "text", text: "Para 1" }] },
        { type: "paragraph", content: [{ type: "text", text: "Para 2" }] },
        { type: "paragraph", content: [{ type: "text", text: "Para 3" }] },
      ];
      const html = blocksToStyledHtml(blocks, "default");
      const pCount = (html.match(/<p/g) || []).length;
      expect(pCount).toBe(3);
    });
  });

  describe("inline formatting with styles", () => {
    it("preserves bold text with styles", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [{ type: "text", text: "bold", styles: { bold: true } }],
        },
      ];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toContain("<strong>bold</strong>");
    });

    it("preserves italic text with styles", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [{ type: "text", text: "italic", styles: { italic: true } }],
        },
      ];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toContain("<em>italic</em>");
    });

    it("combines link styles with inline formatting", () => {
      const blocks = [
        {
          type: "paragraph",
          content: [
            {
              type: "link",
              href: "https://example.com",
              content: [{ type: "text", text: "bold link", styles: { bold: true } }],
            },
          ],
        },
      ];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toContain("<strong>");
      expect(html).toContain("<a");
      expect(html).toContain("style");
    });
  });

  describe("table styles", () => {
    it("applies table theme styles", () => {
      const blocks = [
        {
          type: "table",
          children: [
            {
              type: "tableRow",
              children: [
                { type: "tableCell", content: [{ type: "text", text: "Header" }] },
              ],
            },
          ],
        },
      ];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/<table[^>]*style="[^"]*">/);
    });

    it("applies th and td styles", () => {
      const blocks = [
        {
          type: "table",
          children: [
            {
              type: "tableRow",
              children: [
                { type: "tableCell", content: [{ type: "text", text: "Header" }] },
              ],
            },
            {
              type: "tableRow",
              children: [
                { type: "tableCell", content: [{ type: "text", text: "Data" }] },
              ],
            },
          ],
        },
      ];
      const html = blocksToStyledHtml(blocks, "default");
      expect(html).toMatch(/<th[^>]*style="[^"]*">/);
      expect(html).toMatch(/<td[^>]*style="[^"]*">/);
    });
  });
});
