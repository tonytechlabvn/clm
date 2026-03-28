// Style theme definitions for CMA styled publishing
// Each theme maps HTML elements to inline CSS style strings for WordPress compatibility

export interface ThemeStyles {
  name: string;
  label: string;
  wrapper: string;
  h1: string;
  h2: string;
  h3: string;
  p: string;
  a: string;
  img: string;
  code: string;
  pre: string;
  blockquote: string;
  ul: string;
  ol: string;
  li: string;
  table: string;
  th: string;
  td: string;
  hr: string;
  figure: string;
  figcaption: string;
}

export const THEMES: Record<string, ThemeStyles> = {
  default: {
    name: "default",
    label: "Clean Default",
    wrapper: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; line-height: 1.7; max-width: 720px; margin: 0 auto; padding: 20px;",
    h1: "font-size: 2em; font-weight: 700; margin: 1em 0 0.5em; color: #111;",
    h2: "font-size: 1.5em; font-weight: 600; margin: 1.2em 0 0.4em; color: #222;",
    h3: "font-size: 1.25em; font-weight: 600; margin: 1em 0 0.3em; color: #333;",
    p: "margin: 0 0 1em; line-height: 1.7;",
    a: "color: #2563eb; text-decoration: underline;",
    img: "max-width: 100%; height: auto; border-radius: 8px; margin: 1em 0;",
    code: "background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; font-family: 'Fira Code', monospace;",
    pre: "background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 8px; overflow-x: auto; margin: 1em 0; font-size: 0.9em;",
    blockquote: "border-left: 4px solid #e5e7eb; padding-left: 16px; margin: 1em 0; color: #6b7280; font-style: italic;",
    ul: "margin: 0 0 1em; padding-left: 1.5em;",
    ol: "margin: 0 0 1em; padding-left: 1.5em;",
    li: "margin: 0.3em 0;",
    table: "width: 100%; border-collapse: collapse; margin: 1em 0;",
    th: "border: 1px solid #e5e7eb; padding: 8px 12px; background: #f9fafb; font-weight: 600; text-align: left;",
    td: "border: 1px solid #e5e7eb; padding: 8px 12px;",
    hr: "border: none; border-top: 1px solid #e5e7eb; margin: 2em 0;",
    figure: "margin: 1.5em 0; text-align: center;",
    figcaption: "font-size: 0.85em; color: #6b7280; margin-top: 0.5em;",
  },

  editorial: {
    name: "editorial",
    label: "Editorial",
    wrapper: "font-family: Georgia, 'Times New Roman', serif; color: #2d2d2d; line-height: 1.8; max-width: 680px; margin: 0 auto; padding: 24px;",
    h1: "font-size: 2.2em; font-weight: 700; margin: 1em 0 0.4em; color: #1a1a1a; letter-spacing: -0.02em;",
    h2: "font-size: 1.6em; font-weight: 600; margin: 1.4em 0 0.5em; color: #1a1a1a; border-bottom: 1px solid #e0e0e0; padding-bottom: 0.3em;",
    h3: "font-size: 1.3em; font-weight: 600; margin: 1.2em 0 0.4em; color: #333;",
    p: "margin: 0 0 1.2em; line-height: 1.8; font-size: 1.05em;",
    a: "color: #b91c1c; text-decoration: none; border-bottom: 1px solid #b91c1c;",
    img: "max-width: 100%; height: auto; margin: 1.5em 0;",
    code: "background: #faf5ff; padding: 2px 6px; border-radius: 3px; font-size: 0.88em; font-family: 'Courier New', monospace; color: #7c3aed;",
    pre: "background: #fafafa; color: #333; padding: 20px; border: 1px solid #e0e0e0; overflow-x: auto; margin: 1.5em 0; font-size: 0.9em;",
    blockquote: "border-left: 3px solid #b91c1c; padding-left: 20px; margin: 1.5em 0; color: #555; font-style: italic; font-size: 1.1em;",
    ul: "margin: 0 0 1.2em; padding-left: 1.5em;",
    ol: "margin: 0 0 1.2em; padding-left: 1.5em;",
    li: "margin: 0.4em 0; line-height: 1.7;",
    table: "width: 100%; border-collapse: collapse; margin: 1.5em 0;",
    th: "border-bottom: 2px solid #333; padding: 10px 14px; font-weight: 700; text-align: left;",
    td: "border-bottom: 1px solid #e0e0e0; padding: 10px 14px;",
    hr: "border: none; border-top: 1px solid #ccc; margin: 2.5em auto; max-width: 100px;",
    figure: "margin: 2em 0; text-align: center;",
    figcaption: "font-size: 0.85em; color: #888; margin-top: 0.6em; font-style: italic;",
  },
};

// CSS property allowlist — only these are safe for inline styles
export const ALLOWED_CSS_PROPERTIES = new Set([
  "font-family", "font-size", "font-weight", "font-style",
  "color", "background", "background-color",
  "line-height", "letter-spacing", "text-align", "text-decoration",
  "margin", "margin-top", "margin-bottom", "margin-left", "margin-right",
  "padding", "padding-top", "padding-bottom", "padding-left", "padding-right",
  "border", "border-top", "border-bottom", "border-left", "border-right",
  "border-radius", "border-collapse",
  "max-width", "width", "height",
  "overflow-x", "overflow-y",
  "display", "text-indent",
]);

// Sanitize a style string — strip unsafe properties
export function sanitizeStyleString(style: string): string {
  return style
    .split(";")
    .map((s) => s.trim())
    .filter((s) => {
      if (!s) return false;
      const prop = s.split(":")[0]?.trim().toLowerCase();
      if (!prop) return false;
      // Block url(), expression(), behavior, @import
      const value = s.split(":").slice(1).join(":").toLowerCase();
      if (/url\s*\(|expression\s*\(|behavior\s*:|@import/i.test(value)) return false;
      return ALLOWED_CSS_PROPERTIES.has(prop);
    })
    .join("; ");
}

export function getTheme(name: string): ThemeStyles {
  return THEMES[name] || THEMES.default;
}

export function getAvailableThemes(): { name: string; label: string }[] {
  return Object.values(THEMES).map((t) => ({ name: t.name, label: t.label }));
}
