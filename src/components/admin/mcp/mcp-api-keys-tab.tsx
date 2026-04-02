"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cmaFetch } from "@/lib/cma/use-cma-api";
import { McpCreateKeyDialog } from "./mcp-create-key-dialog";
import {
  Plus, Trash2, Cable, Loader2, Key, Activity, ShieldCheck,
} from "lucide-react";

export interface ApiKeyRow {
  id: string;
  name: string;
  keyPrefix: string;
  isActive: boolean;
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface McpApiKeysTabProps {
  orgId: string;
  keys: ApiKeyRow[];
  loading: boolean;
  refetch: () => void;
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "Never";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function getKeyStatus(key: ApiKeyRow) {
  if (!key.isActive) return { label: "Revoked", variant: "destructive" as const };
  if (key.expiresAt && new Date(key.expiresAt) < new Date())
    return { label: "Expired", variant: "secondary" as const };
  return { label: "Active", variant: "default" as const };
}

export function McpApiKeysTab({ orgId, keys, loading, refetch }: McpApiKeysTabProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sort: most recently used first, nulls last
  const sortedKeys = [...keys].sort((a, b) => {
    if (!a.lastUsedAt && !b.lastUsedAt) return 0;
    if (!a.lastUsedAt) return 1;
    if (!b.lastUsedAt) return -1;
    return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
  });

  const activeCount = keys.filter(
    (k) => k.isActive && (!k.expiresAt || new Date(k.expiresAt) > new Date())
  ).length;
  const lastActivity = keys
    .map((k) => k.lastUsedAt)
    .filter((d): d is string => !!d)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    .pop() ?? null;

  async function handleRevoke(keyId: string) {
    if (!confirm("Revoke this API key? This action cannot be undone.")) return;
    setRevoking(keyId);
    setError(null);
    try {
      await cmaFetch(`/api/cma/api-keys?keyId=${keyId}&orgId=${orgId}`, { method: "DELETE" });
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to revoke key");
    } finally {
      setRevoking(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">{error}</div>
      )}

      {/* Activity Summary Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <Key className="h-5 w-5 text-muted-foreground" />
            <div>
              <p className="text-2xl font-bold">{keys.length}</p>
              <p className="text-xs text-muted-foreground">Total Keys</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-2xl font-bold">{activeCount}</p>
              <p className="text-xs text-muted-foreground">Active Keys</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4 flex items-center gap-3">
            <Activity className="h-5 w-5 text-blue-600" />
            <div>
              <p className="text-2xl font-bold">{relativeTime(lastActivity ?? null)}</p>
              <p className="text-xs text-muted-foreground">Last Activity</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header + Create Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">API Keys</h3>
        <Button size="sm" onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-1" /> Create API Key
        </Button>
      </div>

      <McpCreateKeyDialog
        orgId={orgId}
        open={showCreateDialog}
        onClose={(created) => {
          setShowCreateDialog(false);
          if (created) refetch();
        }}
      />

      {/* Key Table */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : sortedKeys.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Cable className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No API keys yet</p>
            <p className="text-sm">Create a key to connect your MCP client.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-2 font-medium">Name</th>
                <th className="text-left px-4 py-2 font-medium">Key Prefix</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-left px-4 py-2 font-medium">Last Used</th>
                <th className="text-left px-4 py-2 font-medium">Expires</th>
                <th className="text-left px-4 py-2 font-medium">Created</th>
                <th className="text-right px-4 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedKeys.map((key) => {
                const status = getKeyStatus(key);
                return (
                  <tr key={key.id} className="border-t">
                    <td className="px-4 py-2 font-medium">{key.name}</td>
                    <td className="px-4 py-2 font-mono text-xs">{key.keyPrefix}...</td>
                    <td className="px-4 py-2">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{relativeTime(key.lastUsedAt)}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : "Never"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(key.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        disabled={!key.isActive || revoking === key.id}
                        onClick={() => handleRevoke(key.id)}
                      >
                        {revoking === key.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
