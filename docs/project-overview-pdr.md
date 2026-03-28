# Project Overview & Product Development Requirements (PDR)

## Executive Summary

**Tony Tech Lab Core Learning Management (CLM)** is a scalable, multi-tenant educational technology platform being built as part of a monorepo migration from a monolithic architecture. The first major subsystem is the **Content Management Application (CMA)** — a sophisticated content publishing system that allows organizations to manage, schedule, and publish educational content across multiple platforms.

---

## Project Vision

**Mission:** Build a unified, extensible platform for managing educational content lifecycle — from draft to publication — with intelligent scheduling, multi-platform distribution, and calendar-based content planning.

**Core Values:**
- **Scalability:** Multi-tenant architecture supporting unlimited organizations
- **Reliability:** Guaranteed scheduled publishing with retry logic and compensation transactions
- **Extensibility:** Plugin-based platform adapters for new channels
- **Developer Experience:** Clear code standards, comprehensive documentation, type-safe APIs

---

## Product Scope (Phase 3 Complete)

### CMA Module: Content Management Application

#### Phase 1-2: Foundation (Complete)
- ✅ Multi-tenant post CRUD operations
- ✅ Markdown content editor with preview
- ✅ Multi-platform account linking (WordPress, Medium, etc.)
- ✅ Immediate publishing to platforms via adapters
- ✅ Authentication & org-based access control
- ✅ Media asset management

#### Phase 3: Scheduled Publishing (Complete)
- ✅ pg-boss integration for reliable job queue
- ✅ Calendar-based scheduling UI (@fullcalendar/react)
- ✅ Schedule, reschedule, and cancel operations
- ✅ Timezone-aware scheduling (date-fns-tz)
- ✅ Optimistic locking for concurrent operations
- ✅ Next.js instrumentation hook for worker startup
- ✅ Compensation transactions for rollback on failure

#### Planned: Phase 4+ Features
- [ ] Approval workflow (draft → pending approval → scheduled)
- [ ] Content templates & reusable components
- [ ] Multi-language support
- [ ] Analytics dashboard (publish success, engagement)
- [ ] Bulk operations (import/schedule in batch)
- [ ] Webhooks for platform events
- [ ] A/B testing variants

---

## Functional Requirements

### FR1: Post Lifecycle Management
**Requirement:** Users must be able to create, edit, and delete posts in all states.

**Acceptance Criteria:**
- POST `/api/cma/posts` creates post with status="draft"
- PATCH `/api/cma/posts/[id]` updates content, platform selection
- DELETE `/api/cma/posts/[id]` removes post
- Only draft/approved posts can be edited or deleted
- Deletion cascade cleans up related records (media, platforms, jobs)

### FR2: Immediate Publishing
**Requirement:** Users must be able to publish content immediately to linked platforms.

**Acceptance Criteria:**
- POST `/api/cma/posts/[id]/publish` initiates publish
- Status transitions: "draft" → "publishing" → "published" (or "failed")
- Publishes to all linked platform accounts concurrently
- Platform adapter returns published URL
- Publish failures logged and post marked "failed"

### FR3: Scheduled Publishing
**Requirement:** Users must be able to schedule posts for future publication with reliable delivery.

**Acceptance Criteria:**
- POST `/api/cma/posts/[id]/schedule` with `scheduledAt` creates job
- Status transitions: "draft" → "scheduled"
- Job enqueued to pg-boss queue with retry (3x, exponential backoff)
- Job fires at `scheduledAt` time and publishes
- Job can be cancelled or rescheduled before execution
- Post remains "scheduled" until job completes
- Failures logged; job retries automatically

### FR4: Schedule Management
**Requirement:** Users must be able to view, reschedule, and cancel scheduled posts.

**Acceptance Criteria:**
- GET `/api/cma/calendar` returns scheduled posts for calendar widget
- PATCH `/api/cma/posts/[id]/schedule` reschedules (cancels old job, enqueues new)
- DELETE `/api/cma/posts/[id]/schedule` cancels schedule (status → "draft")
- Calendar UI shows all scheduled posts with timezone-aware times
- Rescheduling modal allows user to pick new date/time

