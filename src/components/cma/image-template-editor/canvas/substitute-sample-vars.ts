// Shared helper: replace {{tokenName}} with sample values for the in-editor preview.
// Mirrors the shape of the Handlebars substitution that Puppeteer does at render
// time so what users see in the canvas matches what gets saved. Unknown tokens
// are left in their raw {{name}} form so authors can spot missing variables.

const TOKEN_RE = /\{\{\s*(\w+)\s*\}\}/g;

export function substituteSampleVars(
  raw: string,
  sampleVars: Record<string, string>
): string {
  return raw.replace(TOKEN_RE, (_, key: string) => {
    const val = sampleVars[key];
    return val !== undefined && val !== "" ? val : `{{${key}}}`;
  });
}
