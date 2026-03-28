// Custom BlockNote schema combining default blocks with TonyTechLab custom blocks
// Used by the block editor component for rendering and serialization

import { BlockNoteSchema, defaultBlockSpecs } from "@blocknote/core";
import { CalloutBlock } from "./callout-block-spec";
import { StepBlock } from "./step-block-spec";
import { ConclusionBlock } from "./conclusion-block-spec";
import { TocBlock } from "./toc-block-spec";

// createReactBlockSpec returns a factory function — invoke with () to get BlockSpec
export const cmaBlockSpecs = {
  ...defaultBlockSpecs,
  callout: CalloutBlock(),
  step: StepBlock(),
  conclusion: ConclusionBlock(),
  toc: TocBlock(),
} as const;

export const cmaSchema = BlockNoteSchema.create({ blockSpecs: cmaBlockSpecs });

export type CmaBlockNoteEditor = typeof cmaSchema.BlockNoteEditor;
