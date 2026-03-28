# Product Requirements Document (PRD) & Implementation Blueprint
## Module: CRM & Social Publishing Automation
**Project:** TonyTechLab Ecosystem (CLM & CVMaker Integration)
**Architecture Target:** Modular Monolith (Next.js 14.2 App Router) + Prisma + PostgreSQL
**Status:** Implementation Ready

---

## 1. Context & Ecosystem Vision

**Context for AI Assistant (Claude Code):** You are acting as a Senior Full-stack Engineer. Your task is to implement this PRD into an existing Next.js 14.2 (App Router) monolithic repository. The existing system includes CVMaker and Core Learning Management (CLM) modules using Prisma, PostgreSQL, NextAuth v4, and Tailwind v3. You must follow the established patterns, reuse existing shared services (like `ai-service.ts`), and implement the new features incrementally based on the phases below.

### 1.1 The Role of the CRM Module
Within the TonyTechLab Ecosystem, if Core Learning Management (CLM) represents the **"Learn"** pillar and CVMaker represents the **"Career"** pillar, the CRM & Social Publishing module serves as the **"Acquisition & Marketing"** engine. It acts as an automated top-of-funnel system to distribute content, attract users, and track their conversion journey all the way to course enrollment and CV creation.

### 1.2 Cross-Ecosystem Data Flow
1. **Content Generation:** CRM crawler fetches industry news (e.g., DevOps, AI) → Shared AI Pool summarizes and writes social posts.
2. **Distribution:** Posts are scheduled via Redis Queue and published to Facebook/LinkedIn with automated UTM tracking links.
3. **Tracking:** User clicks the link → visits landing page → UTM data is stored in a first-party cookie.
4. **Conversion:** User logs in (via NextAuth SSO) and enrolls in a CLM course.
5. **Attribution:** The system links the `CourseEnrollment` event to the specific `ContentCampaign` via the UTM cookie, calculating exact conversion metrics and CAC (Customer Acquisition Cost).

---

## 2. System Architecture & Tech Stack

This module will be built directly into the existing Next.js monolithic repository, reusing the current infrastructure to ensure seamless data sharing and reduce operational overhead.

* **Framework:** Next.js 14.2 (App Router) — Integrated under `src/app/admin/crm/` and `src/app/api/crm/`.
* **Database:** PostgreSQL 16 + Prisma ORM — Extending the existing schema.
* **Background Jobs:** **[NEW]** Redis + BullMQ — Mandatory for handling asynchronous 3rd-party API calls, rate limits, and retries.
* **Auth & Roles:** NextAuth v4 — Reusing existing user sessions. Requires expanding role checks (e.g., `admin` or a new `marketing` role).
* **AI Layer:** `src/lib/ai-service.ts` — Reusing the existing Multi-provider AI service (Gemini/Claude/OpenAI) and AI Pool management.
* **UI/UX:** Tailwind CSS v3 + Lucide React + shadcn UI components.

---

## 3. Phased Implementation Plan

### Phase 1: Core Publishing Engine (MVP)
*Goal: Establish stable social media authentication, the composer UI, and a reliable background job queue for publishing.*

* **Social Account Management:**
    * OAuth 2.0 integration for Facebook Pages and LinkedIn (Profile/Company Page).
    * Secure storage of Access Tokens and Refresh Tokens.
    * Automated daily cron job to detect expiring tokens and refresh them.
* **Omnichannel Composer UI:**
    * A unified form to write content, upload media (temporarily stored locally at `/uploads/crm/` or pushed to S3), and select target platforms.
    * Platform-specific content toggles (e.g., different hashtags for LinkedIn vs. Facebook).
    * Timezone-aware post scheduling.
* **Task Queue Execution (Redis + BullMQ):**
    * `PublishWorker`: Consumes jobs and executes API calls to Meta/LinkedIn.
    * **Retry Mechanism:** Automatically retry up to 3 times with exponential backoff if the API times out or hits rate limits.
    * Dead Letter Queue (DLQ) for permanently failed jobs, storing the exact error log.

### Phase 2: AI Content Automation
*Goal: Automate content curation using the existing AI infrastructure to minimize manual workload.*

* **Content Crawler Worker:**
    * Node.js background scripts to read RSS feeds or scrape targeted tech blogs based on specified keywords.
* **AI Curation Pipeline:**
    * Trigger `ai-service.ts` to process raw scraped data.
    * Prompt objectives: Summarize, translate (if necessary), inject expert insights, and format for social media.
* **Approval Workflow (Human-in-the-loop):**
    * AI-generated posts are saved with a `PENDING_REVIEW` status.
    * Admin dashboard to review, edit, and click "Approve & Schedule."

### Phase 3: Analytics & Ecosystem Integration
*Goal: Close the data loop by tracking conversions from social media directly into the CLM.*

* **Auto UTM Tagging:**
    * Automatically append `?utm_source=social&utm_medium=auto_post&utm_campaign=[Campaign_ID]` to all outbound links in the composer.
* **Metrics Sync Job:**
    * Daily BullMQ repeatable job to fetch organic metrics (Reach, Impressions, Clicks, Likes) from Meta/LinkedIn APIs.
* **Conversion Tracking:**
    * Implement a tracking script/middleware to capture UTM parameters into cookies.
    * Upon successful CLM `CourseEnrollment`, log a `LeadConversion` record linking the user to the original marketing campaign.

---

## 4. Prisma Schema Extensions

The CRM module must extend the existing Prisma schema without duplicating core entities like `User`.

