// Source extraction service — extract and summarize content from URLs, text, images, videos
// Supports: blog URLs, YouTube/video links, image URLs, raw text
// Works like NotebookLM: captures source material, distills key insights

import { callAI } from "@/lib/ai-service";
import { getActiveAiConfig } from "@/lib/ai-settings-service";
import { extractContent, sanitizeExtractedText } from "./crawler-service";
import { checkAiBudget, trackTokenUsage } from "./content-ai-service";

export type SourceType = "url" | "text" | "image" | "video";

export interface ExtractedSource {
  sourceType: SourceType;
  title: string;
  summary: string;
  keyInsights: string[];
  suggestedTopics: string[];
  suggestedKeywords: string[];
  originalContent: string;
  metadata: {
    author?: string;
    sourceUrl?: string;
    imageDescription?: string;
    videoPlatform?: string;
    videoId?: string;
  };
  tokensUsed: number;
}

const SOURCE_SUMMARIZE_PROMPT = `You are a senior content strategist for TonyTechLab, an EdTech company.
Analyze the source material and create a comprehensive summary like a research notebook.

Respond with valid JSON only (no markdown fences):
{
  "title": "Descriptive title capturing the main topic",
  "summary": "Comprehensive 200-400 word summary capturing all key points, data, and insights",
  "keyInsights": ["insight 1", "insight 2", "insight 3", "insight 4", "insight 5"],
  "suggestedTopics": ["topic for blog post 1", "topic for blog post 2", "topic for blog post 3"],
  "suggestedKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}

Rules:
- Extract ALL important facts, statistics, quotes, and arguments
- Identify actionable insights and unique perspectives
- Suggest 3 blog post topics that could be written based on this source
- Keywords should be SEO-relevant terms from the content
- Write the summary in a way that preserves the original meaning but improves clarity`;

const IMAGE_DESCRIBE_PROMPT = `You are analyzing an image for content creation purposes.
Describe this image in detail for a content writer who needs to create a blog post about it.

Respond with valid JSON only (no markdown fences):
{
  "title": "Descriptive title for what the image shows",
  "summary": "Detailed 150-300 word description of the image including: what it shows, key elements, colors, mood, context, and any text visible in the image",
  "keyInsights": ["observation 1", "observation 2", "observation 3"],
  "suggestedTopics": ["blog topic idea 1", "blog topic idea 2", "blog topic idea 3"],
  "suggestedKeywords": ["keyword1", "keyword2", "keyword3"]
}`;

/** Detect source type from input */
export function detectSourceType(input: string): SourceType {
  const trimmed = input.trim();

  // Check if it's a URL
  if (/^https?:\/\//i.test(trimmed)) {
    // YouTube / Vimeo / video platforms
    if (/youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com|tiktok\.com/i.test(trimmed)) {
      return "video";
    }
    // Image URLs
    if (/\.(jpg|jpeg|png|gif|webp|svg|bmp)(\?.*)?$/i.test(trimmed)) {
      return "image";
    }
    // Default URL = blog/article
    return "url";
  }

  // Raw text
  return "text";
}

