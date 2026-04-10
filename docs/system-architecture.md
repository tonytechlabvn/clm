# System Architecture — CLM (Content Management + Learning Management)

## Overview

The **Core Learning Management (CLM)** platform is a Next.js-based integrated system combining Content Management (CMA) with classroom learning management and LMS capabilities. Phase 4 expands Phase 3 CMA (social media scheduling) with:
- **Classroom System:** Create classrooms, manage members, assign work, provide feedback
- **Learning Management System (LMS):** Build courses, enroll students, track progress
- **AI Integration:** Auto-generate quizzes, summarize content, review code submissions
- **Cross-system Integration:** Link courses to classroom assignments

### Current Architecture (Phase 8: MCP Server Integration)

```
┌──────────────────────────────────────────────────────────────────────────┐
│                     Next.js Frontend (React)                             │
│  CMA:       /admin/cma/dashboard, /admin/cma/calendar, /admin/cma/posts │
│  Classroom: /classroom (list) → /classroom/[id] → /classroom/[id]/assignments
│  LMS:       /lms (catalog) → /lms/courses/[slug] → /lms/courses/[slug]/learn
└────────────────────────┬──────────────────────────────────────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
              ▼                     ▼
┌─────────────────────────────┐   ┌──────────────────────────┐
│   Session Auth (NextAuth)   │   │  API Key Auth (Bearer)   │
│   - WordPress OAuth         │   │  - Format: clm_...       │
│   - Google OAuth            │   │  - HMAC-SHA256 hash      │
│   - Cookie-based sessions   │   │  - 60 req/min rate limit │
└────────────┬────────────────┘   └──────────────┬───────────┘
             │                                    │
             └────────────────┬───────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┬──────────────┐
        │                     │                     │              │
        ▼                     ▼                     ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ /api/cma/*   │ │/api/classroom/*  │ /api/lms/*  │ /api/integration/*
│ (13 routes)  │ │ (12 routes)  │ (12 routes)  │ (1 route)    │
│ +api-keys    │ │              │ /api/lms/ai/* │              │
│              │ │              │ (3 routes)   │              │
└────────┬─────┘ └────────┬─────┘ └────────┬─────┘ └────────┬─────┘
         │                 │                │                │
         └─────────────────┼────────────────┼────────────────┘
                           │
                           ▼
                ┌──────────────────────────────┐
                │  Prisma ORM (23 models)      │
                │  - CMA (3 models)            │
                │  - Classroom (4 models)      │
                │  - LMS (10 models)           │
                │  - Auth (5 models)           │
                │  - ApiKey (1 model) [NEW]    │
                └────────┬──────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐   ┌──────────────┐  ┌──────────────┐
    │PostgreSQL  │  pg-boss Job  │ │   AI APIs    │
    │   (DB)    │    Queue      │ │(OpenAI,etc)  │
    └────────┘   └──────────────┘ └──────────────┘
         │
         │ (Separate process)
         │
         ▼
┌──────────────────────────────────────────────────┐
│        CLM MCP Server (clm-mcp-server/)         │
│   Markdown → Post → WordPress Auto-Publish      │
│   - 5 tools (publish, draft, status, etc.)      │
│   - YAML frontmatter parsing                    │
│   - API key auth to CLM backend                 │
│   - Claude Desktop & VS Code integration        │
└──────────────────────────────────────────────────┘
```

---

## Key Components

### 1. Frontend Pages & Components

| Path | Purpose | Features |
|------|---------|----------|
| `/cma/dashboard` | Post management hub | List, draft, edit, delete posts |
| `/cma/calendar` | Scheduled content view | @fullcalendar visualization of scheduled posts |
| `/cma/posts/[id]` | Post editor | Markdown editor, preview, platform selection |
| `CMACalendarEvent` | Calendar event UI | Rescheduling modal, time picker (date-fns-tz) |

**Key NPM Packages:**
- `@fullcalendar/react`, `@fullcalendar/daygrid` — Calendar widget
- `date-fns-tz` — Timezone-aware date handling
- `@uiw/react-md-editor` — Markdown editor
- `lucide-react` — Icons

### 2. API Routes