### FR5: Multi-Tenancy
**Requirement:** System must isolate data by organization.

**Acceptance Criteria:**
- Every query filters by `orgId` from session
- No cross-org data leakage
- Users can only access posts in their org
- API returns 404 for posts in other orgs (not 403 — no disclosure)

### FR6: Platform Integration
**Requirement:** Content must be publishable to multiple platforms.

**Acceptance Criteria:**
- Adapter registry supports registering new platform adapters
- WordPress adapter implements publish, update, delete
- Adapter returns platform-specific post ID and URL
- Adapter failures don't block other platforms
- Platform account linking requires authentication token

---

## Non-Functional Requirements

### NFR1: Reliability
**Requirement:** Scheduled posts must publish reliably, even on transient failures.

**Acceptance Criteria:**
- pg-boss retries jobs up to 3 times with exponential backoff
- Retry delay: 30s initial, multiplied on each retry
- Max processing time per job: 15 minutes
- Job IDs tracked in DB for cancellation
- Compensation transactions revert DB state on failure

### NFR2: Performance
**Requirement:** API responses must be fast; calendar loading must not block UI.

**Acceptance Criteria:**
- API responses < 500ms (p99)
- Calendar query returns < 100ms for 1000 posts
- Pagination or cursor-based filtering for large datasets
- Indexes on `orgId`, `scheduledAt`, `status`

### NFR3: Data Integrity
**Requirement:** Concurrent operations must not cause data inconsistency.

**Acceptance Criteria:**
- Optimistic locking prevents duplicate publishes
- Post status transitions are atomic
- pg-boss singleton key prevents duplicate jobs
- Transactions wrap multi-step operations

### NFR4: Observability
**Requirement:** System must be debuggable in production.

**Acceptance Criteria:**
- Structured logging with context (IDs, operation names)
- Log prefixes: `[pg-boss]`, `[scheduling]`, `[api/cma/...]`
- Job status visible in pg-boss jobs table
- Errors include stack traces and contextual details

### NFR5: Scalability
**Requirement:** System must support growing org counts and post volumes.

**Acceptance Criteria:**
- Horizontal scaling (stateless Next.js instances)
- Database connection pooling
- Job queue distributes across workers
- No single points of failure in job processing

---

## Technical Constraints

### Tech Stack (Non-negotiable)
- **Runtime:** Node.js 18+ (Next.js 14.2 requirement)
- **Framework:** Next.js 14.2.35 with App Router
- **Database:** PostgreSQL 14+
- **ORM:** Prisma 5.22.0
- **Job Queue:** pg-boss 12.14.0
- **UI Framework:** React 18 + Tailwind CSS 3.4.1
- **Auth:** NextAuth.js 4.24.13
- **Calendar:** @fullcalendar/react 6.1.20

### Database Constraints
- Single PostgreSQL database (shared by Prisma ORM + pg-boss)
- pg-boss uses dedicated schema: `pgboss`
- No cross-schema queries
- Migrations handled by Prisma + pg-boss

### Architecture Constraints
- Next.js App Router (not Pages Router)
- Client-side: React components with hooks
- Server-side: API routes as request handlers
- No GraphQL (REST API only)
- Instrumentation hook for pg-boss startup

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Job Success Rate** | > 99% | Failed jobs / Total jobs |
| **P99 Publish Latency** | < 2s | Time from trigger to platform ACK |
| **Schedule Hit Rate** | 99.9% | Posts published within ±2min of scheduled time |
| **Data Integrity** | 100% | No duplicate publishes, no data loss |
| **Availability** | 99.5% | Uptime of API + job worker |
| **Code Coverage** | > 80% | Test coverage of services & API routes |
| **Documentation** | Complete | All APIs, services, schemas documented |

---

## Dependencies & Integrations

### Internal Dependencies
- **Prisma ORM:** For CMA entity persistence
- **NextAuth.js:** For authentication & session management
- **Platform Adapters:** For WordPress, Medium, Substack integration

