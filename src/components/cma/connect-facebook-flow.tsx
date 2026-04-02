"use client";

import { Button } from "@/components/ui/button";
import { Facebook } from "lucide-react";

interface Props {
  orgId: string;
}

// Redirects to FB OAuth flow — callback handles the rest
export function ConnectFacebookFlow({ orgId }: Props) {
  function handleConnect() {
    window.location.href = `/api/cma/facebook/auth?orgId=${encodeURIComponent(orgId)}`;
  }

  return (
    <Button onClick={handleConnect} variant="outline" className="gap-2">
      <Facebook className="h-4 w-4 text-blue-600" />
      Connect Facebook Page
    </Button>
  );
}
