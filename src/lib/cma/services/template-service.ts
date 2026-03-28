// CMA Template CRUD service — org-scoped template management with system template support

import { prisma } from "@/lib/prisma-client";
import type { CmaTemplate, Prisma } from "@prisma/client";

export interface CreateTemplateInput {
  name: string;
  slug?: string;
  description?: string;
  category: string;
  blocks: unknown[];
  styleTheme?: string;
  thumbnail?: string;
}

export interface UpdateTemplateInput {
  name?: string;
  description?: string;
  category?: string;
  blocks?: unknown[];
  styleTheme?: string;
  thumbnail?: string;
}

/** Validates that blocks is a non-empty JSON array */
function validateBlocks(blocks: unknown): asserts blocks is unknown[] {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error("Template blocks must be a non-empty array");
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
  validateBlocks(data.blocks);
  const slug = data.slug || `${orgId}-${toSlug(data.name)}-${Date.now()}`;

  return prisma.cmaTemplate.create({
    data: {
      orgId,
      name: data.name,
      slug,
      description: data.description || null,
      category: data.category,
      blocks: data.blocks as Prisma.InputJsonValue,
      styleTheme: data.styleTheme || "default",
      thumbnail: data.thumbnail || null,
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

  return prisma.cmaTemplate.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.blocks !== undefined && { blocks: data.blocks as Prisma.InputJsonValue }),
      ...(data.styleTheme !== undefined && { styleTheme: data.styleTheme }),
      ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
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
