// Resolves AI-generated image placeholders with Unsplash photos at content generation time.
// Replaces <figure class="ai-image" data-query="..."> with actual <img> tags using Unsplash URLs.
// Images are embedded directly (no platform upload) so drafts display complete content.

import { searchPhotos } from "./unsplash-service";

const MAX_IMAGES = 5;
// Match <figure> with class="ai-image" and data-query attribute
const AI_IMAGE_REGEX = /<figure\s+class=["']ai-image["']\s+data-query=["']([^"']+)["'][^>]*>[\s\S]*?<\/figure>/gi;

/**
 * Simplify a query for Unsplash — extract key English words, limit to ~5 words.
 */
function simplifyQuery(raw: string): string {
  const words = raw
    .split(/[\s:,\-–—|?!.]+/)
    .filter((w) => w.length > 2 && /^[a-zA-Z0-9]+$/.test(w))
    .slice(0, 5);
  return words.length >= 2 ? words.join(" ") : raw.substring(0, 40);
}

function escAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Resolve all <figure class="ai-image" data-query="..."> placeholders in HTML
 * with real Unsplash images. Returns updated HTML with images embedded.
 */
export async function resolveAiImagePlaceholders(html: string): Promise<string> {
  // Collect all matches first
  const matches: { fullMatch: string; query: string }[] = [];
  let match: RegExpExecArray | null;
  const regex = new RegExp(AI_IMAGE_REGEX.source, AI_IMAGE_REGEX.flags);

  while ((match = regex.exec(html)) !== null && matches.length < MAX_IMAGES) {
    matches.push({ fullMatch: match[0], query: match[1] });
  }

  if (matches.length === 0) return html;

  // Resolve each image sequentially to respect rate limits
  let result = html;
  for (const { fullMatch, query } of matches) {
    const searchQuery = simplifyQuery(query);
    try {
      const searchResult = await searchPhotos(searchQuery, 1, 1);
      if (!searchResult.results.length) {
        // Remove placeholder if no results
        result = result.replace(fullMatch, "");
        continue;
      }

      const photo = searchResult.results[0];
      const alt = escAttr(photo.alt_description || query);
      const attribution = `Photo by <a href="${photo.user.links.html}?utm_source=clm&utm_medium=referral" target="_blank" rel="noopener">${escAttr(photo.user.name)}</a> on <a href="https://unsplash.com?utm_source=clm&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a>`;

      const figureHtml = `<figure class="ai-image"><img src="${photo.urls.regular}" alt="${alt}" loading="lazy"><figcaption>${attribution}</figcaption></figure>`;

      result = result.replace(fullMatch, figureHtml);
    } catch (err) {
      console.warn(`[ai-image-embed] Failed to resolve image for "${searchQuery}":`, err);
      // Remove failed placeholder
      result = result.replace(fullMatch, "");
    }
  }

  // Remove any remaining unresolved placeholders
  result = result.replace(AI_IMAGE_REGEX, "");
  return result;
}
