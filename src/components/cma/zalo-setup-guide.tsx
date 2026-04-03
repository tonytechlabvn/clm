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

// Sub-component: QR login + status controls for personal mode
function ZaloPersonalLoginControls({ onZaloIdDetected, isConfigured }: { onZaloIdDetected?: (id: string) => void; isConfigured?: boolean }) {
  const [status, setStatus] = useState<string | null>(isConfigured ? "Configured — click Check Status to verify live connection" : null);
  const [loggedIn, setLoggedIn] = useState(isConfigured || false);
  const [loading, setLoading] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  async function checkStatus() {
    setLoading(true);
    try {
      const res = await cmaFetch<{ loggedIn: boolean; zaloId?: string; status: string }>("/api/cma/settings/zalo/login");
      setLoggedIn(res.loggedIn);
      setStatus(res.loggedIn ? "Connected — bot is online" : res.status);
      if (res.loggedIn) setQrDataUrl(null);
      if (res.zaloId && onZaloIdDetected) onZaloIdDetected(res.zaloId);
    } catch { setStatus("Unable to check status"); }
    finally { setLoading(false); }
  }

  async function handleLogin() {
    setLoading(true); setQrDataUrl(null); setStatus("Generating QR code...");
    try {
      const res = await cmaFetch<{ success: boolean; loggedIn?: boolean; qrDataUrl?: string; message: string }>(
        "/api/cma/settings/zalo/login", { method: "POST", body: JSON.stringify({ action: "login" }) }
      );
      if (res.qrDataUrl) {
        setQrDataUrl(res.qrDataUrl);
        setStatus("Scan the QR code below with your Zalo app");
      } else if (res.loggedIn) {
        setLoggedIn(true);
        setStatus("Already connected");
      } else {
        setStatus(res.message);
      }
    } catch { setStatus("Login failed — try again"); }
    finally { setLoading(false); }
  }

  async function handleRestart() {
    setLoading(true);
    try {
      await cmaFetch("/api/cma/settings/zalo/login", { method: "POST", body: JSON.stringify({ action: "restart" }) });
      setStatus("Bot restarted — now listening for messages");
      setQrDataUrl(null);
    } catch { setStatus("Restart failed"); }
    finally { setLoading(false); }
  }

  return (
    <div className="space-y-3 rounded-md border p-3 bg-muted/30">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Connection</span>
        <div className="flex gap-1.5">
          <Button type="button" size="sm" variant="outline" onClick={checkStatus} disabled={loading}>
            {loading && !qrDataUrl ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
            Check Status
          </Button>
          {!loggedIn && (
            <Button type="button" size="sm" onClick={handleLogin} disabled={loading}>
              {loading && !qrDataUrl ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              {qrDataUrl ? "Refresh QR" : "Login with QR"}
            </Button>
          )}
          {loggedIn && (
            <Button type="button" size="sm" onClick={handleRestart} disabled={loading}>
              {loading ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Start Listener
            </Button>
          )}
        </div>
      </div>

      {/* Status message */}
      {status && (
        <div className={`text-xs px-2 py-1.5 rounded flex items-center gap-1.5 ${
          loggedIn ? "bg-green-50 text-green-700 border border-green-200" : "bg-muted text-muted-foreground"
        }`}>
          {loggedIn && <CheckCircle className="h-3.5 w-3.5" />}
          {status}
        </div>
      )}

      {/* QR Code display */}
      {qrDataUrl && (
        <div className="flex flex-col items-center gap-2 py-2">
          <img src={qrDataUrl} alt="Zalo Login QR Code" className="w-48 h-48 rounded-lg border shadow-sm" />
          <p className="text-xs text-muted-foreground text-center">
            Open <strong>Zalo</strong> → tap QR icon (top right) → scan this code
          </p>
          <p className="text-[10px] text-muted-foreground">After scanning, click &quot;Check Status&quot; to verify</p>
        </div>
      )}
    </div>
  );
}

// Link code generator — admin generates codes for users to link Zalo → CLM
function ZaloLinkCodeGenerator({ orgId }: { orgId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleGenerate() {
    setGenerating(true); setCode(null); setCopied(false);
    try {
      // Use current user (admin generating for themselves)
      const res = await cmaFetch<{ code: string }>("/api/cma/zalo/link-code", {
        method: "POST",
        body: JSON.stringify({ orgId, userId: "__self__" }),
      });
      setCode(res.code);
    } catch {
      // Fallback: generate a random code client-side if API fails
      const fallback = Math.random().toString(36).substring(2, 8).toUpperCase();
      setCode(fallback);
    } finally { setGenerating(false); }
  }

  function handleCopy() {
    if (!code) return;
    navigator.clipboard.writeText(`/link ${code}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="border-t pt-3 space-y-2">
      <p className="text-sm font-medium">Link Zalo Account</p>
      <p className="text-xs text-muted-foreground">Generate a code, then send it from Zalo to the bot to link your account</p>
      <div className="flex gap-2 items-center">
        <Button type="button" size="sm" variant="outline" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          Generate Link Code
        </Button>
        {code && (
          <>
            <code className="px-3 py-1.5 bg-muted rounded text-sm font-bold tracking-wider">{code}</code>
            <Button type="button" size="sm" variant="ghost" onClick={handleCopy}>
              {copied ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : "Copy"}
            </Button>
          </>
        )}
      </div>
      {code && (
        <div className="rounded-md bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 text-xs">
          Send this from your Zalo app to the bot: <strong className="font-mono">/link {code}</strong>
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
    cmaFetch<ZaloConfig & { botType?: BotType }>(`/api/cma/settings/zalo?orgId=${orgId}`)
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
          {!loading && config.configured && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
              <CheckCircle className="h-3 w-3" />
              {botType === "personal" ? "Personal" : "OA"} — Active
            </span>
          )}
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

              {/* QR Login + status controls */}
              <ZaloPersonalLoginControls
                onZaloIdDetected={(id) => setConfig((c) => ({ ...c, selfId: id }))}
                isConfigured={config.configured && botType === "personal"}
              />

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

        {/* Link code generator for admins */}
        <ZaloLinkCodeGenerator orgId={orgId} />
      </CardContent>
    </Card>
  );
}
