// Wraps AI-generated plain HTML content into a template's styled HTML structure.
// AI content is typically h2 + p sections; this splits them and injects into
// the template's card/section containers so template CSS classes render correctly.

/** Split HTML into sections by h2 headings. Each section = { heading, body } */
function splitIntoSections(html: string): { heading: string; body: string }[] {
  // Split on h2 tags — capture heading text and collect body until next h2
  const parts = html.split(/<h2[^>]*>/i);
  const sections: { heading: string; body: string }[] = [];

  // First part is content before any h2 (intro)
  const intro = parts[0]?.trim();
  if (intro) {
    sections.push({ heading: "", body: intro });
  }

  for (let i = 1; i < parts.length; i++) {
    const closeIdx = parts[i].indexOf("</h2>");
    if (closeIdx === -1) {
      sections.push({ heading: "", body: parts[i].trim() });
      continue;
    }
    const heading = parts[i].substring(0, closeIdx).replace(/<[^>]*>/g, "").trim();
    const body = parts[i].substring(closeIdx + 5).trim();
    sections.push({ heading, body });
  }

  return sections;
}

/**
 * Wrap plain AI HTML into a template's card-based layout.
 * Detects the template's wrapper/card class patterns and generates matching structure.
 * Falls back to injecting into a generic wrapper if template structure is unrecognized.
 */
export function wrapHtmlInTemplate(
  aiHtml: string,
  templateHtml: string,
  postTitle: string
): string {
  // Check if AI content already uses template classes — if so, return as-is
  // Extract distinctive template class from first element
  const firstClassMatch = templateHtml.match(/class="([^"]+)"/);
  if (firstClassMatch) {
    const mainClass = firstClassMatch[1].split(/\s+/)[0];
    if (mainClass && aiHtml.includes(mainClass)) {
      return aiHtml;
    }
  }

  const sections = splitIntoSections(aiHtml);
  if (sections.length === 0) return aiHtml;

  // Detect TTL Block Card template pattern (ttl-ai-wrapper with ttl-card-wrap sections)
  const isTtlBlockCard = templateHtml.includes("ttl-ai-wrapper") && templateHtml.includes("ttl-card-wrap");

  if (isTtlBlockCard) {
    return buildTtlBlockCardHtml(sections, postTitle);
  }

  // Detect TTL Dark Docs template pattern (ttl-docs-wrapper with ttl-docs-nav + main)
  const isTtlDarkDocs = templateHtml.includes("ttl-docs-wrapper") && templateHtml.includes("ttl-docs-nav");

  if (isTtlDarkDocs) {
    return buildTtlDarkDocsHtml(aiHtml, sections, templateHtml, postTitle);
  }

  // Generic fallback: wrap in the template's outermost container
  const outerMatch = templateHtml.match(/^<(\w+)\s+class="([^"]+)"[^>]*>/);
  if (outerMatch) {
    const [, tag, className] = outerMatch;
    const closeTag = templateHtml.lastIndexOf(`</${tag}>`);
    const closingHtml = closeTag > -1 ? templateHtml.substring(closeTag) : `</${tag}>`;
    return `<${tag} class="${className}">${aiHtml}${closingHtml}`;
  }

  return aiHtml;
}

