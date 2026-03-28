# Codebase Summary — CLM Phase 7

**Project:** Tony Tech Lab Core Learning Management (CLM)
**Modules:** Content Management (CMA) + Classroom System + Learning Management System (LMS)
**Phase:** 7 (CMA Post Template System & UI Overhaul)
**Last Updated:** 2026-03-28
**Status:** In Progress

---

## Quick Navigation

| Document | Purpose |
|----------|---------|
| [system-architecture.md](./system-architecture.md) | System design, data flows, infrastructure |
| [code-standards.md](./code-standards.md) | Naming conventions, patterns, file structure |
| [project-overview-pdr.md](./project-overview-pdr.md) | Requirements, acceptance criteria, roadmap |
| [project-changelog.md](./project-changelog.md) | Phase-by-phase changes and versioning |
| [api-reference.md](./api-reference.md) | Complete API endpoint documentation |

---

## Codebase Structure

```
src/
├── app/
│   ├── api/
│   │   ├── cma/                    # Content Management API (12 routes)
│   │   │   ├── accounts/
│   │   │   ├── calendar/
│   │   │   ├── media/
│   │   │   ├── org/
│   │   │   ├── posts/[id]/{publish,schedule}/
│   │   │   └── preview/
│   │   ├── classroom/              # Classroom API (12 routes)
│   │   │   ├── route.ts
│   │   │   ├── [id]/
│   │   │   │   ├── route.ts
│   │   │   │   ├── assignments/[aid]/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── submit/
│   │   │   │   │   ├── ai-feedback/
│   │   │   │   │   └── submissions/[sid]/feedback/
│   │   │   │   ├── members/[uid]/
│   │   │   │   ├── dashboard/
│   │   │   │   └── export/
│   │   │   └── join/
│   │   ├── lms/                    # Learning Management API (15 routes)
│   │   │   ├── courses/
│   │   │   │   └── [slug]/
│   │   │   │       ├── route.ts
│   │   │   │       ├── sections/[id]/
│   │   │   │       ├── lessons/[id]/
│   │   │   │       ├── enroll/
│   │   │   │       └── progress/
│   │   │   ├── lessons/[id]/progress/
│   │   │   └── ai/
│   │   │       ├── generate-quiz/
│   │   │       ├── summarize/
│   │   │       └── review-code/
│   │   └── integration/
│   │       └── classroom-courses/
│   ├── classroom/                  # Classroom UI (4 pages)
│   │   ├── page.tsx
│   │   ├── [id]/
│   │   │   ├── page.tsx
│   │   │   ├── dashboard/
│   │   │   └── assignments/[aid]/
│   ├── lms/                        # LMS UI (5 pages)
│   │   ├── page.tsx
│   │   ├── courses/
│   │   │   ├── page.tsx
│   │   │   ├── [slug]/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── learn/[lessonId]/
│   │   │   │   └── builder/
│   ├── admin/cma/
│   │   ├── dashboard/
│   │   ├── calendar/
│   │   └── posts/[id]/
│   └── layout.tsx
├── components/
│   ├── cma/                        # CMA components (Phase 3)
│   ├── classroom/                  # Classroom UI (Phase 4)
│   ├── lms/                        # LMS UI (Phase 4)
│   └── ui/                         # Generic UI
├── lib/
│   ├── prisma-client.ts
│   ├── cma/
│   │   ├── services/
│   │   │   ├── pgboss-service.ts
│   │   │   ├── scheduling-service.ts
│   │   │   ├── publishing-service.ts
│   │   │   ├── post-service.ts
│   │   │   └── org-auth.ts
│   │   ├── adapters/
│   │   ├── hooks/
│   │   │   └── use-cma-api.ts
│   │   └── utils/
│   ├── classroom/                  # Classroom services (Phase 4)
│   │   ├── services/
│   │   │   ├── classroom-service.ts
│   │   │   ├── assignment-service.ts
│   │   │   ├── feedback-service.ts
│   │   │   └── classroom-auth.ts
│   │   ├── hooks/
│   │   │   └── use-classroom-api.ts
│   │   └── utils/
│   ├── lms/                        # LMS services (Phase 4)
│   │   ├── services/
│   │   │   ├── course-service.ts
│   │   │   ├── section-lesson-service.ts
│   │   │   ├── enrollment-service.ts
│   │   │   ├── lms-auth.ts
│   │   │   ├── ai-helper-service.ts
│   │   │   ├── lms-pgboss-service.ts
│   │   │   └── lms-worker-handlers.ts
│   │   ├── hooks/
│   │   │   └── use-lms-api.ts
│   │   └── utils/
│   ├── prompts/                    # AI prompts (Phase 4)
│   │   ├── clm-quiz-generator-prompt.ts
│   │   ├── clm-content-summarizer-prompt.ts
│   │   ├── clm-code-reviewer-prompt.ts
│   │   └── clm-submission-feedback-prompt.ts
│   └── utils/
├── instrumentation.ts              # pg-boss init (CMA + LMS workers)
├── middleware.ts
├── types/
└── prisma/
    └── schema.prisma               # 26 models (Phase 3-7)
```

