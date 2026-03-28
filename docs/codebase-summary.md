# Codebase Summary — CMA Phase 3

**Project:** Tony Tech Lab Core Learning Management (CLM)
**Module:** Content Management Application (CMA)
**Phase:** 3 (Scheduled Publishing)
**Last Updated:** 2026-03-28
**Status:** Complete

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
│   ├── api/cma/
│   │   ├── accounts/           # Platform account linking
│   │   ├── calendar/           # GET /api/cma/calendar
│   │   ├── media/              # Asset upload
│   │   ├── org/                # Org settings
│   │   ├── posts/
│   │   │   ├── [id]/
│   │   │   │   ├── publish/    # POST /api/cma/posts/[id]/publish
│   │   │   │   ├── schedule/   # POST/PATCH/DELETE /api/cma/posts/[id]/schedule
│   │   │   │   └── route.ts    # GET/PATCH/DELETE /api/cma/posts/[id]
│   │   │   └── route.ts        # GET/POST /api/cma/posts
│   │   └── preview/            # Content preview endpoint
│   ├── admin/cma/
│   │   ├── dashboard/          # Post management UI
│   │   ├── calendar/           # Calendar view page
│   │   └── posts/[id]/         # Post editor page
│   └── layout.tsx              # Root layout
├── components/cma/
│   ├── post-editor.tsx         # Markdown editor + platform selector
│   ├── cma-calendar-event.tsx  # Calendar event widget
│   ├── calendar-widget.tsx     # Full calendar container
│   └── [other CMA components]
├── lib/cma/
│   ├── services/
│   │   ├── pgboss-service.ts   # Job queue lifecycle (212 lines)
│   │   ├── scheduling-service.ts # Post scheduling logic (160 lines)
│   │   ├── publishing-service.ts # Immediate publish logic
│   │   ├── post-service.ts     # Post CRUD operations
│   │   └── org-auth.ts         # Multi-tenant org validation
│   ├── adapters/
│   │   ├── adapter-registry.ts # Adapter registration
│   │   ├── platform-adapter.ts # Base adapter interface
│   │   └── wordpress-adapter.ts # WordPress implementation
│   ├── hooks/
│   │   └── use-cma-org.ts      # Org context hook
│   ├── use-cma-api.ts          # API client hook
│   ├── crypto-utils.ts         # Encryption/hashing utilities
│   ├── markdown-to-html.ts     # Content rendering
│   └── [other utilities]
├── instrumentation.ts          # Next.js startup hook (pg-boss init)
├── middleware.ts               # Auth + org context validation
└── types/                      # TypeScript definitions
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
- **lucide-react** 0.577.0 (icons)

### Date Handling
- **date-fns-tz** 3.2.0 (timezone-aware scheduling)

### Authentication
- **NextAuth.js** 4.24.13 (session-based auth)

### Content Processing
- **unified** 11.0.5 (markdown AST)
- **remark-parse** 11.0.0
- **remark-rehype** 11.1.2
- **rehype-sanitize** 6.0.0
- **rehype-stringify** 10.0.1
- **rehype-raw** 7.0.0

### Testing & Linting
- **Vitest** 4.1.0 (unit/integration tests)
- **ESLint** 8 + next/lint

### Build Tools
- **PostCSS** 8
- **TypeScript** 5

---

## Data Model (Prisma)

### CmaPost (Primary Post Entity)

```prisma
model CmaPost {
  id              String   @id @default(cuid())
  orgId           String   // Multi-tenant scoping
  title           String
  content         String   // Markdown
  contentHtml     String?  // Rendered HTML
  description     String?
  status          String   @default("draft")
  // Status values: "draft" | "approved" | "scheduled" | "publishing" | "published" | "failed"

  // Scheduling fields (Phase 3)
  scheduledAt     DateTime?        // When to publish
  pgBossJobId     String?          // pg-boss job ID for cancellation

  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  // Relations
  platforms       CmaPostPlatform[]

  // Indexes
  @@index([orgId])
  @@index([scheduledAt])
  @@map("cma_posts")
}
```

### CmaPlatformAccount (Linked Platform Account)

```prisma
model CmaPlatformAccount {
  id              String   @id @default(cuid())
  orgId           String   // Multi-tenant scoping
  platform        String   // "wordpress", "medium", "substack"
  siteUrl         String   // Platform URL
  credentials     String   // Encrypted auth token
  isActive        Boolean  @default(true)
  lastVerified    DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  posts           CmaPostPlatform[]

  @@index([orgId])
  @@map("cma_platform_accounts")
}
```

### CmaPostPlatform (Post ↔ Platform Link)

```prisma
model CmaPostPlatform {
  id              String   @id @default(cuid())
  postId          String
  accountId       String
  publishedUrl    String?  // URL on platform after publish
  publishedId     String?  // Platform-specific post ID
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // Relations
  post            CmaPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  account         CmaPlatformAccount @relation(fields: [accountId], references: [id])

  @@unique([postId, accountId])
  @@map("cma_post_platforms")
}
```

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
# Install dependencies
npm install

# Run dev server (with hot reload)
npm run dev

# Run tests
npm run test
npm run test:watch

# Lint code
npm run lint
```

### Production Build
```bash
# Compile TypeScript + Next.js
npm run build

# Start production server
npm start
```

### Database Migration
```bash
# Apply Prisma migrations
npx prisma migrate deploy

# Reset DB (dev only)
npx prisma migrate reset
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

## Version History

| Version | Date | Status |
|---------|------|--------|
| 0.1.0-phase3 | 2026-03-28 | Complete (this version) |
| 0.1.0-phase2 | [TBD] | Complete |
| 0.1.0-phase1 | [TBD] | Complete |

See [project-changelog.md](./project-changelog.md) for detailed phase notes.

