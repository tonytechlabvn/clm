"use client";

// KB: Image Template System — Admin & Developer Guide

import { CmaKbPageLayout } from "@/components/cma/kb/cma-kb-page-layout";

const TOC = [
  { id: "architecture", label: "Architecture" },
  { id: "data-models", label: "Data Models" },
  { id: "api-reference", label: "API Reference" },
  { id: "create-template", label: "Creating Templates" },
  { id: "template-html", label: "Template HTML Guide" },
  { id: "variables", label: "Variable Schema" },
  { id: "seed-templates", label: "Seeding Templates" },
  { id: "deployment", label: "Deployment" },
  { id: "security", label: "Security" },
  { id: "monitoring", label: "Monitoring" },
  { id: "roadmap", label: "Development Roadmap" },
];

export default function ImageTemplateAdminGuidePage() {
  return (
    <CmaKbPageLayout
      title="Image Template System — Admin & Developer Guide"
      subtitle="Operation, custom templates, architecture, and development roadmap"
      backHref="/admin/cma/kb/image-templates"
      backLabel="Back to KB"
      toc={TOC}
    >
      {/* ── Architecture ── */}
      <section id="architecture">
        <h2>Architecture Overview</h2>
        <p>
          The image template system renders HTML/CSS templates to PNG images using a
          headless Chrome browser (Puppeteer). It integrates into the existing CMA
          publishing pipeline.
        </p>
        <div className="not-prose bg-muted/50 rounded-lg p-4 my-4 border font-mono text-xs leading-relaxed whitespace-pre">{
`User → Pick Template → Fill Variables → Preview → Generate
                              ↓               ↓         ↓
                       Form / Auto-fill   Puppeteer   Sync render
                       from CMA Post      (0.5x)      (2x retina)
                                                         ↓
                                                 PNG saved to
                                                 uploads/cma/generated/
                                                         ↓
                                                 CmaMedia record
                                                 (existing pipeline)
                                                         ↓
                                                 CMA Publish Flow
                                                 (Facebook, etc.)`
        }</div>
        <h3>Key Components</h3>
        <div className="not-prose overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Component</th>
                <th className="text-left py-2 px-3 font-medium">File</th>
                <th className="text-left py-2 px-3 font-medium">Purpose</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3 font-medium">Renderer Service</td>
                <td className="py-2 px-3"><code>services/image-template-renderer-service.ts</code></td>
                <td className="py-2 px-3">Puppeteer singleton, HTML→PNG rendering</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3 font-medium">Type Validators</td>
                <td className="py-2 px-3"><code>types/image-template-types.ts</code></td>
                <td className="py-2 px-3">Zod schemas for API validation</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3 font-medium">API Routes</td>
                <td className="py-2 px-3"><code>app/api/cma/image-templates/</code></td>
                <td className="py-2 px-3">CRUD + render + preview endpoints</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3 font-medium">UI Components</td>
                <td className="py-2 px-3"><code>components/cma/image-template/</code></td>
                <td className="py-2 px-3">Grid, form, preview, panel</td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">Starter Templates</td>
                <td className="py-2 px-3"><code>templates/image/*.ts</code></td>
                <td className="py-2 px-3">HTML/CSS template definitions</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Data Models ── */}
      <section id="data-models">
        <h2>Data Models</h2>
        <h3>CmaImageTemplate</h3>
        <p>Stores template definitions. System templates have <code>isSystem=true</code> and <code>orgId=null</code>.</p>
        <div className="not-prose bg-muted/50 rounded-lg p-4 my-4 border font-mono text-xs leading-relaxed whitespace-pre">{
`CmaImageTemplate
├── id              String (cuid)
├── name            String           — display name
├── description     String?          — brief description
├── platform        String           — "facebook" | "generic"
├── width / height  Int              — output dimensions in pixels
├── htmlContent     String (Text)    — full HTML/CSS with {{variables}}
├── variableSchema  Json             — array of variable definitions
├── thumbnail       String?          — preview image path
├── isSystem        Boolean          — true for built-in templates
├── orgId           String?          — null for system, orgId for custom
├── usageCount      Int              — tracks popularity
└── lastUsedAt      DateTime?`
        }</div>

        <h3>GeneratedImage</h3>
        <p>Tracks each rendered image with provenance (which template, which variables).</p>
        <div className="not-prose bg-muted/50 rounded-lg p-4 my-4 border font-mono text-xs leading-relaxed whitespace-pre">{
`GeneratedImage
├── id              String (cuid)
├── templateId      String           → CmaImageTemplate (cascade delete)
├── variables       Json             — actual values used
├── imagePath       String           — uploads/cma/generated/{orgId}/{uuid}.png
├── width / height  Int
├── fileSize        Int?             — bytes
├── orgId           String           → Organization
├── createdById     String           → User
├── postId          String?          — linked CmaPost
├── mediaId         String?          — linked CmaMedia
└── expiresAt       DateTime?        — for future cleanup`
        }</div>
      </section>

      {/* ── API Reference ── */}
      <section id="api-reference">
        <h2>API Reference</h2>
        <p>All endpoints require authentication via session or API key. All require <code>orgId</code> parameter.</p>

        <div className="not-prose overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Method</th>
                <th className="text-left py-2 px-3 font-medium">Endpoint</th>
                <th className="text-left py-2 px-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3"><code>GET</code></td>
                <td className="py-2 px-3"><code>/api/cma/image-templates?orgId=...&amp;platform=...</code></td>
                <td className="py-2 px-3">List system + org templates (optional platform filter)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>POST</code></td>
                <td className="py-2 px-3"><code>/api/cma/image-templates</code></td>
                <td className="py-2 px-3">Create org-owned template</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>GET</code></td>
                <td className="py-2 px-3"><code>/api/cma/image-templates/[id]?orgId=...</code></td>
                <td className="py-2 px-3">Get single template (org-scoped)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>PUT</code></td>
                <td className="py-2 px-3"><code>/api/cma/image-templates/[id]</code></td>
                <td className="py-2 px-3">Update org-owned template (not system)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>DELETE</code></td>
                <td className="py-2 px-3"><code>/api/cma/image-templates/[id]?orgId=...</code></td>
                <td className="py-2 px-3">Delete org-owned template (not system)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>POST</code></td>
                <td className="py-2 px-3"><code>/api/cma/image-templates/[id]/render?orgId=...</code></td>
                <td className="py-2 px-3">Render full-quality PNG (creates CmaMedia + GeneratedImage)</td>
              </tr>
              <tr>
                <td className="py-2 px-3"><code>POST</code></td>
                <td className="py-2 px-3"><code>/api/cma/image-templates/[id]/preview?orgId=...</code></td>
                <td className="py-2 px-3">Preview at 0.5x scale (returns base64 PNG)</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Render Request Body</h3>
        <pre><code>{`{
  "variables": { "title": "Hello World", "accentColor": "#6366f1" },
  "postId": "optional-post-id"
}`}</code></pre>

        <h3>Render Response</h3>
        <pre><code>{`{
  "data": {
    "generatedImageId": "clxyz...",
    "mediaId": "clxyz...",
    "imageUrl": "/api/cma/media/clxyz...",
    "width": 1200,
    "height": 630
  }
}`}</code></pre>
      </section>

      {/* ── Creating Templates ── */}
      <section id="create-template">
        <h2>Creating Custom Templates</h2>
        <p>
          Admins can create org-specific templates via the API. A template consists of:
        </p>
        <ol>
          <li><strong>HTML content</strong> — Full HTML document with Handlebars <code>{`{{variable}}`}</code> placeholders</li>
          <li><strong>Variable schema</strong> — JSON array defining what users can customize</li>
          <li><strong>Dimensions</strong> — Width and height in pixels</li>
          <li><strong>Platform</strong> — Target platform identifier</li>
        </ol>

        <h3>Example: Create via API</h3>
        <pre><code>{`POST /api/cma/image-templates
Content-Type: application/json

{
  "orgId": "your-org-id",
  "name": "Event Banner",
  "description": "Event announcement banner",
  "platform": "facebook",
  "width": 1200,
  "height": 630,
  "htmlContent": "<!DOCTYPE html><html>...(see HTML guide below)...</html>",
  "variableSchema": [
    { "name": "title", "type": "text", "label": "Event Name", "required": true, "maxLength": 60 },
    { "name": "date", "type": "text", "label": "Date", "required": true, "placeholder": "April 15, 2026" },
    { "name": "imageUrl", "type": "image", "label": "Background", "required": false },
    { "name": "accentColor", "type": "color", "label": "Brand Color", "required": false, "defaultValue": "#6366f1" }
  ]
}`}</code></pre>
      </section>

      {/* ── Template HTML Guide ── */}
      <section id="template-html">
        <h2>Template HTML Guide</h2>
        <p>
          Templates are self-contained HTML documents rendered by Puppeteer (headless Chrome).
          They support full CSS, web fonts, and Handlebars variable substitution.
        </p>

        <h3>Required Structure</h3>
        <pre><code>{`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <!-- Google Fonts for Vietnamese support -->
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{width}}px;    /* system-injected */
      height: {{height}}px;  /* system-injected */
      overflow: hidden;
      font-family: 'Be Vietnam Pro', sans-serif;
    }
    /* Your template CSS here */
  </style>
</head>
<body>
  <!-- Your template HTML with {{variable}} placeholders -->
  <h1>{{title}}</h1>
</body>
</html>`}</code></pre>

        <h3>System Variables</h3>
        <p>
          These are automatically injected — do NOT include them in <code>variableSchema</code>:
        </p>
        <ul>
          <li><code>{`{{width}}`}</code> — Template width in pixels</li>
          <li><code>{`{{height}}`}</code> — Template height in pixels</li>
        </ul>

        <h3>Handlebars Features</h3>
        <ul>
          <li><code>{`{{variable}}`}</code> — HTML-escaped output (safe, use this for text)</li>
          <li><code>{`{{#if variable}}...{{/if}}`}</code> — Conditional rendering</li>
          <li><code>{`{{#unless variable}}...{{/unless}}`}</code> — Inverse conditional</li>
        </ul>

        <div className="not-prose bg-red-500/10 rounded-lg p-4 my-4 border border-red-500/20">
          <p className="text-sm text-red-700 dark:text-red-300">
            <strong>Security Warning:</strong> Never use triple-stash <code>{`{{{variable}}}`}</code> in
            templates — it bypasses HTML escaping and can lead to injection attacks. All user
            variable values are automatically HTML-escaped by Handlebars double-stash.
          </p>
        </div>

        <h3>Design Tips</h3>
        <ul>
          <li>Use <code>overflow: hidden</code> on body to prevent content overflow</li>
          <li>Use absolute positioning for layered layouts (background → overlay → content)</li>
          <li>Background images: use <code>{`{{#if imageUrl}}url('{{imageUrl}}'){{else}}fallback{{/if}}`}</code></li>
          <li>Always provide a gradient fallback when <code>imageUrl</code> is empty</li>
          <li>Set <code>font-family: &apos;Be Vietnam Pro&apos;</code> for Vietnamese diacritics support</li>
        </ul>
      </section>

      {/* ── Variable Schema ── */}
      <section id="variables">
        <h2>Variable Schema Reference</h2>
        <p>Each variable in the <code>variableSchema</code> array has these fields:</p>
        <div className="not-prose overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Field</th>
                <th className="text-left py-2 px-3 font-medium">Type</th>
                <th className="text-left py-2 px-3 font-medium">Required</th>
                <th className="text-left py-2 px-3 font-medium">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3"><code>name</code></td>
                <td className="py-2 px-3">string</td>
                <td className="py-2 px-3">Yes</td>
                <td className="py-2 px-3">Variable key (matches Handlebars placeholder)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>type</code></td>
                <td className="py-2 px-3">&quot;text&quot; | &quot;image&quot; | &quot;color&quot;</td>
                <td className="py-2 px-3">Yes</td>
                <td className="py-2 px-3">Determines UI input and validation</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>label</code></td>
                <td className="py-2 px-3">string</td>
                <td className="py-2 px-3">Yes</td>
                <td className="py-2 px-3">Human-readable label for the form</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>required</code></td>
                <td className="py-2 px-3">boolean</td>
                <td className="py-2 px-3">Yes</td>
                <td className="py-2 px-3">Whether the field must be filled</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>defaultValue</code></td>
                <td className="py-2 px-3">string</td>
                <td className="py-2 px-3">No</td>
                <td className="py-2 px-3">Pre-filled value (colors: hex like <code>#6366f1</code>)</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>maxLength</code></td>
                <td className="py-2 px-3">number</td>
                <td className="py-2 px-3">No</td>
                <td className="py-2 px-3">Character limit for text fields</td>
              </tr>
              <tr>
                <td className="py-2 px-3"><code>placeholder</code></td>
                <td className="py-2 px-3">string</td>
                <td className="py-2 px-3">No</td>
                <td className="py-2 px-3">Placeholder text in the input field</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Seeding Templates ── */}
      <section id="seed-templates">
        <h2>Seeding System Templates</h2>
        <p>
          System templates are seeded via <code>prisma db seed</code>. They use deterministic
          IDs (<code>system-img-facebook</code>, <code>system-img-generic</code>) so the seed
          is idempotent.
        </p>
        <h3>Adding a New System Template</h3>
        <ol>
          <li>Create a new file in <code>src/lib/cma/templates/image/</code> (e.g., <code>instagram-square-template.ts</code>)</li>
          <li>Export a template object with <code>name</code>, <code>platform</code>, <code>width</code>, <code>height</code>, <code>htmlContent</code>, <code>variableSchema</code></li>
          <li>Import and add it to the <code>SYSTEM_IMAGE_TEMPLATES</code> array in <code>seed-image-templates.ts</code></li>
          <li>Run <code>npx prisma db seed</code></li>
        </ol>
        <div className="not-prose bg-amber-500/10 rounded-lg p-4 my-4 border border-amber-500/20">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Note:</strong> The seed ID format <code>system-img-{`{platform}`}</code> supports
            one system template per platform. For multiple templates per platform, extend the ID
            format (e.g., <code>system-img-facebook-event</code>).
          </p>
        </div>
      </section>

      {/* ── Deployment ── */}
      <section id="deployment">
        <h2>Deployment Considerations</h2>

        <h3>Docker / Production</h3>
        <div className="not-prose bg-red-500/10 rounded-lg p-4 my-4 border border-red-500/20">
          <p className="text-sm text-red-700 dark:text-red-300">
            <strong>Critical:</strong> Puppeteer requires Chromium, which is incompatible
            with Alpine Linux (no glibc). Production Docker must use <code>node:20-slim</code> (Debian)
            instead of <code>node:20-alpine</code>.
          </p>
        </div>
        <ul>
          <li><strong>Base image:</strong> Switch to <code>node:20-slim</code> + install <code>chromium</code> via apt</li>
          <li><strong>Memory:</strong> Chrome + Next.js needs ~512MB minimum. Current 768MB cap is tight for concurrent renders</li>
          <li><strong>Alternative:</strong> Run renderer as a separate sidecar service with its own memory allocation</li>
          <li><strong>Chromium:</strong> Use <code>puppeteer-core</code> + system Chrome to avoid bundled download (~280MB)</li>
        </ul>

        <h3>Database Migration</h3>
        <pre><code>{`# Run after deploying new code:
npx prisma migrate deploy
npx prisma db seed    # seeds system templates`}</code></pre>

        <h3>File Storage</h3>
        <ul>
          <li>Generated images are saved to <code>uploads/cma/generated/{`{orgId}`}/{`{uuid}`}.png</code></li>
          <li>Ensure the <code>uploads/</code> directory is persistent across deployments (Docker volume)</li>
          <li>Images are served via <code>/api/cma/media/[id]</code> (existing auth-gated pipeline)</li>
          <li>No CDN or S3 in MVP — add for production scale</li>
        </ul>
      </section>

      {/* ── Security ── */}
      <section id="security">
        <h2>Security</h2>
        <ul>
          <li><strong>Auth:</strong> All API endpoints require session or API key authentication</li>
          <li><strong>Org isolation:</strong> Templates and images are scoped to organizations. Users can only access their org&apos;s resources + system templates</li>
          <li><strong>SSRF protection:</strong> Image URLs validated against private IP ranges (IPv4 + IPv6, localhost, link-local)</li>
          <li><strong>XSS prevention:</strong> Handlebars auto-escapes all variable values via double-stash <code>{`{{var}}`}</code></li>
          <li><strong>Color validation:</strong> Hex color values validated with regex before rendering</li>
          <li><strong>File paths:</strong> UUID-based filenames prevent path traversal. No user-controlled path segments</li>
          <li><strong>System templates:</strong> Read-only (cannot be modified or deleted via API)</li>
          <li><strong>Concurrency limit:</strong> Maximum 3 simultaneous Puppeteer pages to prevent resource exhaustion</li>
        </ul>
      </section>

      {/* ── Monitoring ── */}
      <section id="monitoring">
        <h2>Monitoring &amp; Troubleshooting</h2>

        <h3>Log Prefix</h3>
        <p>
          All renderer logs use the <code>[image-template-renderer]</code> prefix.
          Search server logs for this prefix to find rendering issues.
        </p>

        <h3>Common Issues</h3>
        <div className="not-prose overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Issue</th>
                <th className="text-left py-2 px-3 font-medium">Cause</th>
                <th className="text-left py-2 px-3 font-medium">Fix</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3">Render timeout (10s)</td>
                <td className="py-2 px-3">External image URL slow/unreachable</td>
                <td className="py-2 px-3">Use fast CDN URLs or remove external images</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">Browser launch failure</td>
                <td className="py-2 px-3">Chromium not installed or OOM</td>
                <td className="py-2 px-3">Check Docker image has Chromium, increase memory</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">Font not rendering</td>
                <td className="py-2 px-3">Google Fonts blocked in network</td>
                <td className="py-2 px-3">Bundle font as base64 in template CSS</td>
              </tr>
              <tr>
                <td className="py-2 px-3">Disk space growing</td>
                <td className="py-2 px-3">Generated images not cleaned up</td>
                <td className="py-2 px-3">Implement cleanup job (see roadmap)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Development Roadmap ── */}
      <section id="roadmap">
        <h2>Development Roadmap</h2>
        <p>Current status: <strong>MVP (Phase 1) Complete</strong>. Planned enhancements:</p>

        <h3>Phase 2 — Platform Expansion</h3>
        <ul>
          <li>Instagram Square template (1080×1080)</li>
          <li>LinkedIn Article template (744×400)</li>
          <li>Twitter/X Card template (1024×512)</li>
          <li>Custom dimension support for org templates</li>
        </ul>

        <h3>Phase 3 — Batch &amp; Async</h3>
        <ul>
          <li>pg-boss async queue for batch image generation</li>
          <li>Generate images for multiple platforms from one set of variables</li>
          <li>Background rendering with progress notification</li>
        </ul>

        <h3>Phase 4 — Template Builder UI</h3>
        <ul>
          <li>Visual drag-and-drop template editor (no HTML needed)</li>
          <li>Template marketplace: share templates between organizations</li>
          <li>Template versioning and rollback</li>
        </ul>

        <h3>Phase 5 — Storage &amp; Cleanup</h3>
        <ul>
          <li>S3/R2 cloud storage for generated images</li>
          <li>Automatic cleanup job for expired images (<code>expiresAt</code> field)</li>
          <li>Image compression and format options (WebP, JPEG)</li>
        </ul>

        <h3>Phase 6 — MCP Integration</h3>
        <ul>
          <li>Expose image template operations via MCP server</li>
          <li>AI agents can browse, fill, and generate template images</li>
          <li>Template suggestion based on post content analysis</li>
        </ul>

        <div className="not-prose bg-muted/50 rounded-lg p-4 my-4 border">
          <p className="text-sm text-muted-foreground">
            <strong>Contributing:</strong> Template HTML files are in{" "}
            <code>src/lib/cma/templates/image/</code>. Each template is a self-contained TypeScript
            module exporting template metadata + HTML content. Follow existing templates as reference.
          </p>
        </div>
      </section>
    </CmaKbPageLayout>
  );
}
