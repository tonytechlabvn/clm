# CMA API Reference

Complete API documentation for the Content Management Application (CMA). All endpoints are scoped to organization context (derived from authenticated session).

---

## Base URL

```
http://localhost:3000/api/cma  (development)
https://api.tonytechlab.com/api/cma  (production)
```

---

## Authentication

All endpoints require valid NextAuth.js session with org context.

**Session Structure:**
```typescript
{
  user: { id, email, name },
  org: { id, name }  // Required for all CMA endpoints
}
```

**Unauthorized Response:**
```json
{
  "error": "Unauthorized",
  "details": "Valid session required"
}
```

HTTP Status: `401 Unauthorized`

---

## Posts API

### Create Post

**Endpoint:** `POST /posts`

**Request Body:**
```json
{
  "title": "My First Post",
  "content": "# Markdown content here\n\nSupports **bold**, *italic*, etc.",
  "description": "Optional short description for preview",
  "platformIds": ["platform-123"]  // Optional: pre-select platforms
}
```

**Success Response:** `201 Created`
```json
{
  "data": {
    "id": "post-abc123",
    "orgId": "org-xyz789",
    "title": "My First Post",
    "content": "# Markdown content here...",
    "status": "draft",
    "createdAt": "2026-03-28T10:30:00Z",
    "updatedAt": "2026-03-28T10:30:00Z",
    "scheduledAt": null,
    "pgBossJobId": null
  }
}
```

**Error Responses:**
- `400 Bad Request` — Missing required fields (title, content)
- `401 Unauthorized` — No valid session
- `500 Internal Server Error` — Database error

---

### List Posts

**Endpoint:** `GET /posts`

**Query Parameters:**
```
?status=draft              (filter by status: draft|scheduled|published|failed)
?platformId=platform-123  (filter by linked platform)
?limit=20                 (pagination, default 50)
?offset=0                 (offset for pagination)
```

