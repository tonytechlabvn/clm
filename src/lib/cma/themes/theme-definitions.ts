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
    wrapper: "font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1a1a1a; line-height: 1.75; max-width: 720px; margin: 0 auto; padding: 32px 20px;",
    h1: "font-size: 2.2em; font-weight: 800; margin: 0 0 0.6em; color: #0f172a; letter-spacing: -0.03em; line-height: 1.2;",
    h2: "font-size: 1.6em; font-weight: 700; margin: 1.8em 0 0.6em; color: #1e293b; letter-spacing: -0.02em; padding-bottom: 0.3em; border-bottom: 2px solid #e2e8f0;",
    h3: "font-size: 1.25em; font-weight: 600; margin: 1.4em 0 0.4em; color: #334155;",
    p: "margin: 0 0 1.25em; line-height: 1.75; font-size: 1.05em;",
    a: "color: #2563eb; text-decoration: none; border-bottom: 1px solid #93c5fd;",
    img: "max-width: 100%; height: auto; border-radius: 12px; margin: 1.5em 0;",
    code: "background: #f1f5f9; padding: 3px 7px; border-radius: 6px; font-size: 0.88em; font-family: 'Fira Code', 'Cascadia Code', monospace; color: #0f172a;",
    pre: "background: #1e293b; color: #e2e8f0; padding: 20px 24px; border-radius: 12px; overflow-x: auto; margin: 1.5em 0; font-size: 0.9em; line-height: 1.6; border: 1px solid #334155;",
    blockquote: "border-left: 4px solid #3b82f6; padding: 16px 20px; margin: 1.5em 0; background: #eff6ff; border-radius: 0 8px 8px 0; color: #1e40af; font-style: normal; line-height: 1.7;",
    ul: "margin: 0 0 1.25em; padding-left: 1.5em;",
    ol: "margin: 0 0 1.25em; padding-left: 1.5em;",
    li: "margin: 0.4em 0; line-height: 1.7;",
    table: "width: 100%; border-collapse: collapse; margin: 1.5em 0; border-radius: 8px;",
    th: "border: 1px solid #e2e8f0; padding: 10px 14px; background: #f8fafc; font-weight: 600; text-align: left; color: #334155;",
    td: "border: 1px solid #e2e8f0; padding: 10px 14px;",
    hr: "border: none; border-top: 2px solid #e2e8f0; margin: 2.5em 0;",
    figure: "margin: 1.5em 0; text-align: center;",
    figcaption: "font-size: 0.85em; color: #64748b; margin-top: 0.5em; font-style: italic;",
  },

  editorial: {
    name: "editorial",
    label: "Editorial",
    wrapper: "font-family: Georgia, 'Times New Roman', serif; color: #2d3748; line-height: 1.85; max-width: 680px; margin: 0 auto; padding: 32px 24px;",
    h1: "font-size: 2.4em; font-weight: 700; margin: 0 0 0.5em; color: #1a202c; letter-spacing: -0.03em; line-height: 1.15;",
    h2: "font-size: 1.7em; font-weight: 600; margin: 2em 0 0.6em; color: #1a202c; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; letter-spacing: -0.01em;",
    h3: "font-size: 1.3em; font-weight: 600; margin: 1.5em 0 0.4em; color: #2d3748;",
    p: "margin: 0 0 1.3em; line-height: 1.85; font-size: 1.08em;",
    a: "color: #9b2c2c; text-decoration: none; border-bottom: 1px solid #feb2b2;",
    img: "max-width: 100%; height: auto; margin: 2em 0;",
    code: "background: #faf5ff; padding: 3px 7px; border-radius: 4px; font-size: 0.88em; font-family: 'Courier New', monospace; color: #6b46c1;",
    pre: "background: #fafafa; color: #2d3748; padding: 20px 24px; border: 1px solid #e2e8f0; border-radius: 8px; overflow-x: auto; margin: 1.5em 0; font-size: 0.9em; line-height: 1.6;",
    blockquote: "border-left: 3px solid #9b2c2c; padding: 16px 20px; margin: 1.5em 0; background: #fff5f5; border-radius: 0 8px 8px 0; color: #742a2a; font-style: italic; font-size: 1.05em;",
    ul: "margin: 0 0 1.3em; padding-left: 1.5em;",
    ol: "margin: 0 0 1.3em; padding-left: 1.5em;",
    li: "margin: 0.4em 0; line-height: 1.8;",
    table: "width: 100%; border-collapse: collapse; margin: 1.5em 0;",
    th: "border-bottom: 2px solid #2d3748; padding: 10px 14px; font-weight: 700; text-align: left;",
    td: "border-bottom: 1px solid #e2e8f0; padding: 10px 14px;",
    hr: "border: none; border-top: 1px solid #e2e8f0; margin: 2.5em auto; max-width: 120px;",
    figure: "margin: 2em 0; text-align: center;",
    figcaption: "font-size: 0.85em; color: #718096; margin-top: 0.6em; font-style: italic;",
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
  "text-transform", "font-variant",
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
