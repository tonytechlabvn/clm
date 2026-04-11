// HTML escaping helpers for the layer compiler.
// Critical invariant: {{var}} placeholder tokens must pass through unmodified
// so Handlebars can substitute them at render time. Everything else is
// HTML-escaped to block XSS via user-supplied layer text/colors.

const TOKEN_RE = /\{\{\s*\w+\s*\}\}/g;

const HTML_ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (ch) => HTML_ESCAPES[ch]!);
}

// Escape HTML chars in `raw` while leaving {{token}} segments untouched.
// Strategy: walk token boundaries, escape non-token slices, re-append tokens verbatim.
export function escapeKeepTokens(raw: string): string {
  const out: string[] = [];
  let last = 0;
  const matches = Array.from(raw.matchAll(TOKEN_RE));
  for (const m of matches) {
    const start = m.index ?? 0;
    out.push(escapeHtml(raw.slice(last, start)));
    out.push(m[0]); // keep the raw {{token}} — Handlebars needs it intact
    last = start + m[0].length;
  }
  out.push(escapeHtml(raw.slice(last)));
  return out.join("");
}

// Turn user text (with {{tokens}}) into HTML safe for injection inside a <div>.
// Converts newlines to <br> so multi-line text layers render naturally.
export function textToHtml(raw: string): string {
  return escapeKeepTokens(raw).replace(/\r?\n/g, "<br>");
}
