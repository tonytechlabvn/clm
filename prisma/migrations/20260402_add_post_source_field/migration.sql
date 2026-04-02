-- Add source field to CmaPost for tracking content origin
ALTER TABLE "CmaPost" ADD COLUMN IF NOT EXISTS "source" TEXT NOT NULL DEFAULT 'web';
