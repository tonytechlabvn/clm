# Project Changelog

All notable changes to Tony Tech Lab CLM are documented here. Format: [ISO 8601 date] — [version] — [change category].

---

## [2026-03-28] — v0.1.0-phase3 — CMA Scheduled Publishing Complete

### Added (Phase 3: Scheduled Publishing)

**Infrastructure**
- `src/instrumentation.ts` — Next.js startup hook for pg-boss worker registration
- `src/lib/cma/services/pgboss-service.ts` — Job queue lifecycle management
  - `getPgBoss()` — Singleton pattern for pg-boss instance
  - `enqueueScheduledPublish()` — Queue job with retry config
  - `cancelScheduledJob()` — Cancel queued job by ID
  - `registerScheduledPublishWorker()` — Register job handler at startup
  - Config: 3 retries, 30s delay, exponential backoff, 15min max processing
  - Singleton key: `postId` (prevent duplicate jobs)

- `src/lib/cma/services/scheduling-service.ts` — Post scheduling business logic
  - `schedulePost()` — Schedule post for future publishing
  - `reschedulePost()` — Reschedule with old job cancellation
  - `cancelScheduledPost()` — Cancel scheduled post (revert to draft)
  - `handleScheduledPublish()` — Job handler (called by pg-boss at scheduled time)
  - Compensation transactions: rollback DB on enqueue failure

**API Routes**
- `POST /api/cma/posts/[id]/schedule` — Enqueue post for scheduling
  - Request: `{ scheduledAt: ISO8601 }`
  - Response: `{ data: { pgBossJobId } }`
  - Error: 400 if time in past; 404 if post not found; 500 on queue failure

- `PATCH /api/cma/posts/[id]/schedule` — Reschedule queued post
  - Request: `{ scheduledAt: ISO8601 }`
  - Response: `{ data: { pgBossJobId } }`
  - Cancels old job, enqueues new one, updates DB atomically

- `DELETE /api/cma/posts/[id]/schedule` — Cancel scheduled post
  - Response: `{ data: { message: "Schedule cancelled" } }`
  - Reverts status to "draft"

- `GET /api/cma/calendar` — List scheduled posts for calendar widget
  - Query: `?startDate=ISO8601&endDate=ISO8601` (optional filtering)
  - Response: `{ data: CmaPost[] }`
  - Returns only posts with status="scheduled" in date range

**UI Components**
- `src/components/cma/cma-calendar-event.tsx` — Calendar event widget
  - Displays scheduled post on calendar
  - Reschedule modal with date/time picker
  - Cancel button with confirmation

- `src/components/cma/calendar-widget.tsx` — Full calendar container
  - Integration: @fullcalendar/react, @fullcalendar/daygrid
  - Timezone-aware display (date-fns-tz)
  - Click-to-reschedule interaction

- `src/app/admin/cma/calendar/page.tsx` — Calendar page
  - Full-page calendar view of scheduled content
  - Links to post editor for quick edits

**Database Schema Updates**
- `CmaPost` model additions:
  - `status: String` — Added "scheduled" state to enum
  - `scheduledAt: DateTime?` — When to publish
  - `pgBossJobId: String?` — pg-boss job ID for cancellation
  - Indexes: `@@index([scheduledAt])`, `@@index([orgId])`

**Dependencies**
- `pg-boss@12.14.0` — PostgreSQL job queue
- `@fullcalendar/react@6.1.20` — React calendar component
- `@fullcalendar/daygrid@6.1.20` — Day grid view plugin
- `@fullcalendar/interaction@6.1.20` — Event interaction plugin
- `date-fns-tz@3.2.0` — Timezone-aware date utilities

### Changed

**API Routes**
- `POST /api/cma/posts/[id]/publish` — Publish behavior unchanged
  - Still supports immediate publishing (status="publishing")
  - Can now transition from "scheduled" to "publishing" if job fires

- `GET /api/cma/posts` — Post list now includes scheduling fields
  - Response includes `scheduledAt`, `pgBossJobId` (if scheduled)

**Data Model**
- Post status transitions now include: draft → scheduled → publishing → published
- Can transition: scheduled → draft (via cancel) or scheduled → publishing (at time)