**Post Lifecycle:**
- `POST /api/cma/posts` → Create (status: "draft")
- `PATCH /api/cma/posts/[id]` → Edit content, platform selection
- `POST /api/cma/posts/[id]/publish` → Publish immediately (status: "publishing" → "published")
- `POST /api/cma/posts/[id]/schedule` → Queue for future (status: "scheduled")
- `PATCH /api/cma/posts/[id]/schedule` → Reschedule (cancel old pg-boss job, enqueue new)
- `DELETE /api/cma/posts/[id]/schedule` → Cancel schedule (status: "draft")

**Infrastructure:**
- `GET /api/cma/calendar` — List posts with status="scheduled" (for calendar widget)
- `GET/POST /api/cma/accounts` — Link platform accounts (WordPress, etc.)
- `GET /api/cma/org` — Fetch org details & settings
- `GET/PATCH /api/cma/media` — Asset upload/retrieve

### 3. Job Queue & Scheduling

**pg-boss Integration:**
- **Queue Name:** `cma-scheduled-publish`
- **Service:** `src/lib/cma/services/pgboss-service.ts`
- **Handler:** `src/lib/cma/services/scheduling-service.ts`
- **Startup Hook:** `src/instrumentation.ts` (Next.js instrumentation)

**Queue Configuration:**
- Retry limit: 3 (exponential backoff)
- Retry delay: 30s
- Max processing time: 15min
- Singleton key: `postId` (prevent duplicate jobs for same post)

### 4. Database Schema (CMA Entities)

```prisma
model CmaPost {
  id                String
  orgId             String
  status            String // "draft" | "approved" | "scheduled" | "publishing" | "published" | "failed"
  content           String // Markdown
  contentHtml       String?
  scheduledAt       DateTime? // When to publish
  pgBossJobId       String?  // pg-boss job ID for cancellation
  createdAt         DateTime
  updatedAt         DateTime
}

model CmaPlatformAccount {
  id                String
  orgId             String
  platform          String // "wordpress", "medium", etc.
  isActive          Boolean
}

model CmaPostPlatform {
  id                String
  postId            String
  accountId         String
  publishedUrl      String?
}
```

### 5. Service Layer

| Service | Purpose | Key Functions |
|---------|---------|----------------|
| `pgboss-service` | Job queue lifecycle | `getPgBoss()`, `enqueueScheduledPublish()`, `cancelScheduledJob()`, `registerScheduledPublishWorker()` |
| `scheduling-service` | Post scheduling logic | `schedulePost()`, `reschedulePost()`, `cancelScheduledPost()`, `handleScheduledPublish()` |
| `publishing-service` | Immediate publish logic | `publishPost()` (calls platform adapters) |
| `post-service` | Post CRUD | `createPost()`, `updatePost()`, `deletePost()` |
| `org-auth` | Multi-tenant auth | Org context validation |

### 6. Platform Adapters

Extensible adapter pattern for multi-platform publishing:
- `adapter-registry.ts` — Register/lookup adapters
- `platform-adapter.ts` — Base interface
- `wordpress-adapter.ts` — WordPress REST API integration

---

## Data Flow

### Scheduled Publishing Flow

```
User clicks "Schedule" on post
  │
  ├─→ POST /api/cma/posts/[id]/schedule
       │
       ├─→ Validate: scheduled time > now
       ├─→ Validate: platform account linked & active
       ├─→ Update DB: status="scheduled", scheduledAt
       ├─→ Enqueue pg-boss job (startAfter: scheduledAt)
       ├─→ Store pgBossJobId on post
       │
       └─→ Return { pgBossJobId }

[At scheduled time...]
  │
  ├─→ pg-boss worker processes job
       │
       ├─→ Load post from DB
       ├─→ Validate status="scheduled"
       ├─→ Call handleScheduledPublish()
       ├─→ Call publishPost() (same as immediate publish)
       ├─→ Update status: "published" (or "failed")
       │
       └─→ Job marked complete
```

### Reschedule Flow

```
User reschedules post
  │
  ├─→ PATCH /api/cma/posts/[id]/schedule
       │
       ├─→ Find post (must be status="scheduled")
       ├─→ Cancel existing pg-boss job (pgBossJobId)
       ├─→ Enqueue new job (newScheduledAt)
       ├─→ Update DB: scheduledAt, pgBossJobId
       │
       └─→ Return { pgBossJobId }
```

---

## Critical Rules & Constraints

