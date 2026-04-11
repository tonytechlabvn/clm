// Layer tree data model for the visual image template editor.
// Stored as JSON in CmaImageTemplate.layerData; compiled to htmlContent on save.
// Schema is versioned so future migrations can detect and upgrade old documents.

import { z } from "zod";
import { CURATED_FONTS } from "./image-template-fonts";

// ── Common layer fields ─────────────────────────────────────────────

const shadowSchema = z.object({
  x: z.number(),
  y: z.number(),
  blur: z.number().min(0),
  color: z.string().min(1),
});

const borderSchema = z.object({
  width: z.number().min(0),
  color: z.string().min(1),
});

// Base fields shared by every layer type. Keep this in sync with editor transforms
// (Moveable reports x/y/width/height in px; rotation in deg).
const baseLayerSchema = z.object({
  id: z.string().min(1),
  x: z.number(),
  y: z.number(),
  width: z.number().min(0),
  height: z.number().min(0),
  rotation: z.number(), // degrees
  zIndex: z.number().int(),
  visible: z.boolean(),
  locked: z.boolean(),
  opacity: z.number().min(0).max(1),
});

// ── Text layer ──────────────────────────────────────────────────────

export const textLayerSchema = baseLayerSchema.extend({
  type: z.literal("text"),
  text: z.string(), // may embed {{token}} placeholders
  fontFamily: z.enum(CURATED_FONTS),
  fontSize: z.number().min(1),
  fontWeight: z.union([
    z.literal(400),
    z.literal(500),
    z.literal(600),
    z.literal(700),
    z.literal(800),
  ]),
  color: z.string().min(1), // hex or {{token}}
  textAlign: z.enum(["left", "center", "right"]),
  lineHeight: z.number().min(0),
  letterSpacing: z.number(),
  textShadow: shadowSchema.optional(),
});

// ── Image layer ─────────────────────────────────────────────────────

export const imageLayerSchema = baseLayerSchema.extend({
  type: z.literal("image"),
  src: z.string(), // public URL or {{token}}
  fitMode: z.enum(["cover", "contain", "fill"]),
  borderRadius: z.number().min(0).optional(),
  border: borderSchema.optional(),
});

// ── Rect layer ──────────────────────────────────────────────────────

export const rectLayerSchema = baseLayerSchema.extend({
  type: z.literal("rect"),
  fillColor: z.string().min(1), // hex or {{token}}
  borderRadius: z.number().min(0).optional(),
  border: borderSchema.optional(),
  shadow: shadowSchema.optional(),
});

// ── Discriminated union ─────────────────────────────────────────────

export const layerSchema = z.discriminatedUnion("type", [
  textLayerSchema,
  imageLayerSchema,
  rectLayerSchema,
]);

export const templateLayerDataSchema = z.object({
  version: z.literal(1),
  width: z.number().int().min(100).max(4096),
  height: z.number().int().min(100).max(4096),
  backgroundColor: z.string().min(1),
  layers: z.array(layerSchema),
});

// ── Inferred TypeScript types ───────────────────────────────────────

export type BaseLayer = z.infer<typeof baseLayerSchema>;
export type TextLayer = z.infer<typeof textLayerSchema>;
export type ImageLayer = z.infer<typeof imageLayerSchema>;
export type RectLayer = z.infer<typeof rectLayerSchema>;
export type Layer = z.infer<typeof layerSchema>;
export type TemplateLayerData = z.infer<typeof templateLayerDataSchema>;
