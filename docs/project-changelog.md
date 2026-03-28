# Project Changelog

All notable changes to Tony Tech Lab CLM are documented here. Format: [ISO 8601 date] — [version] — [change category].

---

## [2026-03-28] — v0.1.0-phase4 — Classroom + LMS + AI Integration Complete

### Added (Phase 4: Classroom System + Learning Management + AI)

**Database Models (10 new, 22 total)**
- `Classroom` — Org's learning space (orgId, instructorId, name, description, joinCode 6-char unique, isActive)
- `ClassroomMember` — Student/instructor roster (userId, classroomId, role: "student"|"instructor")
- `Assignment` — Classroom task (classroomId, title, description, jobDescription, dueDate, type, status, linkedCourseId, createdById)
- `Submission` — Student work submission (assignmentId, studentId, content, score, status, submittedAt)
- `Feedback` — Instructor/AI feedback (submissionId, instructorId, comment, score, aiFeedback JSON)
- `Course` — Published learning course (orgId, instructorId, title, slug unique, description, thumbnailUrl, level, status, estimatedHours, tags[])
- `Section` — Course chapter (courseId, title, description, order, isPublished)
- `Lesson` — Learning unit (sectionId, title, type: "video"|"article"|"quiz", content, videoUrl, order, estimatedMinutes, isPublished)
- `LessonProgress` — Student lesson completion (lessonId, userId, status: "not_started"|"in_progress"|"completed", completedAt, timeSpent)
- `CourseEnrollment` — Student enrollment (courseId, userId, progress 0-100, enrolledAt, completedAt)

**Classroom API Routes (12)**
- POST/GET `/api/classroom` — Create classroom + list instructor's classrooms
- GET/PATCH/DELETE `/api/classroom/[id]` — Detail, update, archive
- POST `/api/classroom/join` — Join by code
- DELETE `/api/classroom/[id]/members/[uid]` — Remove member
- POST/GET `/api/classroom/[id]/assignments` — Create + list assignments
- GET `/api/classroom/[id]/assignments/[aid]` — Assignment detail (role-filtered)
- POST `/api/classroom/[id]/assignments/[aid]/submit` — Student submission
- POST `/api/classroom/[id]/assignments/[aid]/submissions/[sid]/feedback` — Give feedback
- POST `/api/classroom/[id]/assignments/[aid]/ai-feedback` — Trigger AI feedback
- GET `/api/classroom/[id]/dashboard` — Instructor analytics
- GET `/api/classroom/[id]/export` — CSV export (submissions + scores)

**LMS API Routes (12)**
- GET/POST `/api/lms/courses` — Catalog + create course
- GET/PATCH/DELETE `/api/lms/courses/[slug]` — Detail, update, archive
- POST `/api/lms/courses/[slug]/sections` — Create section
- PATCH/DELETE `/api/lms/courses/[slug]/sections/[id]` — Section update/delete
- POST `/api/lms/courses/[slug]/lessons` — Create lesson
- GET/PATCH/DELETE `/api/lms/courses/[slug]/lessons/[id]` — Content, update, delete
- POST `/api/lms/courses/[slug]/enroll` — Student enrollment
- GET `/api/lms/courses/[slug]/progress` — Student progress
- POST `/api/lms/lessons/[id]/progress` — Mark lesson complete

**AI Routes (3)**
- POST `/api/lms/ai/generate-quiz` — Generate MCQs from lesson content
- POST `/api/lms/ai/summarize` — Summarize content
- POST `/api/lms/ai/review-code` — Score code submission

**Integration Route (1)**
- POST `/api/integration/classroom-courses` — Link course to assignment

**Service Layer (Classroom)**
- `src/lib/classroom/services/classroom-service.ts` — CRUD, join by code, member management
- `src/lib/classroom/services/assignment-service.ts` — Assignment lifecycle, submissions
- `src/lib/classroom/services/feedback-service.ts` — Feedback, dashboard analytics, CSV export
- `src/lib/classroom/services/classroom-auth.ts` — Member role validation
- `src/lib/classroom/hooks/use-classroom-api.ts` — Client API hook

**Service Layer (LMS)**
- `src/lib/lms/services/course-service.ts` — Course CRUD, catalog, publish/archive
- `src/lib/lms/services/section-lesson-service.ts` — Section/lesson CRUD, reordering
- `src/lib/lms/services/enrollment-service.ts` — Enrollment, progress tracking
- `src/lib/lms/services/lms-auth.ts` — Student access control
- `src/lib/lms/services/ai-helper-service.ts` — AI calls with rate limiting + quota
- `src/lib/lms/services/lms-pgboss-service.ts` — Job queue for async AI operations
- `src/lib/lms/services/lms-worker-handlers.ts` — Quiz generation + batch feedback handlers
- `src/lib/lms/hooks/use-lms-api.ts` — Client API hook

**AI Prompts**
- `src/lib/prompts/clm-quiz-generator-prompt.ts` — MCQ generation from lesson
- `src/lib/prompts/clm-content-summarizer-prompt.ts` — Content summarization
- `src/lib/prompts/clm-code-reviewer-prompt.ts` — Code scoring + feedback
- `src/lib/prompts/clm-submission-feedback-prompt.ts` — Assignment feedback