```prisma
// ─── CRM & Social Accounts ───

model SocialAccount {
  id            String   @id @default(cuid())
  userId        String   
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  platform      String   // "facebook", "linkedin"
  accountId     String   // Platform specific ID (e.g., FB Page ID)
  accountName   String
  accessToken   String   @db.Text
  refreshToken  String?  @db.Text
  expiresAt     DateTime?
  status        String   @default("active") // active, expired, invalid

  posts         SocialPost[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([platform, accountId])
  @@index([userId])
}

// ─── Content Management ───

model ContentCampaign {
  id            String   @id @default(cuid())
  name          String
  description   String?
  utmCampaign   String   @unique
  status        String   @default("active")
  
  posts         SocialPost[]
  conversions   LeadConversion[]

  createdAt     DateTime @default(now())
}

model SocialPost {
  id                String   @id @default(cuid())
  campaignId        String?
  campaign          ContentCampaign? @relation(fields: [campaignId], references: [id], onDelete: SetNull)
  socialAccountId   String
  socialAccount     SocialAccount @relation(fields: [socialAccountId], references: [id], onDelete: Cascade)
  
  content           String   @db.Text 
  mediaUrls         String[] 
  
  status            String   @default("draft") // draft, pending_review, scheduled, published, failed
  scheduledFor      DateTime?
  publishedAt       DateTime?
  platformPostId    String?  
  errorLog          String?  @db.Text

  metrics           SocialMetrics?

  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@index([status])
  @@index([scheduledFor])
}

// ─── Analytics & Tracking ───

model SocialMetrics {
  id            String   @id @default(cuid())
  postId        String   @unique
  post          SocialPost @relation(fields: [postId], references: [id], onDelete: Cascade)
  
  reach         Int      @default(0)
  impressions   Int      @default(0)
  clicks        Int      @default(0)
  likes         Int      @default(0)
  shares        Int      @default(0)
  comments      Int      @default(0)

  lastSyncedAt  DateTime @default(now())
}

model LeadConversion {
  id            String   @id @default(cuid())
  userId        String   
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  campaignId    String?
  campaign      ContentCampaign? @relation(fields: [campaignId], references: [id], onDelete: SetNull)
  
  source        String   // facebook, linkedin
  medium        String   // auto_post
  convertedAt   DateTime @default(now())
  actionType    String   // "course_enrollment", "cv_created"

  @@index([userId])
  @@index([campaignId])
}

// NOTE FOR AI INSTRUCTION: 
// You must extend the existing `User` model to include:
// socialAccounts  SocialAccount[]
// leadConversions LeadConversion[]
## 5. API Design & File Structure
Following the established naming conventions of the TonyTechLab repository:

### 5.1 Backend Services (`src/lib/crm/`)
* `social-auth-service.ts`: Handles OAuth 2.0 flows and token refreshing.
* `publishing-service.ts`: Manages the business logic for formatting payloads and calling external APIs.
* `queue-service.ts`: Instantiates BullMQ, defines the Redis connection, and registers worker processors (`PublishWorker`, `MetricsSyncWorker`).
* `ai-curation-service.ts`: Bridges the CRM crawler to the existing `src/lib/ai-service.ts`.
* `analytics-service.ts`: Handles UTM tracking logic and conversion aggregation.

### 5.2 API Routes (`src/app/api/crm/`)
* `GET /api/crm/accounts`: List linked social accounts.
* `POST /api/crm/accounts/connect`: Initiate OAuth flow.
* `POST /api/crm/posts/schedule`: Accepts composer payload, stores in DB, and enqueues job.
* `GET /api/crm/posts`: Fetch list of posts (filtered by status).
* `POST /api/crm/ai/curate`: Trigger AI to generate a post from a source URL.
* `GET /api/crm/analytics/campaigns`: Fetch conversion and interaction metrics for the dashboard.

### 5.3 Frontend Architecture (`src/app/admin/crm/`)
* `/admin/crm/dashboard`: Marketing overview, conversion funnel, and metrics charts.
* `/admin/crm/composer`: The main interface for drafting and scheduling posts.
* `/admin/crm/calendar`: A visual calendar view of the `Scheduled` and `Published` queues.
* `/admin/crm/approval`: UI for reviewing `PENDING_REVIEW` AI-generated content.
* `/admin/crm/settings`: Manage social account connections and OAuth authentications.

---

## 6. Non-Functional Requirements & Environment

| Requirement | Specification |
| :--- | :--- |
| **Security** | Access tokens must be securely stored. API endpoints must be protected by NextAuth middleware (checking for Admin/Marketing roles). |
| **Reliability** | The background queue must never silently drop jobs. Dead Letter Queue (DLQ) implementations are mandatory for visibility into API failures. |
| **Scalability** | BullMQ workers must be designed to run concurrently if deployed across multiple Kubernetes pods. |

### Required Environment Variables
```env
# Redis Queue
REDIS_URL=redis://localhost:6379

# Social Platform Credentials
FACEBOOK_CLIENT_ID=your_fb_client_id
FACEBOOK_CLIENT_SECRET=your_fb_client_secret
LINKEDIN_CLIENT_ID=your_linkedin_client_id
LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret
## 7.Directives for AI Assistant:
Start by updating schema.prisma with the new CRM models and extending the existing User model. Generate the migration.

Implement the Redis/BullMQ foundation in src/lib/crm/queue-service.ts.

Implement Phase 1: The Social Account authentication flows and the basic Composer UI.

Ensure all new components strictly use Tailwind v3 and Lucide React to match the existing design system.

## Ref CVMaker at file CLM-ECOSYSTEM-BLUEPRINT.md to have more info about CVMaker