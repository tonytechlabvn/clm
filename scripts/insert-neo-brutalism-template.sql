-- Insert Neo-Brutalism template
INSERT INTO "CmaTemplate" (
  id, "orgId", name, slug, description, category, "templateType",
  "htmlTemplate", "cssScoped", "slotDefinitions", blocks,
  "sourceUrl", "usageCount", "styleTheme", "createdAt", "updatedAt"
) VALUES (
  'tpl_neo_brutal_v1',
  'cmn9w9pwf0001mfkrrc469lwo',
  'Neo-Brutalism (Thô mộc hiện đại)',
  'cmn9w9pwf0001mfkrrc469lwo-neo-brutalism',
  'Bold neo-brutalist design with hard shadows, yellow nav bar, colored callouts, retro terminal, chunky feature grid. Raw and modern.',
  'article',
  'html-slots',
  '<div class="ttl-docs-wrapper">
  <nav class="ttl-docs-topmenu">
    <h3>Menu</h3>
    <ul class="ttl-docs-nav">
      <li><a href="#s1">1. [Section 1]</a></li>
      <li><a href="#s2">2. [Section 2]</a></li>
      <li><a href="#s3">3. [Section 3]</a></li>
      <li><a href="#s4">4. [Section 4]</a></li>
      <li><a href="#s5">5. [Section 5]</a></li>
    </ul>
  </nav>
  <main class="ttl-docs-main">
    <h1>[Tiêu đề bài viết]</h1>
    <div class="ttl-callout ttl-callout-info">
      <div class="ttl-callout-title"><svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z"></path></svg> Document Info</div>
      <p style="margin-bottom:0; font-size: 1rem;">[Mô tả ngắn về tài liệu]</p>
    </div>
    <h2 id="s1">1. [Tiêu đề phần 1]</h2>
    <p>[Nội dung phần 1]</p>
    <h2 id="s2">2. [Tiêu đề phần 2 - Features]</h2>
    <p>[Giới thiệu features]</p>
    <div class="ttl-feature-grid">
      <div class="ttl-feature-item"><h4>[Feature 1]</h4><p>[Mô tả]</p></div>
      <div class="ttl-feature-item"><h4>[Feature 2]</h4><p>[Mô tả]</p></div>
      <div class="ttl-feature-item"><h4>[Feature 3]</h4><p>[Mô tả]</p></div>
      <div class="ttl-feature-item"><h4>[Feature 4]</h4><p>[Mô tả]</p></div>
    </div>
    <h2 id="s3">3. [Tiêu đề phần 3]</h2>
    <p>[Giới thiệu]</p>
    <ol>
      <li><strong>[Điểm 1]:</strong> [Chi tiết]</li>
      <li><strong>[Điểm 2]:</strong> [Chi tiết]</li>
      <li><strong>[Điểm 3]:</strong> [Chi tiết]</li>
      <li><strong>[Điểm 4]:</strong> [Chi tiết]</li>
    </ol>
    <h2 id="s4">4. [Tiêu đề phần 4 - Tools]</h2>
    <p>[Giới thiệu tools]</p>
    <div class="ttl-code-wrapper">
      <div class="ttl-code-header"><span>>_ Terminal</span><span>Copy</span></div>
      <pre class="ttl-code-block"><code><span class="ttl-token-comment"># [Comment 1]</span>
<span class="ttl-token-function-dark">[cmd1]</span> <span class="ttl-token-keyword">[--flag]</span> <span class="ttl-token-string-dark">"[value]"</span>

<span class="ttl-token-comment"># [Comment 2]</span>
<span class="ttl-token-function-dark">[cmd2]</span> <span class="ttl-token-keyword">[--flag]</span> <span class="ttl-token-string-dark">"[value]"</span></code></pre>
    </div>
    <h2 id="s5">5. [Tiêu đề phần 5]</h2>
    <div class="ttl-callout ttl-callout-success">
      <div class="ttl-callout-title"><svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path></svg> [Best Practice Title]</div>
      <p style="margin-bottom:0; font-size: 1rem;">[Best practice content]</p>
    </div>
    <h3>[Sub-section]</h3>
    <ul>
      <li>[Tip 1]</li>
      <li>[Tip 2]</li>
      <li>[Tip 3]</li>
    </ul>
    <div class="ttl-callout ttl-callout-warning" style="margin-top: 48px;">
      <div class="ttl-callout-title"><svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z"></path></svg> [Warning Title]</div>
      <p style="margin-bottom:0; font-size: 1rem;">[Warning content]</p>
    </div>
  </main>
</div>',
  ':root{--brutal-bg:#fdfaf6;--brutal-dark:#0f172a;--brutal-yellow:#fde047;--brutal-blue:#93c5fd;--brutal-pink:#f9a8d4;--brutal-green:#86efac;--brutal-border:3px solid var(--brutal-dark);--brutal-shadow:6px 6px 0px var(--brutal-dark);--brutal-shadow-hover:2px 2px 0px var(--brutal-dark);--docs-font-main:"Space Grotesk",-apple-system,BlinkMacSystemFont,"Segoe UI",Helvetica,Arial,sans-serif;--docs-font-mono:"Fira Code",Consolas,Menlo,Courier,monospace}.ttl-docs-wrapper{font-family:var(--docs-font-main);color:var(--brutal-dark);line-height:1.7;display:flex;flex-direction:column;max-width:1100px;margin:0 auto;background-color:var(--brutal-bg);border:var(--brutal-border);box-shadow:12px 12px 0px rgba(15,23,42,0.1);position:relative;overflow:hidden}.ttl-docs-topmenu{background-color:var(--brutal-yellow);border-bottom:var(--brutal-border);padding:20px 32px;position:sticky;top:0;z-index:100;display:flex;align-items:center;flex-wrap:wrap;gap:24px}.ttl-docs-topmenu h3{font-size:1rem;text-transform:uppercase;color:var(--brutal-dark);margin:0;letter-spacing:2px;font-weight:900;white-space:nowrap;background:white;padding:4px 10px;border:2px solid var(--brutal-dark);box-shadow:2px 2px 0px var(--brutal-dark)}.ttl-docs-nav{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:16px}.ttl-docs-nav a{color:var(--brutal-dark);text-decoration:none;font-size:0.95rem;font-weight:700;display:block;padding:8px 20px;background-color:white;border:var(--brutal-border);box-shadow:4px 4px 0px var(--brutal-dark);transition:all 0.15s ease-out;text-transform:uppercase}.ttl-docs-nav a:hover,.ttl-docs-nav a:active{transform:translate(4px,4px);box-shadow:0px 0px 0px var(--brutal-dark);background-color:var(--brutal-pink)}.ttl-docs-main{padding:40px 48px;position:relative;z-index:1}.ttl-docs-main h1{font-size:2.8rem;margin-top:0;margin-bottom:32px;font-weight:900;color:var(--brutal-dark);text-transform:uppercase;letter-spacing:-1px;display:inline-block;background:var(--brutal-green);padding:8px 16px;border:var(--brutal-border);box-shadow:var(--brutal-shadow);transform:rotate(-1deg)}.ttl-docs-main h2{font-size:1.8rem;border-bottom:4px solid var(--brutal-dark);padding-bottom:8px;margin-top:56px;margin-bottom:24px;font-weight:800;color:var(--brutal-dark);text-transform:uppercase}.ttl-docs-main h3{font-size:1.4rem;margin-top:32px;margin-bottom:16px;font-weight:800;color:var(--brutal-dark);display:inline-block;background:var(--brutal-blue);padding:4px 8px;border:2px solid var(--brutal-dark)}.ttl-docs-main p{font-size:1.05rem;font-weight:500;color:#334155}.ttl-callout{padding:24px;margin-bottom:32px;background:white;border:var(--brutal-border);box-shadow:var(--brutal-shadow);position:relative}.ttl-callout-title{font-weight:900;margin-bottom:12px;display:flex;align-items:center;gap:12px;font-size:1.2rem;text-transform:uppercase;color:var(--brutal-dark)}.ttl-callout-info{background-color:var(--brutal-blue)}.ttl-callout-warning{background-color:var(--brutal-yellow)}.ttl-callout-success{background-color:var(--brutal-green)}.ttl-feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:24px;margin-bottom:40px}.ttl-feature-item{background:white;border:var(--brutal-border);padding:24px;box-shadow:var(--brutal-shadow);transition:all 0.1s ease-out}.ttl-feature-item:hover{transform:translate(4px,4px);box-shadow:2px 2px 0px var(--brutal-dark);background:var(--brutal-pink)}.ttl-feature-item h4{margin:0 0 12px 0;font-size:1.2rem;font-weight:800;color:var(--brutal-dark);border-bottom:2px solid var(--brutal-dark);padding-bottom:8px}.ttl-feature-item p{margin:0;font-size:1rem;color:var(--brutal-dark);font-weight:500}.ttl-code-wrapper{border:var(--brutal-border);box-shadow:var(--brutal-shadow);margin-bottom:32px;background:var(--brutal-dark)}.ttl-code-header{background:white;color:var(--brutal-dark);padding:12px 20px;font-size:0.9rem;font-weight:800;text-transform:uppercase;font-family:var(--docs-font-main);display:flex;justify-content:space-between;align-items:center;border-bottom:var(--brutal-border)}.ttl-code-block{margin:0;padding:24px;overflow-x:auto;font-family:var(--docs-font-mono);font-size:0.95rem;color:#e2e8f0;line-height:1.6}.ttl-token-comment{color:#94a3b8;font-style:italic}.ttl-token-keyword{color:var(--brutal-pink);font-weight:bold}.ttl-token-string-dark{color:var(--brutal-green)}.ttl-token-function-dark{color:var(--brutal-blue);font-weight:bold}.ttl-docs-main ul,.ttl-docs-main ol{padding-left:28px;margin-bottom:24px}.ttl-docs-main li{margin-bottom:12px;font-weight:500;color:#334155}.ttl-docs-main li::marker{color:var(--brutal-dark);font-weight:900}@media(max-width:768px){.ttl-docs-wrapper{border:none;box-shadow:none}.ttl-docs-topmenu{padding:16px;flex-direction:column;align-items:stretch;gap:16px}.ttl-docs-topmenu h3{text-align:center}.ttl-docs-nav{justify-content:center}.ttl-docs-main{padding:24px 20px}.ttl-docs-main h1{font-size:2.2rem;transform:none}}',
  '[{"name":"body_content","type":"richtext","label":"Body Content","placeholder":"Edit in HTML editor","maxLength":50000,"required":true}]'::jsonb,
  '[]'::jsonb,
  NULL,
  0,
  'default',
  NOW(),
  NOW()
);
