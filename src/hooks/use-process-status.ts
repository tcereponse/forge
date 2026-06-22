"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface ProcessStatus {
  install: "pending" | "installing" | "installed" | "failed";
  build: "pending" | "building" | "built" | "failed";
  installLog: string;
  buildLog: string;
}

const POLL_INTERVAL = 5000; // 5s

export function useProcessStatus(
  projectId: string | null,
  enabled: boolean
): {
  status: ProcessStatus | null;
  triggerBuild: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [status, setStatus] = useState<ProcessStatus | null>(null);
  const statusRef = useRef<ProcessStatus | null>(null);
  const errorCount = useRef(0);
  const installTriggered = useRef(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        cache: "no-store",
      });
      // Stop immediately on 404 — project doesn't exist
      if (res.status === 404) {
        errorCount.current += 1;
        return;
      }
      if (!res.ok) {
        errorCount.current += 1;
        return;
      }
      errorCount.current = 0;
      const data = await res.json();
      if (data.success) {
        const newStatus: ProcessStatus = {
          install: data.install.status,
          build: data.build.status,
          installLog: data.install.log,
          buildLog: data.build.log,
        };
        setStatus(newStatus);
      }
    } catch {
      errorCount.current += 1;
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !enabled) {
      return;
    }

    // Reset error count on mount/project change
    errorCount.current = 0;
    installTriggered.current = false;

    // Initial fetch
    const initialTimer = setTimeout(() => refresh(), 500);

    // Polling interval — stops on terminal states or errors
    const interval = setInterval(async () => {
      // Stop if too many errors (server down or project missing)
      if (errorCount.current >= 3) {
        clearInterval(interval);
        return;
      }
      const s = statusRef.current;
      const installActive = s?.install === "installing";
      const buildActive = s?.build === "building";
      if (!installActive && !buildActive) {
        clearInterval(interval);
        return;
      }
      await refresh();
    }, POLL_INTERVAL);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [projectId, enabled, refresh]);

  const triggerBuild = useCallback(async () => {
    if (!projectId) return;
    if (errorCount.current >= 3) return; // Don't spam if server is down
    try {
      const res = await fetch(`/api/projects/${projectId}/build`, { method: "POST" });
      if (res.status === 404) {
        errorCount.current += 1;
        return;
      }
      refresh();
    } catch {
      errorCount.current += 1;
    }
  }, [projectId, refresh]);

  return { status, triggerBuild, refresh };
}
