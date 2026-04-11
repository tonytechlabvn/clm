// Shared shape for visual-editor starter templates. Each starter file
// exports a single object matching this contract; the seed script walks
// them and upserts into CmaImageTemplate with a compiled htmlContent.

import type { TemplateLayerData } from "@/lib/cma/types/image-template-layer-types";
import type { VariableDefinition } from "@/lib/cma/types/image-template-types";

export interface StarterTemplate {
  // Deterministic system-template id so re-seeding upserts cleanly
  id: string;
  name: string;
  description: string;
  platform: string; // one of IMAGE_TEMPLATE_PLATFORMS
  layerData: TemplateLayerData;
  variables: VariableDefinition[];
}
