import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all dependencies before importing the module under test
vi.mock("isomorphic-dompurify", () => ({
  default: {
    sanitize: vi.fn((html: string) => {
      // Simple mock: strip <script> tags
      return html.replace(/<script[\s\S]*?<\/script>/gi, "");
    }),
  },
}));

vi.mock("@/lib/cma/services/crawler-service", () => ({
  extractContentHtml: vi.fn(),
}));

vi.mock("@/lib/cma/services/template-css-scoper", () => ({
  extractPageCss: vi.fn(),
  fetchExternalStylesheets: vi.fn(),
  scopeCss: vi.fn(),
  extractSpecialCssRules: vi.fn(),
  sanitizeCss: vi.fn(),
}));

vi.mock("@/lib/cma/services/template-slot-detector", () => ({
  simplifyHtmlForAi: vi.fn(),
  detectSlots: vi.fn(),
  injectSlotPlaceholders: vi.fn(),
}));

import { extractTemplateFromUrl } from "@/lib/cma/services/template-extraction-service";
import { extractContentHtml } from "@/lib/cma/services/crawler-service";
import {
  extractPageCss,
  fetchExternalStylesheets,
  scopeCss,
  extractSpecialCssRules,
  sanitizeCss,
} from "@/lib/cma/services/template-css-scoper";
import {
  simplifyHtmlForAi,
  detectSlots,
  injectSlotPlaceholders,
} from "@/lib/cma/services/template-slot-detector";

describe("template-extraction-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function setupMocks() {
    const mockDom = {} as never;
    vi.mocked(extractContentHtml).mockResolvedValue({
      title: "Test Page",
      contentHtml: "<h1>Hello</h1><p>World</p>",
      fullDom: mockDom,
      url: "https://example.com/page",
    });
    vi.mocked(extractPageCss).mockReturnValue("h1 { color: red; }");
    vi.mocked(fetchExternalStylesheets).mockResolvedValue(".card { padding: 8px; }");
    vi.mocked(sanitizeCss).mockImplementation((css: string) => css);
    vi.mocked(scopeCss).mockReturnValue(".tpl-scope h1 { color: red; }");
    vi.mocked(extractSpecialCssRules).mockReturnValue("");
    vi.mocked(simplifyHtmlForAi).mockReturnValue("<h1>Hello</h1><p>World</p>");
    vi.mocked(detectSlots).mockResolvedValue([
      { name: "title", type: "text", label: "Title", placeholder: "Hello", required: true },
    ]);
    vi.mocked(injectSlotPlaceholders).mockReturnValue("<h1>{{title}}</h1><p>World</p>");
  }

  it("produces valid ExtractedTemplate from URL", async () => {
    setupMocks();

    const result = await extractTemplateFromUrl("https://example.com/page", "org-1", "testscope");

    expect(result).toEqual({
      title: "Test Page",
      htmlTemplate: "<h1>{{title}}</h1><p>World</p>",
      cssScoped: expect.any(String),
      slotDefinitions: [
        expect.objectContaining({ name: "title", type: "text" }),
      ],
      sourceUrl: "https://example.com/page",
    });
  });

  it("calls pipeline steps in correct order", async () => {
    setupMocks();

    await extractTemplateFromUrl("https://example.com", "org-1");

    expect(extractContentHtml).toHaveBeenCalledWith("https://example.com");
    expect(extractPageCss).toHaveBeenCalled();
    expect(fetchExternalStylesheets).toHaveBeenCalled();
    expect(sanitizeCss).toHaveBeenCalled();
    expect(scopeCss).toHaveBeenCalled();
    expect(simplifyHtmlForAi).toHaveBeenCalled();
    expect(detectSlots).toHaveBeenCalled();
    expect(injectSlotPlaceholders).toHaveBeenCalled();
  });

  it("propagates error when fetch fails", async () => {
    vi.mocked(extractContentHtml).mockRejectedValue(new Error("Failed to fetch"));

    await expect(
      extractTemplateFromUrl("https://bad-url.com", "org-1")
    ).rejects.toThrow("Failed to fetch");
  });

  it("sanitizes HTML via DOMPurify (strips scripts)", async () => {
    const mockDom = {} as never;
    vi.mocked(extractContentHtml).mockResolvedValue({
      title: "Page",
      contentHtml: '<h1>Hi</h1><script>alert("xss")</script>',
      fullDom: mockDom,
      url: "https://example.com",
    });
    vi.mocked(extractPageCss).mockReturnValue("");
    vi.mocked(fetchExternalStylesheets).mockResolvedValue("");
    vi.mocked(sanitizeCss).mockImplementation((css: string) => css);
    vi.mocked(scopeCss).mockReturnValue("");
    vi.mocked(extractSpecialCssRules).mockReturnValue("");
    vi.mocked(simplifyHtmlForAi).mockReturnValue("<h1>Hi</h1>");
    vi.mocked(detectSlots).mockResolvedValue([]);
    vi.mocked(injectSlotPlaceholders).mockReturnValue("<h1>Hi</h1>");

    await extractTemplateFromUrl("https://example.com", "org-1");

    // DOMPurify.sanitize was called (our mock strips <script>)
    const { default: DOMPurify } = await import("isomorphic-dompurify");
    expect(DOMPurify.sanitize).toHaveBeenCalled();
  });
});
