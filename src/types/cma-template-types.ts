// Shared TypeScript types for CMA Template Studio

/** Discriminator for template rendering mode */
export type TemplateType = "blocks" | "html-slots";

/** Slot content types supported by HTML-slot templates */
export type SlotType = "text" | "richtext" | "image" | "list";

/** Defines a single editable slot within an HTML-slot template */
export interface SlotDefinition {
  name: string; // e.g., "title", "hero_image", "body_section_1"
  type: SlotType;
  label: string; // Human-readable: "Main Title"
  placeholder: string; // Default content for preview
  maxLength?: number; // Character limit (text/richtext only)
  required: boolean;
}

/** Slot values stored on a CmaPost for re-editing HTML-slot template posts */
export type SlotValues = Record<string, string>;

/** HTML-slot template data subset (fields specific to html-slots type) */
export interface HtmlSlotTemplateData {
  htmlTemplate: string; // Raw HTML with {{slot_name}} placeholders
  cssScoped: string; // Scoped CSS string
  slotDefinitions: SlotDefinition[];
  sourceUrl?: string;
}
