"use client";

// Unsplash photo search panel — debounced search, 3-col grid, photographer attribution

import { useState, useEffect, useRef, useCallback } from "react";
import { Loader2, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { UnsplashPhoto } from "@/lib/cma/services/unsplash-service";

interface Props {
  orgId: string;
  onSelect: (url: string) => void;
}

interface SearchResult {
  results: UnsplashPhoto[];
  total: number;
}

export function CmaUnsplashSearchPanel({ orgId, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UnsplashPhoto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); setTotal(0); return; }
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ q, orgId, page: "1", perPage: "12" });
      const res = await fetch(`/api/cma/images/unsplash-search?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as SearchResult;
      setResults(data.results);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(query), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, runSearch]);

  async function handleUse(photo: UnsplashPhoto) {
    setDownloading(photo.id);
    setError(null);
    try {
      const res = await fetch("/api/cma/images/unsplash-download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId: photo.id, orgId }),
      });
      if (!res.ok) {
        const data = await res.json() as { error?: string };
        throw new Error(data.error ?? "Download failed");
      }
      const data = await res.json() as { url: string };
      onSelect(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search photos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-md border pl-9 pr-3 py-2 text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {!loading && results.length > 0 && (
        <>
          <p className="text-xs text-muted-foreground">{total.toLocaleString()} photos found</p>
          <div className="grid grid-cols-3 gap-2">
            {results.map((photo) => (
              <div key={photo.id} className="group relative rounded-md overflow-hidden border bg-muted aspect-square">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.urls.small}
                  alt={photo.alt_description ?? photo.description ?? "Unsplash photo"}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                  <a
                    href={photo.user.links.html}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white text-xs flex items-center gap-1 hover:underline line-clamp-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    {photo.user.name}
                  </a>
                  <Button
                    size="sm"
                    className="w-full h-7 text-xs"
                    disabled={downloading === photo.id}
                    onClick={() => handleUse(photo)}
                  >
                    {downloading === photo.id
                      ? <Loader2 className="h-3 w-3 animate-spin" />
                      : "Use"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!loading && query.trim() && results.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-6">No photos found for &ldquo;{query}&rdquo;</p>
      )}

      {!query.trim() && (
        <p className="text-sm text-muted-foreground text-center py-6">
          Type to search millions of free photos
        </p>
      )}
    </div>
  );
}
