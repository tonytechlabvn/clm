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
    cmaTemplateFavorite: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma-client";

// Default values for Template Studio fields added to CmaTemplate
const studioDefaults = {
  templateType: "blocks" as string,
  htmlTemplate: null as string | null,
  cssScoped: null as string | null,
  slotDefinitions: null,
  sourceUrl: null as string | null,
  tags: [] as string[],
  usageCount: 0,
  lastUsedAt: null as Date | null,
};

/** Creates a mock CmaTemplate with all required fields */
function mockTemplate(overrides: Record<string, unknown> = {}) {
  return {
    id: "tpl-1",
    orgId: null as string | null,
    name: "Template",
    slug: "template",
    description: null as string | null,
    category: "post",
    blocks: [{ type: "paragraph" }],
    styleTheme: "default",
    isDefault: false,
    thumbnail: null as string | null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...studioDefaults,
    ...overrides,
  };
}

describe("template-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("listTemplates", () => {
    it("returns system templates first, then org templates", async () => {
      const systemTemplate = mockTemplate({
        id: "sys-1",
        name: "System Template",
        slug: "system-template",
        category: "article",
        blocks: [],
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      });

      const orgTemplate = mockTemplate({
        id: "org-1",
        orgId: "org-123",
        name: "Org Template",
        slug: "org-template",
        description: "Custom template",
        styleTheme: "editorial",
        blocks: [],
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
      });

      vi.mocked(prisma.cmaTemplate.findMany)
        .mockResolvedValueOnce([systemTemplate])
        .mockResolvedValueOnce([orgTemplate]);

      const result = await templateService.listTemplates("org-123");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("sys-1");
      expect(result[1].id).toBe("org-1");
    });

    it("returns only system templates if org has no custom templates", async () => {
      const systemTemplate = mockTemplate({
        id: "sys-1",
        name: "System Template",
        slug: "system-template",
        category: "article",
        blocks: [],
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      });

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
      const template = mockTemplate({
        id: "sys-1",
        name: "System Template",
        slug: "system-template",
        category: "article",
        blocks: [],
      });

      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(template);

      const result = await templateService.getTemplate("sys-1", "org-123");

      expect(result).toEqual(template);
    });

    it("returns template visible to org (org template)", async () => {
      const template = mockTemplate({
        id: "org-1",
        orgId: "org-123",
        name: "Org Template",
        slug: "org-template",
        description: "Custom",
        styleTheme: "editorial",
        blocks: [],
      });

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

      const createdTemplate = mockTemplate({
        id: "new-1",
        orgId: "org-123",
        ...input,
      });

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

      vi.mocked(prisma.cmaTemplate.create).mockResolvedValue(
        mockTemplate({ id: "new-1", orgId: "org-789", name: "Test Template", slug: "" })
      );

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

      vi.mocked(prisma.cmaTemplate.create).mockResolvedValue(
        mockTemplate({ id: "new-1", orgId: "org-123", name: "My Template", slug: expect.stringContaining("org-123") })
      );

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

      vi.mocked(prisma.cmaTemplate.create).mockResolvedValue(
        mockTemplate({ id: "new-1", orgId: "org-123", name: "Test Template", slug: "" })
      );

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

      vi.mocked(prisma.cmaTemplate.create).mockResolvedValue(
        mockTemplate({ id: "new-1", orgId: "org-123", name: "Test Template", slug: "" })
      );

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
      const existingTemplate = mockTemplate({
        id: "org-1",
        orgId: "org-123",
        name: "Old Name",
        slug: "old-name",
        description: "Old description",
      });

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
      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(
        mockTemplate({ id: "org-1", orgId: "org-123" })
      );

      await expect(
        templateService.updateTemplate(
          "org-1",
          { blocks: [] },
          "org-123"
        )
      ).rejects.toThrow("Template blocks must be a non-empty array");
    });

    it("uses conditional updates for partial data", async () => {
      const existingTemplate = mockTemplate({
        id: "org-1",
        orgId: "org-123",
        description: "Description",
      });

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
      const existingTemplate = mockTemplate({ id: "org-1", orgId: "org-123" });

      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(existingTemplate);
      vi.mocked(prisma.cmaTemplate.delete).mockResolvedValue(existingTemplate);

      await templateService.deleteTemplate("org-1", "org-123");

      expect(vi.mocked(prisma.cmaTemplate.delete)).toHaveBeenCalledWith({
        where: { id: "org-1" },
      });
    });

    it("checks ownership before deleting", async () => {
      const existingTemplate = mockTemplate({ id: "org-1", orgId: "org-123" });

      vi.mocked(prisma.cmaTemplate.findFirst).mockResolvedValue(existingTemplate);

      await templateService.deleteTemplate("org-1", "org-123");

      expect(vi.mocked(prisma.cmaTemplate.findFirst)).toHaveBeenCalledWith({
        where: { id: "org-1", orgId: "org-123" },
      });
    });
  });

  describe("createTemplate (html-slots)", () => {
    it("creates html-slots template without blocks validation", async () => {
      const input = {
        name: "HTML Template",
        category: "post",
        templateType: "html-slots" as const,
        htmlTemplate: "<h1>{{title}}</h1>",
        cssScoped: "h1 { color: red; }",
        slotDefinitions: [{ name: "title", type: "text" as const, label: "Title", placeholder: "", required: true }],
      };

      const created = mockTemplate({
        id: "html-1",
        orgId: "org-123",
        ...input,
        blocks: [],
      });

      vi.mocked(prisma.cmaTemplate.create).mockResolvedValue(created);

      const result = await templateService.createTemplate(input, "org-123");
      expect(result.id).toBe("html-1");
    });

    it("rejects html-slots template without htmlTemplate", async () => {
      const input = {
        name: "Bad Template",
        category: "post",
        templateType: "html-slots" as const,
        // Missing htmlTemplate
      };

      await expect(
        templateService.createTemplate(input, "org-123")
      ).rejects.toThrow("HTML-slot templates require htmlTemplate");
    });
  });

  describe("listTemplatesWithMeta", () => {
    it("returns templates with isFavorite flag", async () => {
      const tpl1 = mockTemplate({ id: "tpl-1", name: "Template 1" });
      const tpl2 = mockTemplate({ id: "tpl-2", orgId: "org-123", name: "Template 2" });

      vi.mocked(prisma.cmaTemplate.findMany).mockImplementation(((args: { where: { orgId: string | null } }) => {
        if (args.where.orgId === null) return Promise.resolve([tpl1]);
        return Promise.resolve([tpl2]);
      }) as never);
      vi.mocked(prisma.cmaTemplateFavorite.findMany).mockResolvedValue([
        { id: "fav-1", userId: "user-1", templateId: "tpl-1", createdAt: new Date() },
      ]);

      const result = await templateService.listTemplatesWithMeta("org-123", "user-1");

      expect(result).toHaveLength(2);
      expect(result[0].isFavorite).toBe(true);
      expect(result[1].isFavorite).toBe(false);
    });

    it("returns all false when no favorites", async () => {
      vi.mocked(prisma.cmaTemplate.findMany).mockImplementation(((args: { where: { orgId: string | null } }) => {
        if (args.where.orgId === null) return Promise.resolve([mockTemplate({ id: "tpl-1" })]);
        return Promise.resolve([]);
      }) as never);
      vi.mocked(prisma.cmaTemplateFavorite.findMany).mockResolvedValue([]);

      const result = await templateService.listTemplatesWithMeta("org-1", "user-1");

      expect(result.every((t) => t.isFavorite === false)).toBe(true);
    });
  });

  describe("toggleFavorite", () => {
    it("creates favorite and returns true when not yet favorited", async () => {
      vi.mocked(prisma.cmaTemplateFavorite.findUnique).mockResolvedValue(null);
      vi.mocked(prisma.cmaTemplateFavorite.create).mockResolvedValue({} as never);

      const result = await templateService.toggleFavorite("tpl-1", "user-1");

      expect(result).toBe(true);
      expect(prisma.cmaTemplateFavorite.findUnique).toHaveBeenCalledWith({
        where: { userId_templateId: { userId: "user-1", templateId: "tpl-1" } },
      });
      expect(prisma.cmaTemplateFavorite.create).toHaveBeenCalledWith({
        data: { userId: "user-1", templateId: "tpl-1" },
      });
    });

    it("deletes favorite and returns false when already favorited", async () => {
      vi.mocked(prisma.cmaTemplateFavorite.findUnique).mockResolvedValue({
        id: "fav-1",
        userId: "user-1",
        templateId: "tpl-1",
      } as never);
      vi.mocked(prisma.cmaTemplateFavorite.delete).mockResolvedValue({} as never);

      const result = await templateService.toggleFavorite("tpl-1", "user-1");

      expect(result).toBe(false);
      expect(prisma.cmaTemplateFavorite.findUnique).toHaveBeenCalledWith({
        where: { userId_templateId: { userId: "user-1", templateId: "tpl-1" } },
      });
      expect(prisma.cmaTemplateFavorite.delete).toHaveBeenCalledWith({
        where: { id: "fav-1" },
      });
    });
  });

  describe("incrementUsageCount", () => {
    it("increments count and updates lastUsedAt", async () => {
      vi.mocked(prisma.cmaTemplate.update).mockResolvedValue(
        mockTemplate({ usageCount: 1, lastUsedAt: new Date() })
      );

      await templateService.incrementUsageCount("tpl-1");

      expect(prisma.cmaTemplate.update).toHaveBeenCalledWith({
        where: { id: "tpl-1" },
        data: {
          usageCount: { increment: 1 },
          lastUsedAt: expect.any(Date),
        },
      });
    });
  });
});
