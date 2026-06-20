"use client";

import { create } from "zustand";
import type { ProjectRecord } from "@/lib/forge-config";

interface ForgeState {
  // Gallery
  projects: ProjectRecord[];
  loadingProjects: boolean;
  projectsError: string | null;

  // Current workspace
  currentProject: ProjectRecord | null;
  loadingProject: boolean;

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
      set({ projects: data.projects, loadingProjects: false });
    } catch (e) {
      set({
        loadingProjects: false,
        projectsError: e instanceof Error ? e.message : "Erreur",
      });
    }
  },

  selectProject: (p) =>
    set({ currentProject: p, showBuilder: false, generationPhase: "idle", generationError: null }),

  selectProjectById: async (id) => {
    // Optimistically show the project from the gallery, then fetch fresh data
    const cached = get().projects.find((p) => p.id === id) ?? null;
    set({
      currentProject: cached,
      showBuilder: false,
      generationPhase: "idle",
      generationError: null,
      loadingProject: true,
    });
    try {
      const res = await fetch(`/api/projects/${id}`, { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      set({ currentProject: data.project, loadingProject: false });
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
      set({ currentProject: data.project, loadingProject: false });
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
      set({ currentProject: data.project, loadingProject: false, showBuilder: false });
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
