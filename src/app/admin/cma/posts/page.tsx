"use client";

// CMA Posts list — shows all posts with status filters, search, and actions

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Search,
  ExternalLink,
  Pencil,
  Trash2,
  RefreshCw,
} from "lucide-react";

interface PostItem {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  publishedAt: string | null;
  author: { id: string; name: string | null };
  platforms: {
    id: string;
    status: string;
    platformUrl: string | null;
    account: { platform: string; label: string };
  }[];
}

interface PostListResult {
  posts: PostItem[];
  total: number;
  page: number;
  totalPages: number;
}

const STATUS_FILTERS = ["all", "draft", "approved", "scheduled", "published", "failed"];

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  approved: "bg-blue-100 text-blue-700",
  scheduled: "bg-amber-100 text-amber-700",
  publishing: "bg-yellow-100 text-yellow-700",
  published: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function CmaPostsPage() {
  const { org, loading: orgLoading } = useCmaOrg();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    if (!org) return;
    setLoading(true);
    const params = new URLSearchParams({
      orgId: org.id,
      page: String(page),
      limit: "20",
    });
    if (status !== "all") params.set("status", status);
    if (search) params.set("search", search);

    try {
      const res = await fetch(`/api/cma/posts?${params}`);
      if (res.ok) {
        const data: PostListResult = await res.json();
        setPosts(data.posts);
        setTotal(data.total);
        setTotalPages(data.totalPages);
      }
    } finally {
      setLoading(false);
    }
  }, [org, page, status, search]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const handleDelete = async (id: string) => {
    if (!org || !confirm("Delete this post?")) return;
    const res = await fetch(`/api/cma/posts/${id}?orgId=${org.id}`, {
      method: "DELETE",
    });
    if (res.ok) fetchPosts();
  };

  if (orgLoading) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">
          No organization found. Create one in Settings first.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Marketing</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {total} post{total !== 1 ? "s" : ""} · {org.name}
          </p>
        </div>
        <Link href="/admin/cma/composer">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Post
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); }}
              className={`px-3 py-1.5 text-sm rounded-md capitalize transition-colors cursor-pointer ${
                status === s
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-1.5 text-sm border rounded-md bg-background"
          />
        </div>
        <button
          onClick={fetchPosts}
          className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors cursor-pointer"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Posts table */}
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Title</th>
              <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Platform</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Updated</th>
              <th className="text-right px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {posts.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  {loading ? "Loading..." : "No posts found"}
                </td>
              </tr>
            )}
            {posts.map((post) => (
              <tr key={post.id} className="hover:bg-muted/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/cma/posts/${post.id}`}
                    className="font-medium hover:underline"
                  >
                    {post.title || "Untitled"}
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    by {post.author?.name || "Unknown"}
                  </p>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  {post.platforms.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {post.platforms.map((p) => (
                        <span key={p.id} className="text-xs text-muted-foreground">
                          {p.account.label}
                          {p.platformUrl && (
                            <a
                              href={p.platformUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 inline-flex"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="secondary"
                    className={`text-xs capitalize ${statusColors[post.status] || ""}`}
                  >
                    {post.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                  {new Date(post.updatedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <Link href={`/admin/cma/posts/${post.id}`}>
                      <button className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-muted cursor-pointer">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                    </Link>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="h-7 w-7 flex items-center justify-center rounded text-muted-foreground hover:bg-red-50 hover:text-red-600 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
