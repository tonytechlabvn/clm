"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cmaFetch, useCmaGet } from "@/lib/cma/use-cma-api";
import { AiProviderTabContent } from "@/components/settings/ai-provider-tab-content";
import { Loader2, Save, Zap, Check } from "lucide-react";

const PROVIDER_MODELS = {
  gemini: [
    { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro (65K output)" },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash (65K output)" },
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
    { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash Lite" },
  ],
  openai: [
    { id: "gpt-5.2", label: "GPT-5.2 (128K output)" },
    { id: "gpt-4o-mini", label: "GPT-4o Mini" },
    { id: "gpt-4o", label: "GPT-4o" },
    { id: "gpt-4-turbo", label: "GPT-4 Turbo" },
  ],
  claude: [
    { id: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
    { id: "claude-opus-4-20250514", label: "Claude Opus 4" },
    { id: "claude-3-5-sonnet-20241022", label: "Claude 3.5 Sonnet" },
  ],
  local: [
    { id: "llama3", label: "Llama 3" },
    { id: "mistral", label: "Mistral" },
    { id: "codellama", label: "Code Llama" },
  ],
};

type Provider = "gemini" | "openai" | "claude" | "local";
const TABS: { id: Provider; label: string }[] = [
  { id: "gemini", label: "Google Gemini" },
  { id: "openai", label: "OpenAI (ChatGPT)" },
  { id: "claude", label: "Anthropic Claude" },
  { id: "local", label: "Local LLM" },
];

interface SettingsData {
  activeProvider: Provider;
  gemini: { model: string; apiKey: string; hasKey: boolean };
  openai: { model: string; apiKey: string; hasKey: boolean };
  claude: { model: string; apiKey: string; hasKey: boolean };
  local: { model: string; apiKey: string; hasKey: boolean; baseUrl: string };
  unsplash: { apiKey: string; hasKey: boolean };
  maxTokensAnalysis: number;
  maxTokensRewrite: number;
}

export default function AiSettingsPage() {
  const { data, loading, refetch } = useCmaGet<SettingsData>("/api/settings/ai");
  const [tab, setTab] = useState<Provider>("gemini");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local form state
  const [active, setActive] = useState<Provider>("gemini");
  const [models, setModels] = useState({ gemini: "", openai: "", claude: "", local: "" });
  const [keys, setKeys] = useState({ gemini: "", openai: "", claude: "", local: "" });
  const [baseUrl, setBaseUrl] = useState("");
  const [unsplashKey, setUnsplashKey] = useState("");
  const [tokensAnalysis, setTokensAnalysis] = useState(4096);
  const [tokensRewrite, setTokensRewrite] = useState(16384);

  // Sync from server data
  useEffect(() => {
    if (!data) return;
    setActive(data.activeProvider);
    setTab(data.activeProvider);
    setModels({ gemini: data.gemini.model, openai: data.openai.model, claude: data.claude.model, local: data.local.model });
    setBaseUrl(data.local.baseUrl || "");
    setTokensAnalysis(data.maxTokensAnalysis);
    setTokensRewrite(data.maxTokensRewrite);
  }, [data]);

  const activeModelEntry = PROVIDER_MODELS[active]?.find((m) => m.id === models[active]);
  const activeModelLabel = activeModelEntry?.label || models[active] || "Not configured";
  const activeProviderLabel = TABS.find((t) => t.id === active)?.label || active;

  async function handleSave() {
    setSaving(true); setError(null); setSuccess(false);
    try {
      await cmaFetch("/api/settings/ai", {
        method: "PUT",
        body: JSON.stringify({
          activeProvider: active,
          gemini: { model: models.gemini, apiKey: keys.gemini || undefined },
          openai: { model: models.openai, apiKey: keys.openai || undefined },
          claude: { model: models.claude, apiKey: keys.claude || undefined },
          local: { model: models.local, apiKey: keys.local || undefined, baseUrl },
          unsplash: { apiKey: unsplashKey || undefined },
          maxTokensAnalysis: tokensAnalysis,
          maxTokensRewrite: tokensRewrite,
        }),
      });
      setKeys({ gemini: "", openai: "", claude: "", local: "" });
      setUnsplashKey(""); // clear key inputs
      setSuccess(true);
      refetch();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally { setSaving(false); }
  }

  if (loading) return <div className="p-6 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">A.I Settings</h1>
        <p className="text-sm text-muted-foreground">Manage AI providers, models, and token limits.</p>
      </div>

      {error && <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">{error}</div>}
      {success && <div className="rounded-md bg-green-50 text-green-700 px-4 py-3 text-sm">Settings saved successfully.</div>}

      {/* Active Model Banner */}
      <Card className="border-green-200 bg-green-50/50">
        <CardContent className="flex items-center justify-between py-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-green-600 uppercase">
              <Zap className="h-3 w-3" /> Active Model
            </div>
            <p className="text-lg font-bold mt-1">{activeModelLabel}</p>
            <p className="text-sm text-green-600">{activeProviderLabel}</p>
          </div>
          <div className="flex items-center gap-2 text-green-600">
            <Check className="h-4 w-4" /> Ready
          </div>
        </CardContent>
      </Card>

      {/* Provider Tabs */}
      <div className="flex border-b">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
            {active === t.id && <span className="ml-1.5 inline-block w-2 h-2 rounded-full bg-green-500" />}
            {active !== t.id && data?.[t.id]?.hasKey && <span className="ml-1.5 text-xs">🔑</span>}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AiProviderTabContent
        providerLabel={TABS.find((t) => t.id === tab)!.label}
        isActive={active === tab}
        model={models[tab]}
        onModelChange={(v) => setModels((prev) => ({ ...prev, [tab]: v }))}
        modelOptions={PROVIDER_MODELS[tab]}
        apiKey={keys[tab]}
        onApiKeyChange={(v) => setKeys((prev) => ({ ...prev, [tab]: v }))}
        maskedKey={data?.[tab]?.apiKey || ""}
        hasKey={data?.[tab]?.hasKey || false}
        onSetActive={() => {
          setActive(tab);
          // Auto-save active provider change immediately
          setSaving(true); setError(null);
          cmaFetch("/api/settings/ai", {
            method: "PUT",
            body: JSON.stringify({ activeProvider: tab }),
          }).then(() => {
            setSuccess(true);
            refetch();
            setTimeout(() => setSuccess(false), 3000);
          }).catch((err: unknown) => {
            setError(err instanceof Error ? err.message : "Failed to set active provider");
          }).finally(() => setSaving(false));
        }}
        baseUrl={tab === "local" ? baseUrl : undefined}
        onBaseUrlChange={tab === "local" ? setBaseUrl : undefined}
      />

      {/* External API Keys */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <h3 className="font-semibold">External API Keys</h3>
          <div>
            <label className="text-sm font-medium">Unsplash Access Key</label>
            <p className="text-xs text-muted-foreground mb-1">Required for stock photo search in the image picker.</p>
            <input
              type="password"
              value={unsplashKey}
              onChange={(e) => setUnsplashKey(e.target.value)}
              placeholder={data?.unsplash?.hasKey ? "••••" + " (key saved — enter new to replace)" : "Enter Unsplash Access Key"}
              className="w-full mt-1 rounded-md border px-3 py-2 text-sm"
            />
            {data?.unsplash?.hasKey && (
              <p className="text-xs text-green-600 mt-1">Key configured: {data.unsplash.apiKey}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Token Limits */}
      <Card>
        <CardContent className="py-4 space-y-3">
          <h3 className="font-semibold">Output Token Limits</h3>
          <p className="text-xs text-muted-foreground">Controls how many tokens the AI can output. Values are automatically clamped to each model&apos;s maximum limit at runtime.</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Analysis (max output tokens)</label>
              <input type="number" value={tokensAnalysis} onChange={(e) => setTokensAnalysis(parseInt(e.target.value) || 4096)}
                className="w-full mt-1 rounded-md border px-3 py-2" />
              <p className="text-xs text-muted-foreground mt-1">Default: 4,096</p>
            </div>
            <div>
              <label className="text-sm font-medium">Rewrite (max output tokens)</label>
              <input type="number" value={tokensRewrite} onChange={(e) => setTokensRewrite(parseInt(e.target.value) || 16384)}
                className="w-full mt-1 rounded-md border px-3 py-2" />
              <p className="text-xs text-muted-foreground mt-1">Default: 16,384</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Known limits: GPT-5.2 (128K) · Gemini 2.5 Pro/Flash (65K) · GPT-4o (16K) · Claude (8K) · Gemini 2.0 (8K). Values are clamped per model at runtime.</p>
        </CardContent>
      </Card>

      {/* Save */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}