/** Extract YouTube video ID from URL */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/** Extract video metadata using oEmbed (YouTube, Vimeo) */
async function extractVideoMetadata(url: string): Promise<{
  title: string;
  description: string;
  author: string;
  platform: string;
  videoId: string;
}> {
  const youtubeId = extractYouTubeId(url);

  if (youtubeId) {
    // Use YouTube oEmbed for basic metadata
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    try {
      const resp = await fetch(oembedUrl, { signal: AbortSignal.timeout(10_000) });
      if (resp.ok) {
        const data = await resp.json();
        return {
          title: data.title || "YouTube Video",
          description: `Video by ${data.author_name || "Unknown"}: ${data.title || ""}`,
          author: data.author_name || "",
          platform: "youtube",
          videoId: youtubeId,
        };
      }
    } catch { /* fallback below */ }

    return {
      title: "YouTube Video",
      description: `YouTube video ID: ${youtubeId}`,
      author: "",
      platform: "youtube",
      videoId: youtubeId,
    };
  }

  // Vimeo oEmbed
  if (/vimeo\.com/i.test(url)) {
    try {
      const oembedUrl = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
      const resp = await fetch(oembedUrl, { signal: AbortSignal.timeout(10_000) });
      if (resp.ok) {
        const data = await resp.json();
        return {
          title: data.title || "Vimeo Video",
          description: data.description || `Video by ${data.author_name || "Unknown"}`,
          author: data.author_name || "",
          platform: "vimeo",
          videoId: String(data.video_id || ""),
        };
      }
    } catch { /* fallback below */ }
  }

  // Fallback: try page scraping for other video platforms
  try {
    const article = await extractContent(url);
    return {
      title: article.title,
      description: article.content.slice(0, 2000),
      author: article.author || "",
      platform: "other",
      videoId: "",
    };
  } catch {
    return {
      title: "Video",
      description: `Video from: ${url}`,
      author: "",
      platform: "other",
      videoId: "",
    };
  }
}

/** Extract and summarize content from any source type */
export async function extractAndSummarizeSource(
  input: string,
  orgId: string,
  sourceType?: SourceType
): Promise<ExtractedSource> {
  await checkAiBudget(orgId);

  const detectedType = sourceType || detectSourceType(input);
  let rawContent = "";
  const metadata: ExtractedSource["metadata"] = {};

  switch (detectedType) {
    case "url": {
      const article = await extractContent(input);
      rawContent = sanitizeExtractedText(article.content);
      metadata.author = article.author;
      metadata.sourceUrl = input;
      break;
    }

    case "video": {
      const videoMeta = await extractVideoMetadata(input);
      rawContent = `Video Title: ${videoMeta.title}\nAuthor: ${videoMeta.author}\nDescription: ${videoMeta.description}`;
      metadata.sourceUrl = input;
      metadata.videoPlatform = videoMeta.platform;
      metadata.videoId = videoMeta.videoId;
      metadata.author = videoMeta.author;
      break;
    }

    case "image": {
      // For image URLs, we describe what the AI should analyze
      rawContent = `Image URL: ${input}\nPlease analyze and describe this image for content creation.`;
      metadata.sourceUrl = input;
      break;
    }

    case "text": {
      rawContent = sanitizeExtractedText(input);
      break;
    }
  }

  // Build prompt based on source type
  const systemPrompt = detectedType === "image" ? IMAGE_DESCRIBE_PROMPT : SOURCE_SUMMARIZE_PROMPT;
  const userMessage = `Source type: ${detectedType}\n\n${rawContent.slice(0, 8000)}`;
  const fullPrompt = `${systemPrompt}\n\n---\n\n${userMessage}`;

  const ai = await getActiveAiConfig();
  const result = await callAI(ai.provider, ai.apiKey, fullPrompt, 2048, ai.model);
  await trackTokenUsage(orgId, result.usage.totalTokens);

  const parsed = parseJsonSafe(result.text);

  return {
    sourceType: detectedType,
    title: String(parsed.title || "Untitled"),
    summary: String(parsed.summary || ""),
    keyInsights: Array.isArray(parsed.keyInsights) ? parsed.keyInsights : [],
    suggestedTopics: Array.isArray(parsed.suggestedTopics) ? parsed.suggestedTopics : [],
    suggestedKeywords: Array.isArray(parsed.suggestedKeywords) ? parsed.suggestedKeywords : [],
    originalContent: rawContent.slice(0, 5000),
    metadata,
    tokensUsed: result.usage.totalTokens,
  };
}

/** Safely parse JSON from AI response */
function parseJsonSafe(text: string): Record<string, unknown> {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("Failed to parse AI response as JSON");
  }
}
