-- Insert Handwritten/Sketchbook template
INSERT INTO "CmaTemplate" (
  id, "orgId", name, slug, description, category, "templateType",
  "htmlTemplate", "cssScoped", "slotDefinitions", blocks,
  "sourceUrl", "usageCount", "styleTheme", "createdAt", "updatedAt"
) VALUES (
  'tpl_handwritten_v1',
  'cmn9w9pwf0001mfkrrc469lwo',
  'Handwritten / Sketchbook',
  'cmn9w9pwf0001mfkrrc469lwo-handwritten-sketchbook',
  'Handwritten notebook style with ruled paper lines, red margin, post-it callouts, sketchy borders, cursive fonts, tape effects on code blocks.',
  'article',
  'html-slots',
  '<div class="ttl-docs-wrapper">
  <nav class="ttl-docs-topmenu">
    <h3>Tony''s Notes</h3>
    <ul class="ttl-docs-nav">
      <li><a href="#s1">[Section 1]</a></li>
      <li><a href="#s2">[Section 2]</a></li>
      <li><a href="#s3">[Section 3]</a></li>
      <li><a href="#s4">[Section 4]</a></li>
      <li><a href="#s5">[Section 5]</a></li>
    </ul>
  </nav>
  <main class="ttl-docs-main">
    <h1>[Tiêu đề bài viết]</h1>
    <div class="ttl-callout ttl-callout-info">
      <div class="ttl-callout-title">📌 [Callout Title]</div>
      <p>[Mô tả tổng quan]</p>
    </div>
    <h2 id="s1">1. [Tiêu đề phần 1]</h2>
    <p>[Nội dung phần 1]</p>
    <h2 id="s2">2. [Tiêu đề phần 2]</h2>
    <p>[Giới thiệu features]</p>
    <div class="ttl-feature-grid">
      <div class="ttl-feature-item"><span class="ttl-icon-3d">[emoji]</span><h4>[Feature 1]</h4><p>[Mô tả]</p></div>
      <div class="ttl-feature-item"><span class="ttl-icon-3d">[emoji]</span><h4>[Feature 2]</h4><p>[Mô tả]</p></div>
      <div class="ttl-feature-item"><span class="ttl-icon-3d">[emoji]</span><h4>[Feature 3]</h4><p>[Mô tả]</p></div>
      <div class="ttl-feature-item"><span class="ttl-icon-3d">[emoji]</span><h4>[Feature 4]</h4><p>[Mô tả]</p></div>
    </div>
    <h2 id="s3">3. [Tiêu đề phần 3]</h2>
    <p>[Giới thiệu]</p>
    <ol>
      <li><strong>[Điểm 1]:</strong> [Chi tiết]</li>
      <li><strong>[Điểm 2]:</strong> [Chi tiết]</li>
      <li><strong>[Điểm 3]:</strong> [Chi tiết]</li>
      <li><strong>[Điểm 4]:</strong> [Chi tiết]</li>
    </ol>
    <h2 id="s4">4. [Tiêu đề phần 4]</h2>
    <p>[Giới thiệu tools]</p>
    <div class="ttl-code-wrapper">
      <div class="ttl-code-header"><span>💻 Terminal Code Snippets</span><span>(Copy)</span></div>
      <pre class="ttl-code-block"><code><span class="ttl-token-comment"># [Comment 1]</span>
<span class="ttl-token-function-dark">[cmd1]</span> <span class="ttl-token-keyword">[--flag]</span> <span class="ttl-token-string-dark">"[value]"</span>

<span class="ttl-token-comment"># [Comment 2]</span>
<span class="ttl-token-function-dark">[cmd2]</span> <span class="ttl-token-keyword">[--flag]</span> <span class="ttl-token-string-dark">"[value]"</span></code></pre>
    </div>
    <h2 id="s5">5. [Tiêu đề phần 5]</h2>
    <div class="ttl-callout ttl-callout-success">
      <div class="ttl-callout-title">⭐ [Best Practice Title]</div>
      <p>[Best practice content]</p>
    </div>
    <h3>[Sub-section]</h3>
    <ul>
      <li>[Tip 1]</li>
      <li>[Tip 2]</li>
    </ul>
    <div class="ttl-callout ttl-callout-warning" style="margin-top: 48px;">
      <div class="ttl-callout-title">⚠️ [Warning Title]</div>
      <p>[Warning content]</p>
    </div>
  </main>
</div>',
  E'@import url(''https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&family=Patrick+Hand&display=swap'');:root{--hw-pen-black:#1e293b;--hw-pen-blue:#0369a1;--hw-pen-red:#be123c;--hw-paper-bg:#fdfbf7;--hw-paper-line:#bae6fd;--hw-paper-margin:#fca5a5;--hw-postit-yellow:#fef08a;--hw-postit-green:#bbf7d0;--hw-postit-blue:#bfdbfe;--hw-highlighter:rgba(253,224,71,0.6);--hw-font-title:''Kalam'',cursive;--hw-font-body:''Patrick Hand'',cursive,sans-serif;--hw-font-mono:"Fira Code","Courier New",monospace}.ttl-docs-wrapper{font-family:var(--hw-font-body);color:var(--hw-pen-black);font-size:1.25rem;line-height:1.8;display:flex;flex-direction:column;max-width:1000px;margin:40px auto;background-color:var(--hw-paper-bg);box-shadow:0 15px 35px rgba(0,0,0,0.1),0 5px 15px rgba(0,0,0,0.05);border:1px solid #e2e8f0;border-radius:4px 8px 3px 6px;position:relative;overflow:hidden}.ttl-docs-wrapper::before{content:'''';position:absolute;top:0;left:0;right:0;bottom:0;background-image:linear-gradient(90deg,transparent 79px,var(--hw-paper-margin) 79px,var(--hw-paper-margin) 81px,transparent 81px),linear-gradient(transparent 31px,var(--hw-paper-line) 31px,var(--hw-paper-line) 32px);background-size:100% 100%,100% 32px;pointer-events:none;z-index:0;opacity:0.6}.ttl-docs-topmenu{padding:24px 32px 24px 100px;position:relative;z-index:10;display:flex;align-items:center;flex-wrap:wrap;gap:20px;border-bottom:2px solid var(--hw-pen-black);border-radius:255px 15px 225px 15px/15px 225px 15px 255px;margin:10px 20px}.ttl-docs-topmenu h3{font-family:var(--hw-font-title);font-size:1.4rem;color:var(--hw-pen-red);margin:0;font-weight:700;transform:rotate(-2deg)}.ttl-docs-nav{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:15px}.ttl-docs-nav a{color:var(--hw-pen-blue);text-decoration:none;font-size:1.2rem;display:block;transition:all 0.2s}.ttl-docs-nav a:hover{color:var(--hw-pen-red);text-decoration:underline;text-decoration-style:wavy;transform:scale(1.1) rotate(2deg)}.ttl-docs-main{padding:20px 40px 50px 100px;position:relative;z-index:1}.ttl-docs-main h1{font-family:var(--hw-font-title);font-size:3rem;margin-top:10px;margin-bottom:30px;font-weight:700;color:var(--hw-pen-black);text-align:center;transform:rotate(-1.5deg);position:relative;display:inline-block;width:100%}.ttl-docs-main h1::after{content:'''';display:block;width:60%;height:8px;background:var(--hw-pen-blue);margin:5px auto 0;border-radius:255px 15px 225px 15px/15px 225px 15px 255px;opacity:0.8}.ttl-docs-main h2{font-family:var(--hw-font-title);font-size:2rem;margin-top:40px;margin-bottom:15px;font-weight:700;color:var(--hw-pen-blue);border-bottom:2px dashed var(--hw-pen-black);display:inline-block;padding-bottom:5px}.ttl-docs-main h3{font-family:var(--hw-font-title);font-size:1.6rem;margin-top:25px;margin-bottom:10px;font-weight:700;color:var(--hw-pen-black);background:linear-gradient(104deg,transparent 0.9%,var(--hw-highlighter) 2.4%,var(--hw-highlighter) 5.8%,var(--hw-highlighter) 93%,transparent 96%);padding:2px 10px;display:inline-block;transform:rotate(-1deg)}.ttl-docs-main p{margin-bottom:20px}.ttl-docs-main strong{color:var(--hw-pen-red);font-weight:normal}.ttl-callout{padding:20px 25px;margin:35px 0;border-radius:2px 5px 2px 5px;box-shadow:2px 4px 10px rgba(0,0,0,0.15);position:relative;transform:rotate(-1.5deg)}.ttl-callout::before{content:'''';position:absolute;top:-12px;left:50%;transform:translateX(-50%) rotate(-3deg);width:90px;height:25px;background-color:rgba(255,255,255,0.5);box-shadow:0 1px 3px rgba(0,0,0,0.1);border-radius:2px;backdrop-filter:blur(2px)}.ttl-callout-title{font-family:var(--hw-font-title);font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:10px;font-size:1.4rem}.ttl-callout-info{background-color:var(--hw-postit-blue);transform:rotate(1.5deg)}.ttl-callout-info .ttl-callout-title{color:var(--hw-pen-blue)}.ttl-callout-warning{background-color:var(--hw-postit-yellow);transform:rotate(-1deg)}.ttl-callout-warning .ttl-callout-title{color:#854d0e}.ttl-callout-success{background-color:var(--hw-postit-green);transform:rotate(2deg)}.ttl-callout-success .ttl-callout-title{color:#166534}.ttl-feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:25px;margin-bottom:30px}.ttl-feature-item{background:rgba(255,255,255,0.6);padding:20px;border:2px solid var(--hw-pen-black);border-radius:255px 15px 225px 15px/15px 225px 15px 255px;transition:transform 0.2s;position:relative}.ttl-feature-item:hover{transform:scale(1.03) rotate(1deg);border-color:var(--hw-pen-blue)}.ttl-feature-item h4{font-family:var(--hw-font-title);margin:0 0 10px 0;font-size:1.5rem;font-weight:700;color:var(--hw-pen-red)}.ttl-feature-item p{margin:0;font-size:1.15rem}.ttl-icon-3d{font-size:2.5rem;display:inline-block;margin-bottom:10px;filter:sepia(0.5) hue-rotate(-30deg)}.ttl-code-wrapper{margin:35px 0;background:#1e293b;color:#e2e8f0;border-radius:4px;padding:2px;border:2px solid #0f172a;box-shadow:4px 6px 15px rgba(0,0,0,0.2);transform:rotate(0.5deg);position:relative}.ttl-code-wrapper::before,.ttl-code-wrapper::after{content:'''';position:absolute;width:40px;height:15px;background:rgba(255,255,255,0.4);box-shadow:0 1px 2px rgba(0,0,0,0.1);z-index:2}.ttl-code-wrapper::before{top:-5px;left:-10px;transform:rotate(-45deg)}.ttl-code-wrapper::after{bottom:-5px;right:-10px;transform:rotate(-45deg)}.ttl-code-header{font-family:var(--hw-font-title);color:#cbd5e1;padding:10px 20px;font-size:1.2rem;border-bottom:2px dashed #475569;display:flex;justify-content:space-between}.ttl-code-block{margin:0;padding:20px;overflow-x:auto;font-family:var(--hw-font-mono);font-size:0.95rem;line-height:1.5}.ttl-token-comment{color:#94a3b8;font-style:italic}.ttl-token-keyword{color:#fca5a5}.ttl-token-string-dark{color:#86efac}.ttl-token-function-dark{color:#93c5fd}.ttl-docs-main ul,.ttl-docs-main ol{padding-left:20px;margin-bottom:25px}.ttl-docs-main li{margin-bottom:10px;position:relative}.ttl-docs-main ul li::marker{content:''→ '';color:var(--hw-pen-red);font-family:var(--hw-font-title)}@media(max-width:768px){.ttl-docs-wrapper{margin:10px;border-radius:0}.ttl-docs-wrapper::before{background-image:linear-gradient(transparent 31px,var(--hw-paper-line) 31px,var(--hw-paper-line) 32px)}.ttl-docs-topmenu{padding:15px;flex-direction:column;margin:0;border:none;border-bottom:2px dashed var(--hw-pen-black)}.ttl-docs-main{padding:20px 20px 40px 20px}.ttl-docs-main h1{font-size:2.4rem;transform:none}}',
  '[{"name":"body_content","type":"richtext","label":"Body Content","placeholder":"Edit in HTML editor","maxLength":50000,"required":true}]'::jsonb,
  '[]'::jsonb,
  NULL,
  0,
  'default',
  NOW(),
  NOW()
);
