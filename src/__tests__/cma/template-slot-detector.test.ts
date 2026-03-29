import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  simplifyHtmlForAi,
  heuristicSlotDetection,
  injectSlotPlaceholders,
} from "@/lib/cma/services/template-slot-detector";

// Mock AI dependencies for detectSlots
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
vi.mock("@/lib/prompts/cma-slot-detection-prompt", () => ({
  CMA_SLOT_DETECTION_SYSTEM_PROMPT: "Detect slots.",
}));

import { callAI } from "@/lib/ai-service";
import { getActiveAiConfig } from "@/lib/ai-settings-service";
import { checkAiBudget, trackTokenUsage } from "@/lib/cma/services/content-ai-service";
import { detectSlots } from "@/lib/cma/services/template-slot-detector";

describe("template-slot-detector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("simplifyHtmlForAi", () => {
    it("strips all attributes from tags", () => {
      const result = simplifyHtmlForAi('<div class="card" id="main"><p style="color:red">Hello</p></div>');
      expect(result).not.toContain("class=");
      expect(result).not.toContain("style=");
      expect(result).toContain("<div>");
      expect(result).toContain("<p>");
    });

    it("collapses whitespace", () => {
      const result = simplifyHtmlForAi("<p>   lots   of   space   </p>");
      expect(result).not.toContain("   ");
    });

    it("truncates long text nodes to 50 chars", () => {
      const longText = "A".repeat(100);
      const result = simplifyHtmlForAi(`<p>${longText}</p>`);
      // After truncation, text should be ~50 chars + "..."
      expect(result.length).toBeLessThan(100);
      expect(result).toContain("...");
    });

    it("removes empty elements", () => {
      const result = simplifyHtmlForAi("<div>  </div><p>content</p>");
      expect(result).toContain("content");
    });
  });

  describe("heuristicSlotDetection", () => {
    it("detects h1 as title slot", () => {
      const slots = heuristicSlotDetection("<h1>My Title</h1><p>Body text</p>");
      const title = slots.find((s) => s.name === "title");
      expect(title).toBeDefined();
      expect(title?.type).toBe("text");
      expect(title?.required).toBe(true);
    });

    it("detects img as hero_image slot", () => {
      const slots = heuristicSlotDetection('<img src="photo.jpg" alt="Hero">');
      const hero = slots.find((s) => s.name === "hero_image");
      expect(hero).toBeDefined();
      expect(hero?.type).toBe("image");
    });

    it("detects paragraph blocks as body section", () => {
      const slots = heuristicSlotDetection("<p>Some paragraph content here.</p>");
      const body = slots.find((s) => s.name.startsWith("body_section"));
      expect(body).toBeDefined();
      expect(body?.type).toBe("richtext");
    });

    it("returns default content slot when no elements detected", () => {
      const slots = heuristicSlotDetection("<span>inline</span>");
      expect(slots).toHaveLength(1);
      expect(slots[0].name).toBe("content");
      expect(slots[0].type).toBe("richtext");
    });
  });

  describe("detectSlots", () => {
    it("parses AI response with JSON array of slots", async () => {
      const mockSlots = [
        { name: "title", type: "text", label: "Title", placeholder: "Enter title", required: true },
        { name: "hero_image", type: "image", label: "Hero", placeholder: "", required: false },
      ];

      vi.mocked(checkAiBudget).mockResolvedValue(undefined);
      vi.mocked(getActiveAiConfig).mockResolvedValue({
        provider: "openai", apiKey: "key", model: "gpt-4",
      } as ReturnType<typeof getActiveAiConfig> extends Promise<infer T> ? T : never);
      vi.mocked(callAI).mockResolvedValue({
        text: JSON.stringify(mockSlots),
        usage: { totalTokens: 100 },
      } as Awaited<ReturnType<typeof callAI>>);
      vi.mocked(trackTokenUsage).mockResolvedValue(undefined);

      const result = await detectSlots("<h1>Test</h1>", "org-1");

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("title");
      expect(result[1].name).toBe("hero_image");
    });

    it("falls back to heuristic when AI parse fails", async () => {
      vi.mocked(checkAiBudget).mockResolvedValue(undefined);
      vi.mocked(getActiveAiConfig).mockResolvedValue({
        provider: "openai", apiKey: "key", model: "gpt-4",
      } as ReturnType<typeof getActiveAiConfig> extends Promise<infer T> ? T : never);
      vi.mocked(callAI).mockResolvedValue({
        text: "not valid json at all",
        usage: { totalTokens: 50 },
      } as Awaited<ReturnType<typeof callAI>>);
      vi.mocked(trackTokenUsage).mockResolvedValue(undefined);

      const result = await detectSlots("<h1>Title</h1><p>Body</p>", "org-1");

      // Heuristic should detect title + body
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some((s) => s.name === "title" || s.name === "content")).toBe(true);
    });
  });

  describe("injectSlotPlaceholders", () => {
    it("replaces img src with image slot placeholder", () => {
      const html = '<img src="photo.jpg" alt="Hero">';
      const slots = [{ name: "hero_image", type: "image" as const, label: "Hero", placeholder: "photo.jpg", required: false }];
      const result = injectSlotPlaceholders(html, slots);
      expect(result).toContain('src="{{hero_image}}"');
    });

    it("replaces heading content with title slot placeholder", () => {
      const html = "<h1>Original Title</h1>";
      const slots = [{ name: "title", type: "text" as const, label: "Title", placeholder: "Original Title", required: true }];
      const result = injectSlotPlaceholders(html, slots);
      expect(result).toContain("{{title}}");
      expect(result).toContain("<h1>");
    });

    it("handles image slot without specific placeholder", () => {
      const html = '<div><img src="any-image.png"></div>';
      const slots = [{ name: "photo", type: "image" as const, label: "Photo", placeholder: "", required: false }];
      const result = injectSlotPlaceholders(html, slots);
      expect(result).toContain('src="{{photo}}"');
    });
  });
});
