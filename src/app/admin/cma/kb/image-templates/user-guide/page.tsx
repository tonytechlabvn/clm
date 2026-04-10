"use client";

// KB: Image Template System — End User Guide

import { CmaKbPageLayout } from "@/components/cma/kb/cma-kb-page-layout";

const TOC = [
  { id: "overview", label: "Overview" },
  { id: "getting-started", label: "Getting Started" },
  { id: "browse-templates", label: "Browse Templates" },
  { id: "fill-variables", label: "Fill Variables" },
  { id: "live-preview", label: "Live Preview" },
  { id: "generate-image", label: "Generate Image" },
  { id: "use-as-featured", label: "Use as Featured Image" },
  { id: "auto-fill", label: "Auto-Fill from Post" },
  { id: "variable-types", label: "Variable Types" },
  { id: "tips", label: "Tips & Best Practices" },
  { id: "faq", label: "FAQ" },
];

export default function ImageTemplateUserGuidePage() {
  return (
    <CmaKbPageLayout
      title="Image Template System — User Guide"
      subtitle="Create branded social media images from templates"
      backHref="/admin/cma/kb/image-templates"
      backLabel="Back to KB"
      toc={TOC}
    >
      {/* ── Overview ── */}
      <section id="overview">
        <h2>Overview</h2>
        <p>
          The Image Template System lets you create professional, branded social media
          images without any design tools. Pick a template, fill in your content, preview
          it live, and generate a pixel-perfect PNG ready for publishing.
        </p>
        <div className="not-prose bg-muted/50 rounded-lg p-4 my-4 border">
          <p className="text-sm font-medium mb-2">What you can do:</p>
          <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
            <li>Browse platform-optimized templates (Facebook, Generic)</li>
            <li>Customize text, colors, and background images</li>
            <li>See changes in real-time with live preview</li>
            <li>Generate high-quality PNG images at exact platform dimensions</li>
            <li>Use generated images as post featured images for publishing</li>
            <li>Auto-fill template variables from your post data</li>
          </ul>
        </div>
      </section>

      {/* ── Getting Started ── */}
      <section id="getting-started">
        <h2>Getting Started</h2>
        <p>
          The image template system is accessed through the <strong>Featured Image Picker</strong> when
          creating or editing a CMA post.
        </p>
        <ol>
          <li>Open the <strong>CMA Post Editor</strong> (create or edit a post)</li>
          <li>Click the <strong>Featured Image</strong> area to open the image picker</li>
          <li>Select the <strong>&quot;Template&quot;</strong> tab (alongside Upload, Unsplash, AI Generate)</li>
          <li>You&apos;re now in the Image Template panel</li>
        </ol>
        <div className="not-prose bg-blue-500/10 rounded-lg p-4 my-4 border border-blue-500/20">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>Tip:</strong> You can also access templates directly at{" "}
            <code className="text-xs bg-muted rounded px-1 py-0.5">/admin/cma/kb/image-templates</code> for
            browsing and reference.
          </p>
        </div>
      </section>

      {/* ── Browse Templates ── */}
      <section id="browse-templates">
        <h2>Browse Templates</h2>
        <p>
          Templates are organized by platform. Use the filter tabs at the top to narrow down:
        </p>
        <div className="not-prose overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Filter</th>
                <th className="text-left py-2 px-3 font-medium">Shows</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3"><code>All</code></td>
                <td className="py-2 px-3">All available templates</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>Facebook</code></td>
                <td className="py-2 px-3">Facebook-optimized (1200×630)</td>
              </tr>
              <tr>
                <td className="py-2 px-3"><code>Generic</code></td>
                <td className="py-2 px-3">Universal templates for any platform</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Each template card shows a thumbnail preview, the template name, platform, and
          dimensions. Click a card to select it and start customizing.
        </p>
      </section>

      {/* ── Fill Variables ── */}
      <section id="fill-variables">
        <h2>Fill Variables</h2>
        <p>
          After selecting a template, a dynamic form appears with the template&apos;s customizable
          fields. Each template defines its own set of variables — typically:
        </p>
        <ul>
          <li><strong>Title</strong> — The main headline text (required)</li>
          <li><strong>Subtitle / Body</strong> — Supporting text (optional)</li>
          <li><strong>Background Image</strong> — A URL to a background image (optional)</li>
          <li><strong>Accent Color</strong> — A brand color for accent elements (optional)</li>
          <li><strong>Logo</strong> — Your organization&apos;s logo URL (optional)</li>
        </ul>
        <p>
          Required fields are marked with a red asterisk (<span className="text-destructive">*</span>).
          Character counters appear for fields with maximum length limits.
        </p>
      </section>

      {/* ── Live Preview ── */}
      <section id="live-preview">
        <h2>Live Preview</h2>
        <p>
          As you type, the preview updates automatically after a short delay (500ms).
          The preview shows a scaled-down version of your final image so you can see
          exactly how it will look.
        </p>
        <div className="not-prose bg-amber-500/10 rounded-lg p-4 my-4 border border-amber-500/20">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <strong>Note:</strong> Preview images are rendered at half resolution for speed.
            The final generated image will be full quality at the template&apos;s native dimensions
            (e.g., 1200×630 for Facebook).
          </p>
        </div>
        <p>
          If a preview fails (e.g., network issue), an error message appears with details.
          Simply adjust your inputs and the preview will retry automatically.
        </p>
      </section>

      {/* ── Generate Image ── */}
      <section id="generate-image">
        <h2>Generate Image</h2>
        <p>
          Once you&apos;re happy with the preview:
        </p>
        <ol>
          <li>Click the <strong>&quot;Generate Image&quot;</strong> button</li>
          <li>Wait for rendering (typically 1-2 seconds)</li>
          <li>The full-quality PNG is generated and saved</li>
          <li>Two action buttons appear:
            <ul>
              <li><strong>Use as Featured Image</strong> — Sets this image as your post&apos;s featured image</li>
              <li><strong>Download</strong> — Downloads the PNG to your device</li>
            </ul>
          </li>
        </ol>
        <p>
          Generated images are stored on the server and linked to your organization.
          They&apos;re served through the same secure media pipeline as uploaded images.
        </p>
      </section>

      {/* ── Use as Featured Image ── */}
      <section id="use-as-featured">
        <h2>Use as Featured Image</h2>
        <p>
          After generating an image, click <strong>&quot;Use as Featured Image&quot;</strong> to
          set it as your post&apos;s cover image. This works seamlessly with the publishing flow:
        </p>
        <ul>
          <li><strong>Facebook:</strong> The image is uploaded directly to Facebook when you publish (no public URL needed)</li>
          <li><strong>Other platforms:</strong> The image URL is included as the post&apos;s featured media</li>
        </ul>
        <p>
          The image picker modal closes automatically after selection, and your post
          editor updates with the new featured image.
        </p>
      </section>

      {/* ── Auto-Fill ── */}
      <section id="auto-fill">
        <h2>Auto-Fill from Post</h2>
        <p>
          If you&apos;re editing a post that already has content, click the{" "}
          <strong>&quot;Auto-fill from post&quot;</strong> button to populate template variables
          from your post data:
        </p>
        <div className="not-prose overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Post Field</th>
                <th className="text-left py-2 px-3 font-medium">Maps To</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3">Post title</td>
                <td className="py-2 px-3"><code>title</code> variable</td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">Post excerpt</td>
                <td className="py-2 px-3"><code>subtitle</code> / <code>body</code> variable</td>
              </tr>
              <tr>
                <td className="py-2 px-3">Existing featured image</td>
                <td className="py-2 px-3"><code>imageUrl</code> variable (background)</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Auto-fill won&apos;t overwrite fields you&apos;ve already customized — it only
          fills in empty fields.
        </p>
      </section>

      {/* ── Variable Types ── */}
      <section id="variable-types">
        <h2>Variable Types</h2>
        <p>
          Templates support three types of variables, each with its own input style:
        </p>
        <div className="not-prose overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Type</th>
                <th className="text-left py-2 px-3 font-medium">Input</th>
                <th className="text-left py-2 px-3 font-medium">Example</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3 font-medium">Text</td>
                <td className="py-2 px-3">Text input with optional max length</td>
                <td className="py-2 px-3"><code>Breaking News: Feature Launch</code></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3 font-medium">Image</td>
                <td className="py-2 px-3">URL input (paste image URL)</td>
                <td className="py-2 px-3"><code>https://example.com/photo.jpg</code></td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">Color</td>
                <td className="py-2 px-3">Color picker + hex input</td>
                <td className="py-2 px-3"><code>#6366f1</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Tips ── */}
      <section id="tips">
        <h2>Tips &amp; Best Practices</h2>
        <ul>
          <li>
            <strong>Keep titles short.</strong> Most templates look best with headlines under
            60 characters. Longer text may overflow or look cramped.
          </li>
          <li>
            <strong>Use high-resolution background images.</strong> Facebook templates are
            1200×630 pixels — your background image should be at least this size for crisp results.
          </li>
          <li>
            <strong>Match your brand colors.</strong> Use the accent color picker to match
            your organization&apos;s brand palette for consistent visual identity.
          </li>
          <li>
            <strong>Test with Vietnamese text.</strong> All templates support Vietnamese
            diacritics (ắ, ệ, ộ, ứ, etc.) using the Be Vietnam Pro font.
          </li>
          <li>
            <strong>Preview before generating.</strong> The preview is fast and free — check
            your design before committing to a full render.
          </li>
        </ul>
      </section>

      {/* ── FAQ ── */}
      <section id="faq">
        <h2>FAQ</h2>

        <h3>What image dimensions are supported?</h3>
        <p>
          Each template has fixed dimensions optimized for its platform. Facebook templates
          are 1200×630 pixels. Generic templates are also 1200×630 (a widely compatible size).
          More platform sizes (Instagram 1080×1080, LinkedIn 744×400) coming in future updates.
        </p>

        <h3>Can I create my own templates?</h3>
        <p>
          Currently, templates are provided as system defaults. Custom template creation
          is available to administrators through the API. See the{" "}
          <a href="/admin/cma/kb/image-templates/admin-guide">Admin Guide</a> for details.
        </p>

        <h3>What format are generated images?</h3>
        <p>
          All images are generated as PNG (lossless) at 2x retina resolution for crisp
          display on high-DPI screens.
        </p>

        <h3>Is there a limit on how many images I can generate?</h3>
        <p>
          There is a server-side concurrency limit (3 simultaneous renders) to maintain
          performance, but no per-user daily limit for image generation.
        </p>

        <h3>Can I use external images as backgrounds?</h3>
        <p>
          Yes, paste any public HTTPS image URL into the background image field.
          For security, private/internal URLs (localhost, private IPs) are blocked.
        </p>
      </section>
    </CmaKbPageLayout>
  );
}
