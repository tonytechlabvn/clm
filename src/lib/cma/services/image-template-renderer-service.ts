// Puppeteer-based image template renderer — HTML/CSS + Handlebars variables → PNG
// Singleton browser instance for performance, SSRF protection, variable validation

import puppeteer, { Browser } from "puppeteer";
import Handlebars from "handlebars";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";

const LOG = "[image-template-renderer]";

// ── Puppeteer browser singleton (promise-cached, same pattern as pgboss-service) ──

let browser: Browser | null = null;
let browserPromise: Promise<Browser> | null = null;

async function getBrowser(): Promise<Browser> {
  if (browser?.connected) return browser;
  if (browserPromise) return browserPromise;

  browserPromise = (async () => {
    console.log(`${LOG} Launching browser...`);
    const b = await puppeteer.launch({
      headless: true,
      // Raise the Puppeteer CDP protocol timeout so a slow screenshot under
      // load doesn't fall back to the 180s default and hang the tunnel.
      protocolTimeout: 30_000,
      // Use system Chromium if PUPPETEER_EXECUTABLE_PATH is set (Docker production)
      ...(process.env.PUPPETEER_EXECUTABLE_PATH
        ? { executablePath: process.env.PUPPETEER_EXECUTABLE_PATH }
        : {}),
      args: [
        "--no-sandbox", // required when running as non-root in Docker
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--disable-crash-reporter",
        "--disable-extensions",
        "--disable-background-networking",
        "--no-zygote", // single-process model for containers
        "--disable-features=VizDisplayCompositor",
      ],
    });
    browser = b;
    browserPromise = null;
    return b;
  })();
  return browserPromise;
}

// When a render fails with a protocol-level error the browser is in an
// undefined state — the cleanest recovery is to close it so the next call
// re-launches a fresh instance. Safe no-op when the browser is already
// disconnected.
async function resetBrowserOnFatalError(): Promise<void> {
  const current = browser;
  browser = null;
  browserPromise = null;
  if (current) {
    try {
      await current.close();
    } catch {
      // Swallow — we're already in an error path
    }
  }
}

export async function shutdownBrowser(): Promise<void> {
  if (browser) {
    await browser.close();
    browser = null;
    console.log(`${LOG} Browser shut down`);
  }
}

// Cleanup on process exit
process.on("SIGTERM", shutdownBrowser);
process.on("SIGINT", shutdownBrowser);

// ── SSRF protection: block private/internal IPs ──

