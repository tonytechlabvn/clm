"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Globe, LayoutGrid } from "lucide-react";
import Link from "next/link";
import { TemplateStudioGallery } from "@/components/cma/template-studio-gallery";
import { TemplateExtractWizard } from "@/components/cma/template-extract-wizard";

type StudioView = "gallery" | "extract";

export default function CmaTemplateStudioPage() {
  const router = useRouter();
  const [view, setView] = useState<StudioView>("gallery");

  function handleUseTemplate(id: string) {
    router.push(`/admin/cma/composer?templateId=${id}`);
  }

  function handleEditTemplate(id: string) {
    // TODO: open template editor view
    console.log("Edit template:", id);
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/cma">
          <button className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-bold">Template Studio</h1>
          <p className="text-sm text-muted-foreground">
            Create, manage, and extract reusable content templates
          </p>
        </div>
        <div className="flex gap-1">
          <Button
            variant={view === "gallery" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("gallery")}
          >
            <LayoutGrid className="h-4 w-4 mr-1" /> Gallery
          </Button>
          <Button
            variant={view === "extract" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("extract")}
          >
            <Globe className="h-4 w-4 mr-1" /> Extract from URL
          </Button>
        </div>
      </div>

      {/* View */}
      {view === "gallery" && (
        <TemplateStudioGallery
          onUseTemplate={handleUseTemplate}
          onEditTemplate={handleEditTemplate}
          onExtractNew={() => setView("extract")}
        />
      )}
      {view === "extract" && (
        <TemplateExtractWizard
          onBack={() => setView("gallery")}
          onComplete={() => setView("gallery")}
        />
      )}
    </div>
  );
}