### Multi-Tenancy
- Every CmaPost must have `orgId` — enforced in Prisma
- APIs validate org context via `useOrgContext()` hook (middleware)
- Org isolation at DB level (Prisma queries scoped by orgId)

### Idempotency & Locking
- Post status transitions use **optimistic locking**
  - Update only succeeds if current status matches expected
  - Prevents race conditions (e.g., publishing twice)
- pg-boss uses **singletonKey=postId** to prevent duplicate jobs

### Error Handling & Compensation
- Schedule fails? Revert status to "draft" (compensating transaction)
- Reschedule fails? Revert to original scheduledAt & pgBossJobId
- Job processing errors logged; status remains "scheduled" for retry

### Timezone Handling
- Frontend uses `date-fns-tz` for user timezone display
- Store all `scheduledAt` in UTC in DB
- API accepts ISO 8601 timestamps

---

## Deployment & Operations

### Environment Variables Required
```
DATABASE_URL=postgresql://...  # pg-boss uses same DB
NEXT_RUNTIME=nodejs            # Enables instrumentation
```

### Startup Sequence
1. Next.js app starts
2. `instrumentation.ts` runs (server-side only)
3. pg-boss worker registers and begins polling
4. API routes available

### Monitoring
- Check pg-boss jobs table: `SELECT * FROM pgboss.job`
- Monitor logs for `[pg-boss]` and `[scheduling]` prefixes
- Watch `cmaPost.status` distribution for queue health

---

## Phase 4 Architecture: Classroom + LMS + AI (Summary)

**Classroom System (4 models):** Org learning spaces, member roles, assignments, submissions, feedback
- API: 12 routes (CRUD classrooms, assignments, submissions, feedback; dashboard; CSV export)
- Features: Join by code, role-based access, instructor analytics

**LMS (10 models):** Courses, sections, lessons, enrollments, progress tracking
- API: 12 routes (course CRUD, section/lesson CRUD, enrollment, progress)
- Features: Course builder, student progress tracking, lesson types (text/video/quiz)

**AI Integration (3 API routes):** Quiz generation, content summarization, code review
- pg-boss queues: `lms-quiz-generate`, `classroom-batch-feedback`
- Prompts: Quiz generator, content summarizer, code reviewer, submission feedback

**Cross-System:** Link LMS courses to classroom assignments via `/api/integration/classroom-courses`

---

## Phase 5-6: CMA AI Curation, Generation & Analytics (Summary)

RSS feed integration with AI curation, content generation, and metrics syncing. Key additions:
- Services: `crawler-service`, `content-ai-service`, `content-generation-service`, `analytics-service`
- Models: `CmaRssFeed`, `CmaAiUsage`, `CmaPostMetrics`, `CmaMetricsSnapshot`
- API routes: RSS CRUD, AI curate/generate, analytics, approval queue
- Security: SSRF prevention, AI prompt injection prevention, rate limiting, token budgets

See full documentation in project roadmap for detailed phase notes.

---

## Phase 7: CMA Post Template System & UI Overhaul

### 1. BlockNote Block Editor (Dual-mode Editor)

**New Component:**
- `cma-block-editor.tsx` — Notion-like block editor alongside markdown (indefinite coexistence)

**Key Features:**
- Block-based editing: paragraphs, headings, lists, code, images, embeds
- Markdown mode preserved as alternative (users choose `contentFormat`)
- BlockNote JSON blocks stored in `CmaPost.content` when `contentFormat="blocks"`
- Rich formatting: bold, italic, strikethrough, code, links
- Drag-to-reorder blocks, nested structures

**Packages:**
- `@blocknote/core@0.47.3` — Core block editor logic
- `@blocknote/react@0.47.3` — React wrapper
- `@blocknote/shadcn@0.47.3` — shadcn/ui integration

**API:**
- POST/PATCH `/api/cma/posts` now accept `contentFormat` ("markdown" | "blocks")
- Content stored as BlockNote JSON or markdown based on format

### 2. Template System (CRUD + Gallery)

**New Models:**
- `CmaTemplate` (id, orgId?, name, slug unique, description, category, blocks JSON, styleTheme, isDefault)
  - System templates (orgId=null) shared across orgs
  - Org templates (orgId!=null) private to organization
  - Categories: "tutorial", "news", "announcement"