**Success Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "post-abc123",
      "title": "My First Post",
      "status": "draft",
      "scheduledAt": null,
      "createdAt": "2026-03-28T10:30:00Z",
      "platforms": [
        {
          "accountId": "account-xyz",
          "platform": "wordpress",
          "isLinked": true
        }
      ]
    },
    {
      "id": "post-def456",
      "title": "Scheduled Post",
      "status": "scheduled",
      "scheduledAt": "2026-03-30T15:00:00Z",
      "pgBossJobId": "job-12345",
      "createdAt": "2026-03-28T11:00:00Z"
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

**Error Responses:**
- `401 Unauthorized` — No valid session
- `500 Internal Server Error` — Database error

---

### Fetch Post

**Endpoint:** `GET /posts/[id]`

**URL Parameters:**
- `id` (string, required) — Post ID

**Success Response:** `200 OK`
```json
{
  "data": {
    "id": "post-abc123",
    "orgId": "org-xyz789",
    "title": "My First Post",
    "content": "# Markdown content here",
    "contentHtml": "<h1>Markdown content here</h1>",
    "status": "draft",
    "createdAt": "2026-03-28T10:30:00Z",
    "updatedAt": "2026-03-28T10:30:00Z",
    "scheduledAt": null,
    "pgBossJobId": null,
    "platforms": [
      {
        "accountId": "account-xyz",
        "platform": "wordpress",
        "publishedUrl": null,
        "publishedId": null
      }
    ]
  }
}
```

**Error Responses:**
- `401 Unauthorized` — No valid session
- `404 Not Found` — Post not found or belongs to different org
- `500 Internal Server Error` — Database error

---

### Update Post

**Endpoint:** `PATCH /posts/[id]`

**URL Parameters:**
- `id` (string, required) — Post ID

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "content": "# Updated markdown content",
  "description": "Updated description",
  "platformIds": ["platform-123", "platform-456"]
}
```

**Success Response:** `200 OK`
```json
{
  "data": {
    "id": "post-abc123",
    "title": "Updated Title",
    "content": "# Updated markdown content",
    "status": "draft",
    "updatedAt": "2026-03-28T11:00:00Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` — Invalid input
- `401 Unauthorized` — No valid session
- `404 Not Found` — Post not found
- `409 Conflict` — Cannot edit post in "publishing" or "published" status
- `500 Internal Server Error` — Database error

---

### Delete Post

**Endpoint:** `DELETE /posts/[id]`

**URL Parameters:**
- `id` (string, required) — Post ID

**Success Response:** `200 OK`
```json
{
  "data": {
    "message": "Post deleted successfully"
  }
}
```

**Error Responses:**
- `401 Unauthorized` — No valid session
- `404 Not Found` — Post not found
- `409 Conflict` — Cannot delete post in "publishing" or "published" status
- `500 Internal Server Error` — Database error

---

## Publishing API

### Publish Post (Immediate)

**Endpoint:** `POST /posts/[id]/publish`

**URL Parameters:**
- `id` (string, required) — Post ID

**Request Body:** (optional)
```json
{
  "platformIds": ["platform-123"]  // Optional: override linked platforms
}
```

**Success Response:** `202 Accepted`
```json
{
  "data": {
    "id": "post-abc123",
    "status": "publishing",
    "platforms": [
      {
        "platform": "wordpress",
        "status": "pending"
      }
    ]
  }
}
```

**Success Response (After Publication):** `200 OK`
```json
{
  "data": {
    "id": "post-abc123",
    "status": "published",
    "platforms": [
      {
        "platform": "wordpress",
        "publishedUrl": "https://example.com/posts/my-first-post",
        "publishedId": "wordpress-post-123"
      }
    ]
  }
}
```

**Error Responses:**
- `400 Bad Request` — No platforms linked
- `401 Unauthorized` — No valid session
- `404 Not Found` — Post not found
- `409 Conflict` — Post in invalid state for publishing
- `500 Internal Server Error` — Publishing failed

---

## Scheduling API

### Schedule Post

**Endpoint:** `POST /posts/[id]/schedule`

**URL Parameters:**
- `id` (string, required) — Post ID

**Request Body:**
```json
{
  "scheduledAt": "2026-03-30T15:00:00Z"  // ISO 8601, must be future time
}
```

**Validation:**
- `scheduledAt` must be > current time (error: `"Scheduled time must be in the future"`)
- Post must be in draft, approved, or failed status
- Platform account must be linked and active

**Success Response:** `201 Created`
```json
{
  "data": {
    "id": "post-abc123",
    "status": "scheduled",
    "scheduledAt": "2026-03-30T15:00:00Z",
    "pgBossJobId": "job-uuid-12345",
    "message": "Post scheduled for publication"
  }
}
```

**Error Responses:**
- `400 Bad Request` — Time in past, missing field, or invalid format
- `401 Unauthorized` — No valid session
- `404 Not Found` — Post not found or platform account inactive
- `409 Conflict` — Post cannot be scheduled from current status
- `500 Internal Server Error` — Job queue error (with compensation rollback)

---

### Reschedule Post

**Endpoint:** `PATCH /posts/[id]/schedule`

**URL Parameters:**
- `id` (string, required) — Post ID

**Request Body:**
```json
{
  "scheduledAt": "2026-03-31T10:00:00Z"  // New schedule time, must be future
}
```

**Behavior:**
1. Find existing job (pgBossJobId)
2. Cancel old job in pg-boss
3. Enqueue new job with new time
4. Update DB atomically
5. Rollback all changes if enqueue fails

**Success Response:** `200 OK`
```json
{
  "data": {
    "id": "post-abc123",
    "status": "scheduled",
    "scheduledAt": "2026-03-31T10:00:00Z",
    "pgBossJobId": "job-uuid-54321",
    "message": "Post rescheduled successfully"
  }
}
```

**Error Responses:**
- `400 Bad Request` — Time in past or invalid format
- `401 Unauthorized` — No valid session
- `404 Not Found` — Post not found or not in scheduled status
- `500 Internal Server Error` — Job queue error (with automatic rollback)

---

### Cancel Schedule

**Endpoint:** `DELETE /posts/[id]/schedule`

**URL Parameters:**
- `id` (string, required) — Post ID

**Behavior:**
1. Find post (must be scheduled)
2. Cancel pg-boss job (pgBossJobId)
3. Revert status to "draft"
4. Clear scheduledAt and pgBossJobId

**Success Response:** `200 OK`
```json
{
  "data": {
    "id": "post-abc123",
    "status": "draft",
    "scheduledAt": null,
    "pgBossJobId": null,
    "message": "Schedule cancelled; post reverted to draft"
  }
}
```

**Error Responses:**
- `401 Unauthorized` — No valid session
- `404 Not Found` — Post not found or not in scheduled status
- `500 Internal Server Error` — Job cancellation error

---

## Calendar API

### List Scheduled Posts

**Endpoint:** `GET /calendar`

**Query Parameters:**
```
?startDate=2026-03-28T00:00:00Z  (optional, filter by range)
?endDate=2026-03-31T23:59:59Z    (optional, filter by range)
?limit=100                        (default 100)
?offset=0                         (pagination)
```

**Behavior:**
- Returns posts with `status="scheduled"`
- If date range provided, filters by `scheduledAt`
- Sorted by `scheduledAt` ascending
- Includes all scheduling metadata for calendar display

**Success Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "post-abc123",
      "title": "Morning Update",
      "scheduledAt": "2026-03-28T09:00:00Z",
      "status": "scheduled",
      "pgBossJobId": "job-uuid-12345",
      "platforms": [
        {
          "platform": "wordpress",
          "accountId": "account-xyz"
        }
      ]
    },
    {
      "id": "post-def456",
      "title": "Evening Digest",
      "scheduledAt": "2026-03-28T18:00:00Z",
      "status": "scheduled",
      "pgBossJobId": "job-uuid-54321"
    }
  ],
  "pagination": {
    "total": 127,
    "limit": 100,
    "offset": 0,
    "hasMore": true
  }
}
```

**Error Responses:**
- `401 Unauthorized` — No valid session
- `400 Bad Request` — Invalid date format
- `500 Internal Server Error` — Database error

---

## Platform Accounts API

### List Accounts

**Endpoint:** `GET /accounts`

**Success Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "account-xyz",
      "orgId": "org-abc",
      "platform": "wordpress",
      "siteUrl": "https://example.com",
      "isActive": true,
      "lastVerified": "2026-03-28T10:30:00Z"
    }
  ]
}
```

