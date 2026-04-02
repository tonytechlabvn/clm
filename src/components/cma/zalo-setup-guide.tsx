"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { MessageCircle } from "lucide-react";

// Static guide for Zalo OA bot setup in settings page
export function ZaloSetupGuide({ orgId }: { orgId: string }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5 text-blue-500" />
          <CardTitle className="text-base">Zalo OA Bot</CardTitle>
        </div>
        <CardDescription>Create posts by messaging your Zalo Official Account</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div>
          <p className="font-medium mb-1">Setup Steps</p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
            <li>Register a Zalo Official Account at <span className="font-mono text-xs">oa.zalo.me</span></li>
            <li>Configure webhook URL: <span className="font-mono text-xs break-all">{process.env.NEXT_PUBLIC_APP_URL || "https://clm.tonytechlab.com"}/api/webhooks/zalo</span></li>
            <li>Set ZALO_OA_ID, ZALO_OA_SECRET, ZALO_WEBHOOK_SECRET in environment</li>
            <li>Generate link codes for users via API</li>
          </ol>
        </div>

        <div>
          <p className="font-medium mb-1">Bot Commands</p>
          <div className="space-y-1 text-muted-foreground font-mono text-xs">
            <p><span className="text-foreground">/link &lt;CODE&gt;</span> — Link Zalo account to CLM</p>
            <p><span className="text-foreground">/help</span> — Show available commands</p>
            <p><span className="text-foreground">any text</span> — Create a draft post</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          Org ID: <span className="font-mono">{orgId}</span>
        </p>
      </CardContent>
    </Card>
  );
}
