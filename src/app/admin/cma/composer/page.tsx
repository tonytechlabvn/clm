"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cmaFetch, useCmaGet } from "@/lib/cma/use-cma-api";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { CmaMarkdownEditor } from "@/components/cma/cma-markdown-editor";
import { CmaPostMetaForm } from "@/components/cma/cma-post-meta-form";
import { Loader2, Save, Send } from "lucide-react";

interface PlatformAccount {
  id: string;
  platform: string;
  label: string;
  siteUrl: string | null;
}

export default function CmaComposerPage() {
  const router = useRouter();
  const { org } = useCmaOrg();
  const { data: accountsData } = useCmaGet<{ accounts: PlatformAccount[] }>("/api/cma/accounts");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [categories, setCategories] = useState("");
  const [tags, setTags] = useState("");
  const [accountId, setAccountId] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const accounts = accountsData?.accounts || [];

  async function handleSaveDraft() {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const post = await cmaFetch<{ id: string }>("/api/cma/posts", {
        method: "POST",
        body: JSON.stringify({
          orgId: org?.id,
          title,
          content,
          excerpt: excerpt || undefined,
          categories: categories ? categories.split(",").map((s) => s.trim()) : [],
          tags: tags ? tags.split(",").map((s) => s.trim()) : [],
        }),
      });
      router.push(`/admin/cma/posts/${post.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!accountId) { setError("Select a platform account first"); return; }
    if (!title.trim() || !content.trim()) { setError("Title and content are required"); return; }
    setPublishing(true);
    setError(null);
    try {
      // Save draft first, then publish
      const post = await cmaFetch<{ id: string }>("/api/cma/posts", {
        method: "POST",
        body: JSON.stringify({
          orgId: org?.id,
          title,
          content,
          excerpt: excerpt || undefined,
          categories: categories ? categories.split(",").map((s) => s.trim()) : [],
          tags: tags ? tags.split(",").map((s) => s.trim()) : [],
        }),
      });
      await cmaFetch(`/api/cma/posts/${post.id}/publish`, {
        method: "POST",
        body: JSON.stringify({ accountId, orgId: org?.id }),
      });
      router.push("/admin/cma/posts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Compose Post</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={saving || publishing}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Save Draft
          </Button>
          <Button onClick={handlePublish} disabled={saving || publishing || !accountId}>
            {publishing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
            Publish
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Post title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full text-2xl font-bold border-0 border-b bg-transparent px-0 py-2 focus:outline-none focus:border-primary"
          />
          <CmaMarkdownEditor value={content} onChange={setContent} />
        </div>

        <CmaPostMetaForm
          excerpt={excerpt}
          onExcerptChange={setExcerpt}
          categories={categories}
          onCategoriesChange={setCategories}
          tags={tags}
          onTagsChange={setTags}
          accountId={accountId}
          onAccountChange={setAccountId}
          accounts={accounts}
        />
      </div>
    </div>
  );
}