---

## Key Files by Feature

### Scheduled Publishing (Phase 3)

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/cma/services/pgboss-service.ts` | 95 | Job queue lifecycle, singleton pattern |
| `src/lib/cma/services/scheduling-service.ts` | 160 | Schedule/reschedule/cancel logic, compensation |
| `src/app/api/cma/posts/[id]/schedule/route.ts` | ~80 | API handlers for POST/PATCH/DELETE schedule |
| `src/app/api/cma/calendar/route.ts` | ~40 | GET /api/cma/calendar endpoint |
| `src/components/cma/cma-calendar-event.tsx` | ~150 | Calendar event widget + reschedule modal |
| `src/components/cma/calendar-widget.tsx` | ~200 | Full calendar UI (@fullcalendar integration) |
| `src/instrumentation.ts` | 22 | Next.js hook to register pg-boss worker |

### Core Features (Phase 1-2)

| File | Lines | Purpose |
|------|-------|---------|
| `src/lib/cma/services/publishing-service.ts` | ~120 | Immediate publish orchestration |
| `src/lib/cma/services/post-service.ts` | ~100 | Post CRUD operations |
| `src/app/api/cma/posts/route.ts` | ~60 | GET/POST /api/cma/posts |
| `src/app/api/cma/posts/[id]/route.ts` | ~80 | GET/PATCH/DELETE /api/cma/posts/[id] |
| `src/app/api/cma/posts/[id]/publish/route.ts` | ~60 | POST /api/cma/posts/[id]/publish |

---

## Technology Stack

### Runtime & Framework
- **Node.js** 18+ (Next.js 14.2.35 requirement)
- **Next.js** 14.2.35 (App Router)
- **React** 18 (hooks + functional components)
- **TypeScript** 5 (strict mode)

### Database & ORM
- **PostgreSQL** 14+ (primary DB)
- **Prisma** 5.22.0 (ORM + migrations)

### Job Queue & Scheduling
- **pg-boss** 12.14.0 (Postgres-backed job queue)
  - 3 retries, 30s delay, exponential backoff
  - 15min max processing time
  - Singleton key: postId (prevent duplicates)

### UI & Styling
- **React** 18 with hooks
- **Tailwind CSS** 3.4.1
- **@fullcalendar/react** 6.1.20 (calendar widget)
- **@fullcalendar/daygrid** 6.1.20
- **@fullcalendar/interaction** 6.1.20
- **@uiw/react-md-editor** 4.0.11 (markdown editor)
- **@blocknote/core** 0.47.3 (block editor logic)
- **@blocknote/react** 0.47.3 (React wrapper)
- **@blocknote/shadcn** 0.47.3 (shadcn/ui theme)
- **@base-ui/react** 1.3.0 (shadcn v4 dependency)
- **lucide-react** 0.577.0 (icons)

### Date Handling
- **date-fns-tz** 3.2.0 (timezone-aware scheduling)

### Authentication
- **NextAuth.js** 4.24.13 (session-based auth)

### Content Processing
- **unified** 11.0.5 (markdown AST)
- **remark-parse** 11.0.0
- **remark-rehype** 11.1.2 (markdown → HTML AST)
- **rehype-parse** 9.0.1 (HTML → AST, Phase 7)
- **rehype-raw** 7.0.0 (raw HTML handling, Phase 7)
- **rehype-sanitize** 6.0.0 (XSS prevention, Phase 7)
- **rehype-stringify** 10.0.1 (AST → HTML, Phase 7)

### Testing & Linting
- **Vitest** 4.1.0 (unit/integration tests)
- **ESLint** 8 + next/lint

### Build Tools
- **PostCSS** 8
- **TypeScript** 5

---

## Data Model (Prisma) — 26 Models (Phase 3-7)

### Phase 3: Content Management (3 models)

**CmaPost** — Social media post
- id, orgId, title, content (Markdown), status, scheduledAt, pgBossJobId, createdAt, updatedAt
- Indexes: `[orgId]`, `[scheduledAt]`

**CmaPlatformAccount** — Linked platform (WordPress, Medium, etc.)
- id, orgId, platform, siteUrl, credentials (encrypted), isActive, lastVerified, createdAt, updatedAt
- Indexes: `[orgId]`

**CmaPostPlatform** — Post ↔ Platform link
- id, postId, accountId, publishedUrl, publishedId, createdAt, updatedAt
- Unique: `[postId, accountId]`

### Phase 4: Classroom System (4 models)

**Classroom** — Learning space
- id, orgId, instructorId (userId), name, description, joinCode (unique 6-char), isActive, createdAt, updatedAt
- Indexes: `[orgId]`, `[instructorId]`

**ClassroomMember** — Student/instructor roster
- id, userId, classroomId, role ("student" | "instructor"), joinedAt
- Unique: `[userId, classroomId]`
- Indexes: `[classroomId]`

**Assignment** — Classroom task
- id, classroomId, title, description, jobDescription, dueDate, type, status, linkedCourseId, createdById, createdAt, updatedAt
- Indexes: `[classroomId]`, `[dueDate]`

**Submission** — Student work
- id, assignmentId, studentId (userId), content, score, status, submittedAt, createdAt, updatedAt
- Unique: `[assignmentId, studentId]`
- Indexes: `[assignmentId]`

**Feedback** — Instructor/AI feedback
- id, submissionId, instructorId (userId), comment, aiFeedback (JSON), score, createdAt, updatedAt
- Indexes: `[submissionId]`

### Phase 4: Learning Management System (10 models)

**Course** — Published learning course
- id, orgId, instructorId (userId), title, slug (unique), description, thumbnailUrl, level, status, estimatedHours, tags (JSON array), createdAt, updatedAt
- Indexes: `[orgId]`, `[slug]`

**Section** — Course chapter
- id, courseId, title, description, order, isPublished, createdAt, updatedAt
- Indexes: `[courseId]`

**Lesson** — Learning unit
- id, sectionId, title, type ("video" | "article" | "quiz"), content (Markdown), videoUrl, order, estimatedMinutes, isPublished, createdAt, updatedAt
- Indexes: `[sectionId]`

**LessonProgress** — Student lesson completion
- id, lessonId, userId, status ("not_started" | "in_progress" | "completed"), completedAt, timeSpent (seconds), createdAt, updatedAt
- Unique: `[lessonId, userId]`
- Indexes: `[lessonId]`, `[userId]`

**CourseEnrollment** — Student enrollment
- id, courseId, userId, progress (0-100), enrolledAt, completedAt, createdAt, updatedAt
- Unique: `[courseId, userId]`
- Indexes: `[courseId]`, `[userId]`

### Auth Models (5 models)

**User, Organization, Account, Session, VerificationToken** — NextAuth.js standard schema

---

## Core Business Logic Flows

### 1. Schedule Post (POST /api/cma/posts/[id]/schedule)

```
User selects schedule time
  ↓