**API Routes (4):**
- `GET/POST /api/cma/templates` — List templates + create custom template
- `GET /api/cma/templates/[id]` — Template detail (blocks, metadata)
- `PUT /api/cma/templates/[id]` — Update template
- `DELETE /api/cma/templates/[id]` — Delete org template

**Services:**
- `template-service.ts` — CRUD, seeding system templates, validation
- `seed-system-templates.ts` — Seed 3 pre-built: Tutorial, News, Announcement
- `template-definitions.ts` — Template block definitions

**UI Components:**
- `cma-template-picker.tsx` — Template gallery modal, preview, select
- `src/app/admin/cma/templates/page.tsx` — Template management page

**Features:**
- Template picker in composer UI (select template before editing)
- Clone template blocks into new post
- Edit post based on template baseline
- Preview template before using

### 3. Image System (Unsplash + AI Generation)

**New Services:**
- `unsplash-service.ts` — Search Unsplash API, download/attribution
- `image-generation-service.ts` — DALL-E 3 integration with org rate limiting

**API Routes (4):**
- `GET /api/cma/images/unsplash-search?q=...` — Search Unsplash stock photos
- `POST /api/cma/images/unsplash-download` — Download Unsplash photo (triggers attribution)
- `POST /api/cma/images/generate` — Generate image via DALL-E 3 with prompt
- `POST /api/cma/images/[id]` — Set as featured image

**New Models:**
- `CmaAiImageUsage` — Daily per-org AI image generation count (for rate limiting)
  - Unique constraint: (orgId, date)
  - Tracks daily quota (e.g., max 5 AI images/day/org)

**Media Model Updates:**
- `CmaMedia.source` — "upload" | "unsplash" | "ai-generated"
- `CmaMedia.sourceUrl` — Unsplash photo URL for attribution
- `CmaMedia.aiPrompt` — Prompt used for AI generation
- `CmaMedia.aiProvider` — "openai" (DALL-E 3) or "google" (Gemini)

**UI Components:**
- `cma-featured-image-picker.tsx` — Image selection modal (upload/unsplash/ai)
- `cma-ai-image-generator-panel.tsx` — Prompt input, image preview, generation status

### 4. Styled Publishing (Multi-Theme Support)

**New Theme System:**
- `styleTheme` on CmaPost & CmaTemplate — "default" | "editorial"
- Themes render different CSS for WordPress compatibility

**CSS Injection:**
- Generated CSS embedded in post HTML for WordPress
- Theme applies to featured image, heading styles, spacing, typography

**Themes:**
- **Default** — Clean, minimal WordPress styling
- **Editorial** — Magazine-style with bold typography, large featured image

**Features:**
- User selects theme when publishing post
- Theme applied to HTML output before platform publishing
- Inline CSS prevents WordPress from overriding styles
- Theme preview in composer UI

### 5. Redesigned Composer UI

**Sidebar Collapse Feature:**
- Collapsible sidebar with template gallery, image picker, theme selector
- Expandable sections: Templates, Images, Publishing Settings, Theme
- Reduces visual clutter in editor

**New UI Controls:**
- Tab-based: Content (markdown/blocks), Images, Preview, Settings
- Sheet component for advanced options (publishing targets, scheduling)
- Tooltips for complex features

**New shadcn/ui Components:**
- `dialog` — Template picker, image generator modal
- `tabs` — Content/Images/Settings tabs in composer
- `select` — Theme selector dropdown
- `sheet` — Sidebar panel for publishing options
- `separator` — Visual dividers
- `skeleton` — Loading states for image generation
- `input` / `textarea` — Form inputs (improved styling)
- `tooltip` — Feature hints

**Package:** `@base-ui/react@1.3.0` — v4 shadcn dependency

### 6. Template Gallery Page

**New Page:** `/admin/cma/templates`
- Grid view of all templates (system + org)
- Categories filter tabs
- Template preview modal
- Create custom template button
- Edit/delete for org templates only
- "Use Template" button links to composer

### 7. Block HTML Sanitization

**Package:** `rehype-*` suite for HTML safety
- `rehype-parse@9.0.1` — Parse HTML to AST
- `rehype-raw@7.0.0` — Handle raw HTML blocks
- `rehype-sanitize@6.0.0` — Remove unsafe HTML (XSS prevention)
- `rehype-stringify@10.0.1` — Stringify back to HTML
- `remark-rehype@11.1.2` — Convert markdown to rehype AST

