"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cmaFetch, useCmaGet } from "@/lib/cma/use-cma-api";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { Loader2, Plus, Trash2, RefreshCw } from "lucide-react";

interface RssFeed {
  id: string;
  name: string;
  url: string;
  keywords: string[];
  language: string;
  fetchFrequency: string;
  isActive: boolean;
  lastFetchedAt: string | null;
  errorCount: number;
  lastError: string | null;
}

export default function CmaFeedsPage() {
  const { org } = useCmaOrg();
  const orgId = org?.id;
  const { data, loading, refetch } = useCmaGet<{ feeds: RssFeed[] }>(
    orgId ? `/api/cma/feeds?orgId=${orgId}` : null
  );

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [keywords, setKeywords] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const feeds = data?.feeds || [];

  async function handleAdd() {
    if (!orgId || !name.trim() || !url.trim()) {
      setError("Name and URL are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await cmaFetch("/api/cma/feeds", {
        method: "POST",
        body: JSON.stringify({
          orgId,
          name: name.trim(),
          url: url.trim(),
          keywords: keywords ? keywords.split(",").map((k) => k.trim()) : [],
          fetchFrequency: frequency,
        }),
      });
      setName("");
      setUrl("");
      setKeywords("");
      setShowForm(false);
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add feed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(feedId: string) {
    if (!orgId) return;
    try {
      await cmaFetch(`/api/cma/feeds/${feedId}?orgId=${orgId}`, { method: "DELETE" });
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  async function handleToggle(feed: RssFeed) {
    if (!orgId) return;
    try {
      await cmaFetch(`/api/cma/feeds/${feed.id}`, {
        method: "PUT",
        body: JSON.stringify({ orgId, isActive: !feed.isActive }),
      });
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed");
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">RSS Feeds</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> Add Feed
        </Button>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">{error}</div>
      )}

      {showForm && (
        <Card>
          <CardHeader><CardTitle>Add RSS Feed</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <input type="text" placeholder="Feed name" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm" />
            <input type="url" placeholder="Feed URL (https://...)" value={url} onChange={(e) => setUrl(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm" />
            <input type="text" placeholder="Keywords (comma-separated, optional)" value={keywords} onChange={(e) => setKeywords(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm" />
            <select value={frequency} onChange={(e) => setFrequency(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm">
              <option value="hourly">Hourly</option>
              <option value="every_6h">Every 6 hours</option>
              <option value="daily">Daily</option>
            </select>
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Save
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : feeds.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No RSS feeds configured. Add one to start curating content.</p>
      ) : (
        <div className="space-y-3">
          {feeds.map((feed) => (
            <Card key={feed.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{feed.name}</span>
                    <Badge variant={feed.isActive ? "default" : "secondary"}>
                      {feed.isActive ? "Active" : "Paused"}
                    </Badge>
                    {feed.errorCount > 0 && (
                      <Badge variant="destructive">Errors: {feed.errorCount}/5</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate max-w-md">{feed.url}</p>
                  {feed.keywords.length > 0 && (
                    <p className="text-xs text-muted-foreground">Keywords: {feed.keywords.join(", ")}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Frequency: {feed.fetchFrequency} | Last fetched: {feed.lastFetchedAt ? new Date(feed.lastFetchedAt).toLocaleString() : "Never"}
                  </p>
                  {feed.lastError && (
                    <p className="text-xs text-destructive">{feed.lastError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleToggle(feed)}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(feed.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