API validates: time > now, account linked, post state
  ↓
schedulePost() in scheduling-service.ts
  - Optimistic lock: update status="scheduled" atomically
  - If lock fails, throw error (post not schedulable)
  ↓
enqueueScheduledPublish() in pgboss-service.ts
  - Get pg-boss singleton
  - Send job to queue: startAfter=scheduledAt, singletonKey=postId
  - Return jobId
  ↓
Store pgBossJobId in DB
  ↓
Return 201 with { pgBossJobId }

[If enqueue fails]:
  - Compensate: revert status="draft", scheduledAt=null
  - Re-throw error
```

### 2. Reschedule Post (PATCH /api/cma/posts/[id]/schedule)

```
User picks new time
  ↓
reschedulePost() validates: post in "scheduled" state, new time > now
  ↓
cancelScheduledJob(pgBossJobId) — stop old pg-boss job
  ↓
enqueueScheduledPublish(..., newScheduledAt) — queue new job
  ↓
Update DB: scheduledAt, pgBossJobId
  ↓
Return 200

[If enqueue fails]:
  - Compensate: revert scheduledAt to original, pgBossJobId to original
```

### 3. Job Execution (pg-boss Worker)

```
At scheduledAt time, pg-boss fires job
  ↓
registerScheduledPublishWorker() calls handler:
  - handleScheduledPublish() in scheduling-service.ts
  - Load post from DB, verify status="scheduled"
  ↓
