-- Add Facebook App credentials to CmaOrgSettings
ALTER TABLE "CmaOrgSettings" ADD COLUMN IF NOT EXISTS "fbAppId" TEXT;
ALTER TABLE "CmaOrgSettings" ADD COLUMN IF NOT EXISTS "fbAppSecret" TEXT;
ALTER TABLE "CmaOrgSettings" ADD COLUMN IF NOT EXISTS "fbRedirectUri" TEXT;