// Block private/internal IPs including IPv4 and IPv6 variants
const PRIVATE_IP_REGEX =
  /^https?:\/\/(localhost|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.|0\.0\.0\.0|\[::1\]|\[::ffff:127\.\d|\[fd|\[fe80:|\[fc)/i;

function validateImageUrl(url: string): boolean {
  if (!url) return true;
  if (!url.startsWith("https://") && !url.startsWith("http://")) return false;
  if (PRIVATE_IP_REGEX.test(url)) return false;
  return true;
}

// ── Rate limiting: concurrent page semaphore ──

const MAX_CONCURRENT_PAGES = 3;
let activePagesCount = 0;

async function acquirePage(): Promise<void> {
  while (activePagesCount >= MAX_CONCURRENT_PAGES) {
    await new Promise((r) => setTimeout(r, 100));
  }
  activePagesCount++;
}

function releasePage(): void {
  activePagesCount = Math.max(0, activePagesCount - 1);
}

// ── Types ──

// Variables map passed to Handlebars. Values can be:
//   - string: flat legacy variable (e.g. `title` → `{{title}}`)
//   - Record<string,string>: nested dynamic-field context (e.g. `date: { text }`
//     → `{{date.text}}`). Enables APITemplate.io-style dotted query keys.
// Nested objects are exactly one level deep; see direct-url-query-parser.ts
// for the flattening rules used by validation.
export type RenderVariables = Record<string, string | Record<string, string>>;

export interface RenderOptions {
  htmlContent: string;
  variables: RenderVariables;
  width: number;
  height: number;
}

export interface RenderResult {
  buffer: Buffer;
  width: number;
  height: number;
}

// ── Variable validation ──

// Walk flat + nested values. Key used for substring heuristics is the full
// dotted path (`background.url`, `date.text`) so SSRF/hex-color checks keep
// firing correctly when dynamic fields are used.
function checkValue(key: string, value: string): void {
  if (!value) return;
  if (key.toLowerCase().includes("url") || key.toLowerCase().includes("image")) {
    if (!validateImageUrl(value)) {
      throw new Error(`Invalid URL for "${key}": private/internal URLs blocked`);
    }
  }
  if (key.toLowerCase().includes("color")) {
    if (!/^#[0-9a-fA-F]{3,8}$/.test(value)) {
      throw new Error(`Invalid color for "${key}": must be hex (e.g. #ff6600)`);
    }
  }
}

function validateVariables(variables: RenderVariables): void {
  for (const [key, value] of Object.entries(variables)) {
    if (typeof value === "string") {
      checkValue(key, value);
    } else if (value && typeof value === "object") {
      for (const [k2, v2] of Object.entries(value)) {
        checkValue(`${key}.${k2}`, v2);
      }
    }
  }
}

// ── Core render: HTML + variables → PNG buffer ──

// Puppeteer's page.setContent() loads HTML with an `about:blank` base URL,
// so any relative `src="/api/..."` (e.g., editor-uploaded assets stored as
// /api/cma/image-templates/assets/...) fails to resolve and the <img> silently
// renders nothing. We inject a <base href> tag so the in-page fetch runs
// against the internal localhost origin instead. Localhost is correct inside
// the container — the Next.js server serves its own asset routes there and
// Puppeteer hits them via the loopback interface (no DNS, no Cloudflare,
// no external network path).
const INTERNAL_ORIGIN = process.env.INTERNAL_ORIGIN ?? "http://localhost:3000";

function injectBaseHref(html: string): string {
  // Only inject if <head> exists and no <base> already set
  if (html.includes("<base ")) return html;
  return html.replace(
    /<head([^>]*)>/i,
    `<head$1><base href="${INTERNAL_ORIGIN}/">`
  );
}

export async function renderTemplate(opts: RenderOptions): Promise<RenderResult> {
  const { htmlContent, variables, width, height } = opts;

  validateVariables(variables);

  // Inject system variables (width, height) into Handlebars context
  const context = { ...variables, width, height };
  const compiled = Handlebars.compile(htmlContent);
  const html = injectBaseHref(compiled(context));

  await acquirePage();
  let page;
  try {
    const b = await getBrowser();
    page = await b.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    // networkidle2 ignores up to 2 persistent connections (Google Fonts keeps
    // one open); networkidle0 would hang waiting for those. 10s hard cap so
    // slow external resources can't stall us.
    await page.setContent(html, { waitUntil: "networkidle2", timeout: 10_000 });
    const buffer = (await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width, height },
    })) as Buffer;
    return { buffer, width, height };
  } catch (err) {
    // Protocol-level errors (screenshot timeout etc.) leave the browser
    // in a corrupt state. Close + relaunch on next call.
    if (err instanceof Error && /Protocol|timed out|Target closed/i.test(err.message)) {
      await resetBrowserOnFatalError();
    }
    throw err;
  } finally {
    if (page) {
      try { await page.close(); } catch { /* page may already be gone */ }
    }
    releasePage();
  }
}

// ── Render + save to filesystem ──

export async function renderAndSave(
  opts: RenderOptions & { orgId: string }
): Promise<{ filePath: string; fileSize: number } & RenderResult> {
  const result = await renderTemplate(opts);

  const dir = path.join("uploads", "cma", "generated", opts.orgId);
  await fs.mkdir(dir, { recursive: true });
  const fileName = `${randomUUID()}.png`;
  const filePath = path.join(dir, fileName);
  await fs.writeFile(filePath, result.buffer);

  return { ...result, filePath, fileSize: result.buffer.length };
}

// ── Preview: render at reduced scale for speed ──

export async function renderPreview(opts: RenderOptions): Promise<Buffer> {
  const { htmlContent, variables, width, height } = opts;

  validateVariables(variables);

  const previewWidth = Math.round(width * 0.5);
  const previewHeight = Math.round(height * 0.5);

  // Inject system variables for preview too
  const context = { ...variables, width, height };
  const compiled = Handlebars.compile(htmlContent);
  const html = injectBaseHref(compiled(context));

  await acquirePage();
  let page;
  try {
    const b = await getBrowser();
    page = await b.newPage();
    await page.setViewport({ width: previewWidth, height: previewHeight });
    await page.setContent(html, { waitUntil: "networkidle2", timeout: 10_000 });
    return (await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: previewWidth, height: previewHeight },
    })) as Buffer;
  } catch (err) {
    if (err instanceof Error && /Protocol|timed out|Target closed/i.test(err.message)) {
      await resetBrowserOnFatalError();
    }
    throw err;
  } finally {
    if (page) {
      try { await page.close(); } catch { /* page may already be gone */ }
    }
    releasePage();
  }
}