Call publishPost() (same as immediate publish)
  - Call platform adapters (WordPress, Medium, etc.)
  - Concurrently post to all linked accounts
  - Collect results (URLs, IDs)
  ↓
Update post: status="published" (or "failed" if all fail)
  - Store publishedUrl, publishedId on CmaPostPlatform
  ↓
Job marked complete by pg-boss

[If failures]:
  - Job retries: 30s → 60s → 120s
  - After 3 attempts, job exhausted (status="failed")
  - Post remains "scheduled" until manual intervention
```

### 4. Cancel Schedule (DELETE /api/cma/posts/[id]/schedule)

```
User clicks cancel
  ↓
cancelScheduledPost() validates: post in "scheduled" state
  ↓
cancelScheduledJob(pgBossJobId)
  ↓
Update post: status="draft", scheduledAt=null, pgBossJobId=null
  ↓
Return 200
```

---

## Multi-Tenancy Pattern

**Rule:** Every query includes `orgId` from authenticated session.

```typescript
// ✅ Correct: Always scope by orgId
const post = await prisma.cmaPost.findFirst({
  where: { id: postId, orgId }
});

// ❌ Wrong: Data leak (no orgId scope)
const post = await prisma.cmaPost.findUnique({
  where: { id: postId }
});
```

**Enforcement:**
- Middleware validates `session.org.id`
- Every API route gets `orgId` from session (never from request body)
- Prisma queries fail if orgId missing (logged, not silently skipped)

---

## Error Handling Pattern

**Service Layer:** Throw descriptive errors with context

```typescript
if (scheduledAt <= new Date()) {
  throw new Error("Scheduled time must be in the future");
}

