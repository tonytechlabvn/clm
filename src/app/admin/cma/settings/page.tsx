"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCmaGet, cmaFetch } from "@/lib/cma/use-cma-api";
import { Plug, Trash2, RefreshCw, Plus, Loader2, CheckCircle, XCircle } from "lucide-react";
import { ConnectWordPressForm } from "@/components/cma/connect-wordpress-form";
import { ConnectFacebookFlow } from "@/components/cma/connect-facebook-flow";
import { PublishingModeSettings } from "@/components/cma/publishing-mode-settings";
import { ZaloSetupGuide } from "@/components/cma/zalo-setup-guide";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";

interface PlatformAccount {
  id: string;
  platform: string;
  label: string;
  siteUrl: string | null;
  username: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function CmaSettingsPage() {
  const { org } = useCmaOrg();
  const { data, loading, refetch } = useCmaGet<{ accounts: PlatformAccount[] }>(
    "/api/cma/accounts"
  );
  const [showForm, setShowForm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function handleDisconnect(id: string) {
    if (!confirm("Disconnect this account?")) return;
    setActionLoading(id);
    try {
      await cmaFetch(`/api/cma/accounts/${id}`, { method: "DELETE" });
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to disconnect");
    } finally {
      setActionLoading(null);
    }
  }

  async function handleValidate(id: string) {
    setActionLoading(`validate-${id}`);
    try {
      const result = await cmaFetch<{ valid: boolean }>(`/api/cma/accounts/${id}`, { method: "PATCH" });
      alert(result.valid ? "Connection is valid" : "Connection failed — account deactivated");
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Validation failed");
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Platform Connections</h1>
          <p className="text-muted-foreground text-sm mt-1">Connect your publishing platforms</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" /> Connect Platform
        </Button>
      </div>

      {showForm && (
        <div className="space-y-3">
          <ConnectWordPressForm
            orgId={org?.id || ""}
            onSuccess={() => { setShowForm(false); refetch(); }}
            onCancel={() => setShowForm(false)}
          />
          <div className="flex items-center gap-3 px-1">
            <span className="text-sm text-muted-foreground">or</span>
            <ConnectFacebookFlow orgId={org?.id || ""} />
          </div>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading accounts...
        </div>
      )}

      {data?.accounts?.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Plug className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p>No platforms connected yet. Connect WordPress or Facebook to start publishing.</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {data?.accounts?.map((account) => (
          <Card key={account.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {account.isActive ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div>
                    <CardTitle className="text-base">{account.label}</CardTitle>
                    <CardDescription>
                      {account.platform} — {account.siteUrl || "N/A"}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleValidate(account.id)}
                    disabled={actionLoading === `validate-${account.id}`}
                  >
                    {actionLoading === `validate-${account.id}` ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect(account.id)}
                    disabled={actionLoading === account.id}
                    className="text-destructive hover:text-destructive"
                  >
                    {actionLoading === account.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {org?.id && <PublishingModeSettings orgId={org.id} />}
      {org?.id && <ZaloSetupGuide orgId={org.id} />}
    </div>
  );
}
