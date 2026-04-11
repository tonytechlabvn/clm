-- Add layerData JSON column to CmaImageTemplate for visual editor
-- Nullable: legacy/seed templates keep null, editor-authored templates store layer tree
ALTER TABLE "CmaImageTemplate" ADD COLUMN IF NOT EXISTS "layerData" JSONB;
