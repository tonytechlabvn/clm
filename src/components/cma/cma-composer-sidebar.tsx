"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Image, Palette, FileText, Globe, Facebook } from "lucide-react";
import { getAvailableThemes } from "@/lib/cma/themes/theme-definitions";
import { FacebookContentPreview } from "./facebook-content-preview";

interface PlatformAccount {
  id: string;
  platform: string;
  label: string;
  siteUrl: string | null;
}

interface CmaComposerSidebarProps {
  // Featured image
  featuredImage?: string;
  onFeaturedImageClick?: () => void;
  // Theme
  styleTheme: string;
  onStyleThemeChange: (theme: string) => void;
  // Meta
  excerpt: string;
  onExcerptChange: (v: string) => void;
  categories: string;
  onCategoriesChange: (v: string) => void;
  tags: string;
  onTagsChange: (v: string) => void;
  // Platform
  accountId: string;
  onAccountChange: (v: string) => void;
  accounts: PlatformAccount[];
  // Content format indicator
  contentFormat?: "markdown" | "blocks" | "html";
  // Content for Facebook preview
  content?: string;
}

// Collapsible section wrapper
function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-4 py-3 text-sm font-medium hover:bg-muted/50 cursor-pointer"
      >
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        {title}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  );
}

const THEME_DESCRIPTIONS: Record<string, string> = {
  default: "Clean, minimal sans-serif layout",
  editorial: "Classic serif editorial style",
  tonytechlab: "Blue gradients, callouts, step badges — TonyTechLab brand",
};

export function CmaComposerSidebar({
  featuredImage,
  onFeaturedImageClick,
  styleTheme,
  onStyleThemeChange,
  excerpt,
  onExcerptChange,
  categories,
  onCategoriesChange,
  tags,
  onTagsChange,
  accountId,
  onAccountChange,
  accounts,
  contentFormat,
  content,
}: CmaComposerSidebarProps) {
  const themes = getAvailableThemes();
  const selectedAccount = accounts.find((a) => a.id === accountId);
  const isFacebook = selectedAccount?.platform === "facebook";

  return (
    <div className="border rounded-lg bg-background overflow-hidden">
      {/* Featured Image */}
      <Section title="Featured Image" icon={Image}>
        {featuredImage ? (
          <div className="relative group">
            <img src={featuredImage} alt="Featured" className="w-full h-32 object-cover rounded-md" />
            <button
              onClick={onFeaturedImageClick}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center text-white text-xs font-medium cursor-pointer"
            >
              Change Image
            </button>
          </div>
        ) : (
          <button
            onClick={onFeaturedImageClick}
            className="w-full h-24 border-2 border-dashed rounded-md flex items-center justify-center text-sm text-muted-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
          >
            + Add Featured Image
          </button>
        )}
      </Section>

      {/* Facebook preview — shown when FB account selected */}
      {isFacebook && content && (
        <Section title="Facebook Preview" icon={Facebook} defaultOpen={true}>
          <FacebookContentPreview content={content} contentFormat={contentFormat} />
        </Section>
      )}

      {/* Style Theme — WordPress only */}
      {!isFacebook && <Section title="Style Theme" icon={Palette}>
        <select
          value={styleTheme}
          onChange={(e) => onStyleThemeChange(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm bg-background"
        >
          {themes.map((t) => (
            <option key={t.name} value={t.name}>{t.label}</option>
          ))}
        </select>
        <p className="text-xs text-muted-foreground">
          {THEME_DESCRIPTIONS[styleTheme] || "Applied when publishing"}
        </p>
      </Section>}

      {/* Post Details — WordPress only (FB doesn't use categories/tags/excerpt) */}
      {!isFacebook && <Section title="Details" icon={FileText}>
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
        </div>
      </Section>}

      {/* Platform */}
      <Section title="Publish To" icon={Globe}>
        <select
          value={accountId}
          onChange={(e) => onAccountChange(e.target.value)}
          className="w-full rounded-md border px-3 py-2 text-sm bg-background"
        >
          <option value="">Select account...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>{a.label} ({a.platform})</option>
          ))}
        </select>
        {accounts.length === 0 && (
          <p className="text-xs text-muted-foreground">
            No accounts connected. Go to Settings → Connections.
          </p>
        )}
      </Section>
    </div>
  );
}
