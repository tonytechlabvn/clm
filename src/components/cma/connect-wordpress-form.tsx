"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cmaFetch } from "@/lib/cma/use-cma-api";
import { Loader2 } from "lucide-react";

interface Props {
  orgId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ConnectWordPressForm({ orgId, onSuccess, onCancel }: Props) {
  const [siteUrl, setSiteUrl] = useState("");
  const [username, setUsername] = useState("");
  const [appPassword, setAppPassword] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await cmaFetch("/api/cma/accounts", {
        method: "POST",
        body: JSON.stringify({
          orgId,
          platform: "wordpress",
          siteUrl: siteUrl.replace(/\/+$/, ""),
          username,
          accessToken: appPassword,
          label: label || new URL(siteUrl).hostname,
        }),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Connect WordPress Site</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Site URL</label>
              <input
                type="url"
                required
                placeholder="https://example.com"
                value={siteUrl}
                onChange={(e) => setSiteUrl(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Label</label>
              <input
                type="text"
                placeholder="My WordPress Site"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Username</label>
              <input
                type="text"
                required
                placeholder="wp-editor"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Application Password</label>
              <input
                type="password"
                required
                placeholder="xxxx xxxx xxxx xxxx xxxx xxxx"
                value={appPassword}
                onChange={(e) => setAppPassword(e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm bg-background"
              />
            </div>
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Test & Connect
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
