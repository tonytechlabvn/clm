import { describe, it, expect } from "vitest";
import {
  scopeCss,
  sanitizeCss,
  extractSpecialCssRules,
} from "@/lib/cma/services/template-css-scoper";

describe("template-css-scoper", () => {
  describe("scopeCss", () => {
    it("prepends scope class to simple selectors", () => {
      const result = scopeCss("h1 { color: red; }", "tpl-abc");
      expect(result).toBe(".tpl-abc h1 { color: red; }");
    });

    it("handles multiple selectors separated by comma", () => {
      const result = scopeCss("h1, h2 { font-size: 16px; }", "tpl-abc");
      expect(result).toContain(".tpl-abc h1");
      expect(result).toContain(".tpl-abc h2");
    });

    it("replaces body/html selectors with scope class", () => {
      const result = scopeCss("body { margin: 0; }", "tpl-abc");
      expect(result).toBe(".tpl-abc { margin: 0; }");
    });

    it("replaces html selector with scope class", () => {
      const result = scopeCss("html { font-size: 16px; }", "tpl-abc");
      expect(result).toBe(".tpl-abc { font-size: 16px; }");
    });

    it("returns empty string for empty/whitespace input", () => {
      expect(scopeCss("", "tpl-abc")).toBe("");
      expect(scopeCss("   ", "tpl-abc")).toBe("");
    });

    it("scopes compound selectors", () => {
      const result = scopeCss(".card .title { color: blue; }", "tpl-x");
      expect(result).toBe(".tpl-x .card .title { color: blue; }");
    });
  });

  describe("sanitizeCss", () => {
    it("strips </style> tags", () => {
      const result = sanitizeCss("h1 { color: red; }</style><script>alert(1)</script>");
      expect(result).not.toContain("</style>");
    });

    it("strips <script tags", () => {
      const result = sanitizeCss("<script>alert(1)");
      expect(result).not.toContain("<script");
    });

    it("strips expression() calls", () => {
      const result = sanitizeCss("div { width: expression(document.body.clientWidth); }");
      expect(result).not.toMatch(/expression\s*\(/i);
    });

    it("neutralizes javascript: URLs", () => {
      const result = sanitizeCss("div { background: url('javascript:alert(1)'); }");
      expect(result).not.toContain("javascript:");
    });

    it("blocks @import directives", () => {
      const result = sanitizeCss('@import url("evil.css");');
      expect(result).toContain("@import blocked");
    });

    it("passes through clean CSS unchanged", () => {
      const clean = "h1 { color: red; }";
      expect(sanitizeCss(clean)).toBe(clean);
    });
  });

  describe("extractSpecialCssRules", () => {
    it("extracts @font-face rules", () => {
      const css = `
        h1 { color: red; }
        @font-face { font-family: "Custom"; src: url("font.woff2"); }
        p { margin: 0; }
      `;
      const result = extractSpecialCssRules(css);
      expect(result).toContain("@font-face");
      expect(result).toContain("font.woff2");
    });

    it("extracts @keyframes rules", () => {
      const css = `
        div { animation: spin 1s; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `;
      const result = extractSpecialCssRules(css);
      expect(result).toContain("@keyframes spin");
    });

    it("returns empty string when no special rules", () => {
      expect(extractSpecialCssRules("h1 { color: red; }")).toBe("");
    });
  });
});
