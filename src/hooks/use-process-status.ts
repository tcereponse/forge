"use client";

import { useEffect, useState, useCallback } from "react";

export interface ProcessStatus {
  install: "pending" | "installing" | "installed" | "failed";
  build: "pending" | "building" | "built" | "failed";
  installLog: string;
  buildLog: string;
}

const POLL_INTERVAL = 2000; // 2s

export function useProcessStatus(
  projectId: string | null,
  enabled: boolean
): {
  status: ProcessStatus | null;
  triggerBuild: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [status, setStatus] = useState<ProcessStatus | null>(null);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (data.success) {
        setStatus({
          install: data.install.status,
          build: data.build.status,
          installLog: data.install.log,
          buildLog: data.build.log,
        });
      }
    } catch {
      // ignore
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId || !enabled) {
      return;
    }
    let cancelled = false;

    async function poll() {
      if (cancelled) return;
      await refresh();
    }

    // Initial fetch
    poll();

    // Only keep polling while install or build is ACTIVELY running.
    // "pending" means not started yet (could be waiting for disk check),
    // "installing"/"building" means in progress. Stop on terminal states.
    const installActive = status?.install === "installing";
    const buildActive = status?.build === "building";
    const needsPolling = !status || installActive || buildActive;

    if (!needsPolling) return;

    const interval = setInterval(poll, POLL_INTERVAL);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [projectId, enabled, refresh, status?.install, status?.build]);

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
