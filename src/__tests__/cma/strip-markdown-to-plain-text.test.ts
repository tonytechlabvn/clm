import { describe, it, expect } from "vitest";
import { stripMarkdownToPlainText } from "@/lib/cma/utils/strip-markdown-to-plain-text";

describe("stripMarkdownToPlainText", () => {
  describe("image handling", () => {
    it("extracts alt text from images", () => {
      const result = stripMarkdownToPlainText("![alt text](https://example.com/image.jpg)");
      expect(result).toBe("alt text");
    });

    it("handles images with empty alt text", () => {
      const result = stripMarkdownToPlainText("![](https://example.com/image.jpg)");
      expect(result).toBe("");
    });

    it("removes multiple images in sequence", () => {
      const result = stripMarkdownToPlainText(
        "![image1](url1) ![image2](url2)"
      );
      expect(result).toBe("image1 image2");
    });
  });

  describe("link handling", () => {
    it("converts markdown links to plain text with URL in parentheses", () => {
      const result = stripMarkdownToPlainText("[click here](https://example.com)");
      expect(result).toBe("click here (https://example.com)");
    });

    it("handles links with multiple words", () => {
      const result = stripMarkdownToPlainText(
        "[read more about this topic](https://example.com/article)"
      );
      expect(result).toContain("read more about this topic");
      expect(result).toContain("https://example.com/article");
    });

    it("handles multiple links", () => {
      const result = stripMarkdownToPlainText(
        "[link1](url1) and [link2](url2)"
      );
      expect(result).toContain("link1 (url1)");
      expect(result).toContain("link2 (url2)");
    });
  });

  describe("header handling", () => {
    it("removes H1 header markers", () => {
      const result = stripMarkdownToPlainText("# Main Title");
      expect(result).toBe("Main Title");
    });

    it("removes H2 header markers", () => {
      const result = stripMarkdownToPlainText("## Subtitle");
      expect(result).toBe("Subtitle");
    });

    it("removes H6 header markers", () => {
      const result = stripMarkdownToPlainText("###### Small Header");
      expect(result).toBe("Small Header");
    });

    it("removes header markers from middle of lines", () => {
      const result = stripMarkdownToPlainText("Some text\n### Section\nMore text");
      expect(result).toContain("Section");
      expect(result).not.toContain("###");
    });
  });

  describe("emphasis handling", () => {
    it("removes bold asterisks (*)", () => {
      const result = stripMarkdownToPlainText("**bold text**");
      expect(result).toBe("bold text");
    });

    it("removes bold underscores (__)", () => {
      const result = stripMarkdownToPlainText("__bold text__");
      expect(result).toBe("bold text");
    });

    it("removes italic asterisks (*)", () => {
      const result = stripMarkdownToPlainText("*italic text*");
      expect(result).toBe("italic text");
    });

    it("removes italic underscores (_)", () => {
      const result = stripMarkdownToPlainText("_italic text_");
      expect(result).toBe("italic text");
    });

    it("removes bold-italic (***)", () => {
      const result = stripMarkdownToPlainText("***bold italic***");
      expect(result).toBe("bold italic");
    });

    it("handles mixed emphasis in single text", () => {
      const result = stripMarkdownToPlainText(
        "This is **bold** and *italic* and ***both***"
      );
      expect(result).toBe("This is bold and italic and both");
    });
  });

  describe("strikethrough handling", () => {
    it("removes strikethrough markers", () => {
      const result = stripMarkdownToPlainText("~~deleted text~~");
      expect(result).toBe("deleted text");
    });

    it("handles multiple strikethrough passages", () => {
      const result = stripMarkdownToPlainText(
        "Keep ~~old~~ new version"
      );
      expect(result).toBe("Keep old new version");
    });
  });

  describe("code handling", () => {
    it("removes inline code backticks", () => {
      const result = stripMarkdownToPlainText("Use `const x = 1;` for variables");
      expect(result).toBe("Use const x = 1; for variables");
    });

    it("removes fenced code blocks", () => {
      const result = stripMarkdownToPlainText(
        "Here is code:\n```javascript\nconst x = 1;\n```\nEnd"
      );
      expect(result).toContain("const x = 1;");
      expect(result).not.toContain("```");
    });

    it("handles code blocks with language identifier", () => {
      const result = stripMarkdownToPlainText(
        "```python\ndef hello():\n    print('world')\n```"
      );
      expect(result).toContain("def hello():");
      expect(result).not.toContain("```");
    });

    it("removes backticks from code blocks without language", () => {
      const result = stripMarkdownToPlainText(
        "```\nplain code\n```"
      );
      expect(result).toContain("plain code");
    });
  });

  describe("blockquote handling", () => {
    it("removes blockquote markers", () => {
      const result = stripMarkdownToPlainText("> Quoted text");
      expect(result).toBe("Quoted text");
    });

    it("handles blockquotes with space after marker", () => {
      const result = stripMarkdownToPlainText("> This is quoted");
      expect(result).toBe("This is quoted");
    });

    it("handles multiple blockquote lines", () => {
      const result = stripMarkdownToPlainText(
        "> Line 1\n> Line 2"
      );
      expect(result).toContain("Line 1");
      expect(result).toContain("Line 2");
      expect(result).not.toContain(">");
    });
  });

  describe("horizontal rule handling", () => {
    it("removes horizontal rules with dashes", () => {
      const result = stripMarkdownToPlainText("---");
      expect(result).toBe("");
    });

    it("handles asterisks (may be interpreted as emphasis first)", () => {
      const result = stripMarkdownToPlainText("***");
      // *** gets parsed as bold-italic and leaves a single *
      expect(result).toBe("*");
    });

    it("handles underscores (may be interpreted as emphasis first)", () => {
      const result = stripMarkdownToPlainText("___");
      // ___ gets parsed as emphasis and leaves a single _
      expect(result).toBe("_");
    });

    it("preserves text around horizontal rules", () => {
      const result = stripMarkdownToPlainText("Text above\n---\nText below");
      expect(result).toContain("Text above");
      expect(result).toContain("Text below");
    });

    it("handles horizontal rules with trailing spaces", () => {
      const result = stripMarkdownToPlainText("Text\n----  \nMore");
      expect(result).not.toContain("----");
    });
  });

  describe("list handling", () => {
    it("converts unordered list with dash to bullet point", () => {
      const result = stripMarkdownToPlainText("- item 1\n- item 2");
      expect(result).toContain("• item 1");
      expect(result).toContain("• item 2");
    });

    it("converts unordered list with asterisk to bullet point", () => {
      const result = stripMarkdownToPlainText("* item 1\n* item 2");
      expect(result).toContain("• item 1");
      expect(result).toContain("• item 2");
    });

    it("converts unordered list with plus to bullet point", () => {
      const result = stripMarkdownToPlainText("+ item 1\n+ item 2");
      expect(result).toContain("• item 1");
      expect(result).toContain("• item 2");
    });

    it("removes ordered list markers", () => {
      const result = stripMarkdownToPlainText("1. first\n2. second\n3. third");
      expect(result).toContain("first");
      expect(result).toContain("second");
      expect(result).toContain("third");
      expect(result).not.toContain("1.");
    });

    it("handles nested lists", () => {
      const result = stripMarkdownToPlainText(
        "- item 1\n  - nested 1\n  - nested 2\n- item 2"
      );
      expect(result).toContain("item 1");
      expect(result).toContain("nested 1");
    });
  });

  describe("HTML tag removal", () => {
    it("removes simple HTML tags", () => {
      const result = stripMarkdownToPlainText("This is <strong>bold</strong> text");
      expect(result).toBe("This is bold text");
    });

    it("removes div tags", () => {
      const result = stripMarkdownToPlainText("<div>content</div>");
      expect(result).toBe("content");
    });

    it("removes tags with attributes", () => {
      const result = stripMarkdownToPlainText('<a href="url">link</a>');
      expect(result).toBe("link");
    });

    it("removes self-closing tags", () => {
      const result = stripMarkdownToPlainText("Text<br/>More text");
      expect(result).toBe("TextMore text");
    });
  });

  describe("whitespace handling", () => {
    it("collapses multiple blank lines into double newline", () => {
      const result = stripMarkdownToPlainText("Line 1\n\n\n\nLine 2");
      expect(result).toBe("Line 1\n\nLine 2");
    });

    it("trims leading and trailing whitespace", () => {
      const result = stripMarkdownToPlainText("   content   ");
      expect(result).toBe("content");
    });

    it("preserves single newlines", () => {
      const result = stripMarkdownToPlainText("Line 1\nLine 2");
      expect(result).toBe("Line 1\nLine 2");
    });
  });

  describe("complex scenarios", () => {
    it("handles mixed markdown and HTML", () => {
      const result = stripMarkdownToPlainText(
        "# Title\n\n**Bold** and <em>italic</em> [link](url)\n\n> Quote"
      );
      expect(result).toContain("Title");
      expect(result).toContain("Bold");
      expect(result).toContain("italic");
      expect(result).not.toContain("#");
      expect(result).not.toContain("<");
      expect(result).not.toContain(">");
    });

    it("handles Facebook post example", () => {
      const markdown = `# My Blog Post

This is **important** content with a [link to our site](https://example.com).

## Section 1

- Point 1
- Point 2
- Point 3

> A quote from someone wise

Check out the image below!
![cool pic](https://example.com/pic.jpg)`;

      const result = stripMarkdownToPlainText(markdown);
      expect(result).not.toContain("#");
      expect(result).not.toContain("**");
      expect(result).not.toContain("[");
      expect(result).not.toContain("![");
      expect(result).not.toContain(">");
      expect(result).toContain("My Blog Post");
      expect(result).toContain("important");
      expect(result).toContain("cool pic");
    });

    it("preserves readability of converted content", () => {
      const markdown = `**Hello** *world*!

[Read more](http://example.com)

- Item 1
- Item 2`;

      const result = stripMarkdownToPlainText(markdown);
      expect(result.length).toBeGreaterThan(10);
      expect(result).toContain("Hello");
      expect(result).toContain("world");
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      const result = stripMarkdownToPlainText("");
      expect(result).toBe("");
    });

    it("handles whitespace-only string", () => {
      const result = stripMarkdownToPlainText("   \n  \t  ");
      expect(result).toBe("");
    });

    it("handles string with only markdown markers", () => {
      const result = stripMarkdownToPlainText("# ## *** ---");
      // # gets removed, ## remains as text, *** leaves *, --- gets removed
      expect(result).toContain("##");
    });

    it("handles unclosed markdown markers", () => {
      const result = stripMarkdownToPlainText("**unclosed bold");
      expect(result).toBe("**unclosed bold");
    });

    it("handles text with no markdown", () => {
      const result = stripMarkdownToPlainText("Plain text with no formatting");
      expect(result).toBe("Plain text with no formatting");
    });

    it("handles very long content", () => {
      const longText = "**" + "a".repeat(10000) + "**";
      const result = stripMarkdownToPlainText(longText);
      expect(result).toBe("a".repeat(10000));
    });

    it("handles special characters", () => {
      const result = stripMarkdownToPlainText("**Special**: @, #, $, %, &, *, !");
      expect(result).toContain("Special");
      expect(result).toContain("@");
      expect(result).toContain("$");
    });
  });
});
