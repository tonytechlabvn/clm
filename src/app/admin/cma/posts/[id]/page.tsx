"use client";

// CMA Post detail/edit — edit post content, publish to platform

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Save,
  Send,
  ExternalLink,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// Dynamic import for markdown editor (SSR-incompatible)
const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface PlatformAccount {
  id: string;
  platform: string;
  label: string;
  siteUrl: string | null;
  isActive: boolean;
}

interface PostPlatform {
  id: string;
  status: string;
  platformUrl: string | null;
  account: { id: string; platform: string; label: string };
}

interface PostDetail {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  categories: string[];
  tags: string[];
  status: string;
  publishError: string | null;
  publishedAt: string | null;
  platforms: PostPlatform[];
}

export default function CmaPostEditPage() {
  const params = useParams();
  const router = useRouter();
  const postId = params.id as string;
  const { org } = useCmaOrg();

  const [post, setPost] = useState<PostDetail | null>(null);
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState("");

  const fetchPost = useCallback(async () => {
    if (!org) return;
    const res = await fetch(`/api/cma/posts/${postId}?orgId=${org.id}`);
    if (res.ok) {
      const data: PostDetail = await res.json();
      setPost(data);
      setTitle(data.title);
      setContent(data.content);
      setExcerpt(data.excerpt || "");
      setCategories(data.categories.join(", "));
      setTags(data.tags.join(", "));
    }
  }, [org, postId]);

  const fetchAccounts = useCallback(async () => {
    const res = await fetch("/api/cma/accounts");
    if (res.ok) {
      const { accounts: list } = await res.json() as { accounts: PlatformAccount[] };
      const active = list.filter((a) => a.isActive);
      setAccounts(active);
      if (active.length > 0 && !selectedAccountId) {
        setSelectedAccountId(active[0].id);
      }
    }
  }, [selectedAccountId]);

  useEffect(() => {
    fetchPost();
    fetchAccounts();
  }, [fetchPost, fetchAccounts]);

  const handleSave = async () => {
    if (!org) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/cma/posts/${postId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: org.id,
          title,
          content,
          excerpt: excerpt || undefined,
          categories: categories ? categories.split(",").map((c) => c.trim()) : [],
          tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Save failed");
      } else {
        await fetchPost();
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!org || !selectedAccountId) return;
    setPublishing(true);
    setError("");
    try {
      const res = await fetch(`/api/cma/posts/${postId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId: selectedAccountId, orgId: org.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Publish failed");
      } else {
        await fetchPost();
      }
    } finally {
      setPublishing(false);
    }
  };

  const handlePreview = async () => {
    if (showPreview) {
      setShowPreview(false);
      return;
    }
    const res = await fetch("/api/cma/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (res.ok) {
      const data = await res.json();
      setPreviewHtml(data.html);
      setShowPreview(true);
    }
  };

  if (!post) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading post...</p>
      </div>
    );
  }

  const canEdit = post.status !== "publishing";
  const canPublish =
    ["draft", "approved", "failed"].includes(post.status) &&
    accounts.length > 0;

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/cma/posts">
          <button className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Edit Post</h1>
        </div>
        <Badge variant="secondary" className="capitalize">
          {post.status}
        </Badge>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {post.publishError && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-md text-sm">
          Last publish error: {post.publishError}
        </div>
      )}

      {/* Published links */}
      {post.platforms.filter((p) => p.platformUrl).length > 0 && (
        <div className="flex flex-wrap gap-2">
          {post.platforms
            .filter((p) => p.platformUrl)
            .map((p) => (
              <a
                key={p.id}
                href={p.platformUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                {p.account.label}
              </a>
            ))}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium mb-1">Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={!canEdit}
          className="w-full px-3 py-2 border rounded-md bg-background text-sm"
          placeholder="Post title"
        />
      </div>

      {/* Content editor */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-medium">Content (Markdown)</label>
          <button
            onClick={handlePreview}
            className="text-xs text-blue-600 hover:underline cursor-pointer"
          >
            {showPreview ? "Edit" : "Preview"}
          </button>
        </div>
        {showPreview ? (
          <div
            className="prose prose-sm max-w-none border rounded-md p-4 min-h-[300px] bg-white"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        ) : (
          <div data-color-mode="light">
            <MDEditor
              value={content}
              onChange={(val) => setContent(val || "")}
              height={400}
              preview="edit"
            />
          </div>
        )}
      </div>

      {/* Excerpt */}
      <div>
        <label className="block text-sm font-medium mb-1">Excerpt</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          disabled={!canEdit}
          rows={2}
          className="w-full px-3 py-2 border rounded-md bg-background text-sm resize-none"
          placeholder="Brief summary (optional)"
        />
      </div>

      {/* Categories & Tags */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Categories</label>
          <input
            type="text"
            value={categories}
            onChange={(e) => setCategories(e.target.value)}
            disabled={!canEdit}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            placeholder="Comma-separated"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            disabled={!canEdit}
            className="w-full px-3 py-2 border rounded-md bg-background text-sm"
            placeholder="Comma-separated"
          />
        </div>
      </div>

      {/* Publish target */}
      {canPublish && (
        <div>
          <label className="block text-sm font-medium mb-1">Publish to</label>
          <select
            value={selectedAccountId}
            onChange={(e) => setSelectedAccountId(e.target.value)}
            className="w-full sm:w-64 px-3 py-2 border rounded-md bg-background text-sm"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label} ({a.platform})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-2 border-t">
        <Button onClick={handleSave} disabled={saving || !canEdit} variant="outline" className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Draft
        </Button>
        {canPublish && (
          <Button onClick={handlePublish} disabled={publishing} className="gap-2">
            {publishing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            Publish
          </Button>
        )}
        {accounts.length === 0 && (
          <p className="text-sm text-muted-foreground">
            <Link href="/admin/cma/settings" className="text-blue-600 hover:underline">
              Connect a platform
            </Link>{" "}
            to publish
          </p>
        )}
      </div>
    </div>
  );
}
