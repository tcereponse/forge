"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface ProgressPhase {
  name: string;
  pass: number;
  status: "pending" | "running" | "done" | "failed" | "skipped";
  message?: string;
  filesGenerated?: number;
  retries?: number;
  startedAt?: number;
  completedAt?: number;
}

export interface ProgressData {
  projectId: string;
  mode: "standard" | "gold";
  phases: ProgressPhase[];
  currentPhase: number;
  totalFiles: number;
  error?: string;
  startedAt: number;
  updatedAt: number;
  elapsedMs: number;
  projectStatus: string;
  projectName: string;
}

interface UseProgressOptions {
  interval?: number; // polling interval in ms (default 1000)
  enabled?: boolean;
}

/** Polls /api/projects/[id]/progress for real-time pipeline progress. */
export function useProgress(projectId: string | null | undefined, options: UseProgressOptions = {}) {
  const { interval = 1000, enabled = true } = options;
  const [progress, setProgress] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/progress`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.success) {
        setProgress(data.progress);
        setError(null);
        // Stop polling when project is ready or failed
        if (data.project?.status === "ready" || data.project?.status === "failed") {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
          }
          return;
        }
      } else {
        setError(data.error || "Erreur");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !enabled) {
      setProgress(null);
      return;
    }

    setLoading(true);
    fetchProgress().finally(() => setLoading(false));

    const poll = () => {
      fetchProgress().finally(() => {
        timerRef.current = setTimeout(poll, interval);
      });
    };
    timerRef.current = setTimeout(poll, interval);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [projectId, enabled, interval, fetchProgress]);

  return { progress, loading, error, refetch: fetchProgress };
}
