import { describe, it, expect } from "vitest";
import {
  variableSchemaValidator,
  variableDefinitionSchema,
  createImageTemplateSchema,
  renderRequestSchema,
  validateRequiredVariables,
} from "@/lib/cma/types/image-template-types";

describe("image-template-types — Zod validators", () => {
  describe("variableDefinitionSchema", () => {
    it("accepts valid text variable", () => {
      const result = variableDefinitionSchema.safeParse({
        name: "title",
        type: "text",
        label: "Title",
        required: true,
        maxLength: 80,
        placeholder: "Enter title",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid color variable", () => {
      const result = variableDefinitionSchema.safeParse({
        name: "accentColor",
        type: "color",
        label: "Accent Color",
        required: false,
        defaultValue: "#6366f1",
      });
      expect(result.success).toBe(true);
    });

    it("accepts valid image variable", () => {
      const result = variableDefinitionSchema.safeParse({
        name: "imageUrl",
        type: "image",
        label: "Background Image",
        required: false,
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty name", () => {
      const result = variableDefinitionSchema.safeParse({
        name: "",
        type: "text",
        label: "Title",
        required: true,
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid type", () => {
      const result = variableDefinitionSchema.safeParse({
        name: "x",
        type: "number",
        label: "X",
        required: false,
      });
      expect(result.success).toBe(false);
    });
  });

  describe("variableSchemaValidator", () => {
    it("accepts valid array of variable definitions", () => {
      const result = variableSchemaValidator.safeParse([
        { name: "title", type: "text", label: "Title", required: true },
        { name: "color", type: "color", label: "Color", required: false, defaultValue: "#000" },
      ]);
      expect(result.success).toBe(true);
    });

    it("accepts empty array", () => {
      const result = variableSchemaValidator.safeParse([]);
      expect(result.success).toBe(true);
    });

    it("rejects if any item is invalid", () => {
      const result = variableSchemaValidator.safeParse([
        { name: "title", type: "text", label: "Title", required: true },
        { name: "", type: "text", label: "", required: false }, // invalid
      ]);
      expect(result.success).toBe(false);
    });
  });

  describe("createImageTemplateSchema", () => {
    const validPayload = {
      name: "Test Template",
      platform: "facebook",
      width: 1200,
      height: 630,
      htmlContent: "<div>{{title}}</div>",
      variableSchema: [{ name: "title", type: "text", label: "Title", required: true }],
    };

    it("accepts valid template payload", () => {
      expect(createImageTemplateSchema.safeParse(validPayload).success).toBe(true);
    });

    it("rejects missing name", () => {
      const { name, ...rest } = validPayload;
      expect(createImageTemplateSchema.safeParse(rest).success).toBe(false);
    });

    it("rejects width below 100", () => {
      expect(createImageTemplateSchema.safeParse({ ...validPayload, width: 50 }).success).toBe(false);
    });

    it("rejects width above 4096", () => {
      expect(createImageTemplateSchema.safeParse({ ...validPayload, width: 5000 }).success).toBe(false);
    });
  });

  describe("renderRequestSchema", () => {
    it("accepts valid render request", () => {
      const result = renderRequestSchema.safeParse({
        variables: { title: "Hello", accentColor: "#ff0000" },
        postId: "cuid123",
      });
      expect(result.success).toBe(true);
    });

    it("accepts without postId", () => {
      const result = renderRequestSchema.safeParse({
        variables: { title: "Hello" },
      });
      expect(result.success).toBe(true);
    });

    it("rejects non-string variable values", () => {
      const result = renderRequestSchema.safeParse({
        variables: { title: 123 },
      });
      expect(result.success).toBe(false);
    });
  });

  describe("validateRequiredVariables", () => {
    const schema = [
      { name: "title", type: "text" as const, label: "Title", required: true },
      { name: "subtitle", type: "text" as const, label: "Subtitle", required: false },
      { name: "imageUrl", type: "image" as const, label: "Image", required: true },
    ];

    it("returns empty array when all required variables provided", () => {
      const missing = validateRequiredVariables(schema, {
        title: "Hello",
        imageUrl: "https://example.com/img.png",
      });
      expect(missing).toEqual([]);
    });

    it("returns missing required variable names", () => {
      const missing = validateRequiredVariables(schema, { subtitle: "Sub" });
      expect(missing).toEqual(["title", "imageUrl"]);
    });

    it("ignores extra variables not in schema", () => {
      const missing = validateRequiredVariables(schema, {
        title: "Hello",
        imageUrl: "https://example.com/img.png",
        extraField: "ignored",
      });
      expect(missing).toEqual([]);
    });

    it("treats empty string as missing", () => {
      const missing = validateRequiredVariables(schema, {
        title: "",
        imageUrl: "https://example.com/img.png",
      });
      expect(missing).toEqual(["title"]);
    });
  });
});
