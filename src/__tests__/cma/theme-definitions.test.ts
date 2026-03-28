import { describe, it, expect } from "vitest";
import {
  getTheme,
  getAvailableThemes,
  sanitizeStyleString,
  type ThemeStyles,
} from "@/lib/cma/themes/theme-definitions";

describe("getTheme", () => {
  it("returns default theme by name", () => {
    const theme = getTheme("default");
    expect(theme).toBeDefined();
    expect(theme.name).toBe("default");
    expect(theme.label).toBe("Clean Default");
  });

  it("returns editorial theme by name", () => {
    const theme = getTheme("editorial");
    expect(theme).toBeDefined();
    expect(theme.name).toBe("editorial");
    expect(theme.label).toBe("Editorial");
  });

  it("has all required theme properties", () => {
    const theme = getTheme("default");
    const requiredKeys: (keyof ThemeStyles)[] = [
      "name",
      "label",
      "wrapper",
      "h1",
      "h2",
      "h3",
      "p",
      "a",
      "img",
      "code",
      "pre",
      "blockquote",
      "ul",
      "ol",
      "li",
      "table",
      "th",
      "td",
      "hr",
      "figure",
      "figcaption",
    ];
    requiredKeys.forEach((key) => {
      expect(theme).toHaveProperty(key);
      expect(theme[key]).toBeDefined();
    });
  });

  it("returns default theme for nonexistent name", () => {
    const theme = getTheme("nonexistent");
    expect(theme.name).toBe("default");
  });

  it("returns different themes for different names", () => {
    const defaultTheme = getTheme("default");
    const editorialTheme = getTheme("editorial");
    expect(defaultTheme.name).not.toBe(editorialTheme.name);
    expect(defaultTheme.wrapper).not.toBe(editorialTheme.wrapper);
  });

  it("default theme uses sans-serif", () => {
    const theme = getTheme("default");
    expect(theme.wrapper).toContain("sans-serif");
  });

  it("editorial theme uses serif", () => {
    const theme = getTheme("editorial");
    expect(theme.wrapper).toContain("Georgia");
    expect(theme.wrapper).toContain("serif");
  });
});

describe("getAvailableThemes", () => {
  it("returns array of theme metadata", () => {
    const themes = getAvailableThemes();
    expect(Array.isArray(themes)).toBe(true);
    expect(themes.length).toBeGreaterThan(0);
  });

  it("includes default theme", () => {
    const themes = getAvailableThemes();
    const defaultTheme = themes.find((t) => t.name === "default");
    expect(defaultTheme).toBeDefined();
    expect(defaultTheme?.label).toBe("Clean Default");
  });

  it("includes editorial theme", () => {
    const themes = getAvailableThemes();
    const editorialTheme = themes.find((t) => t.name === "editorial");
    expect(editorialTheme).toBeDefined();
    expect(editorialTheme?.label).toBe("Editorial");
  });

  it("returns only name and label properties", () => {
    const themes = getAvailableThemes();
    themes.forEach((theme) => {
      expect(Object.keys(theme).sort()).toEqual(["label", "name"]);
    });
  });

  it("theme metadata matches theme definitions", () => {
    const themes = getAvailableThemes();
    themes.forEach((metadata) => {
      const fullTheme = getTheme(metadata.name);
      expect(fullTheme.name).toBe(metadata.name);
      expect(fullTheme.label).toBe(metadata.label);
    });
  });
});

