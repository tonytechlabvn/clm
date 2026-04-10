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
      args: [
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
      ],
    });
    browser = b;
    browserPromise = null;
    return b;
  })();
  return browserPromise;
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

export interface RenderOptions {
  htmlContent: string;
  variables: Record<string, string>;
  width: number;
  height: number;
}

export interface RenderResult {
  buffer: Buffer;
  width: number;
  height: number;
}

// ── Variable validation ──

function validateVariables(variables: Record<string, string>): void {
  for (const [key, value] of Object.entries(variables)) {
    if (!value) continue;
    // URL/image fields: SSRF check
    if (key.toLowerCase().includes("url") || key.toLowerCase().includes("image")) {
      if (!validateImageUrl(value)) {
        throw new Error(`Invalid URL for "${key}": private/internal URLs blocked`);
      }
    }
    // Color fields: hex format check
    if (key.toLowerCase().includes("color")) {
      if (!/^#[0-9a-fA-F]{3,8}$/.test(value)) {
        throw new Error(`Invalid color for "${key}": must be hex (e.g. #ff6600)`);
      }
    }
  }
}

// ── Core render: HTML + variables → PNG buffer ──

export async function renderTemplate(opts: RenderOptions): Promise<RenderResult> {
  const { htmlContent, variables, width, height } = opts;

  validateVariables(variables);

  // Inject system variables (width, height) into Handlebars context
  const context = { ...variables, width, height };
  const compiled = Handlebars.compile(htmlContent);
  const html = compiled(context);

  await acquirePage();
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setViewport({ width, height, deviceScaleFactor: 2 });
    // 10s timeout to prevent hangs on slow external resources
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 10_000 });
    const buffer = (await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width, height },
    })) as Buffer;
    return { buffer, width, height };
  } finally {
    await page.close();
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
  const html = compiled(context);

  await acquirePage();
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.setViewport({ width: previewWidth, height: previewHeight });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 10_000 });
    return (await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width: previewWidth, height: previewHeight },
    })) as Buffer;
  } finally {
    await page.close();
    releasePage();
  }
}
