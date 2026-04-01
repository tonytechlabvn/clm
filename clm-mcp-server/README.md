# CLM MCP Server

MCP server that publishes markdown content to CLM (Content Learning Management) which auto-publishes to WordPress. Works with Claude Desktop and VS Code.

## Prerequisites

- Node.js 18+
- A running CLM instance with API key auth enabled (`ENABLE_API_KEY_AUTH=true`)
- An API key generated via CLM's `/api/cma/api-keys` endpoint

## Quick Start

```bash
cd clm-mcp-server
npm install
npm run build
```

## Generate an API Key

```bash
# Create an API key (requires an active CLM session)
curl -X POST http://localhost:3000/api/cma/api-keys \
  -H "Cookie: next-auth.session-token=YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{"orgId": "YOUR_ORG_ID", "name": "MCP Server Key"}'
```

Save the returned `key` value — it is shown only once.

## Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLM_API_URL` | Yes | CLM server URL (e.g., `http://localhost:3000`) |
| `CLM_API_KEY` | Yes | API key starting with `clm_` |
| `CLM_DEFAULT_ORG_ID` | No | Default organization ID (can be overridden per-request) |

### Claude Desktop

Add to `%APPDATA%\Claude\claude_desktop_config.json` (Windows) or `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "clm": {
      "command": "node",
      "args": ["/absolute/path/to/clm-mcp-server/dist/index.js"],
      "env": {
        "CLM_API_URL": "http://localhost:3000",
        "CLM_API_KEY": "clm_your_key_here",
        "CLM_DEFAULT_ORG_ID": "your_org_id"
      }
    }
  }
}
```

### VS Code

Create `.vscode/mcp.json` in your project root:

```json
{
  "servers": {
    "clm": {
      "command": "node",
      "args": ["${workspaceFolder}/clm-mcp-server/dist/index.js"],
      "env": {
        "CLM_API_URL": "http://localhost:3000",
        "CLM_API_KEY": "clm_your_key_here",
        "CLM_DEFAULT_ORG_ID": "your_org_id"
      }
    }
  }
}
```

> **Warning:** If VS Code Settings Sync is enabled, `.vscode/mcp.json` may sync your API key to the cloud. Add it to `.gitignore` and consider using environment variables instead.

## Available Tools

### `clm_post_publish`
Parse markdown with frontmatter, create post in CLM, and auto-publish to WordPress.

### `clm_post_draft`
Same as publish but saves as draft for review.

### `clm_post_status`
Check the publish status of an existing post.

### `clm_templates_list`
List available content templates.

### `clm_accounts_list`
List connected WordPress accounts.

## Markdown Frontmatter

Write markdown files with YAML frontmatter:

```markdown
---
title: "My Blog Post"
template: "tech-blog"
account: "account_id_here"
tags: ["javascript", "tutorial"]
category: "Development"
featured_image: "https://example.com/image.jpg"
excerpt: "A short summary of the post"
---

Your markdown content here...
```

| Field | Required | Description |
|-------|----------|-------------|
| `title` | Yes | Post title |
| `template` | No | CLM template slug |
| `account` | No | WordPress account ID (can pass via tool param instead) |
| `tags` | No | Array of tag strings |
| `category` | No | Category name |
| `featured_image` | No | URL to featured image |
| `excerpt` | No | Post excerpt/summary |

## Troubleshooting

**"CLM_API_KEY environment variable is required"**
Set the `CLM_API_KEY` in your MCP client config (see Configuration above).

**"Invalid or expired API key" (401)**
Your API key may be revoked or expired. Generate a new one via the CLM API.

**"Rate limit exceeded" (429)**
API keys are limited to 60 requests per minute. Wait and retry.

**"API key not authorized for this organization" (403)**
The API key is tied to a specific organization. Check `CLM_DEFAULT_ORG_ID` matches.

**Server not appearing in client**
1. Verify `npm run build` succeeds
2. Check the path to `dist/index.js` is absolute (Claude Desktop) or uses `${workspaceFolder}` (VS Code)
3. Restart the MCP client after config changes

## Development

```bash
npm run dev    # Run with tsx (hot reload)
npm run build  # Compile TypeScript
npm start      # Run compiled version
```

## License

MIT
