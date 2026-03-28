import { getServerSession } from "next-auth";
import type { Session } from "next-auth";
import { authOptions } from "@/lib/auth-options";

/** Get authenticated admin session. Returns null if not admin/root. */
export async function getAdminSession(): Promise<Session | null> {
  const session = await getServerSession(authOptions);
  if (!session?.wpUser) return null;
  if (session.role !== "admin" && session.role !== "root") return null;
  return session;
}
