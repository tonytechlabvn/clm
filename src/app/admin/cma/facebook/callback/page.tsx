"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Facebook, CheckCircle } from "lucide-react";
import { cmaFetch } from "@/lib/cma/use-cma-api";

interface FbPage {
  id: string;
  name: string;
  category: string;
  picture?: string;
}

export default function FacebookCallbackPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div>}>
      <FacebookCallbackContent />
    </Suspense>
  );
}

function FacebookCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orgId = searchParams.get("orgId") || "";

  const [pages] = useState<FbPage[]>(() => {
    try {
      return JSON.parse(decodeURIComponent(searchParams.get("pages") || "[]"));
    } catch { return []; }
  });

  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    if (!selectedPageId) return;
    const page = pages.find((p) => p.id === selectedPageId);
    if (!page) return;

    setLoading(true);
    setError(null);
    try {
      await cmaFetch("/api/cma/facebook/select-page", {
        method: "POST",
        body: JSON.stringify({ orgId, pageId: page.id, pageName: page.name }),
      });
      router.push("/admin/cma/settings?fb_success=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to connect page");
    } finally {
      setLoading(false);
    }
  }

  if (pages.length === 0) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <p>No Facebook pages found. Make sure you have admin access to at least one page.</p>
            <Button variant="outline" className="mt-4" onClick={() => router.push("/admin/cma/settings")}>
              Back to Settings
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-4">
      <h1 className="text-xl font-bold">Select a Facebook Page</h1>
      <p className="text-sm text-muted-foreground">Choose the page you want to publish to:</p>

      <div className="space-y-2">
        {pages.map((page) => (
          <Card
            key={page.id}
            className={`cursor-pointer transition-colors ${selectedPageId === page.id ? "border-primary bg-primary/5" : "hover:border-muted-foreground/30"}`}
            onClick={() => setSelectedPageId(page.id)}
          >
            <CardHeader className="py-3 px-4">
              <div className="flex items-center gap-3">
                {page.picture ? (
                  <img src={page.picture} alt="" className="h-10 w-10 rounded-full" />
                ) : (
                  <Facebook className="h-10 w-10 text-blue-600 p-1.5 bg-blue-50 rounded-full" />
                )}
                <div className="flex-1">
                  <CardTitle className="text-sm">{page.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{page.category}</p>
                </div>
                {selectedPageId === page.id && <CheckCircle className="h-5 w-5 text-primary" />}
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-2">
        <Button onClick={handleConnect} disabled={!selectedPageId || loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Connect Page
        </Button>
        <Button variant="outline" onClick={() => router.push("/admin/cma/settings")}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
