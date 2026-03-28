// Pre-built system template definitions — BlockNote JSON block arrays for seeding

import type { PartialBlock } from "@blocknote/core";

export interface TemplateDefinition {
  name: string;
  slug: string;
  description: string;
  category: "tutorial" | "news" | "announce";
  blocks: PartialBlock[];
  styleTheme: string;
}

const techTutorialBlocks: PartialBlock[] = [
  { type: "image", props: { url: "", caption: "Tutorial hero image", textAlignment: "center" } },
  { type: "heading", props: { level: 1 }, content: [{ type: "text", text: "How to Build [Your Topic] — Step by Step", styles: {} }] },
  { type: "paragraph", content: [{ type: "text", text: "In this tutorial, you will learn how to [brief description of what the reader will accomplish]. By the end, you'll have a working [deliverable] that you can use in your own projects.", styles: {} }] },
  { type: "heading", props: { level: 2 }, content: [{ type: "text", text: "Prerequisites", styles: {} }] },
  { type: "bulletListItem", content: [{ type: "text", text: "Basic knowledge of [language/framework]", styles: {} }] },
  { type: "bulletListItem", content: [{ type: "text", text: "Node.js 18+ installed on your machine", styles: {} }] },
  { type: "bulletListItem", content: [{ type: "text", text: "A code editor (VS Code recommended)", styles: {} }] },
  { type: "heading", props: { level: 2 }, content: [{ type: "text", text: "Step 1: Set Up the Project", styles: {} }] },
  { type: "paragraph", content: [{ type: "text", text: "Start by creating a new directory and initializing your project:", styles: {} }] },
  { type: "codeBlock", props: { language: "bash" }, content: [{ type: "text", text: "mkdir my-project\ncd my-project\nnpm init -y", styles: {} }] },
  { type: "heading", props: { level: 2 }, content: [{ type: "text", text: "Step 2: Install Dependencies", styles: {} }] },
  { type: "paragraph", content: [{ type: "text", text: "Install the required packages for this tutorial:", styles: {} }] },
  { type: "codeBlock", props: { language: "bash" }, content: [{ type: "text", text: "npm install [package-name]", styles: {} }] },
  { type: "heading", props: { level: 2 }, content: [{ type: "text", text: "Step 3: Implement the Core Logic", styles: {} }] },
  { type: "paragraph", content: [{ type: "text", text: "Now create the main file and add the following code:", styles: {} }] },
  { type: "codeBlock", props: { language: "typescript" }, content: [{ type: "text", text: "// index.ts\n// Your implementation here\nexport function main() {\n  console.log('Hello, world!');\n}", styles: {} }] },
  { type: "heading", props: { level: 2 }, content: [{ type: "text", text: "Conclusion", styles: {} }] },
  { type: "paragraph", content: [{ type: "text", text: "Congratulations! You have successfully built [deliverable]. You learned how to [key takeaway 1] and [key takeaway 2]. This foundation lets you extend the project with [next steps].", styles: {} }] },
  { type: "paragraph", content: [{ type: "text", text: "Found this tutorial helpful? Share it with your team or leave a comment below with your questions.", styles: {} }] },
];

const newsArticleBlocks: PartialBlock[] = [
  { type: "image", props: { url: "", caption: "Featured image", textAlignment: "center" } },
  { type: "heading", props: { level: 1 }, content: [{ type: "text", text: "[Compelling Headline That Summarizes the Story]", styles: {} }] },
  { type: "paragraph", content: [{ type: "text", text: "[Lead paragraph: the most important facts in 2-3 sentences. Who, what, when, where, why — cover it all here so busy readers get the story immediately.]", styles: {} }] },
  { type: "heading", props: { level: 2 }, content: [{ type: "text", text: "Background", styles: {} }] },
  { type: "paragraph", content: [{ type: "text", text: "To understand why this matters, consider the context: [background information that helps readers grasp the significance of this story].", styles: {} }] },
  { type: "heading", props: { level: 2 }, content: [{ type: "text", text: "Key Details", styles: {} }] },
  { type: "paragraph", content: [{ type: "text", text: "[Expand on the most important details of the story. Include quotes, data points, and specific facts that support the headline.]", styles: {} }] },
  { type: "heading", props: { level: 2 }, content: [{ type: "text", text: "What This Means", styles: {} }] },
  { type: "paragraph", content: [{ type: "text", text: "[Analysis: explain the implications of this news for your audience. What should they do or think differently as a result?]", styles: {} }] },
  { type: "paragraph", content: [{ type: "text", text: "Source: [Publication Name] — [URL or reference to original reporting]", styles: {} }] },
];

const announcementBlocks: PartialBlock[] = [
  { type: "image", props: { url: "", caption: "Announcement banner", textAlignment: "center" } },
  { type: "heading", props: { level: 1 }, content: [{ type: "text", text: "Announcing [Feature / Product / Event Name]", styles: {} }] },
  { type: "paragraph", content: [{ type: "text", text: "We are excited to announce [one-sentence summary of what you are announcing and why it matters to your audience].", styles: {} }] },
  { type: "heading", props: { level: 2 }, content: [{ type: "text", text: "What's New", styles: {} }] },
  { type: "bulletListItem", content: [{ type: "text", text: "[Key highlight #1 — most important thing to know]", styles: {} }] },
  { type: "bulletListItem", content: [{ type: "text", text: "[Key highlight #2 — second most important]", styles: {} }] },
  { type: "bulletListItem", content: [{ type: "text", text: "[Key highlight #3 — supporting detail]", styles: {} }] },
  { type: "heading", props: { level: 2 }, content: [{ type: "text", text: "Details", styles: {} }] },
  { type: "paragraph", content: [{ type: "text", text: "[Provide more context: availability date, pricing, how it works, who it's for, any limitations or requirements readers should know about.]", styles: {} }] },
  { type: "heading", props: { level: 2 }, content: [{ type: "text", text: "Get Started", styles: {} }] },
  { type: "paragraph", content: [{ type: "text", text: "[Call to action: link to sign up, download, learn more, or contact. Make it easy for readers to take the next step right now.]", styles: {} }] },
];

export const SYSTEM_TEMPLATES: TemplateDefinition[] = [
  {
    name: "Tech Tutorial",
    slug: "system-tech-tutorial",
    description: "Step-by-step technical guide with code examples, prerequisites, and clear learning outcomes.",
    category: "tutorial",
    blocks: techTutorialBlocks,
    styleTheme: "default",
  },
  {
    name: "News Article",
    slug: "system-news-article",
    description: "Professional news format with headline, lead paragraph, background, and source attribution.",
    category: "news",
    blocks: newsArticleBlocks,
    styleTheme: "default",
  },
  {
    name: "Announcement",
    slug: "system-announcement",
    description: "Clean announcement layout with banner image, key highlights, details, and call to action.",
    category: "announce",
    blocks: announcementBlocks,
    styleTheme: "default",
  },
];
