-- Create Zalo bot config and user mapping tables
CREATE TABLE IF NOT EXISTS "CmaZaloBotConfig" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL,
  "botType" TEXT NOT NULL DEFAULT 'oa',
  "oaId" TEXT,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "tokenExpiry" TIMESTAMP(3),
  "cookies" TEXT,
  "cookieExpiry" TIMESTAMP(3),
  "selfId" TEXT,
  "imei" TEXT,
  "userAgent" TEXT,
  "allowedSenderIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CmaZaloBotConfig_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CmaZaloBotConfig_orgId_key" UNIQUE ("orgId")
);
CREATE INDEX IF NOT EXISTS "CmaZaloBotConfig_orgId_idx" ON "CmaZaloBotConfig"("orgId");

CREATE TABLE IF NOT EXISTS "CmaZaloUserMapping" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "orgId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "zaloUserId" TEXT NOT NULL,
  "zaloName" TEXT,
  "linkCode" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CmaZaloUserMapping_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "CmaZaloUserMapping_orgId_zaloUserId_key" UNIQUE ("orgId", "zaloUserId")
);
CREATE INDEX IF NOT EXISTS "CmaZaloUserMapping_orgId_idx" ON "CmaZaloUserMapping"("orgId");
CREATE INDEX IF NOT EXISTS "CmaZaloUserMapping_zaloUserId_idx" ON "CmaZaloUserMapping"("zaloUserId");