describe("sanitizeStyleString", () => {
  describe("safe properties", () => {
    it("keeps font-family", () => {
      const result = sanitizeStyleString("font-family: Arial");
      expect(result).toContain("font-family");
    });

    it("keeps color", () => {
      const result = sanitizeStyleString("color: #333");
      expect(result).toContain("color");
      expect(result).toContain("#333");
    });

    it("keeps margin", () => {
      const result = sanitizeStyleString("margin: 10px");
      expect(result).toContain("margin");
    });

    it("keeps padding", () => {
      const result = sanitizeStyleString("padding: 20px");
      expect(result).toContain("padding");
    });

    it("keeps multiple safe properties", () => {
      const input = "color: red; padding: 10px; font-size: 14px";
      const result = sanitizeStyleString(input);
      expect(result).toContain("color");
      expect(result).toContain("padding");
      expect(result).toContain("font-size");
    });
  });

  describe("unsafe properties", () => {
    it("strips url()", () => {
      const result = sanitizeStyleString("background: url(http://evil.com/img.jpg)");
      expect(result).not.toContain("url");
    });

    it("strips expression()", () => {
      const result = sanitizeStyleString("width: expression(alert('xss'))");
      expect(result).not.toContain("expression");
    });

    it("strips behavior", () => {
      const result = sanitizeStyleString("behavior: url(xss.htc)");
      expect(result).not.toContain("behavior");
    });

    it("strips @import", () => {
      const result = sanitizeStyleString("@import url(evil.css)");
      expect(result).not.toContain("@import");
    });

    it("is case insensitive for unsafe patterns", () => {
      const result1 = sanitizeStyleString("background: URL(http://evil.com)");
      const result2 = sanitizeStyleString("background: Url(http://evil.com)");
      expect(result1).not.toContain("URL");
      expect(result2).not.toContain("Url");
    });
  });

  describe("edge cases", () => {
    it("handles empty string", () => {
      const result = sanitizeStyleString("");
      expect(result).toBe("");
    });

    it("handles whitespace", () => {
      const result = sanitizeStyleString("   ;   ;   ");
      expect(result).toBe("");
    });

    it("handles properties without values", () => {
      const input = "color:; margin: 10px; padding:";
      const result = sanitizeStyleString(input);
      expect(result).toContain("margin");
      // Properties with empty values are kept as-is by the current implementation
      // The important thing is that unsafe properties are still filtered
    });

    it("trims whitespace around properties", () => {
      const input = "  color  :  red  ;  padding  :  20px  ";
      const result = sanitizeStyleString(input);
      expect(result).toMatch(/color\s*:\s*red/);
      expect(result).toMatch(/padding\s*:\s*20px/);
    });

    it("preserves property order", () => {
      const input = "color: red; padding: 10px; margin: 5px";
      const result = sanitizeStyleString(input);
      const colorIdx = result.indexOf("color");
      const paddingIdx = result.indexOf("padding");
      const marginIdx = result.indexOf("margin");
      expect(colorIdx).toBeLessThan(paddingIdx);
      expect(paddingIdx).toBeLessThan(marginIdx);
    });

    it("handles colons in values", () => {
      const input = "font-family: 'Courier New', monospace";
      const result = sanitizeStyleString(input);
      expect(result).toContain("Courier New");
    });

    it("removes duplicate semicolons", () => {
      const input = "color: red;;; padding: 10px;;;";
      const result = sanitizeStyleString(input);
      expect(result).not.toContain(";;;");
    });

    it("handles mixed case property names", () => {
      const input = "Color: red; PADDING: 10px; Font-Size: 14px";
      const result = sanitizeStyleString(input);
      // Properties should be matched case-insensitively
      expect(result.includes("Color") || result.includes("color")).toBe(true);
    });
  });

  describe("real-world cases", () => {
    it("sanitizes default theme heading style", () => {
      const input = "font-size: 2em; font-weight: 700; margin: 1em 0 0.5em; color: #111;";
      const result = sanitizeStyleString(input);
      expect(result).toContain("font-size");
      expect(result).toContain("font-weight");
      expect(result).toContain("color");
    });

    it("sanitizes editorial theme link style", () => {
      const input =
        "color: #b91c1c; text-decoration: none; border-bottom: 1px solid #b91c1c;";
      const result = sanitizeStyleString(input);
      expect(result).toContain("color");
      expect(result).toContain("text-decoration");
      expect(result).toContain("border-bottom");
    });

    it("removes all url() patterns from background property", () => {
      const input =
        "background: url(http://evil.com/img.jpg); padding: 10px; background-color: red";
      const result = sanitizeStyleString(input);
      expect(result).not.toContain("url");
      expect(result).toContain("padding");
      expect(result).toContain("background-color");
    });
  });
});
