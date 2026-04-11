"use client";
// Admin route for the visual image template editor. Three view modes:
//   - gallery (default): browse + search system + org templates
//   - new (?mode=new[&starter=id][&platform=X]): open editor with a blank
//     or forked starter template
//   - edit (?mode=edit&id=X): open editor for an existing template
//
// The wizard lives in-page (modal dialog) and funnels its selections back
// into the URL so bookmarking / back-button behave predictably.

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageTemplateEditor } from "@/components/cma/image-template-editor/image-template-editor";
import { ImageTemplateGallery } from "@/components/cma/image-template-editor/gallery/image-template-gallery";
import { NewTemplateWizard } from "@/components/cma/image-template-editor/gallery/new-template-wizard";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import type { GalleryTemplate } from "@/components/cma/image-template-editor/gallery/gallery-types";

type PageMode = "gallery" | "new" | "edit";

function parseMode(value: string | null): PageMode {
  if (value === "new" || value === "edit") return value;
  return "gallery";
}

function ImageTemplatesPageInner() {
  const router = useRouter();
  const params = useSearchParams();
  const { org } = useCmaOrg();

  const mode = parseMode(params.get("mode"));
  const templateId = params.get("id");
  const starterId = params.get("starter");
  const initialPlatform = params.get("platform") ?? undefined;

  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardTemplates, setWizardTemplates] = useState<GalleryTemplate[]>([]);

  // The wizard needs the same template list the gallery loads. Rather than
  // double-fetch we lazily pull it the first time the user opens the wizard.
  useEffect(() => {
    if (!wizardOpen || !org?.id || wizardTemplates.length > 0) return;
    void fetch(`/api/cma/image-templates?orgId=${org.id}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((body: { data: GalleryTemplate[] } | null) => {
        if (body) setWizardTemplates(body.data);
      });
  }, [wizardOpen, org?.id, wizardTemplates.length]);

  const handleExit = useCallback(() => {
    router.push("/admin/cma/image-templates");
  }, [router]);

  const handleNewTemplate = useCallback(() => {
    setWizardOpen(true);
  }, []);

  const handleEditTemplate = useCallback(
    (id: string) => {
      router.push(`/admin/cma/image-templates?mode=edit&id=${id}`);
    },
    [router]
  );

  const handlePickStarter = useCallback(
    (id: string | null) => {
      setWizardOpen(false);
      if (id) {
        router.push(`/admin/cma/image-templates?mode=edit&id=${id}`);
      } else {
        router.push(
          `/admin/cma/image-templates?mode=new${
            initialPlatform ? `&platform=${initialPlatform}` : ""
          }`
        );
      }
    },
    [router, initialPlatform]
  );

  if (mode === "new") {
    return (
      <ImageTemplateEditor
        templateId={null}
        initialPlatform={initialPlatform}
        onExit={handleExit}
      />
    );
  }

  if (mode === "edit" && templateId) {
    return (
      <ImageTemplateEditor
        templateId={templateId}
        initialPlatform={initialPlatform}
        onExit={handleExit}
      />
    );
  }

  // Gallery view (default)
  return (
    <>
      <ImageTemplateGallery
        onNewTemplate={handleNewTemplate}
        onEditTemplate={handleEditTemplate}
      />
      {wizardOpen && (
        <NewTemplateWizard
          templates={wizardTemplates}
          onClose={() => setWizardOpen(false)}
          onPickStarter={handlePickStarter}
        />
      )}
      {/* starterId is consumed elsewhere if needed — reserved for future use */}
      {starterId && null}
    </>
  );
}

export default function ImageTemplatesPage() {
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-muted-foreground">Loading…</div>}
    >
      <ImageTemplatesPageInner />
    </Suspense>
  );
}
