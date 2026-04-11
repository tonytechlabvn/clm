"use client";
// Top-level save flow for the editor. Wraps the pure saveTemplate helper
// with orgId resolution, the missing-variables confirm prompt, and local
// loading/error state so the top bar stays focused on presentation.
//
// Extracted from editor-top-bar.tsx to keep that file under the 200-LOC rule.

import { useCallback, useState } from "react";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { saveTemplate } from "@/lib/cma/editor/editor-save-handler";

interface UseEditorSaveOptions {
  onSaved?: (templateId: string) => void;
}

interface UseEditorSaveResult {
  save: () => void;
  saving: boolean;
  error: string | null;
  orgReady: boolean;
}

export function useEditorSave({
  onSaved,
}: UseEditorSaveOptions = {}): UseEditorSaveResult {
  const { org } = useCmaOrg();
  const setMeta = useEditorStore((s) => s.setMeta);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSave = useCallback(
    async (autoCreateMissingVars: boolean) => {
      if (!org?.id) {
        setError("Organization not loaded");
        return;
      }
      setSaving(true);
      setError(null);
      const state = useEditorStore.getState();

      const result = await saveTemplate(
        {
          meta: {
            id: state.meta.id,
            name: state.meta.name,
            platform: state.meta.platform,
            width: state.meta.width,
            height: state.meta.height,
            backgroundColor: state.meta.backgroundColor,
          },
          layers: state.layers,
          variables: state.variables,
        },
        { orgId: org.id, autoCreateMissingVars }
      );
      setSaving(false);

      if (result.ok) {
        if (state.meta.id === null) setMeta({ id: result.id });
        // setMeta flips isDirty — override back to clean to signal success
        useEditorStore.setState({ isDirty: false });
        onSaved?.(result.id);
        return;
      }

      if (result.kind === "missing-variables") {
        const proceed = window.confirm(
          `These variables are used but not declared:\n\n` +
            result.missing.map((n) => `  {{${n}}}`).join("\n") +
            `\n\nAuto-create them and save?`
        );
        if (proceed) {
          await runSave(true);
        }
        return;
      }

      setError(result.error);
    },
    [org?.id, onSaved, setMeta]
  );

  const save = useCallback(() => {
    void runSave(false);
  }, [runSave]);

  return { save, saving, error, orgReady: !!org?.id };
}