if (!account) {
  throw new Error("Platform account not found or inactive");
}
```

**API Routes:** Catch and return structured responses

```typescript
try {
  // business logic
  return NextResponse.json({ data }, { status: 201 });
} catch (err) {
  console.error("[api/cma/posts/schedule]", err);
  return NextResponse.json(
    { error: "Failed to schedule post", details: (err as Error).message },
    { status: 500 }
  );
}
```

---

## Testing Coverage

### Unit Tests
- ✅ `schedulePost()` — validates time, enqueues job
- ✅ `reschedulePost()` — cancels old, enqueues new
- ✅ `cancelScheduledPost()` — reverts status, cleans jobId
- ✅ `handleScheduledPublish()` — publishes at scheduled time
- ✅ Timezone edge cases (DST, different zones)

### Integration Tests
- ✅ Schedule → publish flow (manual job trigger)
- ✅ Calendar API returns scheduled posts
- ✅ Org isolation (cross-org access blocked)

### Manual Tests
- ✅ UI: calendar displays scheduled posts
- ✅ UI: reschedule modal works
- ✅ Queue: pg-boss jobs visible in DB table
- ✅ Job execution: posts publish at scheduled time

---

## Environment Configuration

### Required Variables

```
DATABASE_URL=postgresql://user:pass@host:5432/clm
NEXTAUTH_SECRET=<random-secret-for-sessions>
NEXTAUTH_URL=http://localhost:3000
NEXT_RUNTIME=nodejs
```

### Optional Variables

```
NODE_ENV=development|production
LOG_LEVEL=info|debug
```

---

## Startup Sequence

1. **Next.js starts**
   ```
   npm run dev
   ```

2. **Instrumentation hook runs** (server-side only)
   ```typescript
   // src/instrumentation.ts
   if (process.env.NEXT_RUNTIME === "nodejs") {
     await registerScheduledPublishWorker(handleScheduledPublish);
   }
   ```

3. **pg-boss worker initializes**
   - Connects to PostgreSQL
   - Creates queue if not exists
   - Begins polling for jobs

4. **API routes ready**
   - All `/api/cma/*` endpoints available
   - Admin UI pages available at `/admin/cma/*`

---

## Known Limitations & Future Work

### Phase 3 Limitations
- No audit log for job executions
- No job replay capability (manual requeue required)
- Calendar pagination needed for 10k+ posts
- Single database (no sharding)

### Phase 4+ Roadmap
- Approval workflow (pending-approval status)
- Bulk scheduling (CSV import)
- Analytics dashboard
- Content templates
- Multi-language support
- Webhooks for platform events
- A/B testing variants

---

## Debugging & Observability

### Log Prefixes
- `[instrumentation]` — Startup events
- `[pg-boss]` — Job queue operations
- `[scheduling]` — Scheduling service logic
- `[api/cma/...]` — API route execution
- `[wordpress-adapter]` — Platform-specific errors

### Monitoring Queries

**View pg-boss jobs:**
```sql
SELECT id, name, state, started_on, completed_on, error
FROM pgboss.job
WHERE name = 'cma-scheduled-publish'
ORDER BY created_on DESC
LIMIT 100;
```

**Check post scheduling status:**
```sql
SELECT id, title, status, scheduled_at, pg_boss_job_id, updated_at
FROM cma_posts
WHERE status = 'scheduled'
ORDER BY scheduled_at ASC;
```

**Monitor job failures:**
```sql
SELECT pg_boss_job_id, error, count(*)
FROM cma_posts
WHERE status = 'failed'
GROUP BY pg_boss_job_id;
```

---

## Build & Deployment

### Local Development
```bash
npm install              # Install dependencies
npm run dev              # Dev server with hot reload
npm run test             # Run tests
npm run lint             # Lint code
```

### Production Deployment
```bash
# Server: 72.60.211.23 | Path: /opt/tonytechlab/clm/
# Containers: clm.tonytechlab.com (app:3001), clm-db (postgres:5433)

# Deploy update:
ssh root@72.60.211.23
cd /opt/tonytechlab/clm
git pull
docker compose up -d --build

# View logs:
docker logs -f clm.tonytechlab.com
docker logs -f clm-db
```

### Docker Compose Services
| Service | Container | Port | Image |
|---------|-----------|------|-------|
| clm | clm.tonytechlab.com | 3001→3000 | clm-clm (multi-stage build) |
| clm-db | clm-db | 5433→5432 | postgres:16-alpine |

### Database Migration
```bash
# Migrations run automatically on container start via docker-entrypoint.sh
# Manual migration (dev):
npx prisma migrate dev --name description
# Manual migration (prod):
npx prisma migrate deploy
```

---

## File Statistics

| Category | Count | Total Lines |
|----------|-------|------------|
| Services | 5 | ~700 |
| API Routes | 8 | ~400 |
| Components | 15+ | ~2000 |
| Type definitions | 10+ | ~200 |
| Tests | 20+ | ~800 |
| Docs | 5 | ~2500 |

---

## Related Documentation

- [system-architecture.md](./system-architecture.md) — Full system design
- [code-standards.md](./code-standards.md) — Code conventions and patterns
- [project-overview-pdr.md](./project-overview-pdr.md) — Requirements and roadmap
- [project-changelog.md](./project-changelog.md) — Version history
- [api-reference.md](./api-reference.md) — API endpoint docs

---

## Phase 4 Module Summaries

### Classroom Module

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| `classroom-service.ts` | `lib/classroom/services/` | CRUD, join by code, member management | Complete |
| `assignment-service.ts` | `lib/classroom/services/` | Assignment lifecycle, submission tracking | Complete |
| `feedback-service.ts` | `lib/classroom/services/` | Instructor feedback, dashboard analytics, CSV export | Complete |
| `classroom-auth.ts` | `lib/classroom/services/` | Member role validation (student vs instructor) | Complete |
| `use-classroom-api.ts` | `lib/classroom/hooks/` | Client-side API hook with loading/error states | Complete |
| `api/classroom/*` | `app/api/classroom/` | 12 API routes (see system-architecture.md) | Complete |

### LMS Module

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| `course-service.ts` | `lib/lms/services/` | Course CRUD, catalog, publish/archive | Complete |
| `section-lesson-service.ts` | `lib/lms/services/` | Section/lesson CRUD, reordering, visibility | Complete |
| `enrollment-service.ts` | `lib/lms/services/` | Student enrollment, progress tracking, completion | Complete |
| `lms-auth.ts` | `lib/lms/services/` | Student access control, completion verification | Complete |
| `ai-helper-service.ts` | `lib/lms/services/` | AI calls with rate limiting + quota management | Complete |
| `lms-pgboss-service.ts` | `lib/lms/services/` | Job queue for async quiz gen + batch feedback | Complete |
| `lms-worker-handlers.ts` | `lib/lms/services/` | Job handlers (quiz generation, batch feedback) | Complete |
| `use-lms-api.ts` | `lib/lms/hooks/` | Client-side API hook | Complete |
| `api/lms/*` | `app/api/lms/` | 15 API routes (12 LMS + 3 AI) | Complete |

### AI Integration

| Prompt | Location | Purpose | Status |
|--------|----------|---------|--------|
| `clm-quiz-generator-prompt.ts` | `lib/prompts/` | Generate MCQs from lesson content | Complete |
| `clm-content-summarizer-prompt.ts` | `lib/prompts/` | Multi-paragraph summary of lesson | Complete |
| `clm-code-reviewer-prompt.ts` | `lib/prompts/` | Code submission scoring + feedback | Complete |
| `clm-submission-feedback-prompt.ts` | `lib/prompts/` | Personalized assignment feedback | Complete |

### Integration Module

| Route | Purpose | Status |
|-------|---------|--------|
| `POST /api/integration/classroom-courses` | Link course to classroom assignment | Complete |

### Phase 7: Block Editor, Templates & Image System

| Component | Location | Purpose | Status |
|-----------|----------|---------|--------|
| `cma-block-editor.tsx` | `components/cma/` | BlockNote editor (Notion-like blocks) | Complete |
| `cma-template-picker.tsx` | `components/cma/` | Template selection modal with gallery | Complete |
| `cma-featured-image-picker.tsx` | `components/cma/` | Image picker (upload/unsplash/AI) | Complete |
| `cma-ai-image-generator-panel.tsx` | `components/cma/` | DALL-E 3 prompt UI with preview | Complete |
| `cma-styled-preview.tsx` | `components/cma/` | Theme preview (default/editorial) | Complete |
| `template-service.ts` | `lib/cma/services/` | Template CRUD, seeding, validation | Complete |
| `image-generation-service.ts` | `lib/cma/services/` | DALL-E 3 integration + rate limiting | Complete |
| `unsplash-service.ts` | `lib/cma/services/` | Unsplash API (search, download) | Complete |
| `template-definitions.ts` | `lib/cma/templates/` | Pre-built template block definitions | Complete |
| `seed-system-templates.ts` | `lib/cma/templates/` | Seeder for system templates | Complete |
| `/api/cma/templates` | `app/api/cma/` | GET/POST templates | Complete |
| `/api/cma/templates/[id]` | `app/api/cma/` | GET/PUT/DELETE template | Complete |
| `/api/cma/images/*` | `app/api/cma/` | Unsplash search, download, DALL-E gen | Complete |
| `/admin/cma/templates` | `app/admin/cma/` | Template gallery page | Complete |
| `/admin/cma/composer` | `app/admin/cma/` | Redesigned composer with block editor | Complete |

### New shadcn/ui Components (Phase 7)

- `dialog` — Modal for templates, image generation
- `tabs` — Content/Images/Settings tabs
- `select` — Theme dropdown selector
- `sheet` — Collapsible sidebar
- `separator` — Visual dividers
- `skeleton` — Loading states
- `input` / `textarea` — Form controls
- `tooltip` — Feature hints

---

## Version History

| Version | Date | Status | Phase |
|---------|------|--------|-------|
| 0.1.0-phase7 | 2026-03-28 | In Progress | Block Editor, Templates, Image System |
| 0.1.0-phase4 | 2026-03-28 | Complete | Classroom + LMS + AI |
| 0.1.0-phase3 | 2026-03-28 | Complete | Scheduled Publishing |
| 0.1.0-phase2 | [TBD] | Complete | Platform Publishing |
| 0.1.0-phase1 | [TBD] | Complete | Post CRUD |

See [project-changelog.md](./project-changelog.md) for detailed phase notes.

