// Direct URL query-string parser — turns APITemplate.io-style flat + dotted
// query keys into a Handlebars render context.
//
// Input (URL):   ?auth=X&date.text=16/4/2026&background.url=https%3A%2F%2F...&title=Hello
// Output (ctx):  { date: { text: "16/4/2026" }, background: { url: "https://..." }, title: "Hello" }
//
// The route passes `ctx` straight into Handlebars. Nested access is native
// (`{{date.text}}` resolves against `ctx.date.text`), so no template changes
// are needed. Flat keys continue to work (legacy `{{title}}` templates).
//
// This module is a pure function — no Prisma, no Puppeteer — so unit tests
// can cover it in isolation.

import { variableSchemaValidator, type VariableSchema } from "../types/image-template-types";
import { FIELD_NAME_RE } from "../types/image-template-layer-types";

// Reserved query keys the renderer never treats as variables. `auth` is the
// URL-auth token; `_cb` is a cache-buster clients append to force a refresh.
const RESERVED_PARAMS = new Set(["auth", "_cb"]);

// Same charset as FIELD_NAME_RE on both halves of the dotted key, so we
// reject anything that could escape into unexpected property paths (e.g.
// `__proto__.text`, `constructor.prototype`, `date.text.sub`). Only a single
// dot is allowed — keep depth flat to prevent prototype-chain reach.
const DOTTED_KEY_RE = /^([a-zA-Z_][a-zA-Z0-9_]*)\.([a-zA-Z_][a-zA-Z0-9_]*)$/;

// Minimal interface so callers can pass either URLSearchParams or a plain
// Map/Record — handy for tests.
export interface QueryParamLike {
  get(name: string): string | null;
  entries(): IterableIterator<[string, string]>;
}

export interface RenderContextResult {
  context: Record<string, string | Record<string, string>>;
  missingRequired: string[];
}

// Fill defaults from the stored variable schema, then overlay query values.
// Flat schema entries stay flat. Entries whose `name` matches `foo.bar` get
// nested into `ctx.foo.bar`. Query params override both.
export function buildRenderContext(
  schema: VariableSchema,
  query: QueryParamLike
): RenderContextResult {
  const ctx: Record<string, string | Record<string, string>> = {};

  // Seed defaults from schema (structure aware — dotted names become nested).
  for (const v of schema) {
    const dotted = v.name.match(DOTTED_KEY_RE);
    const defaultVal = v.defaultValue ?? "";
    if (dotted) {
      const [, parent, child] = dotted;
      if (typeof ctx[parent] !== "object") ctx[parent] = {};
      (ctx[parent] as Record<string, string>)[child] = defaultVal;
    } else {
      ctx[v.name] = defaultVal;
    }
  }

  // Overlay query-string values. Accept any query key the schema declares,
  // flat or dotted. Unknown keys are ignored (same as legacy behavior —
  // prevents callers from injecting arbitrary context).
  // Array.from() avoids needing `--downlevelIteration` for the iterator —
  // keeps the compile target clean across the monorepo's tsconfig.
  const declaredNames = new Set(schema.map((v) => v.name));
  const entries = Array.from(query.entries());
  for (const [key, value] of entries) {
    if (RESERVED_PARAMS.has(key)) continue;
    if (!declaredNames.has(key)) continue;

    const dotted = key.match(DOTTED_KEY_RE);
    if (dotted) {
      const [, parent, child] = dotted;
      if (typeof ctx[parent] !== "object") ctx[parent] = {};
      (ctx[parent] as Record<string, string>)[child] = value;
    } else {
      ctx[key] = value;
    }
  }

  // Required-variable check runs against the raw values we just wrote.
  const missingRequired = schema
    .filter((v) => {
      if (!v.required) return false;
      const dotted = v.name.match(DOTTED_KEY_RE);
      if (dotted) {
        const [, p, c] = dotted;
        const parent = ctx[p];
        return typeof parent !== "object" || !parent[c];
      }
      return !ctx[v.name];
    })
    .map((v) => v.name);

  return { context: ctx, missingRequired };
}

// Flatten the nested render context into the `Record<string,string>` shape
// the Puppeteer renderer's `validateVariables` expects (SSRF check keys on
// substrings like "url"/"image"/"color"). Nested objects contribute entries
// like `date.text` / `background.url` so the same heuristics still fire.
export function flattenContextForValidation(
  ctx: Record<string, string | Record<string, string>>
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(ctx)) {
    if (typeof v === "string") {
      out[k] = v;
    } else {
      for (const [k2, v2] of Object.entries(v)) {
        out[`${k}.${k2}`] = v2;
      }
    }
  }
  return out;
}

// Re-export the dotted-key regex for callers that want to test a raw query
// key before parsing (editor UI, Zalo integration).
export { DOTTED_KEY_RE, FIELD_NAME_RE };

// Re-export so the route only imports from one place.
export { variableSchemaValidator };
