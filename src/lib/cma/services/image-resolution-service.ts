// Image resolution — replaces [IMAGE] placeholders with Unsplash photos uploaded to WordPress

import { prisma } from "@/lib/prisma-client";
import { searchPhotos, downloadPhoto } from "./unsplash-service";
import type { PlatformAdapter } from "../adapters/platform-adapter";
import crypto from "crypto";

export interface ImageResolutionContext {
  siteUrl: string;
  username: string;
  token: string;
  orgId: string;
  postId: string;
  suggestedImagePrompts: string[];
  postTitle: string;
}

export interface ImageResolutionResult {
  html: string;
  uploadedMediaIds: number[]; // WP media IDs for featured image selection
}

const MAX_IMAGES_PER_POST = 5;
// Match [IMAGE] in any context: standalone paragraphs, inline in lists, etc.
const IMAGE_PLACEHOLDER_REGEX = /\[IMAGE\]/i;

/**
 * Resolve [IMAGE] placeholders in HTML with real Unsplash images.
 * Each image is uploaded to WordPress via the adapter.
 * Failures are silently handled — placeholder is removed on error.
 */
export async function resolveImagePlaceholders(
  html: string,
  ctx: ImageResolutionContext,
  adapter: PlatformAdapter
): Promise<ImageResolutionResult> {
  if (!adapter.uploadMedia) {
    // Remove all placeholders if adapter doesn't support media upload
    return { html: html.replace(/\[IMAGE\]/gi, ""), uploadedMediaIds: [] };
  }

  // Count occurrences
  const totalPlaceholders = (html.match(/\[IMAGE\]/gi) || []).length;
  if (totalPlaceholders === 0) return { html, uploadedMediaIds: [] };

  const uploadedMediaIds: number[] = [];
  let processedCount = 0;

  // Replace each [IMAGE] placeholder sequentially (one at a time)
  while (IMAGE_PLACEHOLDER_REGEX.test(html) && processedCount < MAX_IMAGES_PER_POST) {

    const query = ctx.suggestedImagePrompts[processedCount] || ctx.postTitle;

    try {
      // Search Unsplash for relevant image
      const searchResult = await searchPhotos(query, 1, 1);
      if (!searchResult.results.length) {
        html = html.replace(IMAGE_PLACEHOLDER_REGEX, ""); // remove one
        processedCount++;
        continue;
      }

      const photo = searchResult.results[0];

      // Download and upload to WordPress
      const { buffer, contentType } = await downloadPhoto(photo.links.download_location);
      const ext = contentType.includes("png") ? "png" : "jpg";
      const fileName = `post-${crypto.randomUUID()}.${ext}`;

      const uploaded = await adapter.uploadMedia!(
        ctx.siteUrl, ctx.username, ctx.token,
        buffer, fileName, contentType
      );

      uploadedMediaIds.push(uploaded.platformMediaId);

      // Save CmaMedia record
      await prisma.cmaMedia.create({
        data: {
          orgId: ctx.orgId,
          postId: ctx.postId,
          fileName,
          originalName: `unsplash-${photo.id}.${ext}`,
          mimeType: contentType,
          size: buffer.length,
          localPath: "",
          source: "unsplash",
          sourceUrl: photo.urls.regular,
        },
      });

      // Build attribution figcaption
      const alt = photo.alt_description || query;
      const attribution = `Photo by <a href="${photo.user.links.html}?utm_source=clm&utm_medium=referral" style="color: inherit;">${photo.user.name}</a> on <a href="https://unsplash.com?utm_source=clm&utm_medium=referral" style="color: inherit;">Unsplash</a>`;
      const figureHtml = `<figure style="margin: 1.5em 0; text-align: center;"><img src="${uploaded.url}" alt="${escAttr(alt)}" style="max-width: 100%; height: auto; border-radius: 12px;"><figcaption style="font-size: 0.85em; color: #64748b; margin-top: 0.5em; font-style: italic;">${attribution}</figcaption></figure>`;

      // Replace first occurrence
      html = html.replace(IMAGE_PLACEHOLDER_REGEX, figureHtml);
    } catch (err) {
      console.warn(`[image-resolution] Failed to resolve image ${processedCount}:`, err);
      // Remove the failed placeholder
      html = html.replace(IMAGE_PLACEHOLDER_REGEX, "");
    }

    processedCount++;
  }

  // Remove any remaining [IMAGE] placeholders beyond the limit
  html = html.replace(/\[IMAGE\]/gi, "");

  return { html, uploadedMediaIds };
}

/**
 * Fetch and upload a single Unsplash photo for featured image.
 * Returns WP media ID and URL, or undefined on failure.
 */
export async function fetchAndUploadFeaturedImage(
  query: string,
  ctx: { siteUrl: string; username: string; token: string; orgId: string; postId: string },
  adapter: PlatformAdapter
): Promise<{ mediaId: number; url: string } | undefined> {
  try {
    if (!adapter.uploadMedia) return undefined;

    const results = await searchPhotos(query, 1, 1);
    if (!results.results.length) return undefined;

    const photo = results.results[0];
    const { buffer, contentType } = await downloadPhoto(photo.links.download_location);

    const ext = contentType.includes("png") ? "png" : "jpg";
    const fileName = `featured-${crypto.randomUUID()}.${ext}`;
    const uploaded = await adapter.uploadMedia(ctx.siteUrl, ctx.username, ctx.token, buffer, fileName, contentType);

    await prisma.cmaMedia.create({
      data: {
        orgId: ctx.orgId,
        postId: ctx.postId,
        fileName,
        originalName: `featured-${photo.id}.${ext}`,
        mimeType: contentType,
        size: buffer.length,
        localPath: "",
        source: "unsplash",
        sourceUrl: photo.urls.regular,
      },
    });

    return { mediaId: uploaded.platformMediaId, url: uploaded.url };
  } catch (err) {
    console.warn("[image-resolution] Failed to fetch featured image:", err);
    return undefined;
  }
}

function escAttr(str: string): string {
  return str.replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