---

### Link Platform Account

**Endpoint:** `POST /accounts`

**Request Body:**
```json
{
  "platform": "wordpress",
  "siteUrl": "https://example.com",
  "username": "admin",
  "password": "app-specific-password"
}
```

**Success Response:** `201 Created`
```json
{
  "data": {
    "id": "account-xyz",
    "platform": "wordpress",
    "siteUrl": "https://example.com",
    "isActive": true
  }
}
```

---

### Deactivate Account

**Endpoint:** `DELETE /accounts/[id]`

**Success Response:** `200 OK`
```json
{
  "data": {
    "message": "Account deactivated"
  }
}
```

---

## Organization API

### Get Organization

**Endpoint:** `GET /org`

**Success Response:** `200 OK`
```json
{
  "data": {
    "id": "org-abc",
    "name": "My Organization",
    "createdAt": "2026-01-01T00:00:00Z",
    "settings": {
      "defaultTimezone": "America/New_York",
      "autoPublish": false
    }
  }
}
```

---

### Update Organization Settings

**Endpoint:** `PATCH /org`

**Request Body:**
```json
{
  "settings": {
    "defaultTimezone": "America/Los_Angeles",
    "autoPublish": false
  }
}
```

**Success Response:** `200 OK`
```json
{
  "data": {
    "id": "org-abc",
    "settings": {
      "defaultTimezone": "America/Los_Angeles",
      "autoPublish": false
    }
  }
}
```

---

## Error Handling

### Standard Error Format

All errors follow this format:

```json
{
  "error": "Error title",
  "details": "Additional context about what went wrong",
  "code": "ERROR_CODE"  // Optional: machine-readable error identifier
}
```

### Common HTTP Status Codes

| Code | Meaning | Recovery |
|------|---------|----------|
| 200 | Success | None |
| 201 | Created | None |
| 202 | Accepted (async) | Poll endpoint for status |
| 400 | Bad Request | Fix request payload |
| 401 | Unauthorized | Re-authenticate |
| 404 | Not Found | Verify resource ID, org context |
| 409 | Conflict | Resolve state conflict (e.g., can't edit published post) |
| 500 | Server Error | Retry; contact support if persistent |

### Retryable Errors
- `500 Internal Server Error` (transient issues)
- `503 Service Unavailable` (temporary maintenance)
- Network timeouts

Use exponential backoff: 1s → 2s → 4s → 8s (max 60s)

### Non-Retryable Errors
- `400 Bad Request` (fix payload)
- `401 Unauthorized` (re-authenticate)
- `403 Forbidden` (not authorized for resource)
- `404 Not Found` (resource doesn't exist)

---

## Rate Limiting

**Rate Limits (per org, per hour):**
- `POST /posts` — 1,000 requests
- `PATCH /posts/[id]` — 10,000 requests
- `POST /posts/[id]/publish` — 100 requests
- `POST /posts/[id]/schedule` — 100 requests
- All other endpoints — 10,000 requests

**Rate Limit Headers:**
```
X-RateLimit-Limit: 10000
X-RateLimit-Remaining: 9950
X-RateLimit-Reset: 1711600000
```

**Rate Limit Exceeded Response:** `429 Too Many Requests`
```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 3600
}
```

---

## Pagination

Endpoints that return lists support pagination:

**Query Parameters:**
- `limit` — Number of results (default 50, max 100)
- `offset` — Number of results to skip (default 0)

**Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 500,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## Timestamps

All timestamps are in **ISO 8601 format** with UTC timezone:
```
2026-03-28T14:30:45Z
```

Servers return UTC; clients should convert to local timezone using `date-fns-tz`.

---

## Examples

### Example: Schedule a Post

**Request:**
```bash
curl -X POST http://localhost:3000/api/cma/posts/post-abc123/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session-token>" \
  -d '{"scheduledAt": "2026-03-30T15:00:00Z"}'
```

**Response:**
```json
{
  "data": {
    "id": "post-abc123",
    "status": "scheduled",
    "scheduledAt": "2026-03-30T15:00:00Z",
    "pgBossJobId": "job-uuid-12345"
  }
}
```

### Example: Reschedule a Post

**Request:**
```bash
curl -X PATCH http://localhost:3000/api/cma/posts/post-abc123/schedule \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session-token>" \
  -d '{"scheduledAt": "2026-03-31T10:00:00Z"}'
```

**Response:**
```json
{
  "data": {
    "id": "post-abc123",
    "status": "scheduled",
    "scheduledAt": "2026-03-31T10:00:00Z",
    "pgBossJobId": "job-uuid-54321"
  }
}
```

---

## See Also

- `docs/system-architecture.md` — System design and data flows
- `docs/code-standards.md` — Code patterns and conventions
- `README.md` — Project overview

