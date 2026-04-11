"use client";
// Admin page for the visual image template editor.
// Routes between a gallery-style landing view and the full-screen editor via
// `?mode=edit&id=X` / `?mode=new&platform=instagram` query params so the editor
// state is reflected in the URL and shareable.

import { Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageTemplateEditor } from "@/components/cma/image-template-editor/image-template-editor";

type PageMode = "gallery" | "new" | "edit";

function parseMode(value: string | null): PageMode {
  if (value === "new" || value === "edit") return value;
  return "gallery";
}

function ImageTemplatesPageInner() {
  const router = useRouter();
  const params = useSearchParams();

  const mode = parseMode(params.get("mode"));
  const templateId = params.get("id");
  const initialPlatform = params.get("platform") ?? undefined;

  const handleExit = useCallback(() => {
    router.push("/admin/cma/image-templates");
  }, [router]);

  // Full-screen editor mode — replaces the page chrome entirely.
  if (mode === "new" || mode === "edit") {
    return (
      <ImageTemplateEditor
        templateId={mode === "edit" ? templateId : null}
        initialPlatform={initialPlatform}
        onExit={handleExit}
      />
    );
  }

  // Gallery landing view — phase-13 will replace the placeholder with the
  // real grid + category sidebar. Phase-08 only renders a "Create new" CTA.
  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/cma">
          <button
            aria-label="Go back"
            className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Image Templates</h1>
          <p className="text-sm text-muted-foreground">
            Design branded social media graphics with the visual editor.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-dashed p-10 text-center space-y-4">
        <Sparkles className="h-8 w-8 mx-auto text-muted-foreground" />
        <div>
          <div className="font-medium">Template gallery coming in phase-13</div>
          <div className="text-sm text-muted-foreground mt-1">
            You can still open a blank editor right now.
          </div>
        </div>
        <Button
          onClick={() =>
            router.push("/admin/cma/image-templates?mode=new&platform=generic")
          }
        >
          Create new template
        </Button>
      </div>
    </div>
  );
}

export default function ImageTemplatesPage() {
  // useSearchParams() requires a Suspense boundary in the App Router.
  return (
    <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading editor…</div>}>
      <ImageTemplatesPageInner />
    </Suspense>
  );
}
