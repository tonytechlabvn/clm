"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Settings2 } from "lucide-react";
import { cmaFetch } from "@/lib/cma/use-cma-api";

interface OrgSettings {
  publishingMode: string;
  autoPublishSources: string[];
  requireApprovalSources: string[];
  maxDraftsPerHour: number;
  maxDraftsPerDay: number;
  maxPublishesPerDay: number;
  minPublishGapMinutes: number;
}

const SOURCE_OPTIONS = [
  { value: "web", label: "Web Dashboard" },
  { value: "mcp", label: "MCP Server" },
  { value: "scheduler", label: "Scheduler" },
  { value: "zalo_bot", label: "Zalo Bot" },
];

export function PublishingModeSettings({ orgId }: { orgId: string }) {
  const [settings, setSettings] = useState<OrgSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orgId) return;
    cmaFetch<{ settings: OrgSettings }>(`/api/cma/settings/publishing?orgId=${orgId}`)
      .then((res) => setSettings(res.settings))
      .catch(() => setError("Failed to load settings"))
      .finally(() => setLoading(false));
  }, [orgId]);

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setError(null);
    try {
      const res = await cmaFetch<{ settings: OrgSettings }>("/api/cma/settings/publishing", {
        method: "PUT",
        body: JSON.stringify({ orgId, ...settings }),
      });
      setSettings(res.settings);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  function toggleSource(list: "autoPublishSources" | "requireApprovalSources", value: string) {
    if (!settings) return;
    const current = settings[list];
    const updated = current.includes(value) ? current.filter((s) => s !== value) : [...current, value];
    setSettings({ ...settings, [list]: updated });
  }

  if (loading) return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Loading settings...</div>;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          <CardTitle className="text-base">Publishing Mode</CardTitle>
        </div>
        <CardDescription>Configure how new posts are routed</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Mode</label>
          <div className="flex gap-3">
            {[{ value: "human_in_loop", label: "Approval Required" }, { value: "auto", label: "Auto Publish" }].map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="publishingMode"
                  checked={settings?.publishingMode === opt.value}
                  onChange={() => settings && setSettings({ ...settings, publishingMode: opt.value })}
                  className="accent-primary"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        {settings?.publishingMode === "auto" && (
          <div className="space-y-2">
            <label className="text-sm font-medium">Auto-publish sources</label>
            <div className="flex flex-wrap gap-3">
              {SOURCE_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={settings.autoPublishSources.includes(opt.value)} onChange={() => toggleSource("autoPublishSources", opt.value)} className="accent-primary" />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium">Always require approval from</label>
          <div className="flex flex-wrap gap-3">
            {SOURCE_OPTIONS.map((opt) => (
              <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer">
                <input type="checkbox" checked={settings?.requireApprovalSources.includes(opt.value) || false} onChange={() => toggleSource("requireApprovalSources", opt.value)} className="accent-primary" />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="space-y-2 border-t pt-3">
          <label className="text-sm font-medium">Rate Limits</label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { key: "maxDraftsPerHour" as const, label: "Drafts/hour" },
              { key: "maxDraftsPerDay" as const, label: "Drafts/day" },
              { key: "maxPublishesPerDay" as const, label: "Publishes/day" },
              { key: "minPublishGapMinutes" as const, label: "Publish gap (min)" },
            ]).map(({ key, label }) => (
              <div key={key} className="space-y-0.5">
                <label className="text-xs text-muted-foreground">{label}</label>
                <input type="number" min={1} value={settings?.[key] ?? 0}
                  onChange={(e) => settings && setSettings({ ...settings, [key]: parseInt(e.target.value) || 1 })}
                  className="w-full rounded-md border px-2 py-1 text-sm bg-background" />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />}
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
