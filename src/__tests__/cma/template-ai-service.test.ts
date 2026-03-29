import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock dependencies
vi.mock("isomorphic-dompurify", () => ({
  default: {
    sanitize: vi.fn((html: string) => html),
  },
}));

vi.mock("@/lib/ai-service", () => ({
  callAI: vi.fn(),
}));

vi.mock("@/lib/ai-settings-service", () => ({
  getActiveAiConfig: vi.fn(),
}));

vi.mock("@/lib/cma/services/content-ai-service", () => ({
  checkAiBudget: vi.fn(),
  trackTokenUsage: vi.fn(),
}));

vi.mock("@/lib/cma/services/ai-json-parser", () => ({
  parseAiJson: vi.fn(),
}));

vi.mock("@/lib/cma/services/template-css-scoper", () => ({
  scopeCss: vi.fn((css: string) => css),
  sanitizeCss: vi.fn((css: string) => css),
}));

vi.mock("@/lib/prompts/cma-template-generation-prompt", () => ({
  CMA_TEMPLATE_GENERATION_PROMPT: "Generate template.",
}));

vi.mock("@/lib/prompts/cma-content-fill-prompt", () => ({
  CMA_CONTENT_FILL_PROMPT: "Fill content.",
}));

import {
  generateTemplateFromDescription,
  fillTemplateSlots,
} from "@/lib/cma/services/template-ai-service";
import { callAI } from "@/lib/ai-service";
import { getActiveAiConfig } from "@/lib/ai-settings-service";
import { checkAiBudget, trackTokenUsage } from "@/lib/cma/services/content-ai-service";
import { parseAiJson } from "@/lib/cma/services/ai-json-parser";

function mockAiSetup() {
  vi.mocked(checkAiBudget).mockResolvedValue(undefined);
  vi.mocked(getActiveAiConfig).mockResolvedValue({
    provider: "openai",
    apiKey: "key",
    model: "gpt-4",
  } as Awaited<ReturnType<typeof getActiveAiConfig>>);
  vi.mocked(trackTokenUsage).mockResolvedValue(undefined);
}

