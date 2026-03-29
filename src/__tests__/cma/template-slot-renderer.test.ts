import { describe, it, expect } from "vitest";
import {
  injectSlotValues,
  renderSlotTemplate,
} from "@/lib/cma/utils/template-slot-renderer";

describe("template-slot-renderer", () => {
  describe("injectSlotValues", () => {
    it("replaces placeholders with slot values", () => {
      const html = "<h1>{{title}}</h1><p>{{body}}</p>";
      const result = injectSlotValues(html, { title: "Hello", body: "World" });
      expect(result).toBe("<h1>Hello</h1><p>World</p>");
    });

    it("leaves unreplaced placeholders when value missing", () => {
      const html = "<h1>{{title}}</h1><p>{{missing}}</p>";
      const result = injectSlotValues(html, { title: "Hello" });
      expect(result).toContain("{{missing}}");
      expect(result).toContain("Hello");
    });

    it("HTML-escapes text slot values to prevent XSS", () => {
      const html = "<p>{{content}}</p>";
      const result = injectSlotValues(html, {
        content: '<script>alert("xss")</script>',
      });
      expect(result).not.toContain("<script>");
      expect(result).toContain("&lt;script&gt;");
    });

    it("escapes ampersands and quotes in text values", () => {
      const html = "<p>{{content}}</p>";
      const result = injectSlotValues(html, { content: 'A & B "quoted"' });
      expect(result).toContain("&amp;");
      expect(result).toContain("&quot;");
    });

    it("sanitizes image src URLs (blocks javascript:)", () => {
      const html = '<img src="{{hero_image}}">';
      const result = injectSlotValues(html, {
        hero_image: "javascript:alert(1)",
      });
      expect(result).not.toContain("javascript:");
    });

    it("allows valid image URLs", () => {
      const html = '<img src="{{hero_image}}">';
      const result = injectSlotValues(html, {
        hero_image: "https://example.com/image.jpg",
      });
      expect(result).toContain("https://example.com/image.jpg");
    });
  });

  describe("renderSlotTemplate", () => {
    it("wraps rendered HTML with scoped CSS and container div", () => {
      const result = renderSlotTemplate(
        "<h1>{{title}}</h1>",
        ".tpl-abcd1234 h1 { color: red; }",
        { title: "Test" },
        "abcd1234-rest-of-id"
      );
      expect(result).toContain("<style>");
      expect(result).toContain('class="tpl-abcd1234"');
      expect(result).toContain("<h1>Test</h1>");
    });

    it("uses first 8 chars of templateId for scope class", () => {
      const result = renderSlotTemplate("<p>hi</p>", "", {}, "12345678xyz");
      expect(result).toContain('class="tpl-12345678"');
    });
  });
});
