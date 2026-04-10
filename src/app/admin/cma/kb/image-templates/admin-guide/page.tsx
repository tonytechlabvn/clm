"use client";

// KB: Image Template System — Admin & Developer Guide (Vietnamese / English)

import { CmaKbPageLayout, T } from "@/components/cma/kb/cma-kb-page-layout";

const TOC = [
  { id: "architecture", en: "Architecture", vi: "Kiến trúc" },
  { id: "data-models", en: "Data Models", vi: "Mô hình dữ liệu" },
  { id: "api-reference", en: "API Reference", vi: "Tham chiếu API" },
  { id: "create-template", en: "Creating Templates", vi: "Tạo mẫu" },
  { id: "template-html", en: "Template HTML Guide", vi: "Hướng dẫn HTML mẫu" },
  { id: "variables", en: "Variable Schema", vi: "Schema biến" },
  { id: "seed-templates", en: "Seeding Templates", vi: "Seed mẫu hệ thống" },
  { id: "deployment", en: "Deployment", vi: "Triển khai" },
  { id: "security", en: "Security", vi: "Bảo mật" },
  { id: "monitoring", en: "Monitoring", vi: "Giám sát" },
  { id: "roadmap", en: "Development Roadmap", vi: "Lộ trình phát triển" },
];

export default function ImageTemplateAdminGuidePage() {
  return (
    <CmaKbPageLayout
      titleEn="Image Template System — Admin & Developer Guide"
      titleVi="Hệ Thống Mẫu Hình Ảnh — Hướng Dẫn Quản Trị & Phát Triển"
      subtitleEn="Operation, custom templates, architecture, and development roadmap"
      subtitleVi="Vận hành, mẫu tùy chỉnh, kiến trúc và lộ trình phát triển"
      backHref="/admin/cma/kb/image-templates"
      toc={TOC}
    >
      {/* ── Architecture ── */}
      <section id="architecture">
        <h2><T en="Architecture Overview" vi="Tổng quan kiến trúc" /></h2>
        <T
          en={<p>The image template system renders HTML/CSS templates to PNG images using headless Chrome (Puppeteer). It integrates into the existing CMA publishing pipeline.</p>}
          vi={<p>Hệ thống mẫu hình ảnh render các mẫu HTML/CSS thành ảnh PNG sử dụng Chrome headless (Puppeteer). Tích hợp vào pipeline xuất bản CMA hiện có.</p>}
        />
        <div className="not-prose bg-muted/50 rounded-lg p-4 my-4 border font-mono text-xs leading-relaxed whitespace-pre">{
`User → Pick Template → Fill Variables → Preview → Generate
                              ↓               ↓         ↓
                       Form / Auto-fill   Puppeteer   Sync render
                       from CMA Post      (0.5x)      (2x retina)
                                                         ↓
                                                 PNG → uploads/cma/generated/
                                                         ↓
                                                 CmaMedia → CMA Publish Flow`
        }</div>

        <h3><T en="Key Components" vi="Thành phần chính" /></h3>
        <div className="not-prose overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium"><T en="Component" vi="Thành phần" /></th>
                <th className="text-left py-2 px-3 font-medium"><T en="File" vi="Tệp" /></th>
                <th className="text-left py-2 px-3 font-medium"><T en="Purpose" vi="Mục đích" /></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3 font-medium">Renderer Service</td>
                <td className="py-2 px-3"><code>services/image-template-renderer-service.ts</code></td>
                <td className="py-2 px-3"><T en="Puppeteer singleton, HTML→PNG" vi="Puppeteer singleton, HTML→PNG" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3 font-medium">Type Validators</td>
                <td className="py-2 px-3"><code>types/image-template-types.ts</code></td>
                <td className="py-2 px-3"><T en="Zod schemas for API validation" vi="Zod schema cho xác thực API" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3 font-medium">API Routes</td>
                <td className="py-2 px-3"><code>app/api/cma/image-templates/</code></td>
                <td className="py-2 px-3"><T en="CRUD + render + preview" vi="CRUD + render + xem trước" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3 font-medium">UI Components</td>
                <td className="py-2 px-3"><code>components/cma/image-template/</code></td>
                <td className="py-2 px-3"><T en="Grid, form, preview, panel" vi="Lưới, biểu mẫu, xem trước, bảng" /></td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">Starter Templates</td>
                <td className="py-2 px-3"><code>templates/image/*.ts</code></td>
                <td className="py-2 px-3"><T en="HTML/CSS template definitions" vi="Định nghĩa mẫu HTML/CSS" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Data Models ── */}
      <section id="data-models">
        <h2><T en="Data Models" vi="Mô hình dữ liệu" /></h2>
        <h3>CmaImageTemplate</h3>
        <T
          en={<p>Stores template definitions. System templates: <code>isSystem=true</code>, <code>orgId=null</code>.</p>}
          vi={<p>Lưu trữ định nghĩa mẫu. Mẫu hệ thống: <code>isSystem=true</code>, <code>orgId=null</code>.</p>}
        />
        <div className="not-prose bg-muted/50 rounded-lg p-4 my-4 border font-mono text-xs leading-relaxed whitespace-pre">{
`CmaImageTemplate
├── id, name, description
├── platform        — "facebook" | "generic"
├── width / height  — pixels
├── htmlContent     — HTML/CSS with {{variables}}
├── variableSchema  — JSON array of variable defs
├── isSystem        — true = built-in
├── orgId           — null = system, orgId = custom
└── usageCount, lastUsedAt`
        }</div>

        <h3>GeneratedImage</h3>
        <T
          en={<p>Tracks each rendered image with provenance (template + variables used).</p>}
          vi={<p>Theo dõi mỗi ảnh đã render với nguồn gốc (mẫu + biến đã dùng).</p>}
        />
        <div className="not-prose bg-muted/50 rounded-lg p-4 my-4 border font-mono text-xs leading-relaxed whitespace-pre">{
`GeneratedImage
├── templateId      → CmaImageTemplate (cascade delete)
├── variables       — JSON values used
├── imagePath       — uploads/cma/generated/{orgId}/{uuid}.png
├── orgId, createdById, postId, mediaId
└── expiresAt       — for future cleanup`
        }</div>
      </section>

      {/* ── API Reference ── */}
      <section id="api-reference">
        <h2><T en="API Reference" vi="Tham chiếu API" /></h2>
        <T
          en={<p>All endpoints require authentication (session or API key) and <code>orgId</code> parameter.</p>}
          vi={<p>Tất cả endpoint yêu cầu xác thực (session hoặc API key) và tham số <code>orgId</code>.</p>}
        />
        <div className="not-prose overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Method</th>
                <th className="text-left py-2 px-3 font-medium">Endpoint</th>
                <th className="text-left py-2 px-3 font-medium"><T en="Description" vi="Mô tả" /></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3"><code>GET</code></td>
                <td className="py-2 px-3"><code>/api/cma/image-templates</code></td>
                <td className="py-2 px-3"><T en="List templates (system + org)" vi="Liệt kê mẫu (hệ thống + tổ chức)" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>POST</code></td>
                <td className="py-2 px-3"><code>/api/cma/image-templates</code></td>
                <td className="py-2 px-3"><T en="Create org template" vi="Tạo mẫu tổ chức" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>GET</code></td>
                <td className="py-2 px-3"><code>/api/cma/image-templates/[id]</code></td>
                <td className="py-2 px-3"><T en="Get single template" vi="Lấy 1 mẫu" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>PUT</code></td>
                <td className="py-2 px-3"><code>/api/cma/image-templates/[id]</code></td>
                <td className="py-2 px-3"><T en="Update org template" vi="Cập nhật mẫu" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>DELETE</code></td>
                <td className="py-2 px-3"><code>/api/cma/image-templates/[id]</code></td>
                <td className="py-2 px-3"><T en="Delete org template" vi="Xóa mẫu" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>POST</code></td>
                <td className="py-2 px-3"><code>/.../[id]/render</code></td>
                <td className="py-2 px-3"><T en="Render full PNG (creates CmaMedia)" vi="Render PNG đầy đủ (tạo CmaMedia)" /></td>
              </tr>
              <tr>
                <td className="py-2 px-3"><code>POST</code></td>
                <td className="py-2 px-3"><code>/.../[id]/preview</code></td>
                <td className="py-2 px-3"><T en="Preview at 0.5x (base64)" vi="Xem trước 0.5x (base64)" /></td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3><T en="Render Request / Response" vi="Request / Response Render" /></h3>
        <pre><code>{`// Request body:
{ "variables": { "title": "Hello", "accentColor": "#6366f1" }, "postId": "..." }

// Response:
{ "data": { "generatedImageId": "...", "mediaId": "...", "imageUrl": "/api/cma/media/...", "width": 1200, "height": 630 } }`}</code></pre>
      </section>

      {/* ── Creating Templates ── */}
      <section id="create-template">
        <h2><T en="Creating Custom Templates" vi="Tạo mẫu tùy chỉnh" /></h2>
        <T
          en={
            <ol>
              <li><strong>HTML content</strong> — Full HTML document with Handlebars <code>{`{{variable}}`}</code> placeholders</li>
              <li><strong>Variable schema</strong> — JSON array defining user-customizable fields</li>
              <li><strong>Dimensions</strong> — Width and height in pixels</li>
              <li><strong>Platform</strong> — Target platform identifier</li>
            </ol>
          }
          vi={
            <ol>
              <li><strong>Nội dung HTML</strong> — Tài liệu HTML đầy đủ với placeholder Handlebars <code>{`{{biến}}`}</code></li>
              <li><strong>Schema biến</strong> — Mảng JSON định nghĩa các trường người dùng tùy chỉnh</li>
              <li><strong>Kích thước</strong> — Chiều rộng và cao tính bằng pixel</li>
              <li><strong>Nền tảng</strong> — Định danh nền tảng mục tiêu</li>
            </ol>
          }
        />
        <h3><T en="Example: Create via API" vi="Ví dụ: Tạo qua API" /></h3>
        <pre><code>{`POST /api/cma/image-templates
{
  "orgId": "your-org-id",
  "name": "Event Banner",
  "platform": "facebook",
  "width": 1200, "height": 630,
  "htmlContent": "<!DOCTYPE html>...",
  "variableSchema": [
    { "name": "title", "type": "text", "label": "Event Name", "required": true, "maxLength": 60 },
    { "name": "accentColor", "type": "color", "label": "Brand Color", "required": false, "defaultValue": "#6366f1" }
  ]
}`}</code></pre>
      </section>

      {/* ── Template HTML Guide ── */}
      <section id="template-html">
        <h2><T en="Template HTML Guide" vi="Hướng dẫn HTML mẫu" /></h2>
        <T
          en={<p>Templates are self-contained HTML documents rendered by Puppeteer. Support full CSS, web fonts, and Handlebars variables.</p>}
          vi={<p>Mẫu là tài liệu HTML độc lập được render bởi Puppeteer. Hỗ trợ đầy đủ CSS, web font và biến Handlebars.</p>}
        />
        <h3><T en="Required Structure" vi="Cấu trúc bắt buộc" /></h3>
        <pre><code>{`<!DOCTYPE html>
<html><head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { width: {{width}}px; height: {{height}}px; overflow: hidden; font-family: 'Be Vietnam Pro', sans-serif; }
  </style>
</head>
<body>
  <h1>{{title}}</h1>
</body></html>`}</code></pre>

        <h3><T en="System Variables (auto-injected)" vi="Biến hệ thống (tự động inject)" /></h3>
        <ul>
          <li><code>{`{{width}}`}</code> / <code>{`{{height}}`}</code> — <T en="Template dimensions in pixels" vi="Kích thước mẫu tính bằng pixel" /></li>
        </ul>

        <h3><T en="Handlebars Features" vi="Tính năng Handlebars" /></h3>
        <ul>
          <li><code>{`{{variable}}`}</code> — <T en="HTML-escaped output (safe)" vi="Đầu ra HTML-escaped (an toàn)" /></li>
          <li><code>{`{{#if variable}}...{{/if}}`}</code> — <T en="Conditional rendering" vi="Render có điều kiện" /></li>
        </ul>

        <div className="not-prose bg-red-500/10 rounded-lg p-4 my-4 border border-red-500/20">
          <p className="text-sm text-red-700 dark:text-red-300">
            <T
              en={<><strong>Security:</strong> Never use triple-stash <code>{`{{{var}}}`}</code> — it bypasses HTML escaping and can cause injection attacks.</>}
              vi={<><strong>Bảo mật:</strong> Không bao giờ dùng triple-stash <code>{`{{{var}}}`}</code> — nó bỏ qua HTML escaping và có thể gây tấn công injection.</>}
            />
          </p>
        </div>
      </section>

      {/* ── Variable Schema ── */}
      <section id="variables">
        <h2><T en="Variable Schema Reference" vi="Tham chiếu Schema biến" /></h2>
        <div className="not-prose overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium">Field</th>
                <th className="text-left py-2 px-3 font-medium">Type</th>
                <th className="text-left py-2 px-3 font-medium"><T en="Required" vi="Bắt buộc" /></th>
                <th className="text-left py-2 px-3 font-medium"><T en="Description" vi="Mô tả" /></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b"><td className="py-2 px-3"><code>name</code></td><td className="py-2 px-3">string</td><td className="py-2 px-3"><T en="Yes" vi="Có" /></td><td className="py-2 px-3"><T en="Variable key (matches Handlebars)" vi="Khóa biến (khớp Handlebars)" /></td></tr>
              <tr className="border-b"><td className="py-2 px-3"><code>type</code></td><td className="py-2 px-3">&quot;text&quot; | &quot;image&quot; | &quot;color&quot;</td><td className="py-2 px-3"><T en="Yes" vi="Có" /></td><td className="py-2 px-3"><T en="UI input + validation type" vi="Loại input + xác thực" /></td></tr>
              <tr className="border-b"><td className="py-2 px-3"><code>label</code></td><td className="py-2 px-3">string</td><td className="py-2 px-3"><T en="Yes" vi="Có" /></td><td className="py-2 px-3"><T en="Human-readable label" vi="Nhãn hiển thị" /></td></tr>
              <tr className="border-b"><td className="py-2 px-3"><code>required</code></td><td className="py-2 px-3">boolean</td><td className="py-2 px-3"><T en="Yes" vi="Có" /></td><td className="py-2 px-3"><T en="Must be filled" vi="Phải điền" /></td></tr>
              <tr className="border-b"><td className="py-2 px-3"><code>defaultValue</code></td><td className="py-2 px-3">string</td><td className="py-2 px-3"><T en="No" vi="Không" /></td><td className="py-2 px-3"><T en="Pre-filled value" vi="Giá trị mặc định" /></td></tr>
              <tr className="border-b"><td className="py-2 px-3"><code>maxLength</code></td><td className="py-2 px-3">number</td><td className="py-2 px-3"><T en="No" vi="Không" /></td><td className="py-2 px-3"><T en="Character limit for text" vi="Giới hạn ký tự cho text" /></td></tr>
              <tr><td className="py-2 px-3"><code>placeholder</code></td><td className="py-2 px-3">string</td><td className="py-2 px-3"><T en="No" vi="Không" /></td><td className="py-2 px-3"><T en="Placeholder text" vi="Văn bản gợi ý" /></td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Seeding Templates ── */}
      <section id="seed-templates">
        <h2><T en="Seeding System Templates" vi="Seed mẫu hệ thống" /></h2>
        <T
          en={
            <ol>
              <li>Create file in <code>src/lib/cma/templates/image/</code></li>
              <li>Export template object with name, platform, width, height, htmlContent, variableSchema</li>
              <li>Add to <code>SYSTEM_IMAGE_TEMPLATES</code> array in <code>seed-image-templates.ts</code></li>
              <li>Run <code>npx prisma db seed</code></li>
            </ol>
          }
          vi={
            <ol>
              <li>Tạo file trong <code>src/lib/cma/templates/image/</code></li>
              <li>Export đối tượng mẫu với name, platform, width, height, htmlContent, variableSchema</li>
              <li>Thêm vào mảng <code>SYSTEM_IMAGE_TEMPLATES</code> trong <code>seed-image-templates.ts</code></li>
              <li>Chạy <code>npx prisma db seed</code></li>
            </ol>
          }
        />
      </section>

      {/* ── Deployment ── */}
      <section id="deployment">
        <h2><T en="Deployment" vi="Triển khai" /></h2>
        <div className="not-prose bg-red-500/10 rounded-lg p-4 my-4 border border-red-500/20">
          <p className="text-sm text-red-700 dark:text-red-300">
            <T
              en={<><strong>Critical:</strong> Puppeteer requires Chromium. Docker must use <code>node:20-slim</code> (Debian), NOT <code>node:20-alpine</code>.</>}
              vi={<><strong>Quan trọng:</strong> Puppeteer cần Chromium. Docker phải dùng <code>node:20-slim</code> (Debian), KHÔNG dùng <code>node:20-alpine</code>.</>}
            />
          </p>
        </div>
        <T
          en={
            <ul>
              <li><strong>Base image:</strong> <code>node:20-slim</code> + install <code>chromium</code> via apt</li>
              <li><strong>Memory:</strong> 1.5GB minimum (Chrome + Next.js)</li>
              <li><strong>Env vars:</strong> <code>PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium</code></li>
              <li><strong>Storage:</strong> Mount <code>clm-uploads</code> volume for persistent generated images</li>
              <li><strong>Migration:</strong> <code>npx prisma migrate deploy</code> + <code>npx prisma db seed</code></li>
            </ul>
          }
          vi={
            <ul>
              <li><strong>Base image:</strong> <code>node:20-slim</code> + cài <code>chromium</code> qua apt</li>
              <li><strong>Bộ nhớ:</strong> tối thiểu 1.5GB (Chrome + Next.js)</li>
              <li><strong>Biến môi trường:</strong> <code>PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium</code></li>
              <li><strong>Lưu trữ:</strong> Mount volume <code>clm-uploads</code> cho ảnh tạo ra</li>
              <li><strong>Migration:</strong> <code>npx prisma migrate deploy</code> + <code>npx prisma db seed</code></li>
            </ul>
          }
        />
      </section>

      {/* ── Security ── */}
      <section id="security">
        <h2><T en="Security" vi="Bảo mật" /></h2>
        <T
          en={
            <ul>
              <li><strong>Auth:</strong> All endpoints require session or API key</li>
              <li><strong>Org isolation:</strong> Users only access their org&apos;s resources + system templates</li>
              <li><strong>SSRF protection:</strong> Image URLs validated against private IPs (IPv4 + IPv6)</li>
              <li><strong>XSS prevention:</strong> Handlebars auto-escapes all variable values</li>
              <li><strong>Color validation:</strong> Hex values validated before rendering</li>
              <li><strong>File paths:</strong> UUID-based filenames — no user-controlled segments</li>
              <li><strong>Concurrency:</strong> Max 3 simultaneous Puppeteer pages</li>
            </ul>
          }
          vi={
            <ul>
              <li><strong>Xác thực:</strong> Tất cả endpoint yêu cầu session hoặc API key</li>
              <li><strong>Cô lập tổ chức:</strong> Người dùng chỉ truy cập tài nguyên tổ chức mình + mẫu hệ thống</li>
              <li><strong>Chống SSRF:</strong> URL ảnh được kiểm tra IP private (IPv4 + IPv6)</li>
              <li><strong>Chống XSS:</strong> Handlebars tự động escape tất cả giá trị biến</li>
              <li><strong>Kiểm tra màu:</strong> Giá trị hex được xác thực trước khi render</li>
              <li><strong>Đường dẫn file:</strong> Tên file UUID — không có đoạn người dùng kiểm soát</li>
              <li><strong>Đồng thời:</strong> Tối đa 3 trang Puppeteer cùng lúc</li>
            </ul>
          }
        />
      </section>

      {/* ── Monitoring ── */}
      <section id="monitoring">
        <h2><T en="Monitoring & Troubleshooting" vi="Giám sát & Xử lý sự cố" /></h2>
        <T
          en={<p>All renderer logs use prefix <code>[image-template-renderer]</code>.</p>}
          vi={<p>Tất cả log renderer dùng prefix <code>[image-template-renderer]</code>.</p>}
        />
        <div className="not-prose overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium"><T en="Issue" vi="Vấn đề" /></th>
                <th className="text-left py-2 px-3 font-medium"><T en="Cause" vi="Nguyên nhân" /></th>
                <th className="text-left py-2 px-3 font-medium"><T en="Fix" vi="Cách sửa" /></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3">Render timeout (10s)</td>
                <td className="py-2 px-3"><T en="Slow external image URL" vi="URL ảnh bên ngoài chậm" /></td>
                <td className="py-2 px-3"><T en="Use fast CDN URLs" vi="Dùng URL CDN nhanh" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3">Browser launch failure</td>
                <td className="py-2 px-3"><T en="Chromium not installed or OOM" vi="Chromium chưa cài hoặc hết RAM" /></td>
                <td className="py-2 px-3"><T en="Check Docker image, increase memory" vi="Kiểm tra Docker image, tăng bộ nhớ" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><T en="Font not rendering" vi="Font không hiển thị" /></td>
                <td className="py-2 px-3"><T en="Google Fonts blocked" vi="Google Fonts bị chặn" /></td>
                <td className="py-2 px-3"><T en="Bundle font as base64 in CSS" vi="Bundle font base64 trong CSS" /></td>
              </tr>
              <tr>
                <td className="py-2 px-3"><T en="Disk space growing" vi="Dung lượng ổ đĩa tăng" /></td>
                <td className="py-2 px-3"><T en="No cleanup job" vi="Không có job dọn dẹp" /></td>
                <td className="py-2 px-3"><T en="Implement cleanup (see roadmap)" vi="Triển khai dọn dẹp (xem lộ trình)" /></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Roadmap ── */}
      <section id="roadmap">
        <h2><T en="Development Roadmap" vi="Lộ trình phát triển" /></h2>
        <p><T en={<>Current: <strong>MVP Complete</strong>. Planned:</>} vi={<>Hiện tại: <strong>MVP Hoàn thành</strong>. Kế hoạch:</>} /></p>

        <h3><T en="Phase 2 — Platform Expansion" vi="Giai đoạn 2 — Mở rộng nền tảng" /></h3>
        <ul>
          <li>Instagram Square (1080×1080)</li>
          <li>LinkedIn Article (744×400)</li>
          <li>Twitter/X Card (1024×512)</li>
        </ul>

        <h3><T en="Phase 3 — Batch & Async" vi="Giai đoạn 3 — Batch & Bất đồng bộ" /></h3>
        <T
          en={<ul><li>pg-boss async queue for batch generation</li><li>Multi-platform render from one variable set</li></ul>}
          vi={<ul><li>Hàng đợi pg-boss bất đồng bộ cho tạo hàng loạt</li><li>Render nhiều nền tảng từ một bộ biến</li></ul>}
        />

        <h3><T en="Phase 4 — Template Builder UI" vi="Giai đoạn 4 — Giao diện tạo mẫu" /></h3>
        <T
          en={<ul><li>Visual drag-and-drop editor (no HTML needed)</li><li>Template marketplace between organizations</li></ul>}
          vi={<ul><li>Trình soạn kéo-thả trực quan (không cần HTML)</li><li>Chợ mẫu giữa các tổ chức</li></ul>}
        />

        <h3><T en="Phase 5 — Storage & Cleanup" vi="Giai đoạn 5 — Lưu trữ & Dọn dẹp" /></h3>
        <T
          en={<ul><li>S3/R2 cloud storage</li><li>Auto cleanup for expired images</li></ul>}
          vi={<ul><li>Lưu trữ đám mây S3/R2</li><li>Tự động dọn ảnh hết hạn</li></ul>}
        />

        <h3><T en="Phase 6 — MCP Integration" vi="Giai đoạn 6 — Tích hợp MCP" /></h3>
        <T
          en={<ul><li>Expose operations via MCP server</li><li>AI agents browse, fill, and generate template images</li></ul>}
          vi={<ul><li>Mở các thao tác qua MCP server</li><li>AI agent duyệt, điền và tạo ảnh từ mẫu</li></ul>}
        />
      </section>
    </CmaKbPageLayout>
  );
}