describe("template-ai-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateTemplateFromDescription", () => {
    it("returns ExtractedTemplate from AI response", async () => {
      mockAiSetup();
      vi.mocked(callAI).mockResolvedValue({
        text: '{"html":"<h1>{{title}}</h1>","css":"h1{color:red}","slots":[{"name":"title","type":"text","label":"Title","placeholder":"","required":true}]}',
        usage: { totalTokens: 200 },
      } as Awaited<ReturnType<typeof callAI>>);
      vi.mocked(parseAiJson).mockReturnValue({
        html: "<h1>{{title}}</h1>",
        css: "h1{color:red}",
        slots: [{ name: "title", type: "text", label: "Title", placeholder: "", required: true }],
      });

      const result = await generateTemplateFromDescription("A blog post template", "org-1");

      expect(result.title).toContain("AI Generated");
      expect(result.htmlTemplate).toBeDefined();
      expect(result.slotDefinitions).toHaveLength(1);
      expect(result.slotDefinitions[0].name).toBe("title");
      expect(result.sourceUrl).toBe("");
    });

    it("sanitizes slot names to lowercase alphanumeric", async () => {
      mockAiSetup();
      vi.mocked(callAI).mockResolvedValue({
        text: "{}",
        usage: { totalTokens: 100 },
      } as Awaited<ReturnType<typeof callAI>>);
      vi.mocked(parseAiJson).mockReturnValue({
        html: "<p>test</p>",
        css: "",
        slots: [{ name: "Hero Image!", type: "image", label: "Hero", placeholder: "", required: false }],
      });

      const result = await generateTemplateFromDescription("test", "org-1");

      expect(result.slotDefinitions[0].name).toMatch(/^[a-z0-9_]+$/);
    });

    it("caps slots at 15", async () => {
      mockAiSetup();
      const manySlots = Array.from({ length: 20 }, (_, i) => ({
        name: `slot_${i}`, type: "text", label: `Slot ${i}`, placeholder: "", required: false,
      }));
      vi.mocked(callAI).mockResolvedValue({
        text: "{}",
        usage: { totalTokens: 100 },
      } as Awaited<ReturnType<typeof callAI>>);
      vi.mocked(parseAiJson).mockReturnValue({ html: "<p>x</p>", css: "", slots: manySlots });

      const result = await generateTemplateFromDescription("test", "org-1");

      expect(result.slotDefinitions.length).toBeLessThanOrEqual(15);
    });

    it("checks budget before calling AI", async () => {
      mockAiSetup();
      vi.mocked(checkAiBudget).mockRejectedValue(new Error("Budget exceeded"));

      await expect(
        generateTemplateFromDescription("test", "org-1")
      ).rejects.toThrow("Budget exceeded");
      expect(callAI).not.toHaveBeenCalled();
    });

    it("sanitizes AI-generated HTML via DOMPurify", async () => {
      mockAiSetup();
      vi.mocked(callAI).mockResolvedValue({
        text: "{}",
        usage: { totalTokens: 100 },
      } as Awaited<ReturnType<typeof callAI>>);
      vi.mocked(parseAiJson).mockReturnValue({
        html: '<h1>Title</h1><script>alert("xss")</script>',
        css: "",
        slots: [],
      });

      await generateTemplateFromDescription("test", "org-1");

      const { default: DOMPurify } = await import("isomorphic-dompurify");
      expect(DOMPurify.sanitize).toHaveBeenCalledWith(
        expect.stringContaining("<script>"),
        expect.objectContaining({ ALLOWED_TAGS: expect.any(Array) })
      );
    });
  });

  describe("fillTemplateSlots", () => {
    it("returns slot values matching definitions", async () => {
      mockAiSetup();
      vi.mocked(callAI).mockResolvedValue({
        text: '{"title":"Hello World","body":"Content here"}',
        usage: { totalTokens: 80 },
      } as Awaited<ReturnType<typeof callAI>>);
      vi.mocked(parseAiJson).mockReturnValue({
        title: "Hello World",
        body: "Content here",
      });

      const slots = [
        { name: "title", type: "text" as const, label: "Title", placeholder: "", maxLength: 200, required: true },
        { name: "body", type: "richtext" as const, label: "Body", placeholder: "", maxLength: 5000, required: true },
      ];

      const result = await fillTemplateSlots(slots, "AI topic", "professional", "org-1");

      expect(result.title).toBe("Hello World");
      expect(result.body).toBe("Content here");
    });

    it("truncates values exceeding maxLength", async () => {
      mockAiSetup();
      vi.mocked(callAI).mockResolvedValue({
        text: "{}",
        usage: { totalTokens: 50 },
      } as Awaited<ReturnType<typeof callAI>>);
      vi.mocked(parseAiJson).mockReturnValue({
        title: "A".repeat(300),
      });

      const slots = [
        { name: "title", type: "text" as const, label: "Title", placeholder: "", maxLength: 100, required: true },
      ];

      const result = await fillTemplateSlots(slots, "topic", "formal", "org-1");

      expect(result.title?.length).toBe(100);
    });

    it("omits slot values not in definitions", async () => {
      mockAiSetup();
      vi.mocked(callAI).mockResolvedValue({
        text: "{}",
        usage: { totalTokens: 50 },
      } as Awaited<ReturnType<typeof callAI>>);
      vi.mocked(parseAiJson).mockReturnValue({
        title: "Hello",
        extra_field: "Should not appear",
      });

      const slots = [
        { name: "title", type: "text" as const, label: "Title", placeholder: "", required: true },
      ];

      const result = await fillTemplateSlots(slots, "topic", "casual", "org-1");

      expect(result.title).toBe("Hello");
      expect(result).not.toHaveProperty("extra_field");
    });
  });
});
