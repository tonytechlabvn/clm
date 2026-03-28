// Hook to get the current org context for CMA pages.
// MVP: fetches user's primary org via /api/cma/org. Multi-org selector added later.

"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

interface CmaOrg {
  id: string;
  name: string;
  slug: string;
}

export function useCmaOrg() {
  const { data: session } = useSession();
  const [org, setOrg] = useState<CmaOrg | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.dbUserId) {
      setLoading(false);
      return;
    }

    fetch("/api/cma/org")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && !data.error) setOrg(data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.dbUserId]);

  return { org, loading };
}
