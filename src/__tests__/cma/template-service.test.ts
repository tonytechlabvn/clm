import { describe, it, expect, beforeEach, vi } from "vitest";
import * as templateService from "@/lib/cma/services/template-service";

// Mock Prisma client
vi.mock("@/lib/prisma-client", () => ({
  prisma: {
    cmaTemplate: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma-client";

describe("template-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listTemplates", () => {
    it("returns system templates first, then org templates", async () => {
      const systemTemplate = {
        id: "sys-1",
        orgId: null,
        name: "System Template",
        slug: "system-template",
        description: null,
        category: "article",
        blocks: [],
        styleTheme: "default",
        isDefault: false,
        thumbnail: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      const orgTemplate = {
        id: "org-1",
        orgId: "org-123",
        name: "Org Template",
        slug: "org-template",
        description: "Custom template",
        category: "post",
        blocks: [],
        styleTheme: "editorial",
        isDefault: false,
        thumbnail: null,
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
      };

      vi.mocked(prisma.cmaTemplate.findMany)
        .mockResolvedValueOnce([systemTemplate])
        .mockResolvedValueOnce([orgTemplate]);

      const result = await templateService.listTemplates("org-123");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("sys-1");
      expect(result[1].id).toBe("org-1");
    });

    it("returns only system templates if org has no custom templates", async () => {
      const systemTemplate = {
        id: "sys-1",
        orgId: null,
        name: "System Template",
        slug: "system-template",
        description: null,
        category: "article",
        blocks: [],
        styleTheme: "default",
        isDefault: false,
        thumbnail: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      };

      vi.mocked(prisma.cmaTemplate.findMany)
        .mockResolvedValueOnce([systemTemplate])
        .mockResolvedValueOnce([]);

      const result = await templateService.listTemplates("org-456");

      expect(result).toHaveLength(1);
      expect(result[0].orgId).toBeNull();
    });

    it("queries system templates with orgId=null", async () => {
      vi.mocked(prisma.cmaTemplate.findMany).mockResolvedValue([]);

      await templateService.listTemplates("org-123");

      expect(vi.mocked(prisma.cmaTemplate.findMany)).toHaveBeenCalledWith({
        where: { orgId: null },
        orderBy: { createdAt: "asc" },
      });
    });

    it("queries org templates with correct orgId", async () => {
      vi.mocked(prisma.cmaTemplate.findMany)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await templateService.listTemplates("org-789");

      expect(vi.mocked(prisma.cmaTemplate.findMany)).toHaveBeenNthCalledWith(2, {
        where: { orgId: "org-789" },
        orderBy: { createdAt: "desc" },
      });
    });
  });

  describe("getTemplate", () => {
    it("returns template visible to org (system template)", async () => {
      const template = {
        id: "sys-1",
        orgId: null,
        name: "System Template",
        slug: "system-template",
        description: null,
        category: "article",
        blocks: [],
        styleTheme: "default",
        isDefault: false,
        thumbnail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(template);

      const result = await templateService.getTemplate("sys-1", "org-123");

      expect(result).toEqual(template);
    });

    it("returns template visible to org (org template)", async () => {
      const template = {
        id: "org-1",
        orgId: "org-123",
        name: "Org Template",
        slug: "org-template",
        description: "Custom",
        category: "post",
        blocks: [],
        styleTheme: "editorial",
        isDefault: false,
        thumbnail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(template);

      const result = await templateService.getTemplate("org-1", "org-123");

      expect(result).toEqual(template);
    });

    it("returns null for non-existent template", async () => {
      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(null);

      const result = await templateService.getTemplate("nonexistent", "org-123");

      expect(result).toBeNull();
    });

    it("uses OR query to check system or org templates", async () => {
      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(null);

      await templateService.getTemplate("some-id", "org-123");

      expect(vi.mocked(prisma.cmaTemplate.findFirst)).toHaveBeenCalledWith({
        where: {
          id: "some-id",
          OR: [{ orgId: null }, { orgId: "org-123" }],
        },
      });
    });
  });

  describe("createTemplate", () => {
    it("validates blocks is non-empty array", async () => {
      const input = {
        name: "Test Template",
        category: "post",
        blocks: [],
        description: "Test",
      };

      await expect(templateService.createTemplate(input, "org-123")).rejects.toThrow(
        "Template blocks must be a non-empty array"
      );
    });

    it("rejects blocks that is not an array", async () => {
      const input = {
        name: "Test Template",
        category: "post",
        blocks: { type: "paragraph" } as unknown as unknown[],
      };

      await expect(templateService.createTemplate(input, "org-123")).rejects.toThrow(
        "Template blocks must be a non-empty array"
      );
    });

    it("creates template with provided data", async () => {
      const input = {
        name: "Test Template",
        slug: "test-template",
        description: "A test template",
        category: "post",
        blocks: [{ type: "paragraph" }],
        styleTheme: "editorial",
        isDefault: false,
        thumbnail: "thumb.jpg",
      };

      const createdTemplate = {
        id: "new-1",
        orgId: "org-123",
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.cmaTemplate.create).mockResolvedValue(createdTemplate);

      const result = await templateService.createTemplate(input, "org-123");

      expect(result.orgId).toBe("org-123");
      expect(result.name).toBe("Test Template");
    });

    it("sets orgId from parameter", async () => {
      const input = {
        name: "Test Template",
        category: "post",
        blocks: [{ type: "paragraph" }],
      };

      vi.mocked(prisma.cmaTemplate.create).mockResolvedValue({
        id: "new-1",
        orgId: "org-789",
        name: "Test Template",
        slug: "",
        description: null,
        category: "post",
        blocks: [{ type: "paragraph" }],
        styleTheme: "default",
        isDefault: false,
        thumbnail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await templateService.createTemplate(input, "org-789");

      expect(vi.mocked(prisma.cmaTemplate.create)).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orgId: "org-789",
          }),
        })
      );
    });

    it("generates slug if not provided", async () => {
      const input = {
        name: "My Template",
        category: "post",
        blocks: [{ type: "paragraph" }],
      };

      vi.mocked(prisma.cmaTemplate.create).mockResolvedValue({
        id: "new-1",
        orgId: "org-123",
        name: "My Template",
        slug: expect.stringContaining("org-123"),
        description: null,
        category: "post",
        blocks: [{ type: "paragraph" }],
        styleTheme: "default",
        isDefault: false,
        thumbnail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await templateService.createTemplate(input, "org-123");

      const callArgs = vi.mocked(prisma.cmaTemplate.create).mock.calls[0]?.[0];
      expect(callArgs?.data.slug).toMatch(/org-123/);
    });

    it("sets default theme if not provided", async () => {
      const input = {
        name: "Test Template",
        category: "post",
        blocks: [{ type: "paragraph" }],
      };

      vi.mocked(prisma.cmaTemplate.create).mockResolvedValue({
        id: "new-1",
        orgId: "org-123",
        name: "Test Template",
        slug: "",
        description: null,
        category: "post",
        blocks: [{ type: "paragraph" }],
        styleTheme: "default",
        isDefault: false,
        thumbnail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await templateService.createTemplate(input, "org-123");

      const callArgs = vi.mocked(prisma.cmaTemplate.create).mock.calls[0]?.[0];
      expect(callArgs?.data.styleTheme).toBe("default");
    });

    it("sets null for optional fields if not provided", async () => {
      const input = {
        name: "Test Template",
        category: "post",
        blocks: [{ type: "paragraph" }],
      };

      vi.mocked(prisma.cmaTemplate.create).mockResolvedValue({
        id: "new-1",
        orgId: "org-123",
        name: "Test Template",
        slug: "",
        description: null,
        category: "post",
        blocks: [{ type: "paragraph" }],
        styleTheme: "default",
        isDefault: false,
        thumbnail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await templateService.createTemplate(input, "org-123");

      const callArgs = vi.mocked(prisma.cmaTemplate.create).mock.calls[0]?.[0];
      expect(callArgs?.data.description).toBeNull();
      expect(callArgs?.data.thumbnail).toBeNull();
    });
  });

  describe("updateTemplate", () => {
    it("rejects system templates (orgId=null)", async () => {
      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(null);

      await expect(
        templateService.updateTemplate("sys-1", { name: "Updated" }, "org-123")
      ).rejects.toThrow("Template not found or not editable");
    });

    it("rejects update if template not owned by org", async () => {
      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(null);

      await expect(
        templateService.updateTemplate("org-456", { name: "Updated" }, "org-123")
      ).rejects.toThrow("Template not found or not editable");
    });

    it("updates template owned by org", async () => {
      const existingTemplate = {
        id: "org-1",
        orgId: "org-123",
        name: "Old Name",
        slug: "old-name",
        description: "Old description",
        category: "post",
        blocks: [{ type: "paragraph" }],
        styleTheme: "default",
        isDefault: false,
        thumbnail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedTemplate = {
        ...existingTemplate,
        name: "New Name",
        description: "New description",
      };

      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(existingTemplate);
      vi.mocked(prisma.cmaTemplate.update).mockResolvedValue(updatedTemplate);

      const result = await templateService.updateTemplate(
        "org-1",
        { name: "New Name", description: "New description" },
        "org-123"
      );

      expect(result.name).toBe("New Name");
      expect(result.description).toBe("New description");
    });

    it("validates blocks if provided in update", async () => {
      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue({
        id: "org-1",
        orgId: "org-123",
        name: "Template",
        slug: "template",
        description: null,
        category: "post",
        blocks: [{ type: "paragraph" }],
        styleTheme: "default",
        isDefault: false,
        thumbnail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await expect(
        templateService.updateTemplate(
          "org-1",
          { blocks: [] },
          "org-123"
        )
      ).rejects.toThrow("Template blocks must be a non-empty array");
    });

    it("uses conditional updates for partial data", async () => {
      const existingTemplate = {
        id: "org-1",
        orgId: "org-123",
        name: "Template",
        slug: "template",
        description: "Description",
        category: "post",
        blocks: [{ type: "paragraph" }],
        styleTheme: "default",
        isDefault: false,
        thumbnail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(existingTemplate);
      vi.mocked(prisma.cmaTemplate.update).mockResolvedValue(existingTemplate);

      await templateService.updateTemplate(
        "org-1",
        { name: "New Name" },
        "org-123"
      );

      const callArgs = vi.mocked(prisma.cmaTemplate.update).mock.calls[0]?.[0];
      expect(callArgs?.data).toHaveProperty("name");
      expect(callArgs?.data).not.toHaveProperty("description");
    });
  });

  describe("deleteTemplate", () => {
    it("rejects system templates (orgId=null)", async () => {
      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(null);

      await expect(templateService.deleteTemplate("sys-1", "org-123")).rejects.toThrow(
        "Template not found or not deletable"
      );
    });

    it("rejects delete if template not owned by org", async () => {
      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(null);

      await expect(templateService.deleteTemplate("org-456", "org-123")).rejects.toThrow(
        "Template not found or not deletable"
      );
    });

    it("deletes template owned by org", async () => {
      const existingTemplate = {
        id: "org-1",
        orgId: "org-123",
        name: "Template",
        slug: "template",
        description: null,
        category: "post",
        blocks: [{ type: "paragraph" }],
        styleTheme: "default",
        isDefault: false,
        thumbnail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(existingTemplate);
      vi.mocked(prisma.cmaTemplate.delete).mockResolvedValue(existingTemplate);

      await templateService.deleteTemplate("org-1", "org-123");

      expect(vi.mocked(prisma.cmaTemplate.delete)).toHaveBeenCalledWith({
        where: { id: "org-1" },
      });
    });

    it("checks ownership before deleting", async () => {
      const existingTemplate = {
        id: "org-1",
        orgId: "org-123",
        name: "Template",
        slug: "template",
        description: null,
        category: "post",
        blocks: [{ type: "paragraph" }],
        styleTheme: "default",
        isDefault: false,
        thumbnail: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(existingTemplate);

      await templateService.deleteTemplate("org-1", "org-123");

      expect(vi.mocked(prisma.cmaTemplate.findFirst)).toHaveBeenCalledWith({
        where: { id: "org-1", orgId: "org-123" },
      });
    });
  });
});
