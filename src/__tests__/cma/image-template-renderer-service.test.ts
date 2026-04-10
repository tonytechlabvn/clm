import { describe, it, expect, afterAll } from "vitest";
import {
  renderTemplate,
  renderPreview,
  renderAndSave,
  shutdownBrowser,
} from "@/lib/cma/services/image-template-renderer-service";
import fs from "fs/promises";

// These tests require Puppeteer (Chromium) — skip in CI if not available
const SIMPLE_HTML = `<!DOCTYPE html>
<html><head><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { width: {{width}}px; height: {{height}}px; background: {{accentColor}}; display: flex; align-items: center; justify-content: center; }
  h1 { color: #fff; font-size: 48px; font-family: sans-serif; }
</style></head>
<body><h1>{{title}}</h1></body></html>`;

afterAll(async () => {
  await shutdownBrowser();
});

describe("image-template-renderer-service", () => {
  describe("renderTemplate", () => {
    it("returns a valid PNG buffer with correct dimensions", async () => {
      const result = await renderTemplate({
        htmlContent: SIMPLE_HTML,
        variables: { title: "Hello World", accentColor: "#6366f1" },
        width: 600,
        height: 300,
      });

      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.width).toBe(600);
      expect(result.height).toBe(300);
      // PNG magic bytes: 0x89 0x50 0x4e 0x47
      expect(result.buffer[0]).toBe(0x89);
      expect(result.buffer[1]).toBe(0x50);
      expect(result.buffer[2]).toBe(0x4e);
      expect(result.buffer[3]).toBe(0x47);
    }, 15_000);

    it("substitutes variables into the template", async () => {
      // Render with a known title — can't read text from PNG, but verify it succeeds
      const result = await renderTemplate({
        htmlContent: SIMPLE_HTML,
        variables: { title: "Xin Chào Việt Nam", accentColor: "#ff0000" },
        width: 400,
        height: 200,
      });
      expect(result.buffer.length).toBeGreaterThan(100);
    }, 15_000);

    it("handles missing optional variables with empty string", async () => {
      const result = await renderTemplate({
        htmlContent: SIMPLE_HTML,
        variables: { title: "Test", accentColor: "" },
        width: 400,
        height: 200,
      });
      expect(result.buffer).toBeInstanceOf(Buffer);
    }, 15_000);

    it("throws on invalid URL in image variable", async () => {
      await expect(
        renderTemplate({
          htmlContent: SIMPLE_HTML,
          variables: { title: "Test", imageUrl: "http://127.0.0.1/secret", accentColor: "#000" },
          width: 400,
          height: 200,
        })
      ).rejects.toThrow("private/internal URLs blocked");
    });

    it("throws on invalid color hex format", async () => {
      await expect(
        renderTemplate({
          htmlContent: SIMPLE_HTML,
          variables: { title: "Test", accentColor: "not-a-color" },
          width: 400,
          height: 200,
        })
      ).rejects.toThrow("must be hex");
    });
  });

  describe("renderPreview", () => {
    it("returns a smaller buffer than full render", async () => {
      const opts = {
        htmlContent: SIMPLE_HTML,
        variables: { title: "Preview", accentColor: "#6366f1" },
        width: 1200,
        height: 630,
      };

      const [full, preview] = await Promise.all([
        renderTemplate(opts),
        renderPreview(opts),
      ]);

      expect(preview).toBeInstanceOf(Buffer);
      // Preview at 0.5x should be smaller
      expect(preview.length).toBeLessThan(full.buffer.length);
    }, 20_000);
  });

  describe("renderAndSave", () => {
    it("writes PNG file to disk and returns path + size", async () => {
      const result = await renderAndSave({
        htmlContent: SIMPLE_HTML,
        variables: { title: "Save Test", accentColor: "#22c55e" },
        width: 400,
        height: 200,
        orgId: "test-org",
      });

      expect(result.filePath).toContain("uploads");
      expect(result.filePath).toContain("test-org");
      expect(result.filePath).toMatch(/\.png$/);
      expect(result.fileSize).toBeGreaterThan(0);

      // Verify file exists on disk
      const stat = await fs.stat(result.filePath);
      expect(stat.size).toBe(result.fileSize);

      // Cleanup
      await fs.unlink(result.filePath).catch(() => {});
    }, 15_000);
  });
});
