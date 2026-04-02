-- Insert Tech Blog Dark Mode template
INSERT INTO "CmaTemplate" (
  id, "orgId", name, slug, description, category, "templateType",
  "htmlTemplate", "cssScoped", "slotDefinitions", blocks,
  "sourceUrl", "usageCount", "styleTheme", "createdAt", "updatedAt"
) VALUES (
  'tpl_tech_blog_v1',
  'cmn9w9pwf0001mfkrrc469lwo',
  'Tech Blog - Dark Docs',
  'cmn9w9pwf0001mfkrrc469lwo-tech-blog-dark-docs',
  'Dark mode SaaS docs style with glassmorphism nav, neon callouts, dark terminal code blocks, feature grid, gradient text animations.',
  'article',
  'html-slots',
  '<div class="ttl-docs-wrapper">
  <nav class="ttl-docs-topmenu">
    <h3>Nội dung</h3>
    <ul class="ttl-docs-nav">
      <li><a href="#overview">1. [Section 1]</a></li>
      <li><a href="#features">2. [Section 2]</a></li>
      <li><a href="#strategy">3. [Section 3]</a></li>
      <li><a href="#tools">4. [Section 4]</a></li>
      <li><a href="#best-practices">5. [Section 5]</a></li>
    </ul>
  </nav>
  <main class="ttl-docs-main">
    <h1>[Tiêu đề bài viết]</h1>
    <div class="ttl-callout ttl-callout-info">
      <div class="ttl-callout-title"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z"></path></svg> Document Info</div>
      <p style="margin-bottom:0; font-size: 0.9rem;">[Mô tả ngắn về tài liệu này]</p>
    </div>
    <h2 id="overview">1. [Tiêu đề phần 1]</h2>
    <p>[Nội dung phần 1]</p>
    <h2 id="features">2. [Tiêu đề phần 2 - Features]</h2>
    <p>[Giới thiệu các tính năng]</p>
    <div class="ttl-feature-grid">
      <div class="ttl-feature-item"><h4>[Feature 1]</h4><p>[Mô tả feature 1]</p></div>
      <div class="ttl-feature-item"><h4>[Feature 2]</h4><p>[Mô tả feature 2]</p></div>
      <div class="ttl-feature-item"><h4>[Feature 3]</h4><p>[Mô tả feature 3]</p></div>
      <div class="ttl-feature-item"><h4>[Feature 4]</h4><p>[Mô tả feature 4]</p></div>
    </div>
    <h2 id="strategy">3. [Tiêu đề phần 3]</h2>
    <p>[Giới thiệu chiến lược]</p>
    <ol>
      <li><strong>[Điểm 1]:</strong> [Chi tiết]</li>
      <li><strong>[Điểm 2]:</strong> [Chi tiết]</li>
      <li><strong>[Điểm 3]:</strong> [Chi tiết]</li>
      <li><strong>[Điểm 4]:</strong> [Chi tiết]</li>
    </ol>
    <h2 id="tools">4. [Tiêu đề phần 4 - Tools]</h2>
    <p>[Giới thiệu công cụ]</p>
    <div class="ttl-code-wrapper">
      <div class="ttl-code-header"><span>bash</span><span>Copy</span></div>
      <pre class="ttl-code-block"><code><span class="ttl-token-comment"># [Comment 1]</span>
<span class="ttl-token-function-dark">[command1]</span> <span class="ttl-token-keyword">[--flag]</span> <span class="ttl-token-string-dark">"[value]"</span>

<span class="ttl-token-comment"># [Comment 2]</span>
<span class="ttl-token-function-dark">[command2]</span> <span class="ttl-token-keyword">[--flag]</span> <span class="ttl-token-string-dark">"[value]"</span></code></pre>
    </div>
    <h2 id="best-practices">5. [Tiêu đề phần 5 - Best Practices]</h2>
    <div class="ttl-callout ttl-callout-success">
      <div class="ttl-callout-title"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path></svg> [Best Practice Title]</div>
      <p style="margin-bottom:0; font-size: 0.9rem;">[Best practice content]</p>
    </div>
    <h3>[Sub-section title]</h3>
    <ul>
      <li>[Tip 1]</li>
      <li>[Tip 2]</li>
      <li>[Tip 3]</li>
    </ul>
    <div class="ttl-callout ttl-callout-warning" style="margin-top: 40px;">
      <div class="ttl-callout-title"><svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z"></path></svg> [Warning Title]</div>
      <p style="margin-bottom:0; font-size: 0.9rem;">[Warning content]</p>
    </div>
  </main>
</div>',
  ':root{--docs-bg:#0f172a;--docs-text:#cbd5e1;--docs-text-light:#94a3b8;--docs-border:rgba(255,255,255,0.1);--docs-primary:#38bdf8;--docs-primary-glow:rgba(56,189,248,0.4);--docs-success:#34d399;--docs-warning:#fbbf24;--docs-sidebar-bg:rgba(15,23,42,0.75);--docs-code-bg:#0b0f19;--docs-code-text:#e2e8f0;--docs-font-main:-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;--docs-font-mono:"Fira Code",Consolas,Menlo,Courier,monospace}.ttl-docs-wrapper{font-family:var(--docs-font-main);color:var(--docs-text);line-height:1.7;display:flex;flex-direction:column;max-width:1100px;margin:0 auto;background-color:var(--docs-bg);background-image:linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px);background-size:30px 30px;border:1px solid var(--docs-border);border-radius:16px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);position:relative;overflow:hidden}.ttl-docs-wrapper::before{content:'''';position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:80%;height:400px;background:radial-gradient(ellipse at top,rgba(56,189,248,0.15),transparent 70%);pointer-events:none;z-index:0}.ttl-docs-topmenu{background-color:var(--docs-sidebar-bg);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--docs-border);padding:16px 32px;position:sticky;top:0;z-index:100;display:flex;align-items:center;flex-wrap:wrap;gap:24px}.ttl-docs-topmenu h3{font-size:0.85rem;text-transform:uppercase;color:var(--docs-primary);margin:0;letter-spacing:1px;font-weight:700;text-shadow:0 0 10px var(--docs-primary-glow);white-space:nowrap}.ttl-docs-nav{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:12px}.ttl-docs-nav a{color:var(--docs-text-light);text-decoration:none;font-size:0.9rem;display:block;padding:6px 16px;border-radius:20px;background-color:rgba(255,255,255,0.03);border:1px solid transparent;transition:all 0.3s cubic-bezier(0.4,0,0.2,1)}.ttl-docs-nav a:hover{background-color:rgba(56,189,248,0.1);color:var(--docs-primary);border-color:var(--docs-primary);box-shadow:0 0 15px var(--docs-primary-glow);transform:translateY(-1px)}.ttl-docs-main{padding:40px 48px;position:relative;z-index:1}@keyframes textShine{to{background-position:200% center}}.ttl-docs-main h1{font-size:2.5rem;margin-top:0;margin-bottom:32px;font-weight:800;background:linear-gradient(to right,#38bdf8,#818cf8,#c084fc,#38bdf8);background-size:200% auto;-webkit-background-clip:text;background-clip:text;color:transparent;animation:textShine 5s linear infinite}.ttl-docs-main h1::after{content:'''';display:block;width:80px;height:4px;background:linear-gradient(90deg,#38bdf8,#c084fc);margin-top:16px;border-radius:2px;box-shadow:0 0 10px rgba(56,189,248,0.5)}.ttl-docs-main h2{font-size:1.5rem;border-bottom:1px solid var(--docs-border);padding-bottom:8px;margin-top:48px;margin-bottom:20px;font-weight:600;color:#f8fafc}.ttl-docs-main h3{font-size:1.25rem;margin-top:32px;margin-bottom:16px;font-weight:600;color:#e2e8f0}.ttl-callout{padding:20px;border-radius:8px;margin-bottom:24px;background:rgba(30,41,59,0.5);backdrop-filter:blur(8px);border:1px solid var(--docs-border);border-left:4px solid;position:relative;overflow:hidden}.ttl-callout-title{font-weight:600;margin-bottom:8px;display:flex;align-items:center;gap:8px;font-size:1.05rem}.ttl-callout-info{border-left-color:var(--docs-primary);box-shadow:0 4px 20px rgba(56,189,248,0.05)}.ttl-callout-info .ttl-callout-title{color:var(--docs-primary)}.ttl-callout-warning{border-left-color:var(--docs-warning);box-shadow:0 4px 20px rgba(251,191,36,0.05)}.ttl-callout-warning .ttl-callout-title{color:var(--docs-warning)}.ttl-callout-success{border-left-color:var(--docs-success);box-shadow:0 4px 20px rgba(52,211,153,0.05)}.ttl-callout-success .ttl-callout-title{color:var(--docs-success)}.ttl-feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:20px;margin-bottom:32px}.ttl-feature-item{background:rgba(30,41,59,0.4);border:1px solid var(--docs-border);padding:24px;border-radius:12px;transition:all 0.3s ease;position:relative}.ttl-feature-item::before{content:'''';position:absolute;top:0;left:0;width:100%;height:2px;background:linear-gradient(90deg,transparent,var(--docs-primary),transparent);opacity:0;transition:opacity 0.3s ease;border-radius:12px 12px 0 0}.ttl-feature-item:hover{transform:translateY(-4px);background:rgba(30,41,59,0.8);border-color:rgba(56,189,248,0.3);box-shadow:0 10px 30px -10px var(--docs-primary-glow)}.ttl-feature-item:hover::before{opacity:1}.ttl-feature-item h4{margin:0 0 10px 0;font-size:1.1rem;color:#f8fafc}.ttl-feature-item p{margin:0;font-size:0.95rem;color:var(--docs-text-light)}.ttl-code-wrapper{border-radius:8px;overflow:hidden;margin-bottom:24px;background:var(--docs-code-bg);border:1px solid var(--docs-border);box-shadow:0 10px 30px rgba(0,0,0,0.5)}.ttl-code-header{background:#111827;color:#94a3b8;padding:10px 16px;font-size:0.8rem;font-family:var(--docs-font-main);display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--docs-border)}.ttl-code-block{margin:0;padding:20px;overflow-x:auto;font-family:var(--docs-font-mono);font-size:0.9rem;color:var(--docs-code-text);line-height:1.6}.ttl-token-comment{color:#64748b;font-style:italic}.ttl-token-keyword{color:#f43f5e}.ttl-token-string-dark{color:#38bdf8}.ttl-token-function-dark{color:#c084fc}.ttl-docs-main ul,.ttl-docs-main ol{padding-left:24px;margin-bottom:20px}.ttl-docs-main li{margin-bottom:10px}.ttl-docs-main li::marker{color:var(--docs-primary)}@media(max-width:768px){.ttl-docs-wrapper{border-radius:0;border-left:none;border-right:none}.ttl-docs-topmenu{padding:16px;flex-direction:column;align-items:flex-start;gap:16px}.ttl-docs-main{padding:24px 20px}.ttl-docs-main h1{font-size:2rem}}',
  '[{"name":"body_content","type":"richtext","label":"Body Content","placeholder":"Edit in HTML editor","maxLength":50000,"required":true}]'::jsonb,
  '[]'::jsonb,
  NULL,
  0,
  'default',
  NOW(),
  NOW()
);
