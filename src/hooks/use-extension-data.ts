"use client";

import { useEffect, useState, useCallback } from "react";

export interface ExtensionFileData {
  name: string;
  path: string;
  language: string;
  size: number;
  description: string;
  content: string;
}

export interface ExtensionAnalysisData {
  totalFiles: number;
  totalSize: number;
  totalLines: number;
  permissions: string[];
  hostPermissions: string[];
  platforms: { id: string; label: string; host: string }[];
  phases: { id: number; name: string; description: string }[];
  modules: { name: string; role: string; pattern: string }[];
  metrics: { label: string; value: string }[];
}

interface ExtensionDataState {
  loading: boolean;
  error: string | null;
  extension: {
    name: string;
    version: string;
    manifestVersion: number;
    description: string;
  } | null;
  analysis: ExtensionAnalysisData | null;
  files: ExtensionFileData[];
}

export function useExtensionData() {
  const [state, setState] = useState<ExtensionDataState>({
    loading: true,
    error: null,
    extension: null,
    analysis: null,
    files: [],
  });

  const load = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch("/api/extension-files", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Échec du chargement");
      setState({
        loading: false,
        error: null,
        extension: data.extension,
        analysis: data.analysis,
        files: data.files,
      });
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        error: e instanceof Error ? e.message : "Erreur inconnue",
      }));
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { ...state, reload: load };
}
