"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, CheckCircle } from "lucide-react";
import { cmaFetch } from "@/lib/cma/use-cma-api";

interface ZaloConfig {
  oaId: string;
  accessToken: string;
  refreshToken: string;
  isActive: boolean;
  configured: boolean;
}

export function ZaloSetupGuide({ orgId }: { orgId: string }) {
  const [config, setConfig] = useState<ZaloConfig>({ oaId: "", accessToken: "", refreshToken: "", isActive: false, configured: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    cmaFetch<ZaloConfig>(`/api/cma/settings/zalo?orgId=${orgId}`)
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
      await cmaFetch("/api/cma/settings/zalo", {
        method: "PUT",
        body: JSON.stringify({ orgId, ...config }),
      });
      setSuccess(true);
      setConfig((c) => ({ ...c, configured: true, isActive: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Card><CardContent className="p-4"><Loader2 className="h-4 w-4 animate-spin" /></CardContent></Card>;

  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : "https://clm.tonytechlab.com"}/api/webhooks/zalo`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-base">Zalo OA Bot Setup</CardTitle>
          {config.configured && <CheckCircle className="h-4 w-4 text-green-500" />}
        </div>
        <CardDescription>Configure your Zalo Official Account for bot messaging</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSave} className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">OA ID</label>
            <input
              type="text"
              placeholder="Your Zalo OA ID"
              value={config.oaId}
              onChange={(e) => setConfig({ ...config, oaId: e.target.value })}
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">OA Access Token</label>
              <input
                type="password"
                placeholder="Enter OA Access Token"
                value={config.accessToken}
                onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">OA Refresh Token</label>
              <input
                type="password"
                placeholder="Enter OA Refresh Token"
                value={config.refreshToken}
                onChange={(e) => setConfig({ ...config, refreshToken: e.target.value })}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">Saved successfully</p>}
          <Button type="submit" size="sm" disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
            Save Zalo Config
          </Button>
        </form>

        <div className="border-t pt-3 space-y-2 text-sm">
          <p className="font-medium">Webhook URL</p>
          <code className="block text-xs bg-muted px-3 py-2 rounded break-all">{webhookUrl}</code>
          <p className="text-xs text-muted-foreground">Set this as the webhook URL in your Zalo OA Developer settings. Set <code>ZALO_WEBHOOK_SECRET</code> env var to match.</p>
        </div>

        <div className="border-t pt-3 text-sm">
          <p className="font-medium mb-1">Bot Commands</p>
          <div className="space-y-0.5 text-muted-foreground font-mono text-xs">
            <p><span className="text-foreground">/link &lt;CODE&gt;</span> — Link Zalo to CLM account</p>
            <p><span className="text-foreground">/help</span> — Show commands</p>
            <p><span className="text-foreground">any text</span> — Create a draft post</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
