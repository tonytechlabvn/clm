// Client-side fetch helpers for classroom API — GET hook + mutation helper

"use client";

import { useState, useEffect, useCallback } from "react";

export interface ClassroomApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/** Generic GET hook — auto-fetches on mount and when url changes */
export function useClassroomGet<T>(url: string | null): ClassroomApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!url);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(body.error || `Request failed: ${res.status}`);
      }
      const json = await res.json();
      // Unwrap { data: ... } envelope if present
      setData(json.data !== undefined ? json.data : json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/** POST/PATCH/DELETE helper — returns unwrapped data or throws */
export async function classroomFetch<T = unknown>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  const json = await res.json();
  return (json.data !== undefined ? json.data : json) as T;
}

/** Convenience: POST JSON body */
export async function classroomPost<T = unknown>(
  url: string,
  body: unknown
): Promise<T> {
  return classroomFetch<T>(url, { method: "POST", body: JSON.stringify(body) });
}

/** Convenience: PATCH JSON body */
export async function classroomPatch<T = unknown>(
  url: string,
  body: unknown
): Promise<T> {
  return classroomFetch<T>(url, { method: "PATCH", body: JSON.stringify(body) });
}

/** Convenience: DELETE */
export async function classroomDelete<T = unknown>(url: string): Promise<T> {
  return classroomFetch<T>(url, { method: "DELETE" });
}