**Flow:**
1. Block editor output → BlockNote JSON
2. JSON blocks → HTML rendering
3. HTML parsed → AST
4. Sanitized (remove scripts, event handlers)
5. Stringified → Safe HTML for publishing

### 8. New CmaPost Fields (Phase 7)

- `contentFormat: String` — "markdown" (default) | "blocks"
- `templateId: String?` — FK to CmaTemplate (optional)
- `styleTheme: String` — "default" (default) | "editorial" | future themes

---

## Phase 8: MCP Server & API Key Authentication

### 1. API Key Authentication (Backend)

**Service:** `src/lib/cma/services/api-key-service.ts`

**Key Generation & Storage:**
- Format: `clm_` prefix + 32 random base62 chars (256-bit entropy per key)
- Stored as HMAC-SHA256 hash (never plaintext)
- Lookup via indexed prefix (first 8 chars: `clm_xxxx`)
- Requires `CMA_ENCRYPTION_KEY` environment variable (HMAC secret)

**Key Features:**
- **Rate Limiting:** 60 requests/minute per key (in-memory, per-instance)
- **Expiry Support:** Optional `expiresAt` field for time-bound keys
- **Soft Delete:** `isActive` flag (revocation without deleting record)
- **Multi-Key:** Users can create multiple keys per organization
- **Audit Trail:** `lastUsedAt` timestamp tracked on each request

**Database Model (ApiKey):**
```prisma
model ApiKey {
  id         String    @id @default(cuid())
  name       String    // "MCP Server", "CI/CD", etc.
  keyHash    String    // HMAC-SHA256 (never plaintext)
  keyPrefix  String    // "clm_xxxx" for fast lookup
  userId     String    // Who created the key
  orgId      String    // Organization scope
  lastUsedAt DateTime? // Audit trail
  expiresAt  DateTime? // Optional expiry
  isActive   Boolean   @default(true)
  createdAt  DateTime
  updatedAt  DateTime
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  org  Organization @relation(fields: [orgId], references: [id], onDelete: Cascade)
  
  @@index([keyPrefix])
  @@index([userId, orgId])
}
```

**Validation Flow:**
```
Bearer Token (clm_...)
  ↓
validateApiKey() in api-key-service.ts
  ├─ Check prefix matches
  ├─ Hash token, lookup by prefix
  ├─ Verify hash match
  ├─ Check expiry (if set)
  ├─ Check user.isActive && org.isActive
  ├─ Check user role (admin or root)
  ├─ Rate limit check (throw RateLimitError if exceeded)
  ├─ Update lastUsedAt (fire-and-forget)
  ├─ Resolve org role (owner for root, lookup for others)
  └─ Return OrgAuthContext + apiKeyId
```

**API Routes:**
- `POST /api/cma/api-keys` — Create new key
  - Request: `{ name: string, expiresAt?: Date }`
  - Response: `{ key: string, keyId: string, keyPrefix: string }` (key shown once)
  - Auth: Session-based only (not API key auth)
- `GET /api/cma/api-keys` — List user's keys
  - Response: Array of keys (never exposes keyHash)
  - Auth: Session-based or API key
- `DELETE /api/cma/api-keys/[id]` — Revoke a key
  - Auth: Session-based or API key

**Middleware Integration:**
```typescript
// src/middleware.ts
if (process.env.ENABLE_API_KEY_AUTH === "true" &&
    isCmaApi &&
    request.headers.get("authorization")?.startsWith("Bearer clm_")) {
  // Set x-auth-method: api-key header
  // Downstream routes can distinguish API key auth from session auth
}
```

### 2. MCP Server Integration

**Location:** `clm-mcp-server/` (sibling directory to main CLM app)

**Purpose:** Standalone server for Claude Desktop & VS Code integration. Allows markdown-based post publishing with auto-publish to WordPress.

**Architecture:**
```
Claude Desktop / VS Code
  ↓
MCP Server (clm-mcp-server/)
  ├─ Parse markdown + YAML frontmatter
  ├─ Call CLM API (with API key auth)
  ├─ Create/update post
  └─ Auto-publish to WordPress
  ↓
CLM Backend (src/)
  ├─ Validate API key
  ├─ Create CmaPost record
  ├─ Enqueue publish job
  └─ Return status
  ↓
WordPress (via platform adapter)
```

