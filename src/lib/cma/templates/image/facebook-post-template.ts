// Facebook Post image template — 1200×630, bold title + subtitle over background image with gradient overlay

export const facebookPostTemplate = {
  name: "Facebook Post",
  description: "Bold post with background image and overlay text — optimized for Facebook feed",
  platform: "facebook",
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
      background: {{#if imageUrl}}url('{{imageUrl}}') center/cover no-repeat{{else}}linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%){{/if}};
    }
    .overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, rgba(0,0,0,0.1) 100%);
    }
    .accent-bar {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 6px;
      background: {{accentColor}};
    }
    .content {
      position: absolute;
      bottom: 48px;
      left: 56px;
      right: 56px;
      color: #fff;
    }
    .title {
      font-size: 52px;
      font-weight: 800;
      line-height: 1.15;
      margin-bottom: 12px;
      text-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }
    .subtitle {
      font-size: 22px;
      font-weight: 400;
      opacity: 0.9;
      line-height: 1.4;
      text-shadow: 0 1px 4px rgba(0,0,0,0.3);
    }
  </style>
</head>
<body>
  <div class="bg"></div>
  <div class="overlay"></div>
  <div class="accent-bar"></div>
  <div class="content">
    <div class="title">{{title}}</div>
    {{#if subtitle}}<div class="subtitle">{{subtitle}}</div>{{/if}}
  </div>
</body>
</html>`,
  variableSchema: [
    { name: "title", type: "text" as const, label: "Title", required: true, maxLength: 80, placeholder: "Enter your headline" },
    { name: "subtitle", type: "text" as const, label: "Subtitle", required: false, maxLength: 120, placeholder: "Supporting text" },
    { name: "imageUrl", type: "image" as const, label: "Background Image", required: false, defaultValue: "" },
    { name: "accentColor", type: "color" as const, label: "Accent Color", required: false, defaultValue: "#6366f1" },
  ],
};
