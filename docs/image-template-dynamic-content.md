# Image Template — Dynamic Content Guide

How to use the visual template editor's output as an image service where
text/colors/images are supplied at request time (from a Zalo bot, a
scheduler, the composer UI, or any API caller).

Example template used below: **MAF-DAILY**
(id `cmnu7189j000613ug4h243vmj`, authCode `cmnu7189j000713ug5cveucms`)

## 1. How variables work

Every text, image, and rect layer in a template can embed variables as
`{{tokenName}}`. At render time the server substitutes each token with the
value supplied by the caller, either as a query-string parameter on the
Direct URL or as a field in the POST body of the render API.

MAF-DAILY today declares four variables (see `variableSchema` column):

| Name | Type | Required | Default | Used in |
|------|------|----------|---------|---------|
| `title` | text | yes | "Enter your headline" | title text layer |
| `subtitle` | text | no | "Supporting text" | (not referenced yet) |
| `imageUrl` | image | no | — | (not referenced yet) |
| `accentColor` | color | no | `#6366f1` | (not referenced yet) |

Today only `title` is wired into a layer (`layerData.layers[1].text = "{{title}}"`).
The other three are declared but unused — they're ready to be wired into
layers via the editor whenever you want (e.g., swap the background image
to `{{imageUrl}}`, add a subtitle text layer bound to `{{subtitle}}`, etc.).

## 2. Direct URL — the one true way to render

**Pattern:**

```
https://clm.tonytechlab.com/api/cma/image-templates/{templateId}/image
  ?auth={authCode}
  &title={value}
  &{anyOtherVar}={value}
```

- URL-encode every value (space → `%20`, Vietnamese → `%E1%BA%A1` etc.)
- `auth` is required — it's the template's authCode (rotatable if leaked)
- Any declared variable can be passed; unknown query params are ignored
- Missing required variables return HTTP 400

**Example — render MAF-DAILY with a custom title:**

```
https://clm.tonytechlab.com/api/cma/image-templates/cmnu7189j000613ug4h243vmj/image?auth=cmnu7189j000713ug5cveucms&title=S%C3%A1ng%20nay%20ch%E1%BA%A1y%2010km
```

Returns a 2400×1260 PNG with "Sáng nay chạy 10km" in the top-right, the
runners photo as background, and the MAF.RUN watermark locked in place.

**Cache headers:** `Cache-Control: public, max-age=86400, s-maxage=604800,
immutable`. The same query string always renders the same image so CDNs
cache it for a week. Change one character and you get a fresh render.

**Use it anywhere a public image URL fits:**

- `<img src="...">` in any page
- og:image / twitter:image meta tags
- Slack / Discord embeds
- Facebook Graph API `photos` endpoint (used by the publish pipeline)
- Email newsletter image src
- Any third-party tool that accepts an image URL

## 3. From the CMA post composer (UI flow)

1. Open **Composer** → new draft or edit existing post
2. Click the **Featured Image** area → modal opens
3. Click the **Template** tab
4. Pick MAF-DAILY → variable form shows fields for each declared variable
5. Type values → live preview updates at 500ms debounce
6. Click **Use as Featured Image** → the Direct URL is stored on the post
7. Save the post → when you publish, Facebook/WordPress/Zalo adapters
   fetch the PNG via the Direct URL and upload it like any other image

No extra steps — the existing picker panel already handles this.

## 4. From the API (programmatic, headless)

Use an API key (`Authorization: Bearer clm_...`). Any service you own —
scheduler, cron job, Zalo bot, external automation — can call this flow.

**Step 1 — build the Direct URL with your dynamic content:**

```js
const template = {
  id: "cmnu7189j000613ug4h243vmj",
  authCode: "cmnu7189j000713ug5cveucms",
};

function buildDirectUrl(template, variables) {
  const params = new URLSearchParams({ auth: template.authCode });
  for (const [k, v] of Object.entries(variables)) {
    if (v !== undefined && v !== "") params.set(k, v);
  }
  return `https://clm.tonytechlab.com/api/cma/image-templates/${template.id}/image?${params}`;
}

