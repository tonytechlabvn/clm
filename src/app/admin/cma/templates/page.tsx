"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, FileText, Plus } from "lucide-react";
import Link from "next/link";

interface Template {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string;
  styleTheme: string;
  orgId: string | null;
  isDefault: boolean;
}

const CATEGORY_TABS = ["all", "tutorial", "news", "announce"] as const;

export default function CmaTemplateGalleryPage() {
  const router = useRouter();
  const { org } = useCmaOrg();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("all");

  useEffect(() => {
    if (!org?.id) return;
    fetch(`/api/cma/templates?orgId=${org.id}`)
      .then((res) => res.json())
      .then((data) => setTemplates(data.templates || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [org?.id]);

  const filtered = activeCategory === "all"
    ? templates
    : templates.filter((t) => t.category === activeCategory);

  function handleUseTemplate(template: Template) {
    // Navigate to composer with template query param
    router.push(`/admin/cma/composer?templateId=${template.id}`);
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/cma">
          <button className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Template Gallery</h1>
          <p className="text-sm text-muted-foreground">Choose a template to start your post</p>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 border-b">
        {CATEGORY_TABS.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize cursor-pointer ${
              activeCategory === cat
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="border rounded-lg p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p>No templates in this category</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Blank post card */}
          <button
            onClick={() => router.push("/admin/cma/composer")}
            className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center gap-2 hover:border-primary hover:text-primary transition-colors min-h-[180px] cursor-pointer"
          >
            <Plus className="h-8 w-8" />
            <span className="text-sm font-medium">Blank Post</span>
            <span className="text-xs text-muted-foreground">Start from scratch</span>
          </button>

          {/* Template cards */}
          {filtered.map((template) => (
            <div
              key={template.id}
              className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-sm">{template.name}</h3>
                <Badge variant="secondary" className="text-[10px] capitalize">
                  {template.category}
                </Badge>
              </div>
              {template.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              )}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[10px] text-muted-foreground">
                  {template.orgId ? "Custom" : "System"} · {template.styleTheme}
                </span>
                <Button size="sm" variant="outline" onClick={() => handleUseTemplate(template)}>
                  Use Template
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
