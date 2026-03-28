# Core Learning Management (CLM) — Ecosystem Blueprint

> **Document Purpose**: Complete reference for developing CLM and integrating it with CVMaker as a unified ecosystem.
> **Date**: 2026-03-28
> **Status**: Planning Phase

---

## Table of Contents

1. [Ecosystem Vision](#1-ecosystem-vision)
2. [CVMaker — Current State (What Exists)](#2-cvmaker--current-state)
3. [CLM — New System (What We're Building)](#3-clm--new-system)
4. [Integration Architecture](#4-integration-architecture)
5. [Shared Infrastructure](#5-shared-infrastructure)
6. [Data Models & Schema Strategy](#6-data-models--schema-strategy)
7. [Authentication & Authorization](#7-authentication--authorization)
8. [AI Layer](#8-ai-layer)
9. [API Design](#9-api-design)
10. [Frontend Architecture](#10-frontend-architecture)
11. [Deployment Strategy](#11-deployment-strategy)
12. [Migration & Rollout Plan](#12-migration--rollout-plan)

---

## 1. Ecosystem Vision

### The Problem
Career development is fragmented — people learn skills in one place, build CVs in another, and search for jobs in yet another. There's no unified system that connects **learning → skills → career readiness**.

### The Solution: CLM + CVMaker Ecosystem

```
┌─────────────────────────────────────────────────────────────────────┐
│                    TonyTechLab Ecosystem                            │
│                                                                     │
│  ┌──────────────────────┐       ┌──────────────────────┐           │
│  │        CLM            │◄─────►│      CVMaker          │           │
│  │  Core Learning Mgmt   │       │  AI CV Improvement    │           │
│  │                        │       │                        │           │
│  │  • Course Management   │       │  • CV Analysis (AI)    │           │
│  │  • Learning Paths      │       │  • CV Rewrite (AI)     │           │
│  │  • Skill Tracking      │       │  • ATS Check           │           │
│  │  • Assessments/Quizzes │       │  • Interview Prep      │           │
│  │  • Certificates        │       │  • LinkedIn Optimizer   │           │
│  │  • Progress Tracking   │       │  • Job Matching         │           │
│  │  • Instructor Tools    │       │  • Template Gallery     │           │
│  │  • Content Library     │       │  • PDF Export            │           │
│  └──────────┬─────────────┘       └──────────┬─────────────┘           │
│             │                                │                        │
│             └────────────┬───────────────────┘                        │
│                          ▼                                            │
│              ┌───────────────────────┐                                │
│              │    Shared Services     │                                │
│              │  • Auth (WordPress SSO)│                                │
│              │  • User Profiles       │                                │
│              │  • Skill Tree          │                                │
│              │  • AI Pool             │                                │
│              │  • Organizations       │                                │
│              │  • Analytics           │                                │
│              └───────────────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
```

### User Journey Across Ecosystem

```
Student enrolls in CLM course
        ↓
Learns skills → tracked in Skill Tree (shared)
        ↓
Completes course → certificate issued
        ↓
Opens CVMaker → profile auto-populated from CLM data
        ↓
AI analyzes gaps between skills and target job
        ↓
CLM recommends courses to fill gaps
        ↓
Student improves CV → applies to jobs
        ↓
Instructor monitors progress across both systems
```

---

## 2. CVMaker — Current State

### 2.1 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14.2 (App Router), TypeScript |
| Styling | Tailwind CSS v3 + custom shadcn-compatible components |
| Database | PostgreSQL 16 + Prisma ORM (47 models) |
| Auth | NextAuth v4 (WordPress OAuth SSO + Google OAuth) |
| AI | Multi-provider: Google Gemini, OpenAI, Anthropic Claude, Ollama |
| File Processing | pdf-parse v1.1.1, mammoth (DOCX), jsPDF (export) |
| Icons | Lucide React |
| Font | Plus Jakarta Sans |
| State | React Context (CV, Settings, Language, Branding) |
| i18n | EN/VI with JSON translation files |
| Deployment | Docker + Docker Compose + Kubernetes-ready |
| Connection Pool | PgBouncer (transaction mode) |

### 2.2 Design System

- **Style**: Flat Design — 2D, minimalist, clean lines
- **Colors**: Primary `#3B82F6` (blue), Accent `#F97316` (orange CTA), Background `#F8FAFC`, Text `#1E293B`
- **Font**: Plus Jakarta Sans
- **Icons**: Lucide React only (never emojis)
- **Transitions**: 150ms ease
- **All clickable elements**: `cursor-pointer`

### 2.3 Core Features (13 Phases Complete)

#### CV Processing Pipeline (Phase 1)
- **6-step wizard**: Upload Template → Upload CV → Paste JD → AI Analysis → Comparison → Export
- **Multi-AI analysis**: Match score (0-100), matched/missing keywords, gaps, strengths, summary
- **AI rewrite**: Improved CV aligned to job description using template format
- **File parsing**: PDF (pdf-parse v1.1.1) + DOCX (mammoth) → plain text
- **Export**: Copy, download TXT, download PDF (jsPDF + html2canvas), print

#### Authentication & User Management (Phase 2)
- **WordPress OAuth SSO**: Custom mu-plugin on tonytechlab.com
- **Role system**: `root` | `admin` | `user` (mapped from WordPress roles)
- **JWT sessions**: 24h expiry, no DB-stored sessions
- **User dashboard**: Session history, quick stats, filters, search
- **Auto-save**: Wizard steps persist to DB when logged in

#### Admin Panel (Phase 3)
- **Template management**: CRUD for CV templates (14 built-in designs), categories, gallery
- **User management**: Role toggle, activate/deactivate, delete
- **Analytics dashboard**: User growth, session stats, template usage, AI cost tracking
- **Settings**: AI provider config, job sources, branding (logo/colors), LearnPress LMS
- **Documentation CMS**: Markdown docs with categories, publish/archive workflow
- **AI Pool management**: Shared quota system, per-user allocation, audit logs

#### Classroom System (Phase 4)
- **Instructor functions**: Create classroom, manage members, create assignments (JD-based), view submissions, give feedback, dashboard with stats, CSV export
- **Student functions**: Join by 6-char code, view assignments, start/submit work, view feedback
- **14 API endpoints**, 10 frontend pages, 5 service layers
- **Portfolio sharing** (Phase 10): Students share CV sessions with instructors for mentoring

#### Intelligence Features (Phase 6)
- **ATS Compatibility Checker**: 4-category scoring (formatting, keywords, structure, readability)
- **Interview Preparation**: 10 questions across 4 categories with talking points
- **LinkedIn Profile Optimization**: Headline, about section, keyword suggestions

#### Job Matching (Phase 5)
- **4 adapters**: JSearch, Jooble, Adzuna, SerpAPI (Google Jobs)
- **AI ranking**: Scores jobs 0-100 against candidate profile
- **Caching**: Per-source with TTL
- **Vietnam-focused**: Vietnamese job market patterns

#### LearnPress LMS Integration (Phase 7)
- **WordPress mu-plugin** (`cvmaker-learnpress.php`): Bridges CV Maker ↔ LearnPress
- **Bidirectional sync**: Enrollment webhook (HMAC-SHA256), manual sync trigger
- **Grade push**: CV match scores → LearnPress grades
- **Course linking**: Organization.lpCourseId maps classroom to LP course

#### Human Developer Platform (Phase 11)
- **Master Profile**: Full professional profile (personal info, experience, education, certifications, projects)
- **Skill Tree**: 81 nodes across 11 categories with fuzzy search, proficiency tracking (1-5)
- **Gap Analysis**: Hybrid engine (rule-based + AI-enhanced), match score with recommendations
- **Personality Assessment**: 10-question archetype quiz
- **BYOK (Bring-Your-Own-Key)**: Zero-trust API key management (localStorage only, never server-stored)
- **AI Public Pool**: Admin-managed shared AI quota (BYOK → pool → server fallback)
- **Profile Import**: AI extraction from CV/session, smart text condensation, overview editor

#### CV Editor (Phase 8 — In Progress)
- **3-column layout**: Section sidebar + form + live preview
- **Section forms**: Personal info, experience, education, skills, certifications
- **AI tools**: Suggestions, rewrite, grammar fix (planned)

### 2.4 Database Schema Overview (47 Models)

```
User
├── Account (OAuth tokens)
├── CVSession
│   ├── Document[template] + Document[cv]
│   ├── Analysis (matchScore, keywords, gaps)
│   ├── Rewrite (improvedText, structuredData)
│   ├── IntelligenceResult (ats/interview/linkedin)
│   ├── SessionJobResult (job search results)
│   └── Submission → Feedback
├── MasterProfile
│   ├── TechSkill → SkillTreeNode
│   ├── WorkExperience
│   ├── Education
│   ├── Certification
│   ├── ProjectEntry
│   ├── GapAnalysisLog
│   └── PersonalityResult
├── UserAiQuota
└── OrgMember → Organization
      ├── Assignment → Submission → Feedback
      ├── SharedPortfolio → PortfolioReview
      └── Template

SystemSetting (key-value config store)
Template (CV templates for gallery)
CustomDesign (visual CV designs)
ProjectDocument (docs CMS)
SkillTreeNode (skill taxonomy tree)
JobSearchCache (job search results cache)
AiUsageLog (AI usage audit trail)
```

### 2.5 API Surface (80+ Endpoints)

| Category | Count | Examples |
|----------|-------|---------|
| CV Processing | 3 | `/api/analyze`, `/api/rewrite`, `/api/parse-cv` |
| Sessions | 5 | `/api/sessions`, `/api/sessions/[id]`, versions |
| Intelligence | 3 | `/api/ats-check`, `/api/interview-prep`, `/api/linkedin-optimize` |
| Profile & Skills | 8 | `/api/profile/[userId]`, `/api/skills/tree`, `/api/skills/search` |
| Classroom | 14 | `/api/classroom/*` (CRUD, assignments, submissions, portfolios) |
| Job Recommendations | 2 | `/api/job-recommendations` |
| Organizations | 8 | `/api/organizations/*` |
| LearnPress LMS | 6 | `/api/learnpress/*`, `/api/webhooks/learnpress` |
| Admin Settings | 12 | `/api/admin/settings/*` (AI, branding, pool, LP, jobs) |
| Admin CRUD | 6 | `/api/admin/users`, `/api/admin/templates`, `/api/admin/docs` |
| Admin Analytics | 2 | `/api/admin/analytics` |
| AI Internal | 3 | `/api/internal/ai/*` (gap enhance, CV gen, personality) |
| Auth & Health | 5 | `/api/auth/*`, `/api/health`, `/api/ready`, `/api/ai-status` |
| Public | 4 | `/api/branding`, `/api/docs`, `/api/ai-pool/quota`, `/api/byok/test` |

### 2.6 Infrastructure

- **Docker**: Multi-stage build, standalone output, docker-compose with PgBouncer + PostgreSQL
- **Kubernetes**: 10 manifests (Deployment, HPA 2-10 pods, PDB, Ingress with TLS, migration Job)
- **Security**: CSP headers, rate limiting (10 req/min/user on AI), 10MB upload limit, HSTS, X-Request-ID tracing
- **Performance**: PgBouncer pooling, AI client caching, PDF worker threads, 120s AI timeouts

### 2.7 External Integrations

| System | Purpose | Protocol |
|--------|---------|----------|
| WordPress (tonytechlab.com) | OAuth SSO + user roles | OAuth 2.0 |
| LearnPress (WordPress) | LMS course/student sync | REST API + HMAC webhook |
| Google Gemini | AI provider | REST API |
| OpenAI | AI provider | SDK |
| Anthropic Claude | AI provider | SDK |
| JSearch / Jooble / Adzuna / SerpAPI | Job search | REST APIs |

---

## 3. CLM — New System

### 3.1 What CLM Is

**Core Learning Management (CLM)** is a learning platform that manages courses, learning paths, skill development, assessments, and certificates. It complements CVMaker by providing the **"learn"** side of the career journey.

### 3.2 CLM Core Features

#### Course Management
- Create/edit/archive courses with rich content (text, video, code, quizzes)
- Course categories and tags
- Prerequisite chains (course A required before course B)
- Versioning (update course content without breaking enrolled students)
- Draft → Published → Archived lifecycle

#### Learning Paths
- Ordered sequence of courses toward a career goal
- Branching paths (choose specialization)
- Estimated completion time
- Path completion certificates
- Visual progress map

#### Content Delivery
- Lesson types: text/markdown, video (embed), code playground, downloadable resources
- Section/chapter organization within courses
- Progress tracking per lesson (not started → in progress → completed)
- Bookmarking and note-taking
- Mobile-responsive content viewer

#### Assessments & Quizzes
- Multiple choice, true/false, short answer, code challenge
- Timed assessments
- Passing score threshold
- Retry policy (unlimited / limited attempts)
- Auto-grading + manual review option
- Question banks with randomization

#### Certificates
- Auto-issued on course/path completion
- Verifiable certificate ID (public verification page)
- PDF certificate download
- Certificate templates (admin-managed)
- Expiry dates (optional, for time-sensitive certifications)

#### Progress Tracking
- Per-student: courses enrolled, lessons completed, quiz scores, time spent
- Per-course: enrollment count, completion rate, avg score, drop-off points
- Streak tracking and engagement metrics
- XP/points system (gamification layer)

#### Instructor Tools
- Course builder with drag-and-drop section ordering
- Student progress dashboard
- Assignment grading interface
- Announcement/notification system
- Discussion forums per course
- Office hours scheduling

#### Content Library
- Reusable content blocks across courses
- Media library (images, videos, documents)
- External resource links with metadata
- Tags and search

### 3.3 CLM-Specific Data Models (New)

```
Course
├── Section (ordered chapters)
│   └── Lesson (text/video/code/quiz)
│       ├── LessonResource (attachments)
│       └── LessonProgress (per-student tracking)
├── CourseEnrollment (student ↔ course)
├── CourseReview (rating + comment)
└── CoursePrerequisite (prerequisite chain)

LearningPath
├── LearningPathCourse (ordered course sequence)
└── LearningPathEnrollment (student ↔ path)

Assessment
├── Question (MCQ/TF/short/code)
│   └── QuestionOption (for MCQ)
├── AssessmentAttempt (student attempt)
│   └── AttemptAnswer (per-question answer)
└── AssessmentResult (score, passed, feedback)

Certificate
├── CertificateTemplate (admin-managed designs)
└── IssuedCertificate (student ↔ course/path + verification code)

ContentBlock (reusable content library)
MediaAsset (images, videos, documents)
Discussion (threaded forums per course)
Announcement (course-level notifications)
StudentNote (bookmarks + notes per lesson)
XPTransaction (gamification points log)
```

---

## 4. Integration Architecture

### 4.1 Integration Points (CLM ↔ CVMaker)

```
┌──────────────────────────────────────────────────────────────────┐
│                      Integration Layer                            │
│                                                                    │
│  ┌─────────────┐                           ┌─────────────┐       │
│  │     CLM      │     Shared Services       │   CVMaker    │       │
│  │              │                           │              │       │
│  │ Courses ─────┼──► Skill Tree ◄───────────┼── Gap Engine │       │
│  │              │                           │              │       │
│  │ Completion ──┼──► Master Profile ◄───────┼── CV Builder │       │
│  │              │                           │              │       │
│  │ Assessments ─┼──► Skill Proficiency ◄────┼── Analysis   │       │
│  │              │                           │              │       │
│  │ Certificates ┼──► Profile.Certs ◄────────┼── CV Export  │       │
│  │              │                           │              │       │
│  │ Instructor ──┼──► Organizations ◄────────┼── Classroom  │       │
│  │              │                           │              │       │
│  │ Progress ────┼──► Analytics ◄────────────┼── AI Metrics │       │
│  │              │                           │              │       │
│  │ Gap Recos ◄──┼─── Gap Analysis ──────────┼──►           │       │
│  └─────────────┘                           └─────────────┘       │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 Key Integration Flows

#### Flow 1: Skill Completion → Profile Update
```
Student completes CLM course tagged with "React" + "TypeScript"
        ↓
CLM records completion + assessment score
        ↓
Shared Skill Tree: proficiency auto-updated
  (e.g., React: 2→3 based on course level + quiz score)
        ↓
CVMaker Master Profile reflects new skill levels
        ↓
Next gap analysis shows improved match score
```

#### Flow 2: Gap Analysis → Course Recommendation
```
CVMaker gap analysis identifies missing skills:
  "Docker (critical)", "Kubernetes (important)", "CI/CD (nice-to-have)"
        ↓
Integration API queries CLM course catalog
        ↓
CLM returns matching courses:
  - "Docker Fundamentals" (4h, beginner)
  - "K8s for Developers" (8h, intermediate, prereq: Docker)
  - "CI/CD Pipeline Mastery" (6h, intermediate)
        ↓
CVMaker displays "Recommended Learning" with direct enroll links
        ↓
Student enrolls → tracked in CLM → skills update → gap shrinks
```

#### Flow 3: Certificate → CV Auto-Population
```
Student completes course → certificate issued
        ↓
Certificate data synced to MasterProfile.Certification[]
  { name, issuer: "TonyTechLab CLM", issueDate, credentialId, credentialUrl }
        ↓
CVMaker CV builder auto-includes new certification
        ↓
AI rewrite highlights fresh certification in improved CV
```

#### Flow 4: Classroom ↔ Course Assignment
```
Instructor creates CLM course assignment in classroom
        ↓
Students access course content via CLM
        ↓
Completion triggers CVMaker assignment status update
        ↓
Instructor sees unified progress: course completion + CV scores
```

### 4.3 Integration Strategy: Monorepo vs Microservices

**Recommended: Modular Monolith (Phase 1) → Microservices (Phase 2)**

```
Phase 1: Modular Monolith
┌─────────────────────────────────────────┐
│           Next.js Application            │
│                                          │
│  ┌──────────┐  ┌──────────┐  ┌───────┐ │
│  │  CVMaker  │  │   CLM    │  │Shared │ │
│  │  Module   │  │  Module  │  │  Lib  │ │
│  │ /api/cv/* │  │ /api/lms/*│  │       │ │
│  │ /app/cv/* │  │ /app/lms/*│  │       │ │
│  └──────────┘  └──────────┘  └───────┘ │
│              Single PostgreSQL DB        │
└─────────────────────────────────────────┘

Phase 2: Microservices (when scale requires)
┌──────────┐  ┌──────────┐  ┌──────────┐
│  CVMaker  │  │   CLM    │  │  Shared  │
│  Service  │  │  Service │  │  Gateway │
│  (Next.js)│  │ (Next.js)│  │  (API)   │
└─────┬─────┘  └─────┬────┘  └─────┬────┘
      │               │              │
      └───────────────┼──────────────┘
                      ▼
              ┌────────────┐
              │ PostgreSQL  │
              │ (shared DB) │
              └────────────┘
```

---

## 5. Shared Infrastructure

### 5.1 What's Already Built (Reuse from CVMaker)

| Component | Location | Reuse Strategy |
|-----------|----------|----------------|
| Auth (WordPress SSO) | `src/app/api/auth/[...nextauth]` | Share — same auth for CLM |
| Role System | Middleware + JWT | Extend — add `instructor` role |
| User Model | Prisma `User` | Share — same users across both |
| Skill Tree | `SkillTreeNode` + 81 seeds | Share — CLM courses tag to same tree |
| Master Profile | `MasterProfile` + relations | Share — CLM updates same profile |
| Organizations | `Organization` + `OrgMember` | Share — classrooms span both systems |
| AI Pool | `ai-pool-service.ts` | Share — unified quota across both |
| AI Service | `ai-service.ts` (3 providers) | Share — CLM uses same AI layer |
| i18n | `language-context.tsx` + locales | Extend — add CLM translation keys |
| Admin Panel | `/admin/*` pages | Extend — add CLM admin sections |
| Design System | Tailwind v3 + custom components | Share — same visual language |
| Branding | `branding-context.tsx` | Share — unified branding |
| Rate Limiter | `rate-limiter.ts` | Share — same protection |
| Docker/K8s | docker-compose + k8s/ | Extend — same deployment |
| PgBouncer | Connection pooling | Share — same pool |

### 5.2 What Needs to Be Built (New for CLM)

| Component | Description |
|-----------|-------------|
| Course Engine | Course/section/lesson CRUD, ordering, versioning |
| Content Renderer | Markdown + video embed + code playground viewer |
| Assessment Engine | Question types, auto-grading, attempt tracking |
| Certificate Service | Template rendering, verification, PDF generation |
| Learning Path Engine | Path builder, prerequisite validation, progress |
| Progress Tracker | Per-lesson/course/path tracking, streaks, XP |
| Discussion Service | Threaded forums per course |
| Notification Service | Announcements, due date reminders, achievements |
| Media Service | Upload, storage, CDN delivery |
| Course Recommendation Engine | Gap-driven + collaborative filtering |
| Video Service | Video hosting/embedding, progress tracking |

---

## 6. Data Models & Schema Strategy

### 6.1 Schema Extension Approach

CLM models extend the existing Prisma schema. Shared models (User, Organization, SkillTreeNode, MasterProfile) are **not duplicated** — CLM references them directly.

### 6.2 New CLM Models (Prisma)

```prisma
// ─── Course Management ───

model Course {
  id            String   @id @default(cuid())
  title         String
  slug          String   @unique
  description   String?  @db.Text
  thumbnail     String?
  category      String?
  tags          String[]
  level         String   @default("beginner") // beginner, intermediate, advanced
  language      String   @default("en")
  estimatedHours Float?
  status        String   @default("draft") // draft, published, archived
  price         Float    @default(0) // 0 = free
  createdById   String
  createdBy     User     @relation(fields: [createdById], references: [id])
  organizationId String?
  organization  Organization? @relation(fields: [organizationId], references: [id])

  sections      CourseSection[]
  enrollments   CourseEnrollment[]
  reviews       CourseReview[]
  prerequisites CoursePrerequisite[] @relation("CoursePrereqs")
  requiredBy    CoursePrerequisite[] @relation("CourseRequiredBy")
  pathCourses   LearningPathCourse[]
  skillTags     CourseSkillTag[]
  certificates  CertificateTemplate?
  discussions   Discussion[]
  announcements Announcement[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  publishedAt   DateTime?

  @@index([status])
  @@index([category])
  @@index([createdById])
  @@index([organizationId])
}

model CourseSection {
  id        String   @id @default(cuid())
  courseId   String
  course    Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  title     String
  sortOrder Int      @default(0)

  lessons   Lesson[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([courseId, sortOrder])
}

model Lesson {
  id          String   @id @default(cuid())
  sectionId   String
  section     CourseSection @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  title       String
  type        String   @default("text") // text, video, code, quiz, resource
  content     String?  @db.Text // markdown for text, URL for video, JSON for code
  duration    Int?     // estimated minutes
  sortOrder   Int      @default(0)
  isFree      Boolean  @default(false) // preview lesson

  resources   LessonResource[]
  progress    LessonProgress[]
  assessment  Assessment?
  notes       StudentNote[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([sectionId, sortOrder])
}

model LessonResource {
  id        String @id @default(cuid())
  lessonId  String
  lesson    Lesson @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  name      String
  type      String // pdf, zip, link, image
  url       String
  size      Int?   // bytes
  sortOrder Int    @default(0)

  @@index([lessonId])
}

model LessonProgress {
  id          String   @id @default(cuid())
  lessonId    String
  lesson      Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  status      String   @default("not_started") // not_started, in_progress, completed
  completedAt DateTime?
  timeSpent   Int      @default(0) // seconds

  @@unique([lessonId, userId])
  @@index([userId])
}

// ─── Enrollment ───

model CourseEnrollment {
  id           String   @id @default(cuid())
  courseId      String
  course        Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  status        String   @default("active") // active, completed, dropped
  progress      Float    @default(0) // 0-100 percentage
  completedAt   DateTime?
  enrolledAt    DateTime @default(now())

  issuedCertificate IssuedCertificate?

  @@unique([courseId, userId])
  @@index([userId])
  @@index([courseId, status])
}

model CoursePrerequisite {
  id              String @id @default(cuid())
  courseId         String
  course           Course @relation("CoursePrereqs", fields: [courseId], references: [id], onDelete: Cascade)
  prerequisiteId   String
  prerequisite     Course @relation("CourseRequiredBy", fields: [prerequisiteId], references: [id], onDelete: Cascade)

  @@unique([courseId, prerequisiteId])
}

model CourseSkillTag {
  id            String        @id @default(cuid())
  courseId       String
  course         Course        @relation(fields: [courseId], references: [id], onDelete: Cascade)
  skillNodeId    String
  skillNode      SkillTreeNode @relation(fields: [skillNodeId], references: [id])
  proficiencyGain Int          @default(1) // how much this course improves skill (1-2)

  @@unique([courseId, skillNodeId])
}

// ─── Assessments ───

model Assessment {
  id          String   @id @default(cuid())
  lessonId    String   @unique
  lesson      Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  title       String
  passingScore Float   @default(70) // percentage
  timeLimit   Int?     // minutes, null = unlimited
  maxAttempts Int      @default(0) // 0 = unlimited
  shuffleQuestions Boolean @default(false)

  questions   Question[]
  attempts    AssessmentAttempt[]

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Question {
  id            String   @id @default(cuid())
  assessmentId  String
  assessment    Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  type          String   // mcq, true_false, short_answer, code
  text          String   @db.Text
  explanation   String?  @db.Text // shown after answering
  points        Float    @default(1)
  sortOrder     Int      @default(0)

  options       QuestionOption[]
  answers       AttemptAnswer[]

  @@index([assessmentId, sortOrder])
}

model QuestionOption {
  id          String  @id @default(cuid())
  questionId  String
  question    Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  text        String
  isCorrect   Boolean @default(false)
  sortOrder   Int     @default(0)

  @@index([questionId])
}

model AssessmentAttempt {
  id            String   @id @default(cuid())
  assessmentId  String
  assessment    Assessment @relation(fields: [assessmentId], references: [id], onDelete: Cascade)
  userId        String
  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  score         Float?
  passed        Boolean?
  startedAt     DateTime @default(now())
  completedAt   DateTime?
  timeSpent     Int?     // seconds

  answers       AttemptAnswer[]

  @@index([assessmentId, userId])
}

model AttemptAnswer {
  id          String   @id @default(cuid())
  attemptId   String
  attempt     AssessmentAttempt @relation(fields: [attemptId], references: [id], onDelete: Cascade)
  questionId  String
  question    Question @relation(fields: [questionId], references: [id])
  answer      String?  @db.Text // selected option ID, text, or code
  isCorrect   Boolean?
  points      Float    @default(0)

  @@index([attemptId])
}

// ─── Learning Paths ───

model LearningPath {
  id            String   @id @default(cuid())
  title         String
  slug          String   @unique
  description   String?  @db.Text
  thumbnail     String?
  category      String?
  level         String   @default("beginner")
  estimatedHours Float?
  status        String   @default("draft")
  createdById   String
  createdBy     User     @relation(fields: [createdById], references: [id])

  courses       LearningPathCourse[]
  enrollments   LearningPathEnrollment[]

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([status])
}

model LearningPathCourse {
  id          String @id @default(cuid())
  pathId      String
  path        LearningPath @relation(fields: [pathId], references: [id], onDelete: Cascade)
  courseId    String
  course      Course @relation(fields: [courseId], references: [id])
  sortOrder   Int    @default(0)
  isOptional  Boolean @default(false)

  @@unique([pathId, courseId])
  @@index([pathId, sortOrder])
}

model LearningPathEnrollment {
  id          String   @id @default(cuid())
  pathId      String
  path        LearningPath @relation(fields: [pathId], references: [id], onDelete: Cascade)
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  progress    Float    @default(0)
  completedAt DateTime?
  enrolledAt  DateTime @default(now())

  @@unique([pathId, userId])
  @@index([userId])
}

// ─── Certificates ───

model CertificateTemplate {
  id         String   @id @default(cuid())
  courseId   String?  @unique
  course     Course?  @relation(fields: [courseId], references: [id])
  name       String
  design     Json     // template layout + styling
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}

model IssuedCertificate {
  id              String   @id @default(cuid())
  enrollmentId    String   @unique
  enrollment      CourseEnrollment @relation(fields: [enrollmentId], references: [id])
  userId          String
  user            User     @relation(fields: [userId], references: [id])
  verificationCode String  @unique @default(cuid())
  issuedAt        DateTime @default(now())
  expiresAt       DateTime?

  @@index([userId])
  @@index([verificationCode])
}

// ─── Social/Engagement ───

model Discussion {
  id        String   @id @default(cuid())
  courseId   String
  course     Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  authorId   String
  author     User     @relation(fields: [authorId], references: [id])
  parentId   String?
  parent     Discussion? @relation("Replies", fields: [parentId], references: [id])
  replies    Discussion[] @relation("Replies")
  title      String?
  content    String   @db.Text
  isPinned   Boolean  @default(false)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@index([courseId])
  @@index([parentId])
}

model Announcement {
  id        String   @id @default(cuid())
  courseId   String
  course     Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)
  authorId   String
  author     User     @relation(fields: [authorId], references: [id])
  title      String
  content    String   @db.Text

  createdAt  DateTime @default(now())

  @@index([courseId])
}

model StudentNote {
  id        String   @id @default(cuid())
  lessonId  String
  lesson    Lesson   @relation(fields: [lessonId], references: [id], onDelete: Cascade)
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  content   String   @db.Text

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([lessonId, userId])
}

model CourseReview {
  id        String @id @default(cuid())
  courseId   String
  course     Course @relation(fields: [courseId], references: [id], onDelete: Cascade)
  userId     String
  user       User   @relation(fields: [userId], references: [id])
  rating     Int    // 1-5
  comment    String? @db.Text

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([courseId, userId])
}

// ─── Gamification ───

model XPTransaction {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  amount    Int
  reason    String   // lesson_complete, quiz_pass, course_complete, streak_bonus
  sourceId  String?  // lesson/course/path ID

  createdAt DateTime @default(now())

  @@index([userId, createdAt])
}
```

### 6.3 Shared Model Extensions

Add relations to existing CVMaker models:

```prisma
// Add to existing User model:
model User {
  // ... existing fields ...

  // CLM relations
  coursesCreated      Course[]
  courseEnrollments    CourseEnrollment[]
  lessonProgress      LessonProgress[]
  assessmentAttempts  AssessmentAttempt[]
  learningPaths       LearningPathEnrollment[]
  issuedCertificates  IssuedCertificate[]
  discussions         Discussion[]
  announcements       Announcement[]
  studentNotes        StudentNote[]
  courseReviews        CourseReview[]
  xpTransactions      XPTransaction[]
  totalXP             Int @default(0)
}

// Add to existing SkillTreeNode model:
model SkillTreeNode {
  // ... existing fields ...
  courseTags CourseSkillTag[]
}

// Add to existing Organization model:
model Organization {
  // ... existing fields ...
  courses Course[]
}
```

---

## 7. Authentication & Authorization

### 7.1 Shared Auth (No Changes Needed)

CVMaker's NextAuth v4 setup works for CLM out of the box:
- WordPress OAuth SSO (primary)
- Google OAuth (secondary)
- JWT sessions (24h)
- Middleware-based route protection

### 7.2 Extended Role System

Current roles: `root` | `admin` | `user`

CLM requires nuance within organizations:

| Role | Scope | Capabilities |
|------|-------|-------------|
| `root` | Global | Everything |
| `admin` | Global | Admin panel, settings, all CRUD |
| `instructor` | Per-Organization | Create courses, grade, manage students |
| `student` | Per-Organization | Enroll, learn, submit, take assessments |
| `user` | Global (no org) | Browse catalog, self-enroll in public courses |

**Implementation**: Organization membership already has roles (`OrgMember.role`). CLM uses the same model — no new auth mechanism needed.

### 7.3 Route Protection

```
/lms/*                → authenticated users
/lms/admin/*          → admin only
/lms/instructor/*     → instructor role in org
/lms/courses/create   → instructor or admin
/lms/courses/[slug]   → enrolled students or public preview
```

---

## 8. AI Layer

### 8.1 Reuse CVMaker's AI Infrastructure

CLM uses the same AI service layer (`src/lib/ai-service.ts`):
- Same 4 providers (Gemini, OpenAI, Claude, Ollama)
- Same BYOK + Pool quota system
- Same rate limiting

### 8.2 New AI Features for CLM

| Feature | Description | AI Task |
|---------|-------------|---------|
| Quiz Generation | Auto-generate quiz from lesson content | Content → Questions + Options |
| Content Summarization | TL;DR for lessons | Long text → Summary |
| Code Review | Auto-grade code challenges | Code → Feedback + Score |
| Learning Recommendations | Suggest next course based on profile + gaps | Profile + Catalog → Ranked list |
| Content Translation | Auto-translate EN ↔ VI | Text → Translated text |
| Study Guide Generation | Create study notes from course content | Content → Study guide |
| Adaptive Difficulty | Adjust quiz difficulty based on performance | Score history → Next difficulty |

### 8.3 New Prompts

```
src/lib/prompts/
├── clm-quiz-generator-prompt.ts
├── clm-content-summarizer-prompt.ts
├── clm-code-reviewer-prompt.ts
├── clm-course-recommender-prompt.ts
└── clm-study-guide-prompt.ts
```

---

## 9. API Design

### 9.1 CLM API Routes

```
/api/lms/courses                     GET    List courses (catalog)
/api/lms/courses                     POST   Create course (instructor)
/api/lms/courses/[slug]              GET    Course detail
/api/lms/courses/[slug]              PATCH  Update course
/api/lms/courses/[slug]              DELETE Archive course
/api/lms/courses/[slug]/sections     GET    List sections + lessons
/api/lms/courses/[slug]/sections     POST   Create section
/api/lms/courses/[slug]/sections/[id] PATCH  Reorder/update section
/api/lms/courses/[slug]/lessons      POST   Create lesson
/api/lms/courses/[slug]/lessons/[id] GET    Lesson content
/api/lms/courses/[slug]/lessons/[id] PATCH  Update lesson
/api/lms/courses/[slug]/enroll       POST   Enroll student
/api/lms/courses/[slug]/progress     GET    Student progress
/api/lms/courses/[slug]/reviews      GET/POST Reviews
/api/lms/courses/[slug]/discussions  GET/POST Discussions
/api/lms/courses/[slug]/announcements GET/POST Announcements

/api/lms/lessons/[id]/progress       POST   Mark progress (complete/time)
/api/lms/lessons/[id]/notes          GET/POST Student notes

/api/lms/assessments/[id]            GET    Assessment detail
/api/lms/assessments/[id]/attempt    POST   Start attempt
/api/lms/assessments/[id]/submit     POST   Submit answers
/api/lms/assessments/[id]/results    GET    Assessment results

/api/lms/paths                       GET    List learning paths
/api/lms/paths                       POST   Create path (admin)
/api/lms/paths/[slug]                GET    Path detail + courses
/api/lms/paths/[slug]/enroll         POST   Enroll in path

/api/lms/certificates/verify/[code]  GET    Public verification
/api/lms/certificates/[id]/download  GET    Download PDF

/api/lms/my/courses                  GET    My enrolled courses
/api/lms/my/progress                 GET    Overall progress + XP
/api/lms/my/certificates             GET    My certificates

/api/lms/admin/courses               GET    All courses (admin view)
/api/lms/admin/analytics             GET    LMS analytics
/api/lms/admin/certificate-templates GET/POST Template CRUD

/api/lms/ai/generate-quiz            POST   AI quiz from content
/api/lms/ai/summarize                POST   AI content summary
/api/lms/ai/review-code              POST   AI code review
/api/lms/ai/recommend-courses        POST   AI course recommendations
```

### 9.2 Cross-System API (Integration)

```
/api/integration/skill-sync          POST   CLM course completion → Skill Tree update
/api/integration/cert-sync           POST   CLM certificate → MasterProfile.Certification
/api/integration/gap-courses         GET    Gap Analysis → CLM course recommendations
/api/integration/classroom-courses   POST   Link CLM course to CVMaker classroom assignment
```

---

## 10. Frontend Architecture

### 10.1 Page Structure

```
src/app/
├── (existing CVMaker pages)
├── lms/
│   ├── layout.tsx                    # LMS layout with sidebar
│   ├── page.tsx                      # Course catalog / dashboard
│   ├── courses/
│   │   ├── page.tsx                  # Browse courses
│   │   ├── [slug]/
│   │   │   ├── page.tsx              # Course detail + enroll
│   │   │   ├── learn/
│   │   │   │   └── [lessonId]/page.tsx  # Lesson viewer
│   │   │   ├── discussions/page.tsx  # Forum
│   │   │   └── reviews/page.tsx      # Reviews
│   │   └── create/page.tsx           # Course builder
│   ├── paths/
│   │   ├── page.tsx                  # Learning paths
│   │   └── [slug]/page.tsx           # Path detail
│   ├── my-learning/
│   │   ├── page.tsx                  # My courses + progress
│   │   └── certificates/page.tsx     # My certificates
│   └── instructor/
│       ├── page.tsx                  # Instructor dashboard
│       ├── courses/page.tsx          # My courses (manage)
│       └── analytics/page.tsx        # Course analytics
├── admin/
│   ├── (existing admin pages)
│   └── lms/
│       ├── page.tsx                  # LMS admin dashboard
│       ├── courses/page.tsx          # All courses management
│       ├── analytics/page.tsx        # LMS analytics
│       └── certificates/page.tsx     # Certificate templates
```

### 10.2 Key Components

```
src/components/lms/
├── course-card.tsx                   # Course preview card
├── course-builder.tsx                # Instructor course editor
├── section-editor.tsx                # Section/lesson drag-drop ordering
├── lesson-viewer.tsx                 # Content renderer (markdown/video/code)
├── lesson-sidebar.tsx                # Course outline navigation
├── progress-bar.tsx                  # Visual progress tracker
├── assessment-player.tsx             # Quiz/assessment UI
├── certificate-viewer.tsx            # Certificate display + download
├── learning-path-map.tsx             # Visual path progression
├── discussion-thread.tsx             # Forum UI
├── course-review-form.tsx            # Rating + comment form
├── skill-tag-picker.tsx              # Tag courses with skills
├── enrollment-button.tsx             # Enroll CTA
├── instructor-dashboard.tsx          # Instructor overview
├── student-progress-table.tsx        # Student list with progress
├── code-playground.tsx               # Interactive code editor
├── video-player.tsx                  # Video embed with progress
└── xp-badge.tsx                      # Gamification display
```

### 10.3 Context

```
src/context/
├── (existing contexts)
└── lms-context.tsx                   # Active course, lesson, progress state
```

### 10.4 Navigation Integration

Add CLM to existing navigation:

```
Dashboard Sidebar:
  ├── Dashboard (existing)
  ├── CV Wizard (existing)
  ├── My Profile (existing)
  ├── Classroom (existing)
  ├── ──────────────────
  ├── Learning (NEW — /lms)
  ├── My Courses (NEW — /lms/my-learning)
  ├── Certificates (NEW — /lms/my-learning/certificates)
  └── Job Search (existing)

Admin Sidebar:
  ├── (existing admin items)
  ├── ──────────────────
  ├── LMS Dashboard (NEW — /admin/lms)
  ├── Course Management (NEW — /admin/lms/courses)
  ├── Certificate Templates (NEW — /admin/lms/certificates)
  └── LMS Analytics (NEW — /admin/lms/analytics)
```

---

## 11. Deployment Strategy

### 11.1 Same Infrastructure

CLM deploys as part of the same Next.js application — no separate servers needed in Phase 1.

```
Docker Compose (unchanged structure):
  cvmaker-db       → PostgreSQL 16 (shared DB)
  cvmaker-pgbouncer → PgBouncer (shared pool)
  cvmaker          → Next.js (CVMaker + CLM modules)
```

### 11.2 Database Migration

```bash
# Add CLM models to existing schema.prisma
npx prisma migrate dev --name add_clm_models

# Seed CLM data
npx tsx prisma/seed-courses.ts      # sample courses
npx tsx prisma/seed-certificates.ts  # certificate templates
```

### 11.3 Media Storage

CLM requires media storage for course content (videos, images, documents):

| Option | Phase 1 | Phase 2 |
|--------|---------|---------|
| Videos | YouTube/Vimeo embed URLs | Self-hosted or CDN |
| Images | Local `/uploads/lms/` | S3/R2 bucket |
| Documents | Local `/uploads/lms/resources/` | S3/R2 bucket |
| Thumbnails | Local `/uploads/lms/thumbnails/` | CDN |

---

## 12. Migration & Rollout Plan

### Phase A: Foundation (Week 1-2)
- [ ] Extend Prisma schema with CLM models
- [ ] Run migrations on dev server
- [ ] Build course CRUD API (`/api/lms/courses/*`)
- [ ] Build course catalog page (`/lms/courses`)
- [ ] Build course detail page
- [ ] Add LMS section to dashboard sidebar

### Phase B: Content & Learning (Week 3-4)
- [ ] Build section/lesson CRUD
- [ ] Build lesson viewer (markdown + video embed)
- [ ] Build enrollment flow
- [ ] Build progress tracking
- [ ] Build course builder (instructor)

### Phase C: Assessment & Certificates (Week 5-6)
- [ ] Build assessment engine (quiz types)
- [ ] Build assessment player UI
- [ ] Build certificate templates
- [ ] Build certificate issuance + verification
- [ ] Build certificate PDF download

### Phase D: Integration (Week 7-8)
- [ ] Skill sync: course completion → Skill Tree proficiency update
- [ ] Certificate sync: auto-populate MasterProfile.Certification
- [ ] Gap analysis → course recommendations
- [ ] Classroom ↔ CLM course linking
- [ ] Unified progress dashboard (CVMaker scores + CLM progress)

### Phase E: Advanced Features (Week 9-10)
- [ ] Learning paths
- [ ] AI quiz generation
- [ ] Discussion forums
- [ ] Gamification (XP, streaks)
- [ ] Instructor analytics
- [ ] Admin LMS dashboard

### Phase F: Polish & Production (Week 11-12)
- [ ] i18n (EN/VI) for all CLM strings
- [ ] Mobile responsive
- [ ] Performance optimization
- [ ] Security audit
- [ ] Production deployment
- [ ] Documentation

---

## Appendix A: File Naming Convention

Following CVMaker's established patterns:

```
src/lib/
├── clm-course-service.ts
├── clm-enrollment-service.ts
├── clm-assessment-service.ts
├── clm-certificate-service.ts
├── clm-progress-service.ts
├── clm-learning-path-service.ts
├── clm-discussion-service.ts
└── clm-integration-service.ts

src/components/lms/
├── course-card.tsx
├── course-builder.tsx
├── lesson-viewer.tsx
├── assessment-player.tsx
└── (kebab-case, descriptive names)

src/app/api/lms/
├── courses/route.ts
├── courses/[slug]/route.ts
├── lessons/[id]/progress/route.ts
└── (Next.js App Router conventions)
```

## Appendix B: Environment Variables (New for CLM)

```env
# Media Storage (Phase 2)
MEDIA_STORAGE_TYPE=local          # local | s3 | r2
S3_BUCKET=clm-media
S3_REGION=ap-southeast-1
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx

# Video (optional)
YOUTUBE_API_KEY=xxx               # for video metadata fetch

# Certificates
CERTIFICATE_SIGNING_KEY=xxx       # for verification signatures
```

## Appendix C: Key Decisions & Constraints

| Decision | Rationale |
|----------|-----------|
| Modular monolith (not microservices) | Same team, same DB, simpler ops, split later if needed |
| Same Next.js app | Shared auth, shared UI components, shared AI, faster development |
| `/lms/` route prefix | Clean separation from CVMaker routes, easy to extract later |
| `/api/lms/` API prefix | Namespaced API, no collision with existing 80+ CVMaker endpoints |
| Shared Prisma schema | Single source of truth, foreign keys across systems work naturally |
| Reuse SkillTreeNode | Skills are the bridge — courses teach them, CVMaker measures them |
| Reuse Organization | Classrooms already exist, CLM courses belong to same orgs |
| Video as embeds (Phase 1) | Avoid media storage complexity initially |
| Tailwind v3 (not v4) | Must match CVMaker — all components are Tailwind v3 compatible |
| pdf-parse v1.1.1 | Must match CVMaker constraint — v2 has breaking changes |
| Lucide React icons only | Ecosystem-wide consistency |
| EN/VI i18n | Same language support as CVMaker |

---

*This document is the single source of truth for CLM development. Update it as architecture decisions evolve.*
