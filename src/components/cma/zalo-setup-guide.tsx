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

// Sub-component: login status + restart controls for personal mode
function ZaloPersonalLoginControls() {
  const [status, setStatus] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [checking, setChecking] = useState(false);
  const [restarting, setRestarting] = useState(false);
  const [sshCmd, setSshCmd] = useState<string | null>(null);

  async function checkStatus() {
    setChecking(true); setSshCmd(null);
    try {
      const res = await cmaFetch<{ loggedIn: boolean; status: string }>("/api/cma/settings/zalo/login");
      setLoggedIn(res.loggedIn);
      setStatus(res.status);
    } catch { setStatus("Failed to check status"); }
    finally { setChecking(false); }
  }

  async function handleLogin() {
    setChecking(true); setSshCmd(null);
    try {
      const res = await cmaFetch<{ success: boolean; loggedIn: boolean; message: string; sshCommand?: string }>(
        "/api/cma/settings/zalo/login", { method: "POST", body: JSON.stringify({ action: "login" }) }
      );
      setLoggedIn(res.loggedIn);
      setStatus(res.message);
      if (res.sshCommand) setSshCmd(res.sshCommand);
    } catch { setStatus("Login check failed"); }
    finally { setChecking(false); }
  }

  async function handleRestart() {
    setRestarting(true);
    try {
      const res = await cmaFetch<{ success: boolean; message: string }>(
        "/api/cma/settings/zalo/login", { method: "POST", body: JSON.stringify({ action: "restart" }) }
      );
      setStatus(res.message);
    } catch { setStatus("Restart failed"); }
    finally { setRestarting(false); }
  }

  return (
    <div className="space-y-2 rounded-md border p-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Connection Status</span>
        <div className="flex gap-1.5">
          <Button type="button" size="sm" variant="outline" onClick={checkStatus} disabled={checking}>
            {checking ? <Loader2 className="h-3 w-3 animate-spin" /> : "Check Status"}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={handleLogin} disabled={checking}>
            Start Login
          </Button>
          {loggedIn && (
            <Button type="button" size="sm" onClick={handleRestart} disabled={restarting}>
              {restarting ? <Loader2 className="h-3 w-3 animate-spin" /> : "Restart Listener"}
            </Button>
          )}
        </div>
      </div>
      {status && (
        <div className={`text-xs px-2 py-1 rounded ${loggedIn ? "bg-green-50 text-green-700" : "bg-muted text-muted-foreground"}`}>
          {loggedIn ? <><CheckCircle className="h-3 w-3 inline mr-1" />Logged in</> : status}
        </div>
      )}
      {sshCmd && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">QR login requires terminal. Run this command:</p>
          <code className="block text-[10px] bg-background border px-2 py-1.5 rounded break-all select-all">{sshCmd}</code>
          <p className="text-xs text-muted-foreground">After scanning QR, click &quot;Check Status&quot; → &quot;Restart Listener&quot;</p>
        </div>
      )}
    </div>
  );
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
                  <p className="font-medium">Personal mode uses OpenZCA (open-source CLI)</p>
                  <p>Uses a dedicated Zalo account. Session is single-device — don&apos;t open Zalo Web in browser while running.</p>
                </div>
              </div>

              <div className="rounded-md bg-muted px-3 py-2 text-xs space-y-1.5">
                <p className="font-medium text-sm">Setup Steps</p>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Install: <code className="bg-background px-1 rounded">npm install -g openzca@latest</code></li>
                  <li>Login: <code className="bg-background px-1 rounded">openzca auth login</code> → scan QR with Zalo</li>
                  <li>Start listener: <code className="bg-background px-1 rounded text-[10px]">openzca listen --webhook {webhookUrl} --keep-alive --raw</code></li>
                  <li>Fill in your Zalo ID below and save</li>
                </ol>
              </div>

              {/* Login status + controls */}
              <ZaloPersonalLoginControls />

              <div className="space-y-1">
                <label className="text-sm font-medium">Zalo Account ID</label>
                <input type="text" placeholder="Your personal Zalo user ID" value={config.selfId || ""}
                  onChange={(e) => setConfig({ ...config, selfId: e.target.value })}
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background" />
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
