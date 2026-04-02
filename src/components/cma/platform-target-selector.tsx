"use client";

import { useEffect, useState } from "react";
import { cmaFetch } from "@/lib/cma/use-cma-api";
import { Loader2 } from "lucide-react";

interface PlatformAccount {
  id: string;
  platform: string;
  label: string;
  isActive: boolean;
}

interface Props {
  orgId: string;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const PLATFORM_ICONS: Record<string, string> = {
  wordpress: "WP",
  facebook: "FB",
};

// Checkbox list of connected platform accounts for publish targeting
export function PlatformTargetSelector({ orgId, selectedIds, onChange }: Props) {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orgId) return;
    cmaFetch<{ accounts: PlatformAccount[] }>("/api/cma/accounts")
      .then((res) => setAccounts(res.accounts.filter((a) => a.isActive)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  function toggleAccount(id: string) {
    const updated = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onChange(updated);
  }

  if (loading) return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
  if (accounts.length === 0) return <p className="text-xs text-muted-foreground">No platforms connected</p>;

  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium">Publish to</label>
      <div className="flex flex-wrap gap-2">
        {accounts.map((account) => (
          <label key={account.id} className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="checkbox"
              checked={selectedIds.includes(account.id)}
              onChange={() => toggleAccount(account.id)}
              className="accent-primary"
            />
            <span className="font-mono text-xs px-1 py-0.5 rounded bg-muted">
              {PLATFORM_ICONS[account.platform] || account.platform}
            </span>
            {account.label}
          </label>
        ))}
      </div>
    </div>
  );
}
