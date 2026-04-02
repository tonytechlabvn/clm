-- Insert Pixar 3D Animation Style template
INSERT INTO "CmaTemplate" (
  id, "orgId", name, slug, description, category, "templateType",
  "htmlTemplate", "cssScoped", "slotDefinitions", blocks,
  "sourceUrl", "usageCount", "styleTheme", "createdAt", "updatedAt"
) VALUES (
  'tpl_pixar_3d_v1',
  'cmn9w9pwf0001mfkrrc469lwo',
  'Pixar 3D Animation Style',
  'cmn9w9pwf0001mfkrrc469lwo-pixar-3d-animation',
  'Squishy glossy Pixar-inspired design with 3D text, bouncy hover effects, toy-box feature cards, chunky terminal, pastel gradients.',
  'article',
  'html-slots',
  '<div class="ttl-docs-wrapper">
  <nav class="ttl-docs-topmenu">
    <h3>TonyTechLab</h3>
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
      <div class="ttl-callout-title"><svg width="28" height="28" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8zm6.5-.25A.75.75 0 017.25 7h1a.75.75 0 01.75.75v2.75h.25a.75.75 0 010 1.5h-2a.75.75 0 010-1.5h.25v-2h-.25a.75.75 0 01-.75-.75zM8 6a1 1 0 100-2 1 1 0 000 2z"></path></svg> [Callout Title]</div>
      <p style="margin-bottom:0;">[Mô tả tổng quan]</p>
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
      <div class="ttl-code-header"><span>💻 Toy Computer Terminal</span><span>CTRL + C</span></div>
      <pre class="ttl-code-block"><code><span class="ttl-token-comment"># [Comment 1]</span>
<span class="ttl-token-function-dark">[cmd1]</span> <span class="ttl-token-keyword">[--flag]</span> <span class="ttl-token-string-dark">"[value]"</span>

<span class="ttl-token-comment"># [Comment 2]</span>
<span class="ttl-token-function-dark">[cmd2]</span> <span class="ttl-token-keyword">[--flag]</span> <span class="ttl-token-string-dark">"[value]"</span></code></pre>
    </div>
    <h2 id="s5">5. [Tiêu đề phần 5]</h2>
    <div class="ttl-callout ttl-callout-success">
      <div class="ttl-callout-title"><svg width="28" height="28" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path></svg> [Best Practice Title]</div>
      <p style="margin-bottom:0;">[Best practice content]</p>
    </div>
    <h3>[Sub-section]</h3>
    <ul>
      <li>[Tip 1]</li>
      <li>[Tip 2]</li>
    </ul>
    <div class="ttl-callout ttl-callout-warning" style="margin-top: 48px;">
      <div class="ttl-callout-title"><svg width="28" height="28" viewBox="0 0 16 16" fill="currentColor"><path fill-rule="evenodd" d="M8.22 1.754a.25.25 0 00-.44 0L1.698 13.132a.25.25 0 00.22.368h12.164a.25.25 0 00.22-.368L8.22 1.754zm-1.763-.707c.659-1.234 2.427-1.234 3.086 0l6.082 11.378A1.75 1.75 0 0114.082 15H1.918a1.75 1.75 0 01-1.543-2.575L6.457 1.047zM9 11a1 1 0 11-2 0 1 1 0 012 0zm-.25-5.25a.75.75 0 00-1.5 0v2.5a.75.75 0 001.5 0v-2.5z"></path></svg> [Warning Title]</div>
      <p style="margin-bottom:0;">[Warning content]</p>
    </div>
  </main>
</div>',
  E'@import url(''https://fonts.googleapis.com/css2?family=Nunito:wght@600;800;900&display=swap'');:root{--pxr-bg-sky:#e0f2fe;--pxr-bg-cloud:#ffffff;--pxr-text:#334155;--pxr-text-light:#64748b;--pxr-blue-light:#38bdf8;--pxr-blue-base:#0ea5e9;--pxr-blue-dark:#0284c7;--pxr-yellow-light:#fef08a;--pxr-yellow-base:#facc15;--pxr-yellow-dark:#ca8a04;--pxr-pink-light:#f9a8d4;--pxr-pink-base:#f43f5e;--pxr-pink-dark:#be123c;--pxr-green-light:#bbf7d0;--pxr-green-base:#22c55e;--pxr-green-dark:#15803d;--pxr-radius:30px;--pxr-font:''Nunito'',''Varela Round'',''Quicksand'',sans-serif}.ttl-docs-wrapper{font-family:var(--pxr-font);color:var(--pxr-text);line-height:1.7;display:flex;flex-direction:column;max-width:1100px;margin:40px auto;background:linear-gradient(180deg,#ffffff 0%,#f8fafc 100%);border-radius:var(--pxr-radius);box-shadow:0 25px 50px -12px rgba(14,165,233,0.25),0 0 0 8px rgba(255,255,255,0.5);position:relative;overflow:hidden}.ttl-docs-topmenu{background:linear-gradient(to bottom,#ffffff,#f1f5f9);padding:24px 32px;position:sticky;top:0;z-index:100;display:flex;align-items:center;flex-wrap:wrap;gap:24px;border-bottom:2px solid #e2e8f0;box-shadow:0 10px 15px -3px rgba(0,0,0,0.05)}.ttl-docs-topmenu h3{font-size:1.1rem;text-transform:uppercase;margin:0;letter-spacing:1.5px;font-weight:900;white-space:nowrap;background:var(--pxr-blue-light);color:white;padding:8px 18px;border-radius:50px;box-shadow:inset 0 3px 6px rgba(255,255,255,0.4),inset 0 -3px 6px rgba(0,0,0,0.1),0 4px 6px rgba(2,132,199,0.3);text-shadow:0 1px 2px rgba(0,0,0,0.1)}.ttl-docs-nav{list-style:none;padding:0;margin:0;display:flex;flex-wrap:wrap;gap:16px}.ttl-docs-nav a{color:var(--pxr-text-light);text-decoration:none;font-size:1.05rem;font-weight:800;display:block;padding:10px 24px;background-color:#f8fafc;border-radius:50px;box-shadow:0 4px 6px rgba(0,0,0,0.05),inset 0 -3px 0 rgba(226,232,240,1),inset 0 2px 0 rgba(255,255,255,1);transition:all 0.2s cubic-bezier(0.34,1.56,0.64,1)}.ttl-docs-nav a:hover{transform:translateY(-4px);color:var(--pxr-blue-dark);background:linear-gradient(to bottom,#ffffff,#e0f2fe);box-shadow:0 8px 12px rgba(14,165,233,0.15),inset 0 -3px 0 rgba(186,230,253,1),inset 0 2px 0 rgba(255,255,255,1)}.ttl-docs-nav a:active{transform:translateY(2px);box-shadow:0 2px 4px rgba(14,165,233,0.1),inset 0 -1px 0 rgba(186,230,253,1),inset 0 2px 0 rgba(255,255,255,1)}.ttl-docs-main{padding:50px 60px;position:relative;z-index:1}.ttl-docs-main h1{font-size:3.2rem;margin-top:0;margin-bottom:40px;font-weight:900;color:white;text-transform:uppercase;letter-spacing:0px;line-height:1.2;background:linear-gradient(180deg,#ffde59 0%,#ff914d 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;text-shadow:0px 2px 0px #ea580c,0px 4px 0px #c2410c,0px 6px 0px #9a3412,0px 8px 15px rgba(0,0,0,0.2);display:inline-block;transform:rotate(-2deg)}.ttl-docs-main h2{font-size:1.8rem;border-bottom:none;padding-bottom:0;margin-top:56px;margin-bottom:24px;font-weight:900;color:var(--pxr-blue-dark);display:flex;align-items:center;gap:12px}.ttl-docs-main h2::before{content:'''';display:block;width:16px;height:16px;border-radius:50%;background:linear-gradient(135deg,var(--pxr-pink-light),var(--pxr-pink-base));box-shadow:inset 0 -2px 0 rgba(0,0,0,0.1),0 4px 6px rgba(244,63,94,0.3)}.ttl-docs-main h3{font-size:1.4rem;margin-top:32px;margin-bottom:16px;font-weight:800;color:var(--pxr-text);background:linear-gradient(to right,#f1f5f9,transparent);padding:8px 16px;border-radius:12px;border-left:6px solid var(--pxr-yellow-base)}.ttl-docs-main p{font-size:1.15rem;font-weight:600;color:var(--pxr-text-light)}.ttl-callout{padding:24px 32px;margin-bottom:32px;border-radius:20px;position:relative;box-shadow:0 10px 20px rgba(0,0,0,0.05),inset 0 2px 0 rgba(255,255,255,0.8),inset 0 -4px 0 rgba(0,0,0,0.05);transition:transform 0.3s cubic-bezier(0.34,1.56,0.64,1)}.ttl-callout:hover{transform:translateY(-4px) scale(1.01)}.ttl-callout-title{font-weight:900;margin-bottom:12px;display:flex;align-items:center;gap:12px;font-size:1.25rem;text-transform:uppercase;letter-spacing:0.5px}.ttl-callout-info{background:linear-gradient(180deg,#e0f2fe 0%,#bae6fd 100%)}.ttl-callout-info .ttl-callout-title{color:var(--pxr-blue-dark)}.ttl-callout-warning{background:linear-gradient(180deg,#fef08a 0%,#fde047 100%)}.ttl-callout-warning .ttl-callout-title{color:var(--pxr-yellow-dark)}.ttl-callout-success{background:linear-gradient(180deg,#dcfce7 0%,#bbf7d0 100%)}.ttl-callout-success .ttl-callout-title{color:var(--pxr-green-dark)}.ttl-feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:24px;margin-bottom:40px}.ttl-feature-item{background:#ffffff;border-radius:24px;padding:32px 24px;text-align:center;box-shadow:0 10px 25px -5px rgba(0,0,0,0.05),inset 0 -6px 0 rgba(241,245,249,1),inset 0 2px 0 rgba(255,255,255,1);transition:all 0.3s cubic-bezier(0.34,1.56,0.64,1);cursor:pointer}.ttl-feature-item:hover{transform:translateY(-8px);box-shadow:0 20px 35px -5px rgba(14,165,233,0.15),inset 0 -6px 0 rgba(241,245,249,1),inset 0 2px 0 rgba(255,255,255,1)}.ttl-feature-item:active{transform:translateY(2px);box-shadow:0 5px 10px -5px rgba(0,0,0,0.1),inset 0 -2px 0 rgba(241,245,249,1),inset 0 2px 0 rgba(255,255,255,1)}.ttl-feature-item h4{margin:0 0 16px 0;font-size:1.3rem;font-weight:900;color:var(--pxr-text)}.ttl-feature-item p{margin:0;font-size:1.05rem;color:var(--pxr-text-light);font-weight:600;line-height:1.5}.ttl-icon-3d{font-size:3rem;display:inline-block;margin-bottom:16px;filter:drop-shadow(0 10px 10px rgba(0,0,0,0.15));transition:transform 0.3s ease}.ttl-feature-item:hover .ttl-icon-3d{transform:scale(1.1) rotate(5deg)}.ttl-code-wrapper{border-radius:24px;box-shadow:0 20px 40px rgba(0,0,0,0.15),inset 0 2px 0 rgba(255,255,255,0.2);margin-bottom:32px;background:#1e293b;overflow:hidden;border:4px solid #94a3b8}.ttl-code-header{background:linear-gradient(180deg,#cbd5e1 0%,#94a3b8 100%);color:#334155;padding:16px 24px;font-size:1rem;font-weight:900;text-transform:uppercase;font-family:var(--pxr-font);display:flex;justify-content:space-between;align-items:center;box-shadow:inset 0 -2px 0 rgba(0,0,0,0.1)}.ttl-code-block{margin:0;padding:24px;overflow-x:auto;font-family:"Fira Code",Consolas,Menlo,Courier,monospace;font-size:1.05rem;color:#f8fafc;line-height:1.7}.ttl-token-comment{color:#64748b;font-style:italic}.ttl-token-keyword{color:var(--pxr-pink-light);font-weight:bold}.ttl-token-string-dark{color:var(--pxr-green-light)}.ttl-token-function-dark{color:var(--pxr-blue-light);font-weight:bold}.ttl-docs-main ul,.ttl-docs-main ol{padding-left:28px;margin-bottom:24px}.ttl-docs-main li{margin-bottom:16px;font-weight:700;color:var(--pxr-text-light);font-size:1.15rem;position:relative}.ttl-docs-main li::marker{color:var(--pxr-blue-base);font-weight:900;font-size:1.3rem}@media(max-width:768px){.ttl-docs-wrapper{border-radius:0;box-shadow:none;margin:0}.ttl-docs-topmenu{padding:16px;flex-direction:column;align-items:stretch;gap:16px;border-radius:0}.ttl-docs-topmenu h3{text-align:center;transform:none;display:inline-block;align-self:center}.ttl-docs-nav{justify-content:center}.ttl-docs-main{padding:30px 20px}.ttl-docs-main h1{font-size:2.2rem;transform:none;text-shadow:0px 2px 0px #ea580c,0px 4px 0px #c2410c}}',
  '[{"name":"body_content","type":"richtext","label":"Body Content","placeholder":"Edit in HTML editor","maxLength":50000,"required":true}]'::jsonb,
  '[]'::jsonb,
  NULL,
  0,
  'default',
  NOW(),
  NOW()
);