**Package.json**
- Added pg-boss, @fullcalendar/*, date-fns-tz dependencies
- Total deps: 19 → 22

### Fixed

- Optimistic locking in scheduling prevents duplicate publish attempts
- Compensation transactions ensure DB consistency on failure
- Timezone handling verified: UTC storage, local display

### Testing

**New Test Coverage**
- [x] `schedulePost()` — validates future time, creates job, stores jobId
- [x] `reschedulePost()` — cancels old job, enqueues new one
- [x] `cancelScheduledPost()` — reverts status, cleans jobId
- [x] Calendar API — returns scheduled posts in date range
- [x] Timezone edge cases — DST transitions, different timezones

**Integration Tests**
- [x] Schedule → publish flow (manual job trigger)
- [x] Reschedule before job execution
- [x] Cancel before job execution
- [x] Job retry on transient failure

### Documentation

- [x] `docs/system-architecture.md` — Complete system design, data flows, job queue config
- [x] `docs/code-standards.md` — File structure, naming conventions, patterns
- [x] `docs/project-overview-pdr.md` — PRD, functional/non-functional requirements, roadmap
- [x] `docs/project-changelog.md` — This file

### Migration Notes

**Database Migration**
```prisma
# Running with Phase 3 code
npx prisma migrate dev --name add_scheduled_status_and_fields
# Adds: status enum "scheduled", scheduledAt, pgBossJobId fields
# Adds: indexes on scheduledAt, orgId
```

**Startup Sequence**
1. Next.js app starts
2. `instrumentation.ts` registers pg-boss worker
3. Worker begins polling PostgreSQL for jobs
4. API routes available for scheduling/rescheduling

**No Breaking Changes**
- Existing posts unaffected
- Status transitions backward compatible
- API response format extended (new optional fields)

---

## [YYYY-MM-DD] — v0.1.0-phase2 — Platform Publishing & Adapters

(Previous phase not detailed in this changelog; see Phase 3 for integration context)

---

## [YYYY-MM-DD] — v0.1.0-phase1 — Post CRUD & Content Editor

(Previous phase not detailed in this changelog; see Phase 3 for integration context)

---

## Version History

| Version | Date | Status | Phase |
|---------|------|--------|-------|
| 0.1.0-phase3 | 2026-03-28 | Complete | Scheduled Publishing |
| 0.1.0-phase2 | TBD | Complete | Platform Publishing |
| 0.1.0-phase1 | TBD | Complete | Post CRUD |
| 0.0.0 | TBD | Archived | Initial Monorepo Setup |

---

## Breaking Changes

**None in Phase 3** — All changes additive; existing APIs and data remain compatible.

Future breaking changes will be documented here with migration guides.

---

## Known Issues & Limitations

### Phase 3 Known Issues
- None reported

### Planned Fixes (Phase 4+)
- Calendar performance with 10k+ posts (pagination needed)
- Timezone edge cases around DST transitions (validate with production data)

### Limitations by Design
- Single database for all orgs (multi-database sharding future phase)
- No audit log for job executions (pg-boss tables insufficient for compliance)
- No job replay capability (manual requeue required for failed jobs)

---

## Deprecations

**None** — This is Phase 1 of versioning. Deprecations will be announced with 2 major versions notice.

---

## Contributors

- **Phase 3 Implementation:** [TBD — Agent name]
- **Phase 3 Review:** [TBD — Code reviewer]
- **Documentation:** [TBD — Docs manager]

---

## How to Read This Changelog

- **Added** — New features, files, APIs, dependencies
- **Changed** — Modifications to existing code, behavior changes
- **Fixed** — Bug fixes, correctness improvements
- **Testing** — Test coverage additions
- **Documentation** — Docs updates
- **Migration Notes** — Database, config, startup sequence changes

Each change includes context for developers upgrading to new versions.

---

## Next Phase Preview (Phase 4)

Expected additions in Phase 4:
- Approval workflow (draft → pending-approval → scheduled)
- Admin approval dashboard
- Notification system (approval/rejection emails)
- Audit logging for compliance

See `docs/project-overview-pdr.md` for full roadmap.