### External Dependencies
- **Platform APIs:** WordPress REST API, Medium API, Substack API
- **PostgreSQL:** Job queue + data persistence
- **npm packages:** @fullcalendar, date-fns-tz, @uiw/react-md-editor, etc.

### Integration Points
- **Org Module:** User orgs, permissions (not yet implemented)
- **Auth Module:** Session, user context (via NextAuth.js)
- **Analytics Module:** Post publish events (future)

---

## Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|-----------|
| **pg-boss job loss** | Scheduled posts don't publish | Low | pg-boss + Postgres durability; backups |
| **Platform API downtime** | Publishing fails; job retries | Medium | Retry logic; fallback logging; alerts |
| **Race conditions** | Duplicate publishes | Low | Optimistic locking; singleton key |
| **Data leakage (org isolation)** | Security breach | Low | Always filter by orgId; code review |
| **Calendar performance** | UI lag with 10k+ posts | Medium | Pagination; indexing; query optimization |
| **Timezone bugs** | Posts publish at wrong time | Medium | Use date-fns-tz; unit tests; TZ validation |

---

## Acceptance Criteria (Phase 3)

### Functional
- [x] pg-boss job queue integrated and tested
- [x] Schedule API endpoints working (POST/PATCH/DELETE)
- [x] Calendar UI displays scheduled posts
- [x] Rescheduling modal with date/time picker
- [x] Jobs execute at scheduled time
- [x] Retry logic works (manual kill + re-queue test)
- [x] Timezone handling verified (TZ-aware scheduling)

### Quality
- [x] API tests pass (schedule, reschedule, cancel, calendar list)
- [x] Service layer tests pass (scheduling-service, pgboss-service)
- [x] Code follows standards (naming, error handling, logging)
- [x] No `any` types without justification
- [x] Multi-tenant isolation verified

### Documentation
- [x] System architecture documented (this file)
- [x] Code standards documented
- [x] API routes documented with examples
- [x] Database schema documented (Prisma)
- [x] Instrumentation hook explained

---

## Roadmap & Next Steps

### Phase 4: Approval Workflow (Next)
- [ ] Add "pending-approval" status
- [ ] POST `/api/cma/posts/[id]/request-approval`
- [ ] Admin approval dashboard
- [ ] Notification on approval/rejection

### Phase 5: Analytics & Monitoring
- [ ] Dashboard: publish success rate, platform performance
- [ ] Events: published, failed, rescheduled
- [ ] Alerts: job queue lag, publish failures

### Phase 6: Advanced Features
- [ ] Bulk scheduling (CSV import)
- [ ] Content templates
- [ ] Multi-language variants
- [ ] A/B testing (publish variants)

### Beyond Phase 6
- [ ] Webhooks for platform events
- [ ] Content recommendations
- [ ] Social listening (trending topics)
- [ ] Automated content generation (AI)

---

## Ownership & Responsibilities

| Role | Responsibilities |
|------|------------------|
| **Product Owner** | Define features, acceptance criteria, prioritization |
| **Tech Lead** | Architecture, code standards, performance targets |
| **Developers** | Implementation, testing, code review |
| **QA** | Integration testing, deployment verification |
| **DevOps** | Infrastructure, monitoring, alerting |

---

## Review & Approval

- **Document Version:** 1.0 (Phase 3 Complete)
- **Last Updated:** 2026-03-28
- **Next Review:** After Phase 4 implementation

---

## Appendix: Glossary

| Term | Definition |
|------|-----------|
| **CMA** | Content Management Application — post publishing system |
| **pg-boss** | Postgres-backed job queue library |
| **Adapter** | Platform-specific publish implementation (WordPress, Medium) |
| **Status** | Post lifecycle state (draft, scheduled, published, etc.) |
| **Org** | Organization — multi-tenant unit of data isolation |
| **Singleton Key** | pg-boss feature to prevent duplicate jobs for same entity |
| **Compensation Transaction** | Database rollback on failure (revert status) |
| **Timezone** | User's local time; stored as UTC in DB |