**5 MCP Tools:**

| Tool | Input | Output | Purpose |
|------|-------|--------|---------|
| `clm_post_publish` | Markdown + frontmatter | Post ID, URL | Create post, auto-publish |
| `clm_post_draft` | Markdown + frontmatter | Post ID | Create post as draft |
| `clm_post_status` | Post ID | Status, URL | Check publish status |
| `clm_templates_list` | (none) | Templates array | List available templates |
| `clm_accounts_list` | (none) | Accounts array | List connected WordPress accounts |

**Markdown Frontmatter:**
```yaml
---
title: "My Blog Post"
template: "tech-blog"        # Optional: template slug
account: "account_id"        # Optional: WordPress account ID
tags: ["javascript", "web"]  # Optional: tag array
category: "Development"      # Optional: category name
featured_image: "https://..."# Optional: image URL
excerpt: "Short summary"     # Optional: excerpt/description
---

Your markdown content here...
```

**Configuration (Environment Variables):**
- `CLM_API_URL` — Base URL (e.g., `http://localhost:3000`)
- `CLM_API_KEY` — API key (format: `clm_...`)
- `CLM_DEFAULT_ORG_ID` — Default organization ID

**Claude Desktop Setup:**
```json
{
  "mcpServers": {
    "clm": {
      "command": "node",
      "args": ["/absolute/path/to/clm-mcp-server/dist/index.js"],
      "env": {
        "CLM_API_URL": "http://localhost:3000",
        "CLM_API_KEY": "clm_your_key_here",
        "CLM_DEFAULT_ORG_ID": "your_org_id"
      }
    }
  }
}
```

**VS Code Setup:**
- Create `.vscode/mcp.json` with server config
- Warning: Settings Sync may leak API key — use env vars or `.gitignore`

**Dependencies:**
- `@modelcontextprotocol/sdk` — MCP protocol & types
- `axios` — HTTP requests to CLM API
- `gray-matter` — YAML frontmatter parsing
- Build: `typescript`, `esbuild`, `tsx`

**Usage Flow (Claude Example):**
```
User: "Publish a blog post about React hooks"
  ↓
Claude (via clm_post_publish tool):
  1. Generate markdown content + frontmatter
  2. Call clm_post_publish with markdown
  3. MCP server parses frontmatter, calls CLM API
  4. CLM creates post & queues publish job
  5. WordPress adapter publishes immediately
  ↓
Result: "Blog post published at [URL]"
```

---

## Image Template System (MVP)

### 1. Puppeteer-Based Renderer

**Service:** `src/lib/cma/services/image-template-renderer-service.ts`

Renders HTML + CSS templates to PNG images via headless Puppeteer browser. Supports dynamic variable substitution (text, numbers, colors, image URLs).

**Rendering Pipeline:**
```
Template + Variables (JSON)
  ↓
HTML interpolation (variable substitution)
  ↓
Puppeteer launch browser
  ↓
Set viewport (width × height)
  ↓
Navigate to HTML (data:// URL)
  ↓
Screenshot as PNG
  ↓
Return PNG blob
```

**Key Features:**
- Supports starter templates: Facebook Post (1200×630), Generic Announcement (1200×630)
- Variable types: text, number, color, image URL
- Error handling for failed renders (status: "failed")
- Integrated with featured image picker UI

### 2. Image Template Models

**CmaImageTemplate** — Template definition
- HTML + CSS base template, width/height, variable schema (JSON array)
- Thumbnail preview (base64-encoded PNG)
- Org-scoped (orgId) or system-wide (orgId=null for starters)

**GeneratedImage** — Rendered output
- Links template → variables → PNG image blob
- Status tracking: "pending" | "completed" | "failed"
- Tied to featured image picker for seamless integration

### 3. API Routes (6 endpoints)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/cma/image-templates` | GET/POST | List templates, create custom |
| `/api/cma/image-templates/[id]` | GET/PATCH/DELETE | Template CRUD |
| `/api/cma/image-templates/[id]/render` | POST | Render template with variables → PNG |
| `/api/cma/image-templates/[id]/preview` | GET | HTML preview (no render) |

### 4. UI Integration

