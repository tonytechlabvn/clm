// CMA Template CRUD service — org-scoped template management with system template support

import { prisma } from "@/lib/prisma-client";
import type { CmaTemplate, Prisma } from "@prisma/client";
import type {
  TemplateType,
  SlotDefinition,
} from "@/types/cma-template-types";

export interface CreateTemplateInput {
  name: string;
  slug?: string;
  description?: string;
  category: string;
  blocks?: unknown[];
  styleTheme?: string;
  thumbnail?: string;
  // Template Studio fields
  templateType?: TemplateType;
  htmlTemplate?: string;
  cssScoped?: string;
  slotDefinitions?: SlotDefinition[];
  sourceUrl?: string;
  tags?: string[];
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  category?: string;
  blocks?: unknown[];
  styleTheme?: string;
  thumbnail?: string;
  // Template Studio fields
  templateType?: TemplateType;
  htmlTemplate?: string;
  cssScoped?: string;
  slotDefinitions?: SlotDefinition[];
  sourceUrl?: string;
  tags?: string[];
}

/** Validates that blocks is a non-empty JSON array */
function validateBlocks(blocks: unknown): asserts blocks is unknown[] {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error("Template blocks must be a non-empty array");
  }
}

/** Validates required fields for HTML-slot templates */
function validateHtmlSlotData(data: CreateTemplateInput | UpdateTemplateInput) {
  if ("templateType" in data && data.templateType === "html-slots") {
    if (!data.htmlTemplate) {
      throw new Error("HTML-slot templates require htmlTemplate");
    }
  }
}

/** Generates a URL-safe slug from a string */
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Returns system templates (orgId=null) plus org's own custom templates.
 * System templates are listed first for consistent ordering.
 */
export async function listTemplates(orgId: string): Promise<CmaTemplate[]> {
  const [system, custom] = await Promise.all([
    prisma.cmaTemplate.findMany({
      where: { orgId: null },
      orderBy: { createdAt: "asc" },
    }),
    prisma.cmaTemplate.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    }),
  ]);
  return [...system, ...custom];
}

/**
 * Returns a single template visible to the org (system or org-owned).
 */
export async function getTemplate(
  id: string,
  orgId: string
): Promise<CmaTemplate | null> {
  return prisma.cmaTemplate.findFirst({
    where: { id, OR: [{ orgId: null }, { orgId }] },
  });
}

/**
 * Creates a new org-owned template. System templates are seeded via seed script.
 */
export async function createTemplate(
  data: CreateTemplateInput,
  orgId: string
): Promise<CmaTemplate> {
  const isHtmlSlots = data.templateType === "html-slots";

  if (isHtmlSlots) {
    validateHtmlSlotData(data);
  } else {
    validateBlocks(data.blocks);
  }

  const slug = data.slug || `${orgId}-${toSlug(data.name)}-${Date.now()}`;

  return prisma.cmaTemplate.create({
    data: {
      orgId,
      name: data.name,
      slug,
      description: data.description || null,
      category: data.category,
      blocks: (isHtmlSlots ? [] : data.blocks) as Prisma.InputJsonValue,
      styleTheme: data.styleTheme || "default",
      thumbnail: data.thumbnail || null,
      templateType: data.templateType || "blocks",
      htmlTemplate: data.htmlTemplate || null,
      cssScoped: data.cssScoped || null,
      slotDefinitions:
        (data.slotDefinitions as unknown as Prisma.InputJsonValue) || undefined,
      sourceUrl: data.sourceUrl || null,
      tags: data.tags || [],
    },
  });
}

/**
 * Updates an org-owned template. System templates (orgId=null) are immutable.
 */
export async function updateTemplate(
  id: string,
  data: UpdateTemplateInput,
  orgId: string
): Promise<CmaTemplate> {
  const existing = await prisma.cmaTemplate.findFirst({
    where: { id, orgId },
  });
  if (!existing) {
    throw new Error("Template not found or not editable");
  }

  if (data.blocks !== undefined) {
    validateBlocks(data.blocks);
  }
  if (data.templateType === "html-slots") {
    validateHtmlSlotData(data);
  }

  return prisma.cmaTemplate.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.blocks !== undefined && {
        blocks: data.blocks as Prisma.InputJsonValue,
      }),
      ...(data.styleTheme !== undefined && { styleTheme: data.styleTheme }),
      ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
      ...(data.templateType !== undefined && {
        templateType: data.templateType,
      }),
      ...(data.htmlTemplate !== undefined && {
        htmlTemplate: data.htmlTemplate,
      }),
      ...(data.cssScoped !== undefined && { cssScoped: data.cssScoped }),
      ...(data.slotDefinitions !== undefined && {
        slotDefinitions:
          data.slotDefinitions as unknown as Prisma.InputJsonValue,
      }),
      ...(data.sourceUrl !== undefined && { sourceUrl: data.sourceUrl }),
      ...(data.tags !== undefined && { tags: data.tags }),
    },
  });
}

/**
 * Deletes an org-owned template. System templates cannot be deleted.
 */
export async function deleteTemplate(id: string, orgId: string): Promise<void> {
  const existing = await prisma.cmaTemplate.findFirst({
    where: { id, orgId },
  });
  if (!existing) {
    throw new Error("Template not found or not deletable");
  }
  await prisma.cmaTemplate.delete({ where: { id } });
}

/** List templates with per-user favorite flag */
export async function listTemplatesWithMeta(
  orgId: string,
  userId: string
): Promise<(CmaTemplate & { isFavorite: boolean })[]> {
  const [system, custom, favorites] = await Promise.all([
    prisma.cmaTemplate.findMany({
      where: { orgId: null },
      orderBy: { createdAt: "asc" },
    }),
    prisma.cmaTemplate.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.cmaTemplateFavorite.findMany({
      where: { userId },
      select: { templateId: true },
    }),
  ]);

  const favSet = new Set(favorites.map((f) => f.templateId));
  return [...system, ...custom].map((t) => ({
    ...t,
    isFavorite: favSet.has(t.id),
  }));
}

/** Toggle favorite status for a template. Returns new favorite state. */
export async function toggleFavorite(
  templateId: string,
  userId: string
): Promise<boolean> {
  const existing = await prisma.cmaTemplateFavorite.findUnique({
    where: { userId_templateId: { userId, templateId } },
  });

  if (existing) {
    await prisma.cmaTemplateFavorite.delete({ where: { id: existing.id } });
    return false;
  }

  await prisma.cmaTemplateFavorite.create({
    data: { userId, templateId },
  });
  return true;
}

/** Atomically increment usage count and update lastUsedAt */
export async function incrementUsageCount(templateId: string): Promise<void> {
  await prisma.cmaTemplate.update({
    where: { id: templateId },
    data: {
      usageCount: { increment: 1 },
      lastUsedAt: new Date(),
    },
  });
}
