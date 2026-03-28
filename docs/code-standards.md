# Code Standards & Codebase Structure

## Directory Structure

```
src/
├── app/                           # Next.js App Router
│   ├── api/cma/                   # CMA API routes
│   │   ├── accounts/              # Platform account management
│   │   ├── calendar/              # Calendar endpoint
│   │   ├── posts/                 # Post CRUD + publish/schedule
│   │   │   └── [id]/
│   │   │       ├── publish/       # POST /api/cma/posts/[id]/publish
│   │   │       └── schedule/      # POST/PATCH/DELETE /api/cma/posts/[id]/schedule
│   │   ├── media/                 # Asset upload
│   │   ├── org/                   # Organization settings
│   │   └── preview/               # Content preview
│   ├── admin/
│   │   └── cma/
│   │       ├── layout.tsx
│   │       ├── dashboard/
│   │       ├── calendar/          # FullCalendar integration
│   │       └── posts/
│   └── layout.tsx                 # Root layout
├── components/                    # Reusable React components
│   ├── cma/
│   │   ├── post-editor.tsx        # Markdown editor + platform selector
│   │   ├── cma-calendar-event.tsx # Calendar event widget
│   │   ├── calendar-widget.tsx    # Calendar container
│   │   └── ...
│   └── ui/                        # Generic UI (inputs, buttons, etc.)
├── lib/                           # Business logic & utilities
│   ├── prisma-client.ts           # Prisma instance
│   ├── cma/
│   │   ├── services/
│   │   │   ├── pgboss-service.ts         # Job queue lifecycle
│   │   │   ├── scheduling-service.ts     # Post scheduling logic
│   │   │   ├── publishing-service.ts     # Immediate publish logic
│   │   │   ├── post-service.ts           # Post CRUD
│   │   │   └── org-auth.ts               # Multi-tenant auth
│   │   ├── adapters/
│   │   │   ├── adapter-registry.ts       # Adapter registry
│   │   │   ├── platform-adapter.ts       # Base interface
│   │   │   └── wordpress-adapter.ts      # WordPress implementation
│   │   ├── hooks/
│   │   │   └── use-cma-org.ts            # Org context hook
│   │   ├── use-cma-api.ts                # CMA API client hook
│   │   └── ...
│   └── utils/                     # Generic utilities
├── instrumentation.ts             # Next.js startup hook (pg-boss init)
├── middleware.ts                  # Auth & org context middleware
└── types/                         # TypeScript type definitions
```

---

## Naming Conventions

### Files
- **kebab-case** for all `.ts`, `.tsx`, `.js`, `.jsx` files
- Descriptive names: `post-editor.tsx` (not `editor.tsx`), `pgboss-service.ts` (not `queue.ts`)
- API routes: match Next.js conventions — `[id]/route.ts`, `[id]/publish/route.ts`

### Variables & Functions
- **camelCase** for variables, functions, methods
- **PascalCase** for React components, classes, types
- **UPPER_SNAKE_CASE** for constants

```typescript
// ✅ Good
const postId = "post-123";
function schedulePost(postId: string, scheduledAt: Date) { }
const QUEUE_SCHEDULED_PUBLISH = "cma-scheduled-publish";

// ❌ Bad
const PostId = "post-123";
function schedule_post() { }
const queueScheduledPublish = "cma-scheduled-publish";
```

