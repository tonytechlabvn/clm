"use client";
// Fetches a persisted image template and hydrates the editor store. Handles
// three cases:
//   - templateId=null → seed a blank template (via createBlankTemplatePayload)
//   - templateId set, row is org-owned → load as-is
//   - templateId set, row is a system template → fork: keep layerData but
//     set meta.id=null and suffix name with "(Copy)" so the next save lands
//     as an org-owned draft, leaving the system original intact
//
// The hook returns a status string so the page can show a spinner while
// fetching and an error state on failure.

import { useEffect, useState } from "react";
import { useEditorStore } from "./image-template-editor-store";
import { createBlankTemplatePayload } from "./image-template-editor-defaults";
import type { LoadPayload } from "./image-template-editor-store-types";
import type { Layer } from "@/lib/cma/types/image-template-layer-types";
import type { VariableDefinition } from "@/lib/cma/types/image-template-types";

type Status = "idle" | "loading" | "ready" | "error";

interface ApiTemplateRow {
  id: string;
  name: string;
  platform: string;
  width: number;
  height: number;
  isSystem: boolean;
  authCode: string;
  layerData: {
    version?: number;
    backgroundColor?: string;
    layers?: Layer[];
  } | null;
  variableSchema: VariableDefinition[] | null;
}

interface UseTemplateLoaderArgs {
  orgId: string | undefined;
  templateId: string | null;
  initialPlatform?: string;
}

export function useTemplateLoader({
  orgId,
  templateId,
  initialPlatform,
}: UseTemplateLoaderArgs): { status: Status; error: string | null } {
  const loadTemplate = useEditorStore((s) => s.loadTemplate);
  const reset = useEditorStore((s) => s.reset);
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const hydrate = (payload: LoadPayload) => {
      loadTemplate(payload);
      useEditorStore.temporal.getState().clear();
      setStatus("ready");
    };

    // New-template mode: seed blank doc immediately, no network.
    if (templateId === null) {
      hydrate(createBlankTemplatePayload({ platform: initialPlatform }));
      return;
    }

    if (!orgId) {
      setStatus("loading");
      return;
    }

    const run = async () => {
      setStatus("loading");
      setError(null);
      try {
        const res = await fetch(
          `/api/cma/image-templates/${templateId}?orgId=${orgId}`
        );
        if (!res.ok) {
          throw new Error(`Failed to load template (${res.status})`);
        }
        const { data } = (await res.json()) as { data: ApiTemplateRow };
        if (cancelled) return;

        const layers = (data.layerData?.layers ?? []) as Layer[];
        const backgroundColor =
          data.layerData?.backgroundColor ?? "#ffffff";
        const variables = (data.variableSchema ?? []) as VariableDefinition[];

        // Fork system templates on load — keep content but break the link to
        // the original row so the next save creates an org-owned copy and
        // never accidentally mutates the shared starter.
        const isFork = data.isSystem;

        hydrate({
          id: isFork ? null : data.id,
          name: isFork ? `${data.name} (Copy)` : data.name,
          platform: data.platform,
          isSystem: false,
          width: data.width,
          height: data.height,
          backgroundColor,
          // Forked drafts have no public URL yet — server mints a new authCode
          // on first save. Non-forked edits keep the original so the existing
          // Direct URL stays valid.
          authCode: isFork ? null : data.authCode,
          layers,
          variables,
        });
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to load");
        setStatus("error");
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [orgId, templateId, initialPlatform, loadTemplate]);

  // Reset on unmount so the next editor session starts clean
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return { status, error };
}
