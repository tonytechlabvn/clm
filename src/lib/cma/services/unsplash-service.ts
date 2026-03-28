// Unsplash API wrapper — direct fetch(), no archived SDK
// Requires UNSPLASH_ACCESS_KEY env var

export interface UnsplashPhoto {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  description: string | null;
  alt_description: string | null;
  user: {
    name: string;
    links: { html: string };
  };
  links: {
    download_location: string;
  };
}

interface SearchResponse {
  results: UnsplashPhoto[];
  total: number;
}

const BASE_URL = "https://api.unsplash.com";
const VALID_DOWNLOAD_PREFIX = "https://api.unsplash.com/";

function getAccessKey(): string {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) throw new Error("UNSPLASH_ACCESS_KEY is not configured");
  return key;
}

function authHeaders() {
  return { Authorization: `Client-ID ${getAccessKey()}` };
}

/** Search photos by query string */
export async function searchPhotos(
  query: string,
  page = 1,
  perPage = 12
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    query,
    page: String(page),
    per_page: String(perPage),
  });
  const res = await fetch(`${BASE_URL}/search/photos?${params}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Unsplash search failed: ${res.status}`);
  return res.json() as Promise<SearchResponse>;
}

/** Get single photo by ID — returns canonical download_location */
export async function getPhoto(photoId: string): Promise<UnsplashPhoto> {
  const res = await fetch(`${BASE_URL}/photos/${photoId}`, {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Unsplash getPhoto failed: ${res.status}`);
  return res.json() as Promise<UnsplashPhoto>;
}

/** Track download per Unsplash guidelines */
export async function trackDownload(downloadLocation: string): Promise<void> {
  if (!downloadLocation.startsWith(VALID_DOWNLOAD_PREFIX)) {
    throw new Error("Invalid download_location URL");
  }
  // download_location already contains authorization via query params when returned by API
  // but we still need the Client-ID header for the tracking call
  await fetch(downloadLocation, { headers: authHeaders() });
}

/** Download photo buffer — validates SSRF, tracks download, fetches image */
export async function downloadPhoto(
  downloadLocation: string
): Promise<{ buffer: Buffer; contentType: string }> {
  // SSRF protection: only allow Unsplash API URLs
  if (!downloadLocation.startsWith(VALID_DOWNLOAD_PREFIX)) {
    throw new Error("Invalid download_location: must start with https://api.unsplash.com/");
  }

  // Track download (Unsplash requirement)
  await trackDownload(downloadLocation);

  // The tracking endpoint returns the actual download URL
  const trackRes = await fetch(downloadLocation, { headers: authHeaders() });
  const trackData = (await trackRes.json()) as { url?: string };
  const imageUrl = trackData.url;
  if (!imageUrl) throw new Error("No image URL returned from Unsplash download");

  const imgRes = await fetch(imageUrl);
  if (!imgRes.ok) throw new Error(`Image fetch failed: ${imgRes.status}`);

  const contentType = imgRes.headers.get("content-type") || "image/jpeg";
  const buffer = Buffer.from(await imgRes.arrayBuffer());
  return { buffer, contentType };
}
