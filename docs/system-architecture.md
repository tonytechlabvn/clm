# System Architecture — CLM (Content Management + Learning Management)

## Overview

The **Core Learning Management (CLM)** platform is a Next.js-based integrated system combining Content Management (CMA) with classroom learning management and LMS capabilities. Phase 4 expands Phase 3 CMA (social media scheduling) with:
- **Classroom System:** Create classrooms, manage members, assign work, provide feedback
- **Learning Management System (LMS):** Build courses, enroll students, track progress
- **AI Integration:** Auto-generate quizzes, summarize content, review code submissions
- **Cross-system Integration:** Link courses to classroom assignments

### Current Architecture (Phase 7 In Progress)

```
┌────────────────────────────────────────────────────────────────────────┐
│                     Next.js Frontend (React)                           │
│  CMA:       /admin/cma/dashboard, /admin/cma/calendar, /admin/cma/posts
│  Classroom: /classroom (list) → /classroom/[id] → /classroom/[id]/assignments
│  LMS:       /lms (catalog) → /lms/courses/[slug] → /lms/courses/[slug]/learn
└──────────────────────┬─────────────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        │              │              │              │
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│ /api/cma/*   │ │ /api/classroom/*  │ /api/lms/*  │ /api/integration/*
│ (12 routes)  │ │ (12 routes)  │ (12 routes)  │ (1 route)    │
│              │ │              │ /api/lms/ai/* │              │
│              │ │              │ (3 routes)   │              │
└────────┬─────┘ └────────┬─────┘ └────────┬─────┘ └────────┬─────┘
         │                 │                │                │
         └─────────────────┼────────────────┼────────────────┘
                           │
                           ▼
                ┌──────────────────────────┐
                │  Prisma ORM (22 models)  │
                │  - CMA (3 models)        │
                │  - Classroom (4 models)  │
                │  - LMS (10 models)       │
                │  - Auth (5 models)       │
                └────────┬─────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
    ┌────────┐   ┌──────────────┐  ┌──────────────┐
    │PostgreSQL  │  pg-boss Job  │ │   AI APIs    │
    │   (DB)    │    Queue      │ │(OpenAI,etc)  │
    └────────┘   └──────────────┘ └──────────────┘
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

## Phase 4 Architecture: Classroom + LMS + AI

### 1. Classroom System (4 new models, 12 API routes)

**Models:**
- `Classroom` — Org's learning space (orgId, instructorId, name, joinCode unique 6-char, isActive)
- `ClassroomMember` — Student/instructor role (userId, classroomId, role: "student"|"instructor")
- `Assignment` — Classroom task (title, description, jobDescription, dueDate, type, status, linkedCourseId)
- `Submission` — Student work (assignmentId, studentId, content, score, status, submittedAt)
- `Feedback` — Instructor/AI feedback (submissionId, instructorId, comment, aiFeedback)

**API Routes (12):**
- POST/GET `/api/classroom` — Create classroom + list instructor's classrooms
- GET/PATCH/DELETE `/api/classroom/[id]` — Classroom detail, update, archive
- POST `/api/classroom/join` — Join classroom by code
- DELETE `/api/classroom/[id]/members/[uid]` — Remove member
- POST/GET `/api/classroom/[id]/assignments` — Create assignment + list
- GET `/api/classroom/[id]/assignments/[aid]` — Assignment detail (role-filtered view)
- POST `/api/classroom/[id]/assignments/[aid]/submit` — Student submission
- POST `/api/classroom/[id]/assignments/[aid]/submissions/[sid]/feedback` — Give feedback
- POST `/api/classroom/[id]/assignments/[aid]/ai-feedback` — Trigger AI feedback
- GET `/api/classroom/[id]/dashboard` — Instructor analytics
- GET `/api/classroom/[id]/export` — CSV export (submissions + scores)

### 2. LMS (Course + Lesson Management) (10 new models, 12 API routes)

**Models:**
- `Course` — Published course (orgId, instructorId, title, slug unique, description, thumbnailUrl, level, status, estimatedHours, tags[])
- `Section` — Course grouping (courseId, title, order, isPublished)
- `Lesson` — Learning unit (sectionId, title, type: "video"|"article"|"quiz", content, videoUrl, order, estimatedMinutes, isPublished)
- `LessonProgress` — Student completion (lessonId, userId, status: "not_started"|"in_progress"|"completed", completedAt, timeSpent)
- `CourseEnrollment` — Student enrollment (courseId, userId, progress 0-100, enrolledAt, completedAt)
- Plus 5 core auth models (User, Organization, Account, Session, VerificationToken)

**API Routes (12):**
- GET/POST `/api/lms/courses` — Course catalog + create
- GET/PATCH/DELETE `/api/lms/courses/[slug]` — Course detail, update, archive
- POST `/api/lms/courses/[slug]/sections` — Create section
- PATCH/DELETE `/api/lms/courses/[slug]/sections/[id]` — Section update/delete
- POST `/api/lms/courses/[slug]/lessons` — Create lesson
- GET/PATCH/DELETE `/api/lms/courses/[slug]/lessons/[id]` — Lesson content, update, delete
- POST `/api/lms/courses/[slug]/enroll` — Student enrollment
- GET `/api/lms/courses/[slug]/progress` — Progress tracking
- POST `/api/lms/lessons/[id]/progress` — Mark lesson complete

### 3. AI Integration (3 API routes, 2 pg-boss queues)

**AI Routes:**
- POST `/api/lms/ai/generate-quiz` — Generate quiz from lesson content
- POST `/api/lms/ai/summarize` — Summarize lesson content
- POST `/api/lms/ai/review-code` — Score code submission with feedback

**pg-boss Queues:**
- `lms-quiz-generate` — Async quiz generation (prevents UI blocking)
- `classroom-batch-feedback` — Batch AI feedback on ungraded submissions

**Prompts** (src/lib/prompts/):
- `clm-quiz-generator-prompt.ts` — MCQ generation from lesson text
- `clm-content-summarizer-prompt.ts` — Multi-paragraph summary
- `clm-code-reviewer-prompt.ts` — Scoring + improvement suggestions
- `clm-submission-feedback-prompt.ts` — Personalized feedback for assignments

### 4. Cross-System Integration (1 API route)

- POST `/api/integration/classroom-courses` — Link LMS course to classroom assignment
  - Allows students to complete course as assignment submission
  - Tracks completion and automatically scores based on course progress

### Database Enhancements

**New pg-boss Queues:**
```
- Job: 'lms-quiz-generate'
  Data: { lessonId, aiProvider, contentText, lessonTitle }
  Timeout: 30s, Retries: 2

