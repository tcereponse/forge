"use client";

import { useEffect, useState, useCallback, useRef } from "react";

export interface ProcessStatus {
  install: "pending" | "installing" | "installed" | "failed";
  build: "pending" | "building" | "built" | "failed";
  installLog: string;
  buildLog: string;
}

const POLL_INTERVAL = 2000; // 2s — faster for better UX

export function useProcessStatus(
  projectId: string | null,
  enabled: boolean
): {
  status: ProcessStatus | null;
  triggerBuild: () => Promise<void>;
  triggerInstall: () => Promise<void>;
  refresh: () => Promise<void>;
} {
  const [status, setStatus] = useState<ProcessStatus | null>(null);
  const [pollingEnabled, setPollingEnabled] = useState(false);
  const statusRef = useRef<ProcessStatus | null>(null);
  const errorCount = useRef(0);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const refresh = useCallback(async () => {
    if (!projectId) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/status`, {
        cache: "no-store",
      });
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
        statusRef.current = newStatus;
      }
    } catch {
      errorCount.current += 1;
    }
  }, [projectId]);

  // Start/stop polling based on pollingEnabled
  useEffect(() => {
    if (!projectId || !enabled || !pollingEnabled) {
      return;
    }

    // Initial fetch immediately
    refresh();

    const interval = setInterval(async () => {
      if (errorCount.current >= 5) {
        setPollingEnabled(false);
        clearInterval(interval);
        return;
      }
      const s = statusRef.current;
      const installActive = s?.install === "installing";
      const buildActive = s?.build === "building";
      // Stop polling when no active process
      if (!installActive && !buildActive) {
        setPollingEnabled(false);
        clearInterval(interval);
        return;
      }
      await refresh();
    }, POLL_INTERVAL);

    return () => clearInterval(interval);
  }, [projectId, enabled, pollingEnabled, refresh]);

  // Initial fetch on mount/project change
  useEffect(() => {
    if (!projectId || !enabled) return;
    errorCount.current = 0;
    refresh();
    // Start polling by default to catch any in-progress install/build
    setPollingEnabled(true);
  }, [projectId, enabled, refresh]);

  const triggerBuild = useCallback(async () => {
    if (!projectId) return;
    if (errorCount.current >= 5) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/build`, { method: "POST" });
      if (res.status === 404) {
        errorCount.current += 1;
        return;
      }
      errorCount.current = 0;
      // Optimistically update status to building
      const optimistic: ProcessStatus = {
        ...(statusRef.current ?? { install: "pending", build: "pending", installLog: "", buildLog: "" }),
        build: "building",
        buildLog: "$ npm run build\n",
      };
      setStatus(optimistic);
      statusRef.current = optimistic;
      // Start polling
      setPollingEnabled(true);
      // Immediate refresh after 500ms
      setTimeout(() => refresh(), 500);
    } catch {
      errorCount.current += 1;
    }
  }, [projectId, refresh]);

  const triggerInstall = useCallback(async () => {
    if (!projectId) return;
    if (errorCount.current >= 5) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/install`, { method: "POST" });
      if (res.status === 404) {
        errorCount.current += 1;
        return;
      }
      errorCount.current = 0;
      // Optimistically update status to installing
      const optimistic: ProcessStatus = {
        ...(statusRef.current ?? { install: "pending", build: "pending", installLog: "", buildLog: "" }),
        install: "installing",
        installLog: "$ npm install\n",
      };
      setStatus(optimistic);
      statusRef.current = optimistic;
      // Start polling
      setPollingEnabled(true);
      // Immediate refresh after 500ms
      setTimeout(() => refresh(), 500);
      // And another after 2s to ensure we catch the server-side status
      setTimeout(() => refresh(), 2000);
    } catch {
      errorCount.current += 1;
    }
  }, [projectId, refresh]);

  return { status, triggerBuild, triggerInstall, refresh };
}