**Components:**
- `image-template-grid.tsx` — Template selector (card grid with thumbnails)
- `template-variable-form.tsx` — Dynamic form based on template variables
- `template-live-preview.tsx` — Real-time HTML/PNG preview
- `image-template-panel.tsx` — Main editor interface (integrated into featured image picker)

**Featured Image Picker Integration:**
- Template tab in existing featured image picker
- Variables form dynamically generated from template schema
- Live preview updates as user edits variables
- Render button generates PNG, stores as featured image

### 5. Type System

**Zod Validators:** `src/lib/cma/types/image-template-types.ts`
- TemplateVariable schema (name, label, type, defaultValue, required)
- CreateImageTemplateRequest, RenderImageRequest, GeneratedImageResponse
- Validates variable types and required fields before rendering

---

## Phase 9: CMA Template Studio (Summary)

Advanced template extraction, generation, and slot-based editing via URL extraction. See separate template studio documentation for full details.

**Key Additions:**
- `template-extraction-service.ts` — URL → HTML extraction + CSS scoping
- `CmaTemplate.templateType` — "blocks" | "html-slots"
- `CmaTemplate.htmlTemplate`, `slotDefinitions` — HTML-slot support
- API routes: `/api/cma/templates/{extract,ai-generate,ai-fill,from-post}`
- UI: Template studio page with extraction wizard, slot editor, favorites

---

## Future Considerations

- **Social Media Publishing:** Facebook + LinkedIn adapters (blocked on FB App Review)
- **UTM Tracking:** Conversion attribution (blocked on CLM core)
- **Webhook Notifications:** Platform-specific webhooks for publish events
- **UI Calendar Improvements:** Drag-to-reschedule, mass calendar actions
- **Template Marketplace:** Share/discover community templates
- **Advanced CSS Isolation:** Iframe-based preview for full CSS isolation
- **Headless Browser Extraction:** Puppeteer/Playwright for dynamic sites (instead of JSDOM)

---

## Phase 10: Facebook Auto-Post System with Zalo OA Bot

### 1. Facebook Adapter (Graph API v21.0)

**New Services:**
- `src/lib/cma/adapters/facebook-adapter.ts` — Implements PlatformAdapter for Facebook Pages
  - Publishing: Text + images to Facebook (v21.0 API)
  - Metrics: Real-time reach/engagement via Graph API
  - Syncs every 6 hours via metrics sync job
- `src/lib/cma/adapters/facebook-graph-client.ts` — HTTP wrapper for Facebook Graph API
  - Typed API calls, token refresh handling, error mapping

**OAuth Service:**
- `src/lib/cma/services/facebook-oauth-service.ts` — Full OAuth 2.0 flow
  - Authorize → callback → token storage (encrypted in DB)
  - Token refresh on expiry (automatic)
  - Page selection UI (users choose which FB page to publish to)

**API Routes (3 new):**
- `GET /api/cma/facebook/authorize` — OAuth flow initiation
- `GET /api/cma/facebook/callback` — OAuth redirect handler
- `GET /api/cma/facebook/pages` — List connected FB pages

**UI Components:**
- `connect-facebook-flow.tsx` — OAuth flow UI + page selector
- `facebook-content-preview.tsx` — Post preview as it appears on Facebook

**Environment Variables:**
- `FB_APP_ID`, `FB_APP_SECRET` — Facebook app credentials
- `FB_REDIRECT_URI` — OAuth callback URL

### 2. Publishing Mode System (Per-Org Auto/Human-in-Loop)

**Database Model:**
- `CmaOrgSettings` (new) — Per-org publishing control
  - `publishingMode`: "auto" | "human_in_loop"
  - `autoPublishSources`: sources auto-publish (e.g., ["scheduler", "mcp"])
  - `requireApprovalSources`: always need approval (e.g., ["zalo_bot"])

**Service:**
- `src/lib/cma/services/publish-mode-router.ts` — Route posts to auto-publish or approval queue
  - Checks source + mode → decide publish immediately or queue for approval
  - Integrates with approval workflow

**API Route:**
- `PATCH /api/cma/org/settings` — Update org publishing mode

### 3. Zalo OA Bot (Webhook-based)

**Models:**
- `CmaZaloBotConfig` — Bot setup per org (botType, oaId, tokens, active status)
- `CmaZaloUserMapping` — Map Zalo user IDs → CLM users for authorship