- Job: 'classroom-batch-feedback'
  Data: { classroomId, assignmentId, llmModel }
  Timeout: 60s, Retries: 2
```

**Indexes Added:**
- `Classroom` — `@@index([orgId])`, `@@index([instructorId])`
- `Assignment` — `@@index([classroomId])`, `@@index([dueDate])`
- `Course` — `@@index([orgId])`, `@@index([slug])`
- `Lesson` — `@@index([courseId])`, `@@index([sectionId])`
- `CourseEnrollment` — `@@index([courseId])`, `@@index([userId])`

---

## Phase 5-6: CMA AI Curation, Generation & Analytics

### CMA AI Content Pipeline (Phase 4-5)

**New Services:**
- `crawler-service.ts` — RSS feed parsing, content extraction via @mozilla/readability, URL normalization, dedup
- `content-ai-service.ts` — AI curation bridge (Gemini Flash), structured prompt with system/user separation
- `content-generation-service.ts` — Two-step outline→content generation (Gemini 2.5 Flash)
- `url-safety.ts` — SSRF prevention (DNS resolution, IP blocklist, scheme allowlist)
- `analytics-service.ts` — Metrics aggregation (overview, timeseries, best-times, top posts)

**New pg-boss Queues:**
```
- Job: 'cma:rss-crawl'     — RSS feed crawling (per-feed, configurable frequency)
- Job: 'cma:curate'        — AI curation per article (3 retries, 120s timeout)
- Job: 'cma:metrics-sync'  — Daily metrics sync at 03:00 UTC (2 retries, 600s timeout)
```

**New API Routes (Phase 4-6):**
- `GET/POST /api/cma/feeds` — RSS feed CRUD
- `PUT/DELETE /api/cma/feeds/[id]` — Feed update/delete
- `POST /api/cma/ai/curate` — Curate content from URL
- `GET/POST /api/cma/approval` — Approval queue (pending_review posts)
- `POST /api/cma/ai/generate-outline` — AI outline generation
- `POST /api/cma/ai/generate-content` — AI full content generation
- `GET /api/cma/analytics/overview` — Dashboard summary
- `GET /api/cma/analytics/timeseries` — Time-series chart data
- `GET /api/cma/analytics/best-times` — Posting heatmap
- `GET /api/cma/analytics/export` — CSV export

**New UI Pages:**
- `/admin/cma/settings/feeds` — RSS feed management
- `/admin/cma/approval` — AI content approval queue
- `/admin/cma/composer/ai-generator` — 4-step AI content wizard
- `/admin/cma/analytics` — Analytics dashboard (Recharts)

**New Schema Models:**
- `CmaRssFeed` — RSS feed config (orgId, url, keywords, frequency, errorCount)
- `CmaAiUsage` — Org AI token budget tracking (orgId, month, tokensUsed, tokenLimit)
- `CmaPostMetrics` — Latest post metrics (reach, clicks, likes, shares, comments)
- `CmaMetricsSnapshot` — Daily time-series snapshots (append-only)

**CmaPost New Fields:**
- `aiGenerated`, `sourceUrl`, `normalizedSourceUrl`, `parentPostId` (Phase 4)
- `outlineData`, `originalAiDraft`, `generationStatus` (Phase 5)

### Security Measures
- SSRF prevention on RSS feeds and URL curation (DNS blocklist, scheme allowlist)
- AI prompt injection prevention (system/user message separation, input sanitization)
- Self-approval logic (single-admin: explicit ack, multi-admin: different userId)
- Rate limiting on AI endpoints (5-10 req/hour/user)
- Org-level AI token budget with 80% warn / 100% hard-stop

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

## Future Considerations

- **Social Media Publishing:** Facebook + LinkedIn adapters (blocked on FB App Review)
- **UTM Tracking:** Conversion attribution (blocked on CLM core)
- **Webhook Notifications:** Platform-specific webhooks for publish events
- **UI Calendar Improvements:** Drag-to-reschedule, mass calendar actions

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
| AI Models | OpenAI (DALL-E 3), Anthropic Claude | Latest |

