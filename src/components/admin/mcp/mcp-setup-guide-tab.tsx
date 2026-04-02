"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Check, ExternalLink } from "lucide-react";

interface McpSetupGuideTabProps {
  orgId: string;
}

/** Reusable copy button with clipboard fallback (Red Team #3) */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  }

  if (error) {
    return (
      <span className="text-xs text-destructive">Copy failed — select and copy manually</span>
    );
  }

  return (
    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCopy}>
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-600" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

/** Code block with copy button */
function CodeBlock({ code }: { code: string }) {
  return (
    <div className="relative">
      <div className="absolute right-2 top-2">
        <CopyButton text={code} />
      </div>
      <pre className="bg-muted rounded-lg p-4 text-sm font-mono overflow-x-auto select-text whitespace-pre">
        {code}
      </pre>
    </div>
  );
}

export function McpSetupGuideTab({ orgId }: McpSetupGuideTabProps) {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  const claudeConfig = JSON.stringify(
    {
      mcpServers: {
        clm: {
          command: "npx",
          args: ["-y", "@tonytechlab/clm-mcp-server"],
          env: {
            CLM_API_URL: baseUrl,
            CLM_API_KEY: "your-api-key-here",
            CLM_DEFAULT_ORG_ID: orgId,
          },
        },
      },
    },
    null,
    2
  );

  const vscodeConfig = JSON.stringify(
    {
      servers: {
        clm: {
          command: "npx",
          args: ["-y", "@tonytechlab/clm-mcp-server"],
          env: {
            CLM_API_URL: baseUrl,
            CLM_API_KEY: "your-api-key-here",
            CLM_DEFAULT_ORG_ID: orgId,
          },
        },
      },
    },
    null,
    2
  );

  return (
    <div className="space-y-4">
      {/* Prerequisites */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prerequisites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <ul className="list-disc pl-5 space-y-1">
            <li>Node.js 18+ installed</li>
            <li>
              A CLM API key (create one in the{" "}
              <span className="font-medium text-primary">API Keys</span> tab)
            </li>
            <li>
              A connected WordPress account (
              <a href="/admin/cma/settings" className="text-primary hover:underline inline-flex items-center gap-1">
                Connections <ExternalLink className="h-3 w-3" />
              </a>
              )
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* Claude Desktop */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Claude Desktop</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Open Claude Desktop → <strong>Settings</strong> → <strong>MCP Servers</strong>
            </li>
            <li>Add the following configuration:</li>
          </ol>
          <CodeBlock code={claudeConfig} />
          <ol className="list-decimal pl-5 space-y-2" start={3}>
            <li>
              Replace <code className="bg-muted px-1 rounded">your-api-key-here</code> with your
              API key from the API Keys tab
            </li>
            <li>Restart Claude Desktop</li>
          </ol>
        </CardContent>
      </Card>

      {/* VS Code */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">VS Code</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Create <code className="bg-muted px-1 rounded">.vscode/mcp.json</code> in your
              project root
            </li>
            <li>Add the following configuration:</li>
          </ol>
          <CodeBlock code={vscodeConfig} />
          <div className="rounded-md bg-muted px-4 py-2 text-xs text-muted-foreground">
            Add <code>.vscode/mcp.json</code> to your <code>.gitignore</code> — it contains your API key and org ID.
          </div>
          <ol className="list-decimal pl-5 space-y-2" start={3}>
            <li>
              Replace <code className="bg-muted px-1 rounded">your-api-key-here</code> with your
              API key
            </li>
          </ol>
        </CardContent>
      </Card>

      {/* Environment Variables Reference */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Environment Variables</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Variable</th>
                  <th className="text-left px-4 py-2 font-medium">Required</th>
                  <th className="text-left px-4 py-2 font-medium">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="px-4 py-2 font-mono text-xs">CLM_API_URL</td>
                  <td className="px-4 py-2">Yes</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    CLM server URL (auto-filled: {baseUrl || "—"})
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-mono text-xs">CLM_API_KEY</td>
                  <td className="px-4 py-2">Yes</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    API key from the API Keys tab
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="px-4 py-2 font-mono text-xs">CLM_DEFAULT_ORG_ID</td>
                  <td className="px-4 py-2">Recommended</td>
                  <td className="px-4 py-2 text-muted-foreground">
                    Default org ID (auto-filled: {orgId})
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
