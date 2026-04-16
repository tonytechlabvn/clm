// Save flow for the visual image template editor. Pure serialization +
// HTTP layer — no React, no store import. The top bar passes in the
// current store snapshot + an orgId and we handle validation, layer→HTML
// compilation, missing-variable detection, and POST/PUT routing.
//
// Returning a discriminated result instead of throwing lets the caller
// distinguish "ok", "needs user confirmation" (missing vars), and "error".

import { compileLayersToHtml } from "@/lib/cma/services/template-layer-compiler";
import type {
  Layer,
  TemplateLayerData,
} from "@/lib/cma/types/image-template-layer-types";
import type { VariableDefinition } from "@/lib/cma/types/image-template-types";
import {
  extractUsedVariableNames,
  diffDeclaredVsUsed,
  mergeDynamicFieldsIntoVariables,
} from "./extract-layer-variables";

export interface SaveInputMeta {
  id: string | null;
  name: string;
  platform: string;
  width: number;
  height: number;
  backgroundColor: string;
}

export interface SaveInput {
  meta: SaveInputMeta;
  layers: Layer[];
  variables: VariableDefinition[];
}

export type SaveResult =
  | { ok: true; id: string }
  | { ok: false; kind: "validation"; error: string }
  | { ok: false; kind: "missing-variables"; missing: string[] }
  | { ok: false; kind: "server"; error: string };

interface SaveOptions {
  orgId: string;
  autoCreateMissingVars?: boolean;
}

// Build the exact JSON body the POST/PUT handlers expect. Separated so the
// smoke test can assert on the shape without making a real network call.
//
// Dynamic-field layers contribute one `variableSchema` entry each, keyed by
// `${fieldName}.${property}`. That flat naming keeps the stored schema
// compatible with the existing `variableSchemaValidator` (just an array of
// `{name,type,...}`) — we don't need a nested-object variant. User-declared
// free-form variables still merge in alongside.
export function buildSavePayload(input: SaveInput, orgId: string) {
  const layerData: TemplateLayerData = {
    version: 1,
    width: input.meta.width,
    height: input.meta.height,
    backgroundColor: input.meta.backgroundColor,
    layers: input.layers,
  };

  const htmlContent = compileLayersToHtml(layerData);
  const variableSchema = mergeDynamicFieldsIntoVariables(
    input.variables,
    input.layers
  );

  return {
    orgId,
    name: input.meta.name.trim(),
    platform: input.meta.platform,
    width: input.meta.width,
    height: input.meta.height,
    htmlContent,
    layerData,
    variableSchema,
  };
}

export async function saveTemplate(
  input: SaveInput,
  opts: SaveOptions
): Promise<SaveResult> {
  // 1. Validate — these checks run before network so a noisy error never
  //    hits the server and the user can fix fast.
  if (!input.meta.name.trim()) {
    return { ok: false, kind: "validation", error: "Template name is required" };
  }
  if (input.layers.length === 0) {
    return {
      ok: false,
      kind: "validation",
      error: "Add at least one layer before saving",
    };
  }

  // 2. Variable diff — block save if any token is referenced but undeclared,
  //    unless the caller already confirmed the auto-create prompt.
  const used = extractUsedVariableNames(input.layers);
  const { missing } = diffDeclaredVsUsed(input.variables, used);
  let variables = input.variables;
  if (missing.length > 0) {
    if (!opts.autoCreateMissingVars) {
      return { ok: false, kind: "missing-variables", missing };
    }
    variables = [
      ...input.variables,
      ...missing.map((name) => ({
        name,
        label: name,
        type: "text" as const,
        defaultValue: "",
        required: false,
      })),
    ];
  }

  // 3. Build payload with the (possibly amended) variable list
  const payload = buildSavePayload({ ...input, variables }, opts.orgId);

  // 4. POST for new templates, PUT for existing ones
  const isNew = input.meta.id === null;
  const url = isNew
    ? `/api/cma/image-templates`
    : `/api/cma/image-templates/${input.meta.id}`;

  try {
    const res = await fetch(url, {
      method: isNew ? "POST" : "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}) as { error?: string });
      return {
        ok: false,
        kind: "server",
        error: err.error ?? `Save failed (${res.status})`,
      };
    }
    const { data } = (await res.json()) as { data: { id: string } };
    return { ok: true, id: data.id };
  } catch (e) {
    return {
      ok: false,
      kind: "server",
      error: e instanceof Error ? e.message : "Network error",
    };
  }
}
