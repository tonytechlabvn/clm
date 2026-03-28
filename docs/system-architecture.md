# System Architecture — CMA (Content Management Application)

## Overview

The **Content Management Application (CMA)** is a Next.js-based content publishing platform that manages posts across multiple social media platforms. It provides organizational multi-tenancy, content scheduling via pg-boss, calendar visualization, and intelligent content preview.

### Current Architecture (Phase 3 Complete)

```
┌─────────────────────────────────────────────────────────────────┐
│                     Next.js Frontend (React)                    │
│  Pages: /cma/dashboard, /cma/calendar, /cma/posts               │
│  Components: PostEditor, CMACalendarEvent, CalendarWidget       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   API Routes (/api/cma/*)                       │
│  GET    /api/cma/posts          (list posts)                    │
│  POST   /api/cma/posts          (create post)                   │
│  GET    /api/cma/posts/[id]     (fetch post)                    │
│  PATCH  /api/cma/posts/[id]     (update post)                   │
│  DELETE /api/cma/posts/[id]     (delete post)                   │
│  POST   /api/cma/posts/[id]/publish       (immediate publish)   │
│  POST   /api/cma/posts/[id]/schedule      (enqueue for later)   │
│  PATCH  /api/cma/posts/[id]/schedule      (reschedule)         │
│  DELETE /api/cma/posts/[id]/schedule      (cancel schedule)     │
│  GET    /api/cma/calendar       (list scheduled posts)          │
│  POST   /api/cma/accounts       (link platform account)         │
│  GET    /api/cma/org            (org details)                   │
│  GET/PATCH /api/cma/media       (asset upload)                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   ┌────────┐  ┌─────────────────┐  ┌──────────────┐
   │ Prisma │  │   pg-boss Job   │  │ Platform API │
   │ORM+DB  │  │    Queue        │  │  Adapters    │
   └────────┘  └─────────────────┘  └──────────────┘
        │              │              │
        └──────────────┴──────────────┴────────────┘
                       │
                       ▼
            ┌──────────────────────┐
            │    PostgreSQL DB     │
            │  (CMA + pg-boss      │
            │   schema)            │
            └──────────────────────┘
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

## Future Considerations

- **Batch Publishing:** Extend pg-boss to support bulk schedule operations
- **Workflow Approval:** Add approval step before scheduled publish
- **Analytics:** Track publish success rate & performance per platform
- **Webhook Notifications:** Platform-specific webhooks for publish events
- **UI Calendar Improvements:** Drag-to-reschedule, mass calendar actions

---

## Tech Stack Summary

| Layer | Tech | Version |
|-------|------|---------|
| Runtime | Node.js | 18+ (Next.js 14.2 requirement) |
| Framework | Next.js | 14.2.35 |
| UI | React | 18 |
| Styling | Tailwind CSS | 3.4.1 |
| Database | PostgreSQL | 14+ |
| ORM | Prisma | 5.22.0 |
| Job Queue | pg-boss | 12.14.0 |
| Calendar | @fullcalendar | 6.1.20 |
| Markdown | @uiw/react-md-editor | 4.0.11 |
| Auth | NextAuth.js | 4.24.13 |

