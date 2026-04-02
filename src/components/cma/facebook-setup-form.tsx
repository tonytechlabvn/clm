"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Facebook, CheckCircle } from "lucide-react";
import { cmaFetch } from "@/lib/cma/use-cma-api";

interface FbConfig {
  fbAppId: string;
  fbAppSecret: string;
  fbRedirectUri: string;
  configured: boolean;
}

export function FacebookSetupForm({ orgId }: { orgId: string }) {
  const [config, setConfig] = useState<FbConfig>({ fbAppId: "", fbAppSecret: "", fbRedirectUri: "", configured: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    cmaFetch<FbConfig>(`/api/cma/settings/facebook?orgId=${orgId}`)
      .then(setConfig)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await cmaFetch("/api/cma/settings/facebook", {
        method: "PUT",
        body: JSON.stringify({ orgId, ...config }),
      });
      setSuccess(true);
      setConfig((c) => ({ ...c, configured: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Card><CardContent className="p-4"><Loader2 className="h-4 w-4 animate-spin" /></CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Facebook className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-base">Facebook App Setup</CardTitle>
          {config.configured && <CheckCircle className="h-4 w-4 text-green-500" />}
        </div>
        <CardDescription>Configure your Facebook App credentials for OAuth and publishing</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSave} className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">App ID</label>
              <input
                type="text"
                placeholder="123456789012345"
                value={config.fbAppId}
                onChange={(e) => setConfig({ ...config, fbAppId: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">App Secret</label>
              <input
                type="password"
                placeholder="Enter App Secret"
                value={config.fbAppSecret}
                onChange={(e) => setConfig({ ...config, fbAppSecret: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium">Redirect URI</label>
            <input
              type="url"
              placeholder={`${window.location.origin}/api/cma/facebook/callback`}
              value={config.fbRedirectUri}
              onChange={(e) => setConfig({ ...config, fbRedirectUri: e.target.value })}
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            />
            <p className="text-xs text-muted-foreground">Must match the redirect URI in your Facebook App settings</p>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">Saved successfully</p>}
          <Button type="submit" size="sm" disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
            Save Facebook Config
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
