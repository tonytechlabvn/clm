-- Create CmaOrgSettings table for per-org publishing configuration
CREATE TABLE IF NOT EXISTS "CmaOrgSettings" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL,
  "publishingMode" TEXT NOT NULL DEFAULT 'human_in_loop',
  "autoPublishSources" TEXT[] DEFAULT ARRAY['scheduler'],
  "requireApprovalSources" TEXT[] DEFAULT ARRAY['zalo_bot'],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CmaOrgSettings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CmaOrgSettings_orgId_key" UNIQUE ("orgId"),
  CONSTRAINT "CmaOrgSettings_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE
);
