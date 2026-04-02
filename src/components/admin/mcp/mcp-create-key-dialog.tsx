"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cmaFetch } from "@/lib/cma/use-cma-api";
import { Loader2, Copy, Check } from "lucide-react";

interface McpCreateKeyDialogProps {
  orgId: string;
  open: boolean;
  onClose: (created: boolean) => void;
}

export function McpCreateKeyDialog({ orgId, open, onClose }: McpCreateKeyDialogProps) {
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Tomorrow's date for min expiry
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  async function handleCreate() {
    setCreating(true);
    setError(null);
    try {
      const result = await cmaFetch<{ key: string }>("/api/cma/api-keys", {
        method: "POST",
        body: JSON.stringify({ orgId, name, expiresAt: expiry || undefined }),
      });
      setCreatedKey(result.key);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Copy failed — please select and copy manually.");
    }
  }

  function handleClose() {
    const wasCreated = !!createdKey;
    setCreatedKey(null);
    setName("");
    setExpiry("");
    setError(null);
    setCopied(false);
    onClose(wasCreated);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{createdKey ? "API Key Created" : "Create API Key"}</DialogTitle>
        </DialogHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 text-destructive px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {createdKey ? (
          <div className="space-y-4">
            <div className="rounded-md bg-yellow-50 border border-yellow-200 px-4 py-3 text-sm text-yellow-800">
              Save this key now — it will not be shown again.
            </div>
            <div className="relative">
              <Input
                readOnly
                value={createdKey}
                className="font-mono text-sm pr-10"
                onClick={(e) => (e.target as HTMLInputElement).select()}
              />
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => handleCopy(createdKey)}
              >
                {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <Button onClick={handleClose} className="w-full">Done</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name</label>
              <Input
                placeholder="e.g. Claude Desktop"
                value={name}
                maxLength={64}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="text-sm font-medium">
                Expiry <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input type="date" min={minDate} value={expiry} onChange={(e) => setExpiry(e.target.value)} />
            </div>
            <Button onClick={handleCreate} disabled={!name.trim() || creating} className="w-full">
              {creating && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Key
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
