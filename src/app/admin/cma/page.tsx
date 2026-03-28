"use client";

// CMA landing — redirects to posts list (dashboard deferred to Phase 6)

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CmaPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/admin/cma/posts");
  }, [router]);

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-muted-foreground">Loading CMA...</p>
    </div>
  );
}
