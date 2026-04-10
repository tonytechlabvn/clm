"use client";

// KB: Image Template System — End User Guide (Vietnamese / English)

import { CmaKbPageLayout, T } from "@/components/cma/kb/cma-kb-page-layout";

const TOC = [
  { id: "overview", en: "Overview", vi: "Tổng quan" },
  { id: "getting-started", en: "Getting Started", vi: "Bắt đầu" },
  { id: "browse-templates", en: "Browse Templates", vi: "Duyệt mẫu" },
  { id: "fill-variables", en: "Fill Variables", vi: "Điền biến" },
  { id: "live-preview", en: "Live Preview", vi: "Xem trước" },
  { id: "generate-image", en: "Generate Image", vi: "Tạo hình ảnh" },
  { id: "use-as-featured", en: "Use as Featured Image", vi: "Dùng làm ảnh đại diện" },
  { id: "auto-fill", en: "Auto-Fill from Post", vi: "Tự động điền từ bài viết" },
  { id: "variable-types", en: "Variable Types", vi: "Loại biến" },
  { id: "tips", en: "Tips & Best Practices", vi: "Mẹo & thực hành tốt" },
  { id: "faq", en: "FAQ", vi: "Câu hỏi thường gặp" },
];

export default function ImageTemplateUserGuidePage() {
  return (
    <CmaKbPageLayout
      titleEn="Image Template System — User Guide"
      titleVi="Hệ Thống Mẫu Hình Ảnh — Hướng Dẫn Sử Dụng"
      subtitleEn="Create branded social media images from templates"
      subtitleVi="Tạo hình ảnh mạng xã hội chuyên nghiệp từ mẫu có sẵn"
      backHref="/admin/cma/kb/image-templates"
      toc={TOC}
    >
      {/* ── Overview ── */}
      <section id="overview">
        <h2><T en="Overview" vi="Tổng quan" /></h2>
        <T
          en={<p>The Image Template System lets you create professional, branded social media images without any design tools. Pick a template, fill in your content, preview it live, and generate a pixel-perfect PNG ready for publishing.</p>}
          vi={<p>Hệ thống Mẫu Hình Ảnh cho phép bạn tạo hình ảnh mạng xã hội chuyên nghiệp mà không cần công cụ thiết kế. Chọn mẫu, điền nội dung, xem trước trực tiếp và tạo ảnh PNG chất lượng cao để đăng bài.</p>}
        />
        <div className="not-prose bg-muted/50 rounded-lg p-4 my-4 border">
          <p className="text-sm font-medium mb-2"><T en="What you can do:" vi="Bạn có thể:" /></p>
          <T
            en={
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Browse platform-optimized templates (Facebook, Generic)</li>
                <li>Customize text, colors, and background images</li>
                <li>See changes in real-time with live preview</li>
                <li>Generate high-quality PNG images at exact platform dimensions</li>
                <li>Use generated images as post featured images for publishing</li>
                <li>Auto-fill template variables from your post data</li>
              </ul>
            }
            vi={
              <ul className="text-sm space-y-1 text-muted-foreground list-disc list-inside">
                <li>Duyệt mẫu tối ưu cho từng nền tảng (Facebook, Chung)</li>
                <li>Tùy chỉnh văn bản, màu sắc và hình nền</li>
                <li>Xem thay đổi trực tiếp với chế độ xem trước</li>
                <li>Tạo ảnh PNG chất lượng cao đúng kích thước nền tảng</li>
                <li>Sử dụng ảnh đã tạo làm ảnh đại diện bài viết để xuất bản</li>
                <li>Tự động điền biến mẫu từ dữ liệu bài viết</li>
              </ul>
            }
          />
        </div>
      </section>

      {/* ── Getting Started ── */}
      <section id="getting-started">
        <h2><T en="Getting Started" vi="Bắt đầu" /></h2>
        <T
          en={<p>The image template system is accessed through the <strong>Featured Image Picker</strong> when creating or editing a CMA post.</p>}
          vi={<p>Hệ thống mẫu hình ảnh được truy cập qua <strong>Bộ chọn ảnh đại diện</strong> khi tạo hoặc chỉnh sửa bài viết CMA.</p>}
        />
        <T
          en={
            <ol>
              <li>Open the <strong>CMA Post Editor</strong> (create or edit a post)</li>
              <li>Click the <strong>Featured Image</strong> area to open the image picker</li>
              <li>Select the <strong>&quot;Template&quot;</strong> tab</li>
              <li>You&apos;re now in the Image Template panel</li>
            </ol>
          }
          vi={
            <ol>
              <li>Mở <strong>Trình soạn bài CMA</strong> (tạo mới hoặc chỉnh sửa bài viết)</li>
              <li>Nhấn vào vùng <strong>Ảnh đại diện</strong> để mở bộ chọn ảnh</li>
              <li>Chọn tab <strong>&quot;Template&quot;</strong></li>
              <li>Bạn đã vào bảng điều khiển Mẫu Hình Ảnh</li>
            </ol>
          }
        />
      </section>

      {/* ── Browse Templates ── */}
      <section id="browse-templates">
        <h2><T en="Browse Templates" vi="Duyệt mẫu" /></h2>
        <T
          en={<p>Templates are organized by platform. Use the filter tabs at the top to narrow down:</p>}
          vi={<p>Mẫu được sắp xếp theo nền tảng. Sử dụng các tab lọc ở trên để thu hẹp:</p>}
        />
        <div className="not-prose overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium"><T en="Filter" vi="Bộ lọc" /></th>
                <th className="text-left py-2 px-3 font-medium"><T en="Shows" vi="Hiển thị" /></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3"><code>All</code></td>
                <td className="py-2 px-3"><T en="All available templates" vi="Tất cả mẫu có sẵn" /></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><code>Facebook</code></td>
                <td className="py-2 px-3"><T en="Facebook-optimized (1200×630)" vi="Tối ưu cho Facebook (1200×630)" /></td>
              </tr>
              <tr>
                <td className="py-2 px-3"><code>Generic</code></td>
                <td className="py-2 px-3"><T en="Universal templates for any platform" vi="Mẫu chung cho mọi nền tảng" /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <T
          en={<p>Each template card shows a thumbnail, name, platform, and dimensions. Click to select and start customizing.</p>}
          vi={<p>Mỗi thẻ mẫu hiển thị ảnh thu nhỏ, tên, nền tảng và kích thước. Nhấn để chọn và bắt đầu tùy chỉnh.</p>}
        />
      </section>

      {/* ── Fill Variables ── */}
      <section id="fill-variables">
        <h2><T en="Fill Variables" vi="Điền biến" /></h2>
        <T
          en={<p>After selecting a template, a dynamic form appears with customizable fields:</p>}
          vi={<p>Sau khi chọn mẫu, một biểu mẫu động xuất hiện với các trường có thể tùy chỉnh:</p>}
        />
        <T
          en={
            <ul>
              <li><strong>Title</strong> — The main headline text (required)</li>
              <li><strong>Subtitle / Body</strong> — Supporting text (optional)</li>
              <li><strong>Background Image</strong> — URL to a background image (optional)</li>
              <li><strong>Accent Color</strong> — A brand color for accent elements (optional)</li>
              <li><strong>Logo</strong> — Your organization&apos;s logo URL (optional)</li>
            </ul>
          }
          vi={
            <ul>
              <li><strong>Tiêu đề</strong> — Dòng chữ chính (bắt buộc)</li>
              <li><strong>Phụ đề / Nội dung</strong> — Văn bản hỗ trợ (tùy chọn)</li>
              <li><strong>Hình nền</strong> — URL hình ảnh làm nền (tùy chọn)</li>
              <li><strong>Màu nhấn</strong> — Màu thương hiệu cho các phần tử (tùy chọn)</li>
              <li><strong>Logo</strong> — URL logo tổ chức của bạn (tùy chọn)</li>
            </ul>
          }
        />
        <T
          en={<p>Required fields are marked with a red asterisk (<span className="text-destructive">*</span>). Character counters appear for fields with maximum length limits.</p>}
          vi={<p>Trường bắt buộc được đánh dấu bằng dấu sao đỏ (<span className="text-destructive">*</span>). Bộ đếm ký tự hiển thị cho các trường có giới hạn độ dài.</p>}
        />
      </section>

      {/* ── Live Preview ── */}
      <section id="live-preview">
        <h2><T en="Live Preview" vi="Xem trước trực tiếp" /></h2>
        <T
          en={<p>As you type, the preview updates automatically after a short delay (500ms). The preview shows a scaled-down version of your final image.</p>}
          vi={<p>Khi bạn gõ, bản xem trước tự động cập nhật sau một khoảng trễ ngắn (500ms). Bản xem trước hiển thị phiên bản thu nhỏ của ảnh cuối cùng.</p>}
        />
        <div className="not-prose bg-amber-500/10 rounded-lg p-4 my-4 border border-amber-500/20">
          <p className="text-sm text-amber-700 dark:text-amber-300">
            <T
              en={<><strong>Note:</strong> Preview images are rendered at half resolution for speed. The final generated image will be full quality at the template&apos;s native dimensions (e.g., 1200×630 for Facebook).</>}
              vi={<><strong>Lưu ý:</strong> Ảnh xem trước được render ở nửa độ phân giải để tăng tốc. Ảnh tạo ra cuối cùng sẽ đầy đủ chất lượng ở kích thước gốc của mẫu (ví dụ: 1200×630 cho Facebook).</>}
            />
          </p>
        </div>
      </section>

      {/* ── Generate Image ── */}
      <section id="generate-image">
        <h2><T en="Generate Image" vi="Tạo hình ảnh" /></h2>
        <T
          en={
            <>
              <p>Once you&apos;re happy with the preview:</p>
              <ol>
                <li>Click the <strong>&quot;Generate Image&quot;</strong> button</li>
                <li>Wait for rendering (typically 1-2 seconds)</li>
                <li>The full-quality PNG is generated and saved</li>
                <li>Two action buttons appear: <strong>Use as Featured Image</strong> and <strong>Download</strong></li>
              </ol>
            </>
          }
          vi={
            <>
              <p>Khi bạn hài lòng với bản xem trước:</p>
              <ol>
                <li>Nhấn nút <strong>&quot;Generate Image&quot;</strong></li>
                <li>Chờ render (thường 1-2 giây)</li>
                <li>Ảnh PNG chất lượng cao được tạo và lưu</li>
                <li>Hai nút hành động xuất hiện: <strong>Dùng làm ảnh đại diện</strong> và <strong>Tải xuống</strong></li>
              </ol>
            </>
          }
        />
      </section>

      {/* ── Use as Featured Image ── */}
      <section id="use-as-featured">
        <h2><T en="Use as Featured Image" vi="Dùng làm ảnh đại diện" /></h2>
        <T
          en={
            <>
              <p>After generating, click <strong>&quot;Use as Featured Image&quot;</strong> to set it as your post&apos;s cover image:</p>
              <ul>
                <li><strong>Facebook:</strong> The image is uploaded directly when you publish (no public URL needed)</li>
                <li><strong>Other platforms:</strong> The image URL is included as the post&apos;s featured media</li>
              </ul>
            </>
          }
          vi={
            <>
              <p>Sau khi tạo, nhấn <strong>&quot;Use as Featured Image&quot;</strong> để đặt làm ảnh bìa bài viết:</p>
              <ul>
                <li><strong>Facebook:</strong> Ảnh được tải trực tiếp lên khi xuất bản (không cần URL công khai)</li>
                <li><strong>Nền tảng khác:</strong> URL ảnh được đính kèm làm media bài viết</li>
              </ul>
            </>
          }
        />
      </section>

      {/* ── Auto-Fill ── */}
      <section id="auto-fill">
        <h2><T en="Auto-Fill from Post" vi="Tự động điền từ bài viết" /></h2>
        <T
          en={<p>Click <strong>&quot;Auto-fill from post&quot;</strong> to populate template variables from your post data:</p>}
          vi={<p>Nhấn <strong>&quot;Auto-fill from post&quot;</strong> để tự động điền biến mẫu từ dữ liệu bài viết:</p>}
        />
        <div className="not-prose overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium"><T en="Post Field" vi="Trường bài viết" /></th>
                <th className="text-left py-2 px-3 font-medium"><T en="Maps To" vi="Ánh xạ tới" /></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3"><T en="Post title" vi="Tiêu đề bài viết" /></td>
                <td className="py-2 px-3"><code>title</code></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3"><T en="Post excerpt" vi="Tóm tắt bài viết" /></td>
                <td className="py-2 px-3"><code>subtitle</code> / <code>body</code></td>
              </tr>
              <tr>
                <td className="py-2 px-3"><T en="Existing featured image" vi="Ảnh đại diện hiện tại" /></td>
                <td className="py-2 px-3"><code>imageUrl</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Variable Types ── */}
      <section id="variable-types">
        <h2><T en="Variable Types" vi="Loại biến" /></h2>
        <div className="not-prose overflow-x-auto my-4">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3 font-medium"><T en="Type" vi="Loại" /></th>
                <th className="text-left py-2 px-3 font-medium"><T en="Input" vi="Đầu vào" /></th>
                <th className="text-left py-2 px-3 font-medium"><T en="Example" vi="Ví dụ" /></th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-2 px-3 font-medium">Text</td>
                <td className="py-2 px-3"><T en="Text input with optional max length" vi="Ô nhập văn bản, có thể giới hạn ký tự" /></td>
                <td className="py-2 px-3"><code>Tin Nổi Bật: Ra Mắt Tính Năng Mới</code></td>
              </tr>
              <tr className="border-b">
                <td className="py-2 px-3 font-medium">Image</td>
                <td className="py-2 px-3"><T en="URL input (paste image URL)" vi="Ô nhập URL (dán đường dẫn hình ảnh)" /></td>
                <td className="py-2 px-3"><code>https://example.com/photo.jpg</code></td>
              </tr>
              <tr>
                <td className="py-2 px-3 font-medium">Color</td>
                <td className="py-2 px-3"><T en="Color picker + hex input" vi="Bộ chọn màu + mã hex" /></td>
                <td className="py-2 px-3"><code>#6366f1</code></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ── Tips ── */}
      <section id="tips">
        <h2><T en="Tips & Best Practices" vi="Mẹo & Thực hành tốt" /></h2>
        <T
          en={
            <ul>
              <li><strong>Keep titles short.</strong> Most templates look best with headlines under 60 characters.</li>
              <li><strong>Use high-resolution background images.</strong> Facebook templates are 1200×630px — your background should be at least this size.</li>
              <li><strong>Match your brand colors.</strong> Use the accent color picker to match your organization&apos;s brand palette.</li>
              <li><strong>Test with Vietnamese text.</strong> All templates support Vietnamese diacritics (ắ, ệ, ộ, ứ) using Be Vietnam Pro font.</li>
              <li><strong>Preview before generating.</strong> The preview is fast and free — check your design before committing.</li>
            </ul>
          }
          vi={
            <ul>
              <li><strong>Giữ tiêu đề ngắn gọn.</strong> Hầu hết mẫu đẹp nhất với tiêu đề dưới 60 ký tự.</li>
              <li><strong>Sử dụng hình nền độ phân giải cao.</strong> Mẫu Facebook là 1200×630px — hình nền nên ít nhất bằng kích thước này.</li>
              <li><strong>Phù hợp màu thương hiệu.</strong> Sử dụng bộ chọn màu nhấn để khớp với bảng màu thương hiệu tổ chức.</li>
              <li><strong>Thử nghiệm với tiếng Việt.</strong> Tất cả mẫu hỗ trợ dấu tiếng Việt (ắ, ệ, ộ, ứ) nhờ font Be Vietnam Pro.</li>
              <li><strong>Xem trước trước khi tạo.</strong> Bản xem trước nhanh và miễn phí — kiểm tra thiết kế trước khi tạo ảnh chính thức.</li>
            </ul>
          }
        />
      </section>

      {/* ── FAQ ── */}
      <section id="faq">
        <h2><T en="FAQ" vi="Câu hỏi thường gặp" /></h2>

        <h3><T en="What image dimensions are supported?" vi="Hỗ trợ kích thước ảnh nào?" /></h3>
        <T
          en={<p>Each template has fixed dimensions. Facebook: 1200×630. Generic: 1200×630. More sizes (Instagram 1080×1080, LinkedIn 744×400) coming soon.</p>}
          vi={<p>Mỗi mẫu có kích thước cố định. Facebook: 1200×630. Chung: 1200×630. Thêm kích thước (Instagram 1080×1080, LinkedIn 744×400) sẽ có sớm.</p>}
        />

        <h3><T en="Can I create my own templates?" vi="Tôi có thể tạo mẫu riêng không?" /></h3>
        <T
          en={<p>Custom template creation is available to administrators through the API. See the <a href="/admin/cma/kb/image-templates/admin-guide">Admin Guide</a>.</p>}
          vi={<p>Quản trị viên có thể tạo mẫu tùy chỉnh qua API. Xem <a href="/admin/cma/kb/image-templates/admin-guide">Hướng dẫn quản trị</a>.</p>}
        />

        <h3><T en="What format are generated images?" vi="Ảnh được tạo ở định dạng nào?" /></h3>
        <T
          en={<p>All images are PNG (lossless) at 2x retina resolution for crisp display on high-DPI screens.</p>}
          vi={<p>Tất cả ảnh ở định dạng PNG (không mất dữ liệu) với độ phân giải 2x retina cho hiển thị sắc nét trên màn hình cao.</p>}
        />

        <h3><T en="Is there a limit on image generation?" vi="Có giới hạn số ảnh tạo không?" /></h3>
        <T
          en={<p>Server-side concurrency limit (3 simultaneous renders) but no per-user daily limit.</p>}
          vi={<p>Giới hạn đồng thời phía server (3 render cùng lúc) nhưng không giới hạn số lượng mỗi ngày cho người dùng.</p>}
        />

        <h3><T en="Can I use external images as backgrounds?" vi="Có thể dùng ảnh bên ngoài làm nền không?" /></h3>
        <T
          en={<p>Yes, paste any public HTTPS image URL. Private/internal URLs (localhost, private IPs) are blocked for security.</p>}
          vi={<p>Có, dán bất kỳ URL ảnh HTTPS công khai nào. URL nội bộ/riêng tư (localhost, IP private) bị chặn vì lý do bảo mật.</p>}
        />
      </section>
    </CmaKbPageLayout>
  );
}
