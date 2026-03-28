"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ImageIcon, X } from "lucide-react";

interface PlatformAccount {
  id: string;
  platform: string;
  label: string;
  siteUrl: string | null;
}

interface Props {
  excerpt: string;
  onExcerptChange: (v: string) => void;
  categories: string;
  onCategoriesChange: (v: string) => void;
  tags: string;
  onTagsChange: (v: string) => void;
  accountId: string;
  onAccountChange: (v: string) => void;
  accounts: PlatformAccount[];
  featuredImage?: string;
  onFeaturedImageChange?: (url: string | undefined) => void;
  onOpenImagePicker?: () => void;
}

export function CmaPostMetaForm({
  excerpt, onExcerptChange,
  categories, onCategoriesChange,
  tags, onTagsChange,
  accountId, onAccountChange,
  accounts,
  featuredImage,
  onFeaturedImageChange,
  onOpenImagePicker,
}: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Featured Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {featuredImage ? (
            <div className="relative rounded-md overflow-hidden border">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={featuredImage} alt="Featured" className="w-full h-32 object-cover" />
              <button
                onClick={() => onFeaturedImageChange?.(undefined)}
                className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 hover:bg-black/80"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className="rounded-md border-2 border-dashed border-muted-foreground/30 h-24 flex items-center justify-center text-xs text-muted-foreground">
              No image selected
            </div>
          )}
          <Button variant="outline" size="sm" className="w-full" onClick={onOpenImagePicker}>
            <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
            {featuredImage ? "Change Image" : "Select Image"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Publish To</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <select
            value={accountId}
            onChange={(e) => onAccountChange(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm bg-background"
          >
            <option value="">Select account...</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label} ({a.platform})
              </option>
            ))}
          </select>
          {accounts.length === 0 && (
            <p className="text-xs text-muted-foreground">
              No accounts connected. Go to Settings to connect WordPress.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Post Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Excerpt</label>
            <textarea
              value={excerpt}
              onChange={(e) => onExcerptChange(e.target.value)}
              placeholder="Brief summary..."
              rows={3}
              className="w-full rounded-md border px-3 py-2 text-sm bg-background resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Categories</label>
            <input
              type="text"
              value={categories}
              onChange={(e) => onCategoriesChange(e.target.value)}
              placeholder="Tech, Education"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => onTagsChange(e.target.value)}
              placeholder="nextjs, react, tutorial"
              className="w-full rounded-md border px-3 py-2 text-sm bg-background"
            />
            <p className="text-xs text-muted-foreground">Comma-separated</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
