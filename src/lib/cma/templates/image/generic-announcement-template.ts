// Generic Announcement image template — 1200×630, centered content card over background with logo support

export const genericAnnouncementTemplate = {
  name: "Generic Announcement",
  description: "Professional announcement card with logo, title, body text, and accent CTA bar",
  platform: "generic",
  width: 1200,
  height: 630,
  htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <link href="https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: {{width}}px;
      height: {{height}}px;
      overflow: hidden;
      font-family: 'Be Vietnam Pro', sans-serif;
      position: relative;
    }
    .bg {
      position: absolute;
      inset: 0;
      background: {{#if imageUrl}}url('{{imageUrl}}') center/cover no-repeat{{else}}linear-gradient(135deg, #0f172a 0%, #1e293b 100%){{/if}};
    }
    .overlay {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.55);
    }
    .card {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 860px;
      background: rgba(255,255,255,0.97);
      border-radius: 20px;
      padding: 48px 56px;
      box-shadow: 0 24px 48px rgba(0,0,0,0.3);
      text-align: center;
    }
    .logo {
      width: 56px;
      height: 56px;
      border-radius: 12px;
      object-fit: contain;
      margin: 0 auto 20px;
      display: block;
    }
    .logo-placeholder {
      display: none;
    }
    .title {
      font-size: 40px;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.2;
      margin-bottom: 16px;
    }
    .body {
      font-size: 20px;
      font-weight: 400;
      color: #475569;
      line-height: 1.5;
      margin-bottom: 28px;
    }
    .cta-bar {
      height: 6px;
      width: 80px;
      border-radius: 3px;
      background: {{accentColor}};
      margin: 0 auto;
    }
  </style>
</head>
<body>
  <div class="bg"></div>
  <div class="overlay"></div>
  <div class="card">
    {{#if logoUrl}}<img class="logo" src="{{logoUrl}}" alt="Logo" />{{/if}}
    <div class="title">{{title}}</div>
    {{#if body}}<div class="body">{{body}}</div>{{/if}}
    <div class="cta-bar"></div>
  </div>
</body>
</html>`,
  variableSchema: [
    { name: "title", type: "text" as const, label: "Title", required: true, maxLength: 80, placeholder: "Announcement headline" },
    { name: "body", type: "text" as const, label: "Body Text", required: false, maxLength: 200, placeholder: "Description or details" },
    { name: "imageUrl", type: "image" as const, label: "Background Image", required: false, defaultValue: "" },
    { name: "accentColor", type: "color" as const, label: "Accent Color", required: false, defaultValue: "#6366f1" },
    { name: "logoUrl", type: "image" as const, label: "Logo", required: false, defaultValue: "" },
  ],
};
