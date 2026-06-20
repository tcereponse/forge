"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface ProcessStatus {
  install: "pending" | "installing" | "installed" | "failed";
  build: "pending" | "building" | "built" | "failed";
  installLog: string;
  buildLog: string;
}

const POLL_INTERVAL = 3000; // 3s

export function useProcessStatus(
  projectId: string | null,
  enabled: boolean
): {
  status: ProcessStatus | null;
  triggerBuild: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [status, setStatus] = useState<ProcessStatus | null>(null);
  // Use a ref to track the latest status for the interval callback,
  // avoiding re-running the effect on every status change.
  const statusRef = useRef<ProcessStatus | null>(null);
  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        cache: "no-store",
      });
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
      // ignore
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !enabled) {
      return;
    }

    // Initial fetch (deferred to avoid synchronous setState in effect)
    const initialTimer = setTimeout(() => refresh(), 0);

    // Set up a single interval that checks the ref for whether to continue.
    // This avoids the tight loop of: poll → setState → effect re-run → poll.
    const interval = setInterval(async () => {
      const s = statusRef.current;
      // Only keep polling while install or build is ACTIVELY running.
      const installActive = s?.install === "installing";
      const buildActive = s?.build === "building";
      if (!installActive && !buildActive) {
        // Terminal or idle state — stop polling.
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
    try {
      await fetch(`/api/projects/${projectId}/build`, { method: "POST" });
      refresh();
    } catch {
      // ignore
    }
  }, [projectId, refresh]);

  return { status, triggerBuild, refresh };
}
