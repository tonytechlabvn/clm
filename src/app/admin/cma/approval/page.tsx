"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cmaFetch, useCmaGet } from "@/lib/cma/use-cma-api";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { Loader2, Check, X, ExternalLink, Bot } from "lucide-react";

interface ApprovalPost {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  sourceUrl: string | null;
  aiGenerated: boolean;
  tags: string[];
  createdAt: string;
  author: { name: string | null; email: string | null };
  children: { id: string; title: string; content: string; status: string }[];
}

export default function CmaApprovalPage() {
  const { org } = useCmaOrg();
  const orgId = org?.id;
  const { data, loading, refetch } = useCmaGet<{ posts: ApprovalPost[]; total: number }>(
    orgId ? `/api/cma/approval?orgId=${orgId}` : null
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);
  const [selfAck, setSelfAck] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const posts = data?.posts || [];

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function selectAll() {
    if (selected.size === posts.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(posts.map((p) => p.id)));
    }
  }

  async function handleAction(action: "approve" | "reject") {
    if (!orgId || selected.size === 0) return;
    setProcessing(true);
    setError(null);
    try {
      await cmaFetch("/api/cma/approval", {
        method: "POST",
        body: JSON.stringify({
          orgId,
          postIds: Array.from(selected),
          action,
          selfApprovalAck: selfAck,
        }),
      });
      setSelected(new Set());
      refetch();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Approval Queue</h1>
          <p className="text-sm text-muted-foreground">{data?.total || 0} posts pending review</p>
        </div>
        {posts.length > 0 && (
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={selfAck} onChange={(e) => setSelfAck(e.target.checked)} />
              I reviewed this AI content
            </label>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selected.size === posts.length ? "Deselect All" : "Select All"}
            </Button>
            <Button size="sm" onClick={() => handleAction("approve")} disabled={processing || selected.size === 0}>
              {processing ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Check className="h-4 w-4 mr-1" />}
              Approve ({selected.size})
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleAction("reject")} disabled={processing || selected.size === 0}>
              <X className="h-4 w-4 mr-1" /> Reject ({selected.size})
            </Button>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">{error}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : posts.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">No posts pending review.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className={selected.has(post.id) ? "ring-2 ring-primary" : ""}>
              <CardContent className="py-4">
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={selected.has(post.id)}
                    onChange={() => toggleSelect(post.id)} className="mt-1" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{post.title}</span>
                      {post.aiGenerated && (
                        <Badge variant="secondary"><Bot className="h-3 w-3 mr-1" /> AI</Badge>
                      )}
                    </div>
                    {post.sourceUrl && (
                      <a href={post.sourceUrl} target="_blank" rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:underline flex items-center gap-1 mb-2">
                        <ExternalLink className="h-3 w-3" /> Source
                      </a>
                    )}
                    {post.tags.length > 0 && (
                      <div className="flex gap-1 mb-2">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    )}
                    <button onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}
                      className="text-xs text-muted-foreground hover:text-foreground">
                      {expandedId === post.id ? "Hide preview" : "Show preview"}
                    </button>
                    {expandedId === post.id && (
                      <div className="mt-3 p-3 bg-muted/50 rounded-md text-sm whitespace-pre-wrap max-h-64 overflow-auto">
                        {post.content}
                      </div>
                    )}
                    {post.children.length > 0 && expandedId === post.id && (
                      <div className="mt-2 space-y-2">
                        {post.children.map((child) => (
                          <div key={child.id} className="p-2 bg-muted/30 rounded text-xs">
                            <span className="font-medium">{child.title}</span>
                            <p className="mt-1 text-muted-foreground">{child.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