**Bot Provider Interface:**
- `src/lib/zalo/zalo-bot-provider.ts` — Abstract bot interface (OA or personal)
- `src/lib/zalo/zalo-oa-provider.ts` — Zalo OA implementation
- `src/lib/zalo/zalo-user-mapping.ts` — User ID resolution

**Message Router:**
- `src/lib/zalo/zalo-message-router.ts` — Webhook handler, message parsing

**Webhook Route:**
- `POST /api/webhooks/zalo` — Webhook endpoint for Zalo messages
  - Validates HMAC signature (`ZALO_WEBHOOK_SECRET`)
  - Parses incoming text messages → draft posts
  - Returns 200 OK immediately (async processing)

**Environment Variables:**
- `ZALO_OA_ID`, `ZALO_OA_SECRET` — OA app credentials
- `ZALO_WEBHOOK_SECRET` — HMAC signature validation

**Features:**
- Simple mode: Text message → draft post (auto-tagged "zalo_bot")
- Optional: Image attachment support (via CmaMedia)
- Always routed to approval queue (per `CmaOrgSettings.requireApprovalSources`)

### 4. Notifications & Approval Flow

**Notification Service Updates:**
- `src/lib/cma/services/notification-service.ts` — Send Zalo message notifications
  - Approval request: "New post pending review: [link to post]"
  - Approval token: HMAC-signed JWT in URL query (`approvalToken`)

**Approval Token Service (new):**
- `src/lib/cma/services/approval-token-service.ts` — Generate/verify approval tokens
  - Signed with `JWT_APPROVAL_SECRET`
  - Includes: postId, userId, expiresAt
  - One-click approval: `POST /api/cma/posts/[id]/approve?token=...`

**New Environment Variable:**
- `JWT_APPROVAL_SECRET` — JWT signing key for approval tokens

### 5. New CmaPost Field

**Source Field:**
- `CmaPost.source: String` — Discriminate origin
  - "web" (default) | "zalo_bot" | "mcp" | "scheduler"
  - Used in publish-mode-router to determine auto-publish vs approval

### 6. Type System Updates

**PlatformAdapter Interface Additions:**
- `prepareContent(content: string, format: "html"|"plaintext"): Promise<string>`
  - Transform content for platform specifics (strip HTML for FB plain-text, etc.)
- `usesHtmlPipeline: boolean` — Flag if adapter requires HTML processing

**MediaUploadResult Type Change:**
- `platformMediaId`: String (was number) — Some platforms use string IDs (Facebook)

### 7. UI Components (New)

- `source-badge.tsx` — Badge showing post origin ("Web" | "Zalo Bot" | "MCP" | "Scheduler")
- `platform-target-selector.tsx` — Choose platforms when publishing (WordPress + Facebook)
- `zalo-setup-guide.tsx` — Step-by-step guide for Zalo OA bot setup
- `publishing-mode-settings.tsx` — Org admin panel for auto/human-in-loop modes

### 8. API Routes Summary

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/cma/facebook/authorize` | GET | Start OAuth flow |
| `/api/cma/facebook/callback` | GET | OAuth callback handler |
| `/api/cma/facebook/pages` | GET | List connected FB pages |
| `/api/webhooks/zalo` | POST | Zalo message webhook |
| `/api/cma/posts/[id]/approve` | POST | One-click approval (with token) |
| `/api/cma/org/settings` | PATCH | Update org publishing mode |

---

## Tech Stack Summary

| Layer | Tech | Version |
|-------|------|---------|
| Runtime | Node.js | 18+ |
| Framework | Next.js | 14.2.35 |
| UI | React | 18 |
| Styling | Tailwind CSS | 3.4.1 |
| Database | PostgreSQL | 14+ |
| ORM | Prisma | 5.22.0 |
| Job Queue | pg-boss | 12.14.0 |
| Calendar | @fullcalendar | 6.1.20 |
| Markdown | @uiw/react-md-editor | 4.0.11 |
| Block Editor | @blocknote/core, react, shadcn | 0.47.3 |
| UI Components | @base-ui/react | 1.3.0 |
| HTML Processing | rehype-* | 6.0.0+ |
| Auth | NextAuth.js | 4.24.13 |
| Facebook API | Graph API | v21.0 |
| Zalo API | Zalo OA/Personal | Latest |
| AI Models | OpenAI (DALL-E 3), Anthropic Claude | Latest |

