"use client";

import { Loader2, Cable } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCmaOrg } from "@/lib/cma/hooks/use-cma-org";
import { useCmaGet } from "@/lib/cma/use-cma-api";
import { McpApiKeysTab, type ApiKeyRow } from "@/components/admin/mcp/mcp-api-keys-tab";
import { McpSetupGuideTab } from "@/components/admin/mcp/mcp-setup-guide-tab";
import { McpToolsOverviewTab } from "@/components/admin/mcp/mcp-tools-overview-tab";

export default function McpSettingsPage() {
  const { org, loading: orgLoading } = useCmaOrg();

  // Lift API keys fetch to page level to prevent duplicate calls across tabs (Red Team #10)
  const {
    data: keysData,
    loading: keysLoading,
    refetch,
  } = useCmaGet<{ keys: ApiKeyRow[] }>(
    org ? `/api/cma/api-keys?orgId=${org.id}` : null
  );

  if (orgLoading) {
    return (
      <div className="p-6 flex justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  // Null-org guard (Red Team #2)
  if (!org) {
    return (
      <div className="p-6 max-w-4xl">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Cable className="h-5 w-5" />
          <p>No organization found. Please set up an organization first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">MCP Integration</h1>
        <p className="text-sm text-muted-foreground">
          Manage API keys, view setup guides, and monitor MCP tool usage.
        </p>
      </div>

      <Tabs defaultValue="api-keys">
        <TabsList>
          <TabsTrigger value="api-keys">API Keys</TabsTrigger>
          <TabsTrigger value="setup">Setup Guide</TabsTrigger>
          <TabsTrigger value="tools">Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="api-keys" className="mt-4">
          <McpApiKeysTab
            orgId={org.id}
            keys={keysData?.keys ?? []}
            loading={keysLoading}
            refetch={refetch}
          />
        </TabsContent>

        <TabsContent value="setup" className="mt-4">
          <McpSetupGuideTab orgId={org.id} />
        </TabsContent>

        <TabsContent value="tools" className="mt-4">
          <McpToolsOverviewTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
