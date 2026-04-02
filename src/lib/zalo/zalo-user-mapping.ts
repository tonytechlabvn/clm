// Zalo user mapping — maps Zalo user IDs to CLM users via admin-generated link codes

import { prisma } from "@/lib/prisma-client";
import { randomBytes } from "crypto";

// Generate a 6-char alphanumeric link code for admin to share with Zalo user
export async function generateLinkCode(orgId: string, userId: string): Promise<string> {
  const code = randomBytes(3).toString("hex").toUpperCase(); // e.g. "A3F2B1"

  // Upsert: if user already has a mapping, update the code
  await prisma.cmaZaloUserMapping.upsert({
    where: { orgId_zaloUserId: { orgId, zaloUserId: "__pending_" + userId } },
    create: { orgId, userId, zaloUserId: "__pending_" + userId, linkCode: code },
    update: { linkCode: code },
  });

  return code;
}

// Verify link code and create Zalo user → CLM user mapping
export async function verifyAndLink(
  orgId: string,
  zaloUserId: string,
  zaloName: string | undefined,
  code: string
): Promise<{ success: boolean; error?: string }> {
  // Find pending mapping with matching code
  const pending = await prisma.cmaZaloUserMapping.findFirst({
    where: { orgId, linkCode: code, zaloUserId: { startsWith: "__pending_" } },
  });

  if (!pending) return { success: false, error: "Invalid or expired link code" };

  // Update: replace pending placeholder with actual Zalo user ID
  await prisma.cmaZaloUserMapping.update({
    where: { id: pending.id },
    data: { zaloUserId, zaloName, linkCode: null, isActive: true },
  });

  return { success: true };
}

// Look up CLM userId from Zalo sender ID
export async function getLinkedUserId(orgId: string, zaloUserId: string): Promise<string | null> {
  const mapping = await prisma.cmaZaloUserMapping.findUnique({
    where: { orgId_zaloUserId: { orgId, zaloUserId } },
    select: { userId: true, isActive: true },
  });
  if (!mapping?.isActive) return null;
  return mapping.userId;
}
