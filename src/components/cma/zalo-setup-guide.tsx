"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, MessageCircle, CheckCircle, AlertTriangle } from "lucide-react";
import { cmaFetch } from "@/lib/cma/use-cma-api";

type BotType = "oa" | "personal";

interface ZaloConfig {
  oaId: string;
  accessToken: string;
  refreshToken: string;
  isActive: boolean;
  configured: boolean;
  botType?: BotType;
  // Personal mode fields
  cookies?: string;
  imei?: string;
  userAgent?: string;
  selfId?: string;
}

export function ZaloSetupGuide({ orgId }: { orgId: string }) {
  const [botType, setBotType] = useState<BotType>("oa");
  const [config, setConfig] = useState<ZaloConfig>({ oaId: "", accessToken: "", refreshToken: "", isActive: false, configured: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!orgId) return;
    cmaFetch<ZaloConfig>(`/api/cma/settings/zalo?orgId=${orgId}`)
      .then((data) => { setConfig(data); if (data.botType) setBotType(data.botType); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [orgId]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null); setSuccess(false);
    try {
      await cmaFetch("/api/cma/settings/zalo", {
        method: "PUT",
        body: JSON.stringify({ orgId, botType, ...config }),
      });
      setSuccess(true);
      setConfig((c) => ({ ...c, configured: true, isActive: true }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally { setSaving(false); }
  }

  if (loading) return <Card><CardContent className="p-4"><Loader2 className="h-4 w-4 animate-spin" /></CardContent></Card>;

  const webhookUrl = `${typeof window !== "undefined" ? window.location.origin : "https://clm.tonytechlab.com"}/api/webhooks/zalo`;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-base">Zalo Bot Setup</CardTitle>
          {config.configured && <CheckCircle className="h-4 w-4 text-green-500" />}
        </div>
        <CardDescription>Configure Zalo bot for creating posts via messaging</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Bot type toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg w-fit">
          {([
            { key: "oa" as const, label: "Official Account (OA)" },
            { key: "personal" as const, label: "Personal Account" },
          ]).map(({ key, label }) => (
            <button key={key} type="button" onClick={() => setBotType(key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                botType === key ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >{label}</button>
          ))}
        </div>

        <form onSubmit={handleSave} className="space-y-3">
          {botType === "oa" ? (
            <>
              <div className="space-y-1">
                <label className="text-sm font-medium">OA ID</label>
                <input type="text" placeholder="Your Zalo OA ID" value={config.oaId}
                  onChange={(e) => setConfig({ ...config, oaId: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">OA Access Token</label>
                  <input type="password" placeholder="Enter OA Access Token" value={config.accessToken}
                    onChange={(e) => setConfig({ ...config, accessToken: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm bg-background" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">OA Refresh Token</label>
                  <input type="password" placeholder="Enter OA Refresh Token" value={config.refreshToken}
                    onChange={(e) => setConfig({ ...config, refreshToken: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm bg-background" />
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-md bg-amber-50 border border-amber-200 text-amber-800 px-3 py-2 text-xs flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Personal mode uses an unofficial library (zca-js)</p>
                  <p>Use a dedicated throwaway Zalo account. Session dies if Zalo Web is opened in browser. Ban risk exists.</p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Zalo Account ID</label>
                <input type="text" placeholder="Your personal Zalo user ID" value={config.selfId || ""}
                  onChange={(e) => setConfig({ ...config, selfId: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Cookies (from DevTools)</label>
                <textarea placeholder="Paste cookie JSON from Zalo Web DevTools..." value={config.cookies || ""}
                  onChange={(e) => setConfig({ ...config, cookies: e.target.value })}
                  rows={3} className="w-full rounded-md border px-3 py-2 text-sm bg-background resize-none font-mono" />
                <p className="text-xs text-muted-foreground">Open Zalo Web → DevTools → Application → Cookies → copy all as JSON</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-sm font-medium">IMEI</label>
                  <input type="text" placeholder="Device IMEI for zca-js" value={config.imei || ""}
                    onChange={(e) => setConfig({ ...config, imei: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm bg-background" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">User Agent</label>
                  <input type="text" placeholder="Browser User-Agent string" value={config.userAgent || ""}
                    onChange={(e) => setConfig({ ...config, userAgent: e.target.value })}
                    className="w-full rounded-md border px-3 py-2 text-sm bg-background" />
                </div>
              </div>
            </>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
          {success && <p className="text-sm text-green-600">Saved successfully</p>}
          <Button type="submit" size="sm" disabled={saving}>
            {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
            Save Zalo Config
          </Button>
        </form>

        {botType === "oa" && (
          <div className="border-t pt-3 space-y-2 text-sm">
            <p className="font-medium">Webhook URL</p>
            <code className="block text-xs bg-muted px-3 py-2 rounded break-all">{webhookUrl}</code>
            <p className="text-xs text-muted-foreground">Set this in your Zalo OA Developer settings. Set <code>ZALO_WEBHOOK_SECRET</code> env var to match.</p>
          </div>
        )}

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
