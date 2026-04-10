// Shared types + Zod validators for the image template system
// Used by API routes, renderer service, and UI components

import { z } from "zod";

// ── Variable definition schema (stored as JSON in CmaImageTemplate.variableSchema) ──

export const variableDefinitionSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["text", "image", "color"]),
  label: z.string().min(1),
  defaultValue: z.string().optional(),
  required: z.boolean(),
  maxLength: z.number().optional(),
  placeholder: z.string().optional(),
});

// Runtime validation for stored JSON variableSchema arrays
export const variableSchemaValidator = z.array(variableDefinitionSchema);

export type VariableDefinition = z.infer<typeof variableDefinitionSchema>;
export type VariableSchema = VariableDefinition[];

// ── API request/response types ──

export const createImageTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  platform: z.string().min(1),
  width: z.number().int().min(100).max(4096),
  height: z.number().int().min(100).max(4096),
  htmlContent: z.string().min(1),
  variableSchema: variableSchemaValidator,
});

export const updateImageTemplateSchema = createImageTemplateSchema.partial();

export const renderRequestSchema = z.object({
  variables: z.record(z.string(), z.string()),
  postId: z.string().optional(),
});

// ── Helper: validate required variables are provided ──

export function validateRequiredVariables(
  schema: VariableSchema,
  variables: Record<string, string>
): string[] {
  return schema
    .filter((v) => v.required && !variables[v.name])
    .map((v) => v.name);
}
