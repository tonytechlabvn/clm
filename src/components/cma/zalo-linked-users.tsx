"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, User, Shield, ShieldOff } from "lucide-react";
import { cmaFetch } from "@/lib/cma/use-cma-api";

interface LinkedUser {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  zaloName: string;
  allowedAccountIds: string[];
  isActive: boolean;
  createdAt: string;
}

interface PlatformAccount {
  id: string;
  platform: string;
  label: string;
}

export function ZaloLinkedUsers({ orgId }: { orgId: string }) {
  const [users, setUsers] = useState<LinkedUser[]>([]);
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    cmaFetch<{ linkedUsers: LinkedUser[]; accounts: PlatformAccount[] }>(`/api/cma/zalo/users?orgId=${orgId}`)
      .then((res) => { setUsers(res.linkedUsers); setAccounts(res.accounts); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  async function toggleAccount(mappingId: string, accountId: string, currentIds: string[]) {
    setSaving(mappingId);
    const isAllowed = currentIds.length === 0 || currentIds.includes(accountId);
    let newIds: string[];

    if (currentIds.length === 0) {
      // Currently "all" — switching to explicit list minus this one
      newIds = accounts.filter((a) => a.id !== accountId).map((a) => a.id);
    } else if (isAllowed) {
      // Remove this account
      newIds = currentIds.filter((id) => id !== accountId);
    } else {
      // Add this account
      newIds = [...currentIds, accountId];
    }
    // If all accounts selected, set to empty (= all)
    if (newIds.length === accounts.length) newIds = [];

    try {
      await cmaFetch("/api/cma/zalo/users", {
        method: "PUT",
        body: JSON.stringify({ orgId, mappingId, allowedAccountIds: newIds }),
      });
      setUsers((prev) => prev.map((u) => u.id === mappingId ? { ...u, allowedAccountIds: newIds } : u));
    } catch {} finally { setSaving(null); }
  }

  async function toggleActive(mappingId: string, isActive: boolean) {
    setSaving(mappingId);
    try {
      await cmaFetch("/api/cma/zalo/users", {
        method: "PUT",
        body: JSON.stringify({ orgId, mappingId, isActive: !isActive }),
      });
      setUsers((prev) => prev.map((u) => u.id === mappingId ? { ...u, isActive: !isActive } : u));
    } catch {} finally { setSaving(null); }
  }

  if (loading) return <Loader2 className="h-4 w-4 animate-spin" />;
  if (users.length === 0) return <p className="text-xs text-muted-foreground">No linked users yet.</p>;

  return (
    <div className="border-t pt-3 space-y-2">
      <p className="text-sm font-medium">Linked Users & Permissions</p>
      <div className="space-y-2">
        {users.map((user) => {
          const allAllowed = user.allowedAccountIds.length === 0;
          return (
            <div key={user.id} className={`rounded-md border p-3 text-sm ${user.isActive ? "" : "opacity-50"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{user.userName}</span>
                  {user.zaloName && <span className="text-xs text-muted-foreground">({user.zaloName})</span>}
                </div>
                <div className="flex items-center gap-1.5">
                  {allAllowed && <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-100 text-green-700">All platforms</span>}
                  <Button type="button" size="sm" variant="ghost" onClick={() => toggleActive(user.id, user.isActive)}
                    disabled={saving === user.id} className="h-7 px-2">
                    {user.isActive ? <Shield className="h-3.5 w-3.5 text-green-600" /> : <ShieldOff className="h-3.5 w-3.5 text-red-500" />}
                  </Button>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {accounts.map((account) => {
                  const allowed = allAllowed || user.allowedAccountIds.includes(account.id);
                  return (
                    <button key={account.id} type="button"
                      onClick={() => toggleAccount(user.id, account.id, user.allowedAccountIds)}
                      disabled={saving === user.id}
                      className={`px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                        allowed
                          ? "bg-primary/10 text-primary border border-primary/30"
                          : "bg-muted text-muted-foreground border border-transparent"
                      }`}
                    >
                      {account.platform === "facebook" ? "FB" : "WP"}: {account.label}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