const directUrl = buildDirectUrl(template, {
  title: "Sáng nay chạy 10km",
});
```

**Step 2 — create a CmaPost draft with that URL as featuredImage:**

```bash
curl -X POST https://clm.tonytechlab.com/api/cma/posts \
  -H "Authorization: Bearer clm_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "cmn9w9pwf0001mfkrrc469lwo",
    "title": "Nhật ký chạy — 11/04",
    "content": "Post body...",
    "contentFormat": "markdown",
    "featuredImage": "<the Direct URL from step 1>",
    "source": "zalo_bot"
  }'
```

Response: `{ "id": "cmNewPostId", ... }`.

**Step 3 — publish immediately OR schedule:**

```bash
# Immediate publish
curl -X POST https://clm.tonytechlab.com/api/cma/posts/{postId}/publish \
  -H "Authorization: Bearer clm_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "cmn9w9pwf0001mfkrrc469lwo",
    "accountId": "cmni66m11000151a2o99r11sj"
  }'

# Schedule for later
curl -X POST https://clm.tonytechlab.com/api/cma/posts/{postId}/schedule \
  -H "Authorization: Bearer clm_YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orgId": "cmn9w9pwf0001mfkrrc469lwo",
    "accountId": "cmni66m11000151a2o99r11sj",
    "scheduledAt": "2026-04-12T06:00:00+07:00"
  }'
```

## 5. Zalo bot integration — `/daily` command (shipped)

The Zalo message router (`src/lib/zalo/zalo-message-router.ts`) now
ships with a `/daily` command that wires dynamic template content into
a single round-trip publish flow. Send from Zalo:

```
/daily Sáng nay chạy 10km, cảm giác tuyệt vời!
```

Bot response:

```
🎉 Published to tonytechlab.com

Title: Sáng nay chạy 10km, cảm giác tuyệt vời!
🔗 https://www.facebook.com/122179.........
```

**What happens server-side (no additional code needed):**

1. Router parses the `/daily <text>` prefix
2. Looks up the MAF-DAILY template for the org (org-owned first, then
   system fallback — each org can have its own MAF-DAILY clone)
3. Picks the first active Facebook account for the org, respecting the
   Zalo user's `allowedAccountIds` list
4. Runs the publish spam guard (same rate limits `/approve fb` uses)
5. Builds the Direct URL with the message text as the `{{title}}`
   query parameter (URLSearchParams handles UTF-8 encoding so Vietnamese
   works — no mojibake because the text bypasses the editor's textarea)
6. Creates a `CmaPost` draft with that URL as `featuredImage`
7. Immediately calls `publishPost` — no draft/approve step
8. Replies with the FB URL on success or an actionable error otherwise

**Which template:** the handler looks up a row named exactly
"MAF-DAILY" (case-sensitive). To use a different template per org,
create it in Image Studio with that exact name. To extend the command
to pick different templates, see the source at
`src/lib/zalo/zalo-message-router.ts` (search for `/daily`).

**Building your own command:** if you want a parallel command like
`/promo`, copy the `/daily` branch and swap the template lookup + the
target platform. The pattern is: resolve template → pick account →
spam guard → build Direct URL → create post → publish.

## 5b. Raw API pattern (for non-Zalo callers)

If you're integrating from a scheduler, a cron, or an external service
(not Zalo), use the same underlying primitives:

```ts
// Server-side or authenticated API-key flow
const template = await prisma.cmaImageTemplate.findUnique({
  where: { id: "cmnu7189j000613ug4h243vmj" },
});

const params = new URLSearchParams({
  auth: template.authCode,
  title: "Sáng nay chạy 10km",
});
const directUrl = `https://clm.tonytechlab.com/api/cma/image-templates/${template.id}/image?${params}`;

const post = await prisma.cmaPost.create({
  data: {
    orgId, authorId, title: "Sáng nay", content: "...",
    contentFormat: "markdown", source: "scheduler",
    featuredImage: directUrl, status: "draft",
  },
});

