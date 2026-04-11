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

// ── Direct URL builder (APITemplate.io-style) ──
// Builds a URL that returns the rendered image directly
// Usage: <img src={buildImageUrl(template, { title: "Hello" })} />

interface TemplateForUrl {
  id: string;
  authCode: string;
}

/**
 * Build a Direct URL for an image template.
 * The returned URL returns image/png directly — use it as an <img src>,
 * og:image, or pass to Facebook/social adapters as a public image URL.
 *
 * @param template - The template with id and authCode
 * @param variables - Variable values to substitute
 * @param baseUrl - Optional base URL (defaults to relative path, useful for server-side)
 */
export function buildImageUrl(
  template: TemplateForUrl,
  variables: Record<string, string> = {},
  baseUrl = ""
): string {
  const params = new URLSearchParams({ auth: template.authCode });
  for (const [key, value] of Object.entries(variables)) {
    if (value !== undefined && value !== "") {
      params.set(key, value);
    }
  }
  return `${baseUrl}/api/cma/image-templates/${template.id}/image?${params.toString()}`;
}