### Database & Prisma
- **camelCase** for Prisma field names
- **snake_case** for actual DB column names (Prisma's `@map` decorator)
- **PascalCase** for model names

```prisma
model CmaPost {
  id        String   @id @default(cuid())
  orgId     String
  status    String   @default("draft")
  pgBossJobId String?

  @@map("cma_posts")  // DB table name
}
```

---

## Code Quality Standards

### TypeScript
- Use strict mode (no `any` without reason)
- Define return types on public functions
- Use discriminated unions over optional fields where possible
- Import types with `import type`

```typescript
// ✅ Good
import type { CmaPost } from "@prisma/client";

async function schedulePost(
  postId: string,
  scheduledAt: Date
): Promise<{ pgBossJobId: string }> {
  // ...
}

// ❌ Bad
async function schedulePost(postId, scheduledAt) {
  // implicit return, no type safety
}
```

### Error Handling
- Use try-catch for async operations
- Log errors with context (include IDs, operation name)
- Return structured error responses from APIs
- Never swallow errors silently (log or re-throw)

```typescript
// ✅ Good
try {
  await enqueueScheduledPublish(postId, accountId, orgId, scheduledAt);
} catch (err) {
  console.error(`[scheduling] Failed to enqueue job for post ${postId}:`, err);
  throw err; // or handle specifically
}

// ❌ Bad
try {
  await enqueueScheduledPublish(...);
} catch (err) {
  // silent fail
}
```

### Logging
- Use consistent log prefixes: `[service-name]`
- Log at appropriate levels: `info`, `warn`, `error`
- Include contextual IDs in log messages

```typescript
// ✅ Good
console.log("[pg-boss] Started successfully");
console.error("[scheduling] Failed to publish post ${data.postId}: ${result.error}");

// ❌ Bad
console.log("Started");
console.error("Error occurred");
```

### Comments
- Explain "why", not "what"
- Use for non-obvious logic, architectural decisions, edge cases
- Keep comments near the code they describe

```typescript
// ✅ Good
// Uses optimistic locking to prevent concurrent schedule attempts
const lockResult = await prisma.cmaPost.updateMany({
  where: { id: postId, orgId, status: { in: ["draft", "approved", "failed"] } },
  data: { status: "scheduled", scheduledAt },
});

// ❌ Bad
// Update the post
const lockResult = await prisma.cmaPost.updateMany({...});
```

### File Size Limit
- **Target:** Keep files under 200 lines
- **Exceptions:** Schemas, generated files, config files
- **Strategy:** Extract utilities into separate modules, use composition

---

## API Route Patterns

### Structure
All API routes follow Next.js App Router conventions:

```typescript
// src/app/api/cma/posts/[id]/schedule/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Validate auth & org context
    // 2. Parse request body
    // 3. Call service layer
    // 4. Return success response
    return NextResponse.json({ ... });
  } catch (err) {
    console.error("[api/cma/posts/schedule] Error:", err);
    return NextResponse.json(
      { error: "Failed to schedule post", details: (err as Error).message },
      { status: 500 }
    );
  }
}
```

### Response Format
- **Success:** `{ data: ... }` with appropriate status (200, 201, etc.)
- **Error:** `{ error: string, details?: string }` with status >= 400

```typescript
// ✅ Success response
return NextResponse.json(
  { data: { pgBossJobId: "job-123" } },
  { status: 201 }
);

// ❌ Error response
return NextResponse.json(
  { error: "Post not found" },
  { status: 404 }
);
```

---

## React Component Patterns

### Functional Components
- Use hooks for state & effects
- Keep components under 150 lines (consider composition)
- Props should be typed with interfaces

```typescript
// ✅ Good
interface CMACalendarEventProps {
  postId: string;
  title: string;
  scheduledAt: Date;
  onReschedule: (newDate: Date) => Promise<void>;
}

export function CMACalendarEvent({
  postId,
  title,
  scheduledAt,
  onReschedule,
}: CMACalendarEventProps) {
  const [isRescheduling, setIsRescheduling] = useState(false);

  return (
    <div className="event-card">
      {/* Component JSX */}
    </div>
  );
}
```

### Custom Hooks
- Prefix with `use`
- Return objects with descriptive property names
- Handle loading and error states

```typescript
// ✅ Good hook
export function useCMAOrg() {
  const [org, setOrg] = useState<Org | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Load org data
  }, []);

  return { org, isLoading, error };
}
```

---

## Service Layer Patterns

### Services (Business Logic)
- **Purpose:** Implement business rules, coordinate DB access, external APIs
- **Pattern:** Export async functions, not classes (unless state needed)
- **Naming:** Verb-based: `schedulePost()`, `publishPost()`, `cancelScheduledJob()`

```typescript
// ✅ Good service structure
export async function schedulePost(
  postId: string,
  accountId: string,
  orgId: string,
  scheduledAt: Date
): Promise<{ pgBossJobId: string }> {
  // Validate inputs
  if (scheduledAt <= new Date()) {
    throw new Error("Scheduled time must be in the future");
  }

  // Call infrastructure (DB, queue)
  const jobId = await enqueueScheduledPublish(postId, accountId, orgId, scheduledAt);

  // Return result
  return { pgBossJobId: jobId };
}
```

### Error Handling in Services
- Throw descriptive errors (consumed by API routes)
- Include context in error messages
- Use compensation transactions for rollback

```typescript
// ✅ Good
try {
  pgBossJobId = await enqueueScheduledPublish(...);
} catch (err) {
  // Compensate: revert status to draft
  await prisma.cmaPost.update({
    where: { id: postId },
    data: { status: "draft", scheduledAt: null },
  });
  throw err;
}
```

---

## Multi-Tenancy Patterns

### Always Scope by orgId
Every query must include `orgId` filter to ensure org isolation:

```typescript
// ✅ Good
const post = await prisma.cmaPost.findFirst({
  where: { id: postId, orgId }, // ← ALWAYS include orgId
});

// ❌ Bad (data leak risk)
const post = await prisma.cmaPost.findUnique({
  where: { id: postId }, // Missing orgId scope
});
```

### Org Context Validation
- Use `useOrgContext()` hook in components
- Validate in middleware or service layer
- Never trust client-provided orgId — validate from session

```typescript
// ✅ Good
export async function POST(request: NextRequest) {
  const session = await auth(); // get session
  const orgId = session?.org?.id; // from session, never from body

  if (!orgId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { postId } = await request.json();
  await schedulePost(postId, orgId, ...); // pass orgId from session
}
```

---

## Testing Standards

### Unit Tests
- Test service functions independently
- Mock Prisma for unit tests
- Test error cases

```typescript
// ✅ Good test
it("schedulePost should throw if scheduled time is in past", async () => {
  const pastDate = new Date(Date.now() - 1000);
  await expect(
    schedulePost("post-1", "account-1", "org-1", pastDate)
  ).rejects.toThrow("Scheduled time must be in the future");
});
```

### Integration Tests
- Test API routes with real DB (or test DB)
- Verify org isolation
- Test happy path & error scenarios

---

## Prisma Best Practices

### Queries
- Use `findFirst` with `where` instead of `findUnique` for complex filters
- Use `updateMany` for optimistic locking
- Always include `orgId` in `where` clauses

```typescript
// ✅ Good
const lockResult = await prisma.cmaPost.updateMany({
  where: { id: postId, orgId, status: "draft" },
  data: { status: "scheduled", scheduledAt },
});

if (lockResult.count === 0) {
  throw new Error("Post not found or cannot be scheduled");
}
```

### Indexes
- Add indexes on frequently filtered fields
- Example: `scheduledAt` for calendar queries, `orgId` for org-scoped queries

```prisma
model CmaPost {
  // ...
  @@index([orgId])
  @@index([scheduledAt])
}
```

---

## Deployment & Environment

### Environment Variables
- Store in `.env.local` (never commit)
- Document in `.env.example`
- Required vars: `DATABASE_URL`, `NEXTAUTH_SECRET`

### Build & Runtime
- Compile with `npm run build`
- Run with `npm run dev` (dev) or `npm start` (production)
- Linting: `npm run lint` (ESLint)

---

## Security Standards

### Input Validation
- Validate all user input (query params, request body)
- Use Prisma for SQL injection prevention (no raw SQL)
- Sanitize markdown content before storing/rendering

### Auth & Multi-Tenancy
- Always validate org context from session, never from user input
- Use NextAuth.js for authentication
- Middleware enforces auth on protected routes

### Sensitive Data
- Never log passwords, tokens, API keys
- Use environment variables for secrets
- Mask sensitive data in error messages

---

## Build & Lint Rules

### ESLint
- Configuration: `.eslintrc.json`
- Run: `npm run lint`
- Fix: `npx eslint . --fix`
- Enforce: required before commit

### TypeScript
- Strict mode enabled
- No `any` without comment
- Compile: `npm run build`