await publishPost({ postId: post.id, accountId: fbAccountId, orgId });
```

This is exactly what the `/daily` handler does — you're just calling
the same functions from a different entry point.

## 6. Scheduler / cron pattern

pg-boss is already set up (see `src/lib/cma/services/pgboss-service.ts`).
For a daily running journal post:

1. Create a recurring job that fires once per day
2. In the handler: fetch today's running data from wherever it lives
   (a DB table, an external API like Strava, a Google Sheet, etc.)
3. Build the Direct URL with the fetched content as `title`
4. Create + publish a CmaPost the same way the Zalo handler does

Or simpler — use `POST /api/cma/posts/{id}/schedule` to queue a post for
a specific time and let pg-boss pick it up.

## 7. Adding more variables to an existing template

Option A — in the visual editor:

1. Open the editor for MAF-DAILY
2. Click the **Variables** tab in the right panel → Add → give it a name
3. Click a text layer → in the content textarea, use the **Insert var...**
   dropdown to embed `{{yourNewVar}}` at the cursor
4. Save — the compiler re-derives `htmlContent` from the layer tree

Option B — via SQL (faster but bypasses the editor):

```sql
-- Add a new variable to the schema
UPDATE "CmaImageTemplate"
SET "variableSchema" = "variableSchema" || '[{
  "name": "eyebrow",
  "type": "text",
  "label": "Eyebrow",
  "required": false,
  "defaultValue": "NHẬT KÝ"
}]'::jsonb
WHERE id = 'cmnu7189j000613ug4h243vmj';
```

Then either edit the layer tree in the visual editor to reference
`{{eyebrow}}` or patch `layerData` directly and call
`POST /api/cma/image-templates/regenerate-thumbnails` to recompile.

## 8. Security notes

- **authCode** gates the Direct URL. It's a random string stored on the
  template row — rotate it if leaked:
  ```sql
  UPDATE "CmaImageTemplate"
  SET "authCode" = gen_random_uuid()::text
  WHERE id = '...';
  ```
  Every old Direct URL instantly returns 401.

- **SSRF protection** is enforced on any variable whose name contains
  `url` or `image` — private/internal IPs (10.x, 192.168.x, 127.x, etc.)
  are blocked at render time.

- **Color validation** is enforced on any variable whose name contains
  `color` — must be a 3-8 digit hex value.

- **Rate limiting** — API keys have a 60 req/min cap per key. For
  high-volume automation, cache the rendered URLs via the 1-day browser /
  7-day CDN headers the Direct URL already sets.

## 9. Gotchas

- **Vietnamese / non-ASCII content** must be URL-encoded properly. In
  Node use `encodeURIComponent` or `URLSearchParams`. In Bash use
  `python -c "import urllib.parse; print(urllib.parse.quote('Sáng nay'))"`.
- **Text layers on the visual editor are currently storing Vietnamese
  input as double-encoded UTF-8 (mojibake)** — known bug, patched manually
  for MAF-DAILY. Until fixed, it's safer to pass Vietnamese content via
  the Direct URL `?title=` query string (where encoding is well-defined)
  rather than typing directly into the editor's textarea.
- **Tokens in image src** must be the entire value, e.g., `src: "{{imageUrl}}"`.
  Partial substitutions like `src: "https://cdn.example.com/{{slug}}.png"`
  work for text/rect but the compiler's conditional-emit optimization
  only skips the img tag when the src is a pure token.

## 10. Related files

- `src/lib/cma/services/template-layer-compiler.ts` — layerData → HTML
- `src/lib/cma/services/image-template-renderer-service.ts` — HTML → PNG via Puppeteer
- `src/app/api/cma/image-templates/[id]/image/route.ts` — Direct URL endpoint
- `src/app/api/cma/image-templates/regenerate-thumbnails/route.ts` — batch regen
- `src/lib/cma/services/publishing-service.ts` — cross-platform publish
- `src/lib/zalo/zalo-message-router.ts` — Zalo incoming handler
- `src/lib/cma/services/pgboss-service.ts` — scheduled job queue

## Unresolved

- Editor save path currently double-encodes Vietnamese text in layer
  content — untraced; mitigation above.
- No dedicated "render with variables" form in the Image Studio itself
  (the CMA composer's featured image picker is the existing UI for
  end-user variable filling).