**UI Pages (4 Classroom)**
- `src/app/classroom/page.tsx` — My classrooms list
- `src/app/classroom/[id]/page.tsx` — Classroom detail
- `src/app/classroom/[id]/assignments/[aid]/page.tsx` — Assignment detail
- `src/app/classroom/[id]/dashboard/page.tsx` — Instructor dashboard

**UI Pages (5 LMS)**
- `src/app/lms/page.tsx` — Course catalog
- `src/app/lms/courses/page.tsx` — My enrolled courses
- `src/app/lms/courses/[slug]/page.tsx` — Course detail + enroll
- `src/app/lms/courses/[slug]/learn/[lessonId]/page.tsx` — Lesson viewer
- `src/app/lms/courses/[slug]/builder/page.tsx` — Course builder

**pg-boss Queues (2 new)**
- `lms-quiz-generate` — Async quiz generation (timeout: 30s, retries: 2)
- `classroom-batch-feedback` — Batch AI feedback (timeout: 60s, retries: 2)
- Both registered in `src/instrumentation.ts` alongside CMA worker

### Changed

**Codebase Structure**
- Reorganized `src/lib/` into domain modules: `cma/`, `classroom/`, `lms/`
- Added `src/lib/prompts/` directory for AI prompt definitions
- Updated `src/instrumentation.ts` to register LMS workers alongside CMA

**Prisma Schema**
- Expanded from 12 to 22 models
- Added indexes on new models for query performance
- Example: `Classroom @@index([orgId])`, `Assignment @@index([dueDate])`

**API Response Format**
- Consistent `{ data: ... }` for success, `{ error, details }` for errors (unchanged)
- AI routes may return `{ data: { quizJson, summaryText, codeScore } }`

### Database Indexes Added

| Model | Index | Purpose |
|-------|-------|---------|
| Classroom | `[orgId]`, `[instructorId]` | Org isolation, instructor lookup |
| Assignment | `[classroomId]`, `[dueDate]` | Classroom assignment list, deadline queries |
| Course | `[orgId]`, `[slug]` | Org isolation, URL-friendly course lookup |
| Lesson | `[courseId]`, `[sectionId]` | Course lesson list, section nav |
| CourseEnrollment | `[courseId]`, `[userId]` | Course students, user's courses |
| LessonProgress | `[lessonId]`, `[userId]` | Lesson completion tracking |

### Testing

**New Classroom Tests**
- Classroom CRUD and access control
- Join by code functionality
- Assignment submission + feedback workflows
- Role-based API filtering (student vs instructor)
- CSV export data integrity

**New LMS Tests**
- Course CRUD and publication
- Section/lesson ordering and visibility
- Enrollment and progress tracking
- AI helper rate limiting and quota validation
- pg-boss quiz generation and batch feedback

**Integration Tests**
- Classroom-to-LMS course linking
- Student completes course as assignment
- Cross-system access control

### Documentation

- [x] `docs/system-architecture.md` — Phase 4 architecture, API routes, pg-boss queues
- [x] `docs/codebase-summary.md` — Phase 4 module structure, data models
- [x] `docs/code-standards.md` — Phase 4 directory structure
- [x] `docs/project-changelog.md` — This file

### Migration Notes

**Database Migration**
```bash
# Assumes migration file 0002_phase4_classroom_lms_ai
npx prisma migrate deploy  # Production
npx prisma migrate dev --name 0002_phase4  # Dev
```

**Startup Sequence (Updated)**
1. Next.js app starts
2. `instrumentation.ts` registers TWO workers:
   - `cma-scheduled-publish` (Phase 3, unchanged)
   - `lms-quiz-generate` (Phase 4, new)
   - `classroom-batch-feedback` (Phase 4, new)
3. Workers begin polling PostgreSQL
4. All API routes available

**No Breaking Changes to Phase 3**
- CMA APIs unchanged
- Existing posts, scheduling, calendar unaffected
- New endpoints are additive only

---

## [2026-03-28] — v0.1.0 — Production Deployment

### Deployed
- Initial production deployment to server (72.60.211.23)
- Git repository initialized and pushed to https://github.com/tonytechlabvn/clm
- Docker Compose: PostgreSQL 16 (`clm-db`) + Next.js app (`clm.tonytechlab.com`)
- Prisma migration `0001_init` applied — 11 tables created
- All containers healthy, health endpoint verified
- Auth providers configured: WordPress SSO + Google OAuth

### Infrastructure
- Server path: `/opt/tonytechlab/clm/`
- App container: `clm.tonytechlab.com` (port 3001 → 3000)
- DB container: `clm-db` (port 5433 → 5432)
- Network: `tony-net` (shared with CVMaker)
- Public URL: `https://clm.tonytechlab.com` (pending Cloudflare Tunnel config)

### Fixed (Pre-deployment)
- Added healthcheck on CLM app service (wget /api/health)
- Added missing OPENAI_API_KEY, ANTHROPIC_API_KEY env vars in compose
- Fixed Prisma migrate in Docker entrypoint (use `node` instead of `npx`)
- Added `public/.gitkeep` for Docker build COPY step
- Healthcheck uses `0.0.0.0` instead of `localhost` (Next.js binding)

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