/** Build HTML using the TTL Block Card Ultra Modern template structure */
function buildTtlBlockCardHtml(
  sections: { heading: string; body: string }[],
  postTitle: string
): string {
  const parts: string[] = [];

  // Hero section
  const intro = sections.find((s) => !s.heading);
  const introText = intro
    ? intro.body.replace(/<p[^>]*>(.*?)<\/p>/i, "$1").replace(/<[^>]*>/g, "").trim()
    : "";
  parts.push(`<div class="ttl-ai-wrapper">`);
  parts.push(`  <div class="ttl-hero-card"><div class="ttl-hero-content">`);
  parts.push(`    <h1 class="ttl-hero-title">${escHtml(postTitle)}</h1>`);
  if (introText) {
    parts.push(
      `    <p style="font-size:1.2rem;font-weight:500;opacity:0.9;max-width:700px;margin:0 auto;line-height:1.6;">${escHtml(introText)}</p>`
    );
  }
  parts.push(`  </div></div>`);

  // Content sections → cards
  const contentSections = sections.filter((s) => s.heading);
  for (const section of contentSections) {
    parts.push(`  <div class="ttl-card-wrap"><div class="ttl-card">`);
    parts.push(`    <h2 class="ttl-card-title">${escHtml(section.heading)}</h2>`);
    // Re-style lists to use ttl-list class
    const styledBody = section.body
      .replace(/<ul[^>]*>/gi, '<ul class="ttl-list">')
      .replace(/<ol[^>]*>/gi, '<ul class="ttl-list">');
    parts.push(`    ${styledBody}`);
    parts.push(`  </div></div>`);
  }

  parts.push(`</div>`);
  return parts.join("\n");
}

/**
 * Extract h2 headings from HTML content. Generates slug-based IDs and injects them.
 * Returns the headings list and the modified HTML with id attributes on h2 tags.
 */
function extractHeadings(html: string): { headings: { id: string; text: string }[]; html: string } {
  const headings: { id: string; text: string }[] = [];
  let idx = 0;

  // Single-pass replacement: find all <h2...>...</h2> and inject IDs
  const modified = html.replace(/<h2([^>]*)>([\s\S]*?)<\/h2>/gi, (_match, attrs: string, inner: string) => {
    idx++;
    const plainText = inner.replace(/<[^>]*>/g, "").trim();
    if (!plainText) return _match; // skip empty headings

    // Use existing id if present, otherwise generate one
    const existingId = attrs.match(/id="([^"]*)"/)?.[1];
    const id = existingId || `s${idx}`;
    headings.push({ id, text: plainText });

    if (existingId) return _match; // already has id, keep as-is
    return `<h2 id="${id}"${attrs}>${inner}</h2>`;
  });

  return { headings, html: modified };
}

/** Build HTML using the TTL Dark Docs template structure (nav tabs + main content) */
function buildTtlDarkDocsHtml(
  contentHtml: string,
  _sections: { heading: string; body: string }[],
  templateHtml: string,
  postTitle: string
): string {
  // Find <main> boundaries in template
  const mainOpen = templateHtml.indexOf("<main");
  const mainInnerStart = mainOpen > -1 ? templateHtml.indexOf(">", mainOpen) + 1 : -1;
  const mainClose = templateHtml.indexOf("</main>");

  if (mainInnerStart <= 0 || mainClose <= mainInnerStart) {
    // Template has no <main>, just wrap content inside the outer container
    return templateHtml.replace(/<\/div>\s*$/, contentHtml + "\n</div>");
  }

  // Extract headings from content and inject IDs
  const { headings, html: contentWithIds } = extractHeadings(contentHtml);

  // Build nav section: replace placeholder [Section N] links with actual headings
  let navHtml = templateHtml.substring(0, mainInnerStart);
  if (headings.length > 0) {
    const navUlOpen = navHtml.indexOf('<ul class="ttl-docs-nav">');
    const navUlClose = navHtml.indexOf("</ul>", navUlOpen);
    if (navUlOpen > -1 && navUlClose > navUlOpen) {
      const navLinks = headings
        .map((h, i) => `      <li><a href="#${h.id}">${i + 1}. ${h.text}</a></li>`)
        .join("\n");
      navHtml =
        navHtml.substring(0, navUlOpen) +
        '<ul class="ttl-docs-nav">\n' +
        navLinks +
        "\n    </ul>" +
        navHtml.substring(navUlClose + "</ul>".length);
    }
  }

  // Splice: template nav + title + content + template footer
  return (
    navHtml +
    `\n<h1>${escHtml(postTitle)}</h1>\n` +
    contentWithIds +
    "\n" +
    templateHtml.substring(mainClose)
  );
}

function escHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
