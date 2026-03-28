import { getServerSession } from "next-auth";
import type { Session } from "next-auth";

/** Get authenticated admin session. Returns null if not admin/root. */
export async function getAdminSession(): Promise<Session | null> {
  const session = await getServerSession();
  if (!session?.wpUser) return null;
  if (session.role !== "admin" && session.role !== "root") return null;
  return session;
}
