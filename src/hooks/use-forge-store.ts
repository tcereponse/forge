"use client";

import { create } from "zustand";
import type { ProjectRecord, ValidationReport } from "@/lib/forge-config";

// Ensure every project record has safe defaults for array/string fields,
// regardless of which endpoint it came from (list vs detail).
function normalizeProject(p: Partial<ProjectRecord> | null | undefined): ProjectRecord | null {
  if (!p || !p.id) return null;
  return {
    id: p.id,
    name: p.name ?? "Sans nom",
    slug: p.slug ?? p.id,
    description: p.description ?? "",
    stack: (p.stack ?? "vite") as ProjectRecord["stack"],
    typescript: p.typescript ?? true,
    styling: (p.styling ?? "tailwind") as ProjectRecord["styling"],
    routing: (p.routing ?? "router") as ProjectRecord["routing"],
    stateMgmt: (p.stateMgmt ?? "none") as ProjectRecord["stateMgmt"],
    uiLib: (p.uiLib ?? "none") as ProjectRecord["uiLib"],
    features: Array.isArray(p.features) ? p.features : [],
    prd: p.prd ?? "",
    files: Array.isArray(p.files) ? p.files : [],
    fileCount: p.fileCount ?? 0,
    status: (p.status ?? "draft") as ProjectRecord["status"],
    createdAt: p.createdAt ?? new Date().toISOString(),
    updatedAt: p.updatedAt ?? new Date().toISOString(),
  };
}

function normalizeProjects(ps: unknown): ProjectRecord[] {
  if (!Array.isArray(ps)) return [];
  return ps
    .map((p) => normalizeProject(p as Partial<ProjectRecord>))
    .filter((p): p is ProjectRecord => p !== null);
}

interface ForgeState {
  // Gallery
  projects: ProjectRecord[];
  loadingProjects: boolean;
  projectsError: string | null;

  // Current workspace
  currentProject: ProjectRecord | null;
  loadingProject: boolean;
  validation: ValidationReport | null;

  // Builder
  showBuilder: boolean;
  generating: boolean;
  generationPhase: "idle" | "prd" | "code" | "saving" | "done" | "error";
  generationError: string | null;

  // Actions
  setProjects: (p: ProjectRecord[]) => void;
  fetchProjects: () => Promise<void>;
  selectProject: (p: ProjectRecord | null) => void;
  selectProjectById: (id: string) => Promise<void>;
  refreshCurrentProject: () => Promise<void>;
  fetchProject: (id: string) => Promise<void>;
  setShowBuilder: (v: boolean) => void;
  setGenerating: (v: boolean) => void;
  setPhase: (p: ForgeState["generationPhase"]) => void;
  setGenerationError: (e: string | null) => void;
  removeProject: (id: string) => void;
}

export const useForgeStore = create<ForgeState>((set, get) => ({
  projects: [],
  loadingProjects: false,
  projectsError: null,
  currentProject: null,
  loadingProject: false,
  validation: null,
  showBuilder: true,
  generating: false,
  generationPhase: "idle",
  generationError: null,

  setProjects: (p) => set({ projects: p }),
  setShowBuilder: (v) => set({ showBuilder: v }),
  setGenerating: (v) => set({ generating: v }),
  setPhase: (p) => set({ generationPhase: p }),
  setGenerationError: (e) => set({ generationError: e }),

  fetchProjects: async () => {
    set({ loadingProjects: true, projectsError: null });
    try {
      const res = await fetch("/api/projects", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      set({ projects: normalizeProjects(data.projects), loadingProjects: false });
    } catch (e) {
      set({
        loadingProjects: false,
        projectsError: e instanceof Error ? e.message : "Erreur",
      });
    }
  },

  selectProject: (p) =>
    set({ currentProject: normalizeProject(p), showBuilder: false, generationPhase: "idle", generationError: null }),

  selectProjectById: async (id) => {
    // Optimistically show the project from the gallery (normalized), then fetch fresh data
    const cached = normalizeProject(get().projects.find((p) => p.id === id) ?? null);
    set({
      currentProject: cached,
      validation: null,
      showBuilder: false,
      generationPhase: "idle",
      generationError: null,
      loadingProject: true,
    });
    try {
      const res = await fetch(`/api/projects/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      set({
        currentProject: normalizeProject(data.project),
        validation: data.validation ?? null,
        loadingProject: false,
      });
      // Also refresh the gallery to keep status in sync
      get().fetchProjects();
    } catch (e) {
      set({
        loadingProject: false,
        generationError: e instanceof Error ? e.message : "Erreur",
      });
    }
  },

  refreshCurrentProject: async () => {
    const cur = get().currentProject;
    if (!cur) return;
    set({ loadingProject: true });
    try {
      const res = await fetch(`/api/projects/${cur.id}`, { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      set({
        currentProject: normalizeProject(data.project),
        validation: data.validation ?? null,
        loadingProject: false,
      });
      get().fetchProjects();
    } catch (e) {
      set({ loadingProject: false });
    }
  },

  fetchProject: async (id) => {
    set({ loadingProject: true });
    try {
      const res = await fetch(`/api/projects/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      set({
        currentProject: normalizeProject(data.project),
        validation: data.validation ?? null,
        loadingProject: false,
        showBuilder: false,
      });
    } catch (e) {
      set({
        loadingProject: false,
        generationError: e instanceof Error ? e.message : "Erreur",
      });
    }
  },

  removeProject: (id) =>
    set((s) => ({
      projects: s.projects.filter((p) => p.id !== id),
      currentProject: s.currentProject?.id === id ? null : s.currentProject,
      showBuilder: s.currentProject?.id === id ? true : s.showBuilder,
    })),
}));
