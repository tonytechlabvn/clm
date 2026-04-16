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

// Valid field name — identifier-style so it safely embeds in dotted query
// keys like `date.text` and Handlebars property paths like `{{date.text}}`.
// Letters/digits/underscore, must not start with a digit.
export const FIELD_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

// Base fields shared by every layer type. Keep this in sync with editor transforms
// (Moveable reports x/y/width/height in px; rotation in deg).
//
// APITemplate.io-style dynamic fields (optional, backward-compatible):
//   - `fieldName`: identifier used as the dotted-query prefix (e.g. `date`
//     → `?date.text=...`). When unset, the layer is static.
//   - `dynamic`: when true, the compiler emits `{{fieldName.<prop>}}` tokens
//     instead of the literal content, making the layer URL-overridable.
//     `dynamic` requires `fieldName`; validated below via .refine().
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
  fieldName: z
    .string()
    .regex(FIELD_NAME_RE, "fieldName must match [a-zA-Z_][a-zA-Z0-9_]*")
    .optional(),
  dynamic: z.boolean().optional(),
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

// ── Dynamic field property map ──────────────────────────────────────
// Per layer-type, the sub-property of the nested Handlebars context that
// receives the URL override. This single map is the source of truth —
// compiler (emit `{{fieldName.<prop>}}`), route (parse `fieldName.<prop>`),
// and variable-schema derivation all read from here.
export const DYNAMIC_FIELD_PROPERTY = {
  text: "text",
  image: "url",
  rect: "color",
} as const;

export type DynamicFieldPropertyFor<T extends Layer["type"]> =
  (typeof DYNAMIC_FIELD_PROPERTY)[T];
