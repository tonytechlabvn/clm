"use client";
// Direct URL panel — APITemplate.io-style preview of the public URL.
// Lists every dynamic field declared on a layer, shows the live `?fieldName.prop=value`
// query string with a copy button, and explains which layers are unlocked
// vs static. Empty state prompts the author to mark at least one layer dynamic.
//
// The URL is built against the current editor state (no network), so it
// reflects unsaved edits. After a save, the authCode populates from the
// server response and the URL becomes shareable.

import { useMemo, useState } from "react";
import { Copy, Check, AlertCircle } from "lucide-react";
import { useEditorStore } from "@/lib/cma/editor/image-template-editor-store";
import {
  collectDynamicFields,
  type DynamicFieldEntry,
} from "@/lib/cma/editor/extract-layer-variables";

function buildUrl(
  templateId: string,
  authCode: string,
  fields: DynamicFieldEntry[],
  origin: string
): string {
  const params = new URLSearchParams({ auth: authCode });
  for (const f of fields) {
    // Default value of the layer makes a realistic preview; author replaces
    // it on the call site. Skip empty defaults so the URL stays tidy.
    if (f.defaultValue) params.set(f.fullName, f.defaultValue);
  }
  return `${origin}/api/cma/image-templates/${templateId}/image?${params.toString()}`;
}

export function DirectUrlPanel() {
  const meta = useEditorStore((s) => s.meta);
  const layers = useEditorStore((s) => s.layers);
  const [copied, setCopied] = useState(false);

  const dynamicFields = useMemo(() => collectDynamicFields(layers), [layers]);

  // `window.location.origin` is only available in the browser — guard SSR
  // just in case the panel renders during hydration.
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  const url =
    meta.id && meta.authCode
      ? buildUrl(meta.id, meta.authCode, dynamicFields, origin)
      : null;

  const handleCopy = async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard permission denied — fall back silently; the URL is still
      // visible in the textarea for the user to select manually.
    }
  };

  return (
    <div className="p-3 space-y-3 overflow-y-auto text-xs">
      <section>
        <h4 className="text-xs font-semibold mb-2">Direct URL</h4>
        <p className="text-[11px] text-muted-foreground mb-2">
          APITemplate.io-style URL. Locked layers render their static content;
          dynamic (unlocked) layers accept overrides via dotted query keys.
        </p>

        {!meta.id && (
          <div className="flex gap-1.5 p-2 rounded border border-dashed text-[11px] text-muted-foreground">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              Save the template first to mint the auth code and generate a
              shareable Direct URL.
            </span>
          </div>
        )}

        {meta.id && !meta.authCode && (
          <div className="flex gap-1.5 p-2 rounded border border-dashed text-[11px] text-destructive">
            <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>Auth code missing — reload the editor.</span>
          </div>
        )}

        {url && (
          <div className="space-y-1.5">
            <textarea
              readOnly
              value={url}
              rows={5}
              className="w-full font-mono text-[10px] border rounded px-2 py-1.5 bg-muted/30 break-all"
              onFocus={(e) => e.currentTarget.select()}
            />
            <button
              type="button"
              onClick={handleCopy}
              className="w-full flex items-center justify-center gap-1.5 h-7 text-[11px] border rounded hover:bg-muted transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3" /> Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" /> Copy URL
                </>
              )}
            </button>
          </div>
        )}
      </section>

      <section>
        <h4 className="text-xs font-semibold mb-2">Dynamic fields</h4>
        {dynamicFields.length === 0 ? (
          <p className="text-[11px] text-muted-foreground">
            No dynamic fields yet. Select a layer, open Properties, scroll to
            &quot;Dynamic field&quot; and enable &quot;Unlock for URL override&quot;.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {dynamicFields.map((f) => (
              <li
                key={f.layerId}
                className="border rounded px-2 py-1.5 text-[11px]"
              >
                <div className="font-mono text-foreground">
                  ?{f.fullName}=<span className="text-muted-foreground">…</span>
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {f.varType} · default: {f.defaultValue || "(empty)"}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h4 className="text-xs font-semibold mb-2">Chatbot recipe</h4>
        <p className="text-[11px] text-muted-foreground mb-1">
          Build the URL in code by swapping the default value for the input
          you want to inject:
        </p>
        <pre className="font-mono text-[10px] border rounded px-2 py-1.5 bg-muted/30 whitespace-pre-wrap break-all">
{`const url = \`${origin}/api/cma/image-templates/${meta.id ?? "{id}"}/image\`
  + \`?auth=${meta.authCode ?? "{authCode}"}\`
${dynamicFields.length === 0 ? "  // add dynamic fields for overrides" : dynamicFields
  .map(
    (f) =>
      `  + \`&${f.fullName}=\${encodeURIComponent(${JSON.stringify(
        f.fieldName
      )})}\``
  )
  .join("\n")};`}
        </pre>
      </section>
    </div>
  );
}
