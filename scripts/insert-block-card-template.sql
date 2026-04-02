-- Insert Block Card Ultra Modern template
INSERT INTO "CmaTemplate" (
  id, "orgId", name, slug, description, category, "templateType",
  "htmlTemplate", "cssScoped", "slotDefinitions", blocks,
  "sourceUrl", "usageCount", "styleTheme", "createdAt", "updatedAt"
) VALUES (
  'tpl_block_card_v1',
  'cmn9w9pwf0001mfkrrc469lwo',
  'Block Card Ultra Modern',
  'cmn9w9pwf0001mfkrrc469lwo-block-card-ultra-modern',
  'Glowing cards with hover effects, bento-box feature grid, Mac-style terminal, animated hero. Ultra modern SaaS UI.',
  'article',
  'html-slots',
  '<div class="ttl-ai-wrapper">
  <div class="ttl-hero-card">
    <div class="ttl-hero-content">
      <h1 class="ttl-hero-title">[Tiêu đề bài viết]</h1>
      <p style="font-size: 1.2rem; font-weight: 500; opacity: 0.9; max-width: 700px; margin: 0 auto; line-height: 1.6;">[Mô tả ngắn gọn về nội dung bài viết]</p>
    </div>
  </div>
  <div class="ttl-card-wrap"><div class="ttl-card">
    <p>[Đoạn giới thiệu chủ đề]</p>
    <p>Tại <strong style="color: var(--ttl-primary);">TonyTechLab</strong>, [đoạn kết nối thương hiệu]</p>
  </div></div>
  <div class="ttl-card-wrap"><div class="ttl-card">
    <h2 class="ttl-card-title">[Tiêu đề phần 1 - Features]</h2>
    <div class="ttl-grid-2">
      <div class="ttl-feature-box"><div class="ttl-icon">[emoji]</div><h4>[Feature 1]</h4><p>[Mô tả feature 1]</p></div>
      <div class="ttl-feature-box"><div class="ttl-icon">[emoji]</div><h4>[Feature 2]</h4><p>[Mô tả feature 2]</p></div>
      <div class="ttl-feature-box"><div class="ttl-icon">[emoji]</div><h4>[Feature 3]</h4><p>[Mô tả feature 3]</p></div>
      <div class="ttl-feature-box"><div class="ttl-icon">[emoji]</div><h4>[Feature 4]</h4><p>[Mô tả feature 4]</p></div>
    </div>
  </div></div>
  <div class="ttl-card-wrap"><div class="ttl-card">
    <h2 class="ttl-card-title">[Tiêu đề phần 2 - List]</h2>
    <ul class="ttl-list">
      <li><strong>[Điểm 1]:</strong> [Chi tiết điểm 1]</li>
      <li><strong>[Điểm 2]:</strong> [Chi tiết điểm 2]</li>
      <li><strong>[Điểm 3]:</strong> [Chi tiết điểm 3]</li>
      <li><strong>[Điểm 4]:</strong> [Chi tiết điểm 4]</li>
    </ul>
  </div></div>
  <div class="ttl-terminal">
    <div class="ttl-terminal-header">
      <div class="ttl-mac-btn ttl-close"></div>
      <div class="ttl-mac-btn ttl-min"></div>
      <div class="ttl-mac-btn ttl-max"></div>
      <div class="ttl-terminal-title">tony@techlab:~ /[topic]</div>
    </div>
    <div class="ttl-terminal-body">
<span class="ttl-comment"># [Comment 1]</span>
<span class="ttl-prompt"></span><span class="ttl-cmd">[command1]</span> <span class="ttl-flag">[--flag]</span> <span class="ttl-string">"[value]"</span>
<br><br>
<span class="ttl-comment"># [Comment 2]</span>
<span class="ttl-prompt"></span><span class="ttl-cmd">[command2]</span> <span class="ttl-flag">[--flag]</span> <span class="ttl-string">"[value]"</span><span class="ttl-cursor"></span>
    </div>
  </div>
  <div class="ttl-card-wrap"><div class="ttl-card">
    <h2 class="ttl-card-title">[Tiêu đề phần 3]</h2>
    <p>[Nội dung phần 3]</p>
    <ul class="ttl-list">
      <li><strong>[Tip 1]:</strong> [Chi tiết tip 1]</li>
      <li><strong>[Tip 2]:</strong> [Chi tiết tip 2]</li>
    </ul>
  </div></div>
  <div class="ttl-alert">
    <h4><svg width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg> [Alert Title]</h4>
    <p>[Alert content with key takeaway]</p>
  </div>
</div>',
  ':root{--ttl-primary:#4f46e5;--ttl-secondary:#9333ea;--ttl-accent:#e11d48;--ttl-dark:#0f172a;--ttl-light:#f8fafc;--ttl-text:#334155;--ttl-border:#e2e8f0;--ttl-font:system-ui,-apple-system,BlinkMacSystemFont,''Segoe UI'',Roboto,sans-serif}.ttl-ai-wrapper{font-family:var(--ttl-font);color:var(--ttl-text);max-width:900px;margin:0 auto;line-height:1.8;background-color:#fafafa;padding:20px;border-radius:24px}@keyframes ttl-gradient-pan{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}@keyframes ttl-float{0%{transform:translateY(0px)}50%{transform:translateY(-8px)}100%{transform:translateY(0px)}}@keyframes ttl-blink{0%,100%{opacity:1}50%{opacity:0}}@keyframes ttl-text-shine{to{background-position:200% center}}.ttl-hero-card{background:linear-gradient(-45deg,#0f172a,#1e1b4b,#312e81);background-size:200% 200%;animation:ttl-gradient-pan 15s ease infinite;border-radius:24px;padding:60px 40px;color:white;text-align:center;margin-bottom:40px;position:relative;overflow:hidden;box-shadow:0 25px 50px -12px rgba(49,46,129,0.5)}.ttl-hero-card::before{content:'''';position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.05) 1px,transparent 1px);background-size:30px 30px;z-index:1;opacity:0.5}.ttl-hero-card::after{content:'''';position:absolute;top:-50%;left:-50%;width:200%;height:200%;background:radial-gradient(circle,rgba(147,51,234,0.15) 0%,transparent 60%);z-index:2}.ttl-hero-content{position:relative;z-index:3}.ttl-hero-title{font-size:2.8rem;font-weight:900;margin:0 0 20px 0;letter-spacing:-1px;background:linear-gradient(to right,#a855f7,#ec4899,#a855f7);background-size:200% auto;color:transparent;-webkit-background-clip:text;background-clip:text;animation:ttl-text-shine 4s linear infinite}.ttl-card-wrap{position:relative;margin-bottom:40px}.ttl-card-wrap::before{content:'''';position:absolute;inset:0;background:linear-gradient(135deg,var(--ttl-primary),var(--ttl-secondary),var(--ttl-accent));border-radius:20px;filter:blur(15px);opacity:0;transition:opacity 0.5s ease;z-index:0}.ttl-card-wrap:hover::before{opacity:0.3}.ttl-card{background:rgba(255,255,255,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-radius:20px;padding:36px;position:relative;z-index:1;box-shadow:0 10px 30px -5px rgba(0,0,0,0.05);border:1px solid rgba(255,255,255,0.5);transition:transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275)}.ttl-card-wrap:hover .ttl-card{transform:translateY(-5px);border-color:rgba(147,51,234,0.3)}.ttl-card-title{font-size:1.8rem;color:var(--ttl-dark);margin-top:0;margin-bottom:24px;display:flex;align-items:center;gap:12px}.ttl-card-title::before{content:'''';display:inline-block;width:12px;height:12px;background:linear-gradient(135deg,var(--ttl-primary),var(--ttl-accent));border-radius:50%;box-shadow:0 0 10px var(--ttl-secondary)}.ttl-grid-2{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px}.ttl-feature-box{background:white;padding:28px;border-radius:16px;border:1px solid var(--ttl-border);transition:all 0.3s ease;position:relative;overflow:hidden}.ttl-feature-box::before{content:'''';position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,var(--ttl-primary),var(--ttl-secondary));opacity:0;transition:opacity 0.3s ease}.ttl-feature-box:hover{box-shadow:0 15px 30px -10px rgba(99,102,241,0.15);transform:scale(1.02)}.ttl-feature-box:hover::before{opacity:1}.ttl-icon{font-size:2.5rem;margin-bottom:20px;display:inline-block;animation:ttl-float 3s ease-in-out infinite;filter:drop-shadow(0 4px 6px rgba(0,0,0,0.1))}.ttl-feature-box h4{margin:0 0 12px 0;color:var(--ttl-dark);font-size:1.25rem;font-weight:700}.ttl-feature-box p{margin:0;font-size:0.95rem;color:#64748b}.ttl-list{list-style:none;padding:0;margin:0}.ttl-list li{position:relative;padding-left:40px;margin-bottom:20px;font-size:1.05rem;background:var(--ttl-light);padding-top:16px;padding-bottom:16px;padding-right:20px;border-radius:12px;border-left:4px solid var(--ttl-primary);transition:transform 0.2s ease}.ttl-list li:hover{transform:translateX(8px);border-left-color:var(--ttl-accent)}.ttl-list li::before{content:''✓'';position:absolute;left:12px;top:16px;color:var(--ttl-primary);font-weight:bold}.ttl-list strong{color:var(--ttl-dark)}.ttl-terminal{background:#0d1117;border-radius:16px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.5);margin:40px 0;border:1px solid #30363d}.ttl-terminal-header{background:#161b22;padding:16px 20px;display:flex;align-items:center;gap:8px;border-bottom:1px solid #30363d}.ttl-mac-btn{width:14px;height:14px;border-radius:50%}.ttl-close{background:#ff5f56}.ttl-min{background:#ffbd2e}.ttl-max{background:#27c93f}.ttl-terminal-title{color:#8b949e;font-size:0.85rem;font-family:monospace;margin-left:auto;margin-right:auto}.ttl-terminal-body{padding:24px 30px;color:#c9d1d9;font-family:''Fira Code'',''JetBrains Mono'',''Courier New'',monospace;font-size:0.95rem;overflow-x:auto;line-height:1.7}.ttl-cmd{color:#79c0ff;font-weight:bold}.ttl-flag{color:#ff7b72}.ttl-string{color:#a5d6ff}.ttl-comment{color:#8b949e;font-style:italic}.ttl-prompt::before{content:''➜ '';color:#3fb950;font-weight:bold}.ttl-cursor{display:inline-block;width:8px;height:18px;background-color:#c9d1d9;vertical-align:middle;animation:ttl-blink 1s step-end infinite;margin-left:4px}.ttl-alert{background:linear-gradient(135deg,rgba(254,243,199,0.8),rgba(253,230,138,0.8));backdrop-filter:blur(10px);border-left:6px solid #f59e0b;border-radius:12px;padding:24px;position:relative;box-shadow:0 10px 15px -3px rgba(245,158,11,0.1)}.ttl-alert h4{color:#b45309;margin:0 0 10px 0;font-size:1.2rem;display:flex;align-items:center;gap:8px}.ttl-alert p{margin:0;color:#92400e;font-size:0.95rem}',
  '[{"name":"body_content","type":"richtext","label":"Body Content","placeholder":"Edit in HTML editor","maxLength":50000,"required":true}]'::jsonb,
  '[]'::jsonb,
  NULL,
  0,
  'default',
  NOW(),
  NOW()
);
