"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hammer,
  Plus,
  Trash2,
  Loader2,
  FolderGit2,
  CheckCircle2,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useForgeStore } from "@/hooks/use-forge-store";
import type { ProjectRecord } from "@/lib/forge-config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function StatusDot({ status }: { status: ProjectRecord["status"] }) {
  if (status === "ready")
    return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
  if (status === "generating")
    return <Loader2 className="h-3.5 w-3.5 animate-spin text-cyan-400" />;
  if (status === "failed")
    return <AlertCircle className="h-3.5 w-3.5 text-rose-400" />;
  return <Clock className="h-3.5 w-3.5 text-slate-500" />;
}

function timeAgo(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "à l'instant";
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const days = Math.floor(h / 24);
  return `il y a ${days} j`;
}

export function Sidebar() {
  const {
    projects,
    loadingProjects,
    projectsError,
    currentProject,
    showBuilder,
    fetchProjects,
    selectProjectById,
    setShowBuilder,
    removeProject,
  } = useForgeStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  async function handleDelete(e: React.MouseEvent, p: ProjectRecord) {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/projects/${p.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Échec");
      removeProject(p.id);
      toast.success(`Projet « ${p.name} » supprimé`);
    } catch {
      toast.error("Suppression impossible");
    }
  }

  return (
    <aside className="flex h-full w-full flex-col border-r border-slate-800 bg-slate-950/60">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
          <Hammer className="h-5 w-5 text-cyan-300" />
        </div>
        <div>
          <p className="font-mono text-sm font-bold text-slate-100">
            React Forge
          </p>
          <p className="text-[10px] uppercase tracking-widest text-slate-500">
            Générateur IA
          </p>
        </div>
      </div>

      {/* New project */}
      <div className="p-3">
        <Button
          onClick={() => setShowBuilder(true)}
          className={cn(
            "w-full justify-start gap-2 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400",
            showBuilder && "ring-2 ring-cyan-400/40"
          )}
        >
          <Plus className="h-4 w-4" />
          Nouveau projet
        </Button>
      </div>

      {/* Projects list */}
      <div className="flex items-center justify-between px-4 pb-2 pt-1">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
          Projets ({projects.length})
        </p>
        <button
          onClick={() => fetchProjects()}
          disabled={loadingProjects}
          className="text-slate-500 transition hover:text-slate-300 disabled:opacity-50"
          aria-label="Rafraîchir"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", loadingProjects && "animate-spin")}
          />
        </button>
      </div>

      <div className="custom-scroll flex-1 overflow-y-auto px-2 pb-4">
        {loadingProjects && projects.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-8 text-xs text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement…
          </div>
        ) : projectsError ? (
          <div className="px-2 py-4 text-xs text-rose-400">
            {projectsError}
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <FolderGit2 className="h-8 w-8 text-slate-700" />
            <p className="text-xs text-slate-500">
              Aucun projet pour l'instant.
              <br />
              Crée le premier avec le bouton ci-dessus.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            <AnimatePresence initial={false}>
              {projects.map((p) => {
                const isActive = currentProject?.id === p.id && !showBuilder;
                return (
                  <motion.li
                    key={p.id}
                    layout
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => selectProjectById(p.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          selectProjectById(p.id);
                        }
                      }}
                      className={cn(
                        "group flex w-full cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 text-left transition",
                        isActive
                          ? "border-cyan-500/40 bg-cyan-500/10"
                          : "border-transparent hover:border-slate-700 hover:bg-slate-800/40"
                      )}
                    >
                      <div className="mt-0.5">
                        <StatusDot status={p.status} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            "truncate text-sm font-medium",
                            isActive ? "text-slate-100" : "text-slate-300"
                          )}
                        >
                          {p.name}
                        </p>
                        <p className="truncate text-[11px] text-slate-500">
                          {p.stack} · {p.fileCount} fichiers
                        </p>
                        <p className="text-[10px] text-slate-600">
                          {timeAgo(p.createdAt)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, p)}
                        className="shrink-0 rounded p-1 text-slate-600 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"
                        aria-label="Supprimer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </motion.li>
                );
              })}
            </AnimatePresence>
          </ul>
        )}
      </div>

      <div className="border-t border-slate-800 px-4 py-3">
        <p className="text-[10px] leading-relaxed text-slate-600">
          Propulsé par{" "}
          <span className="font-mono text-cyan-500/70">z-ai-web-dev-sdk</span>{" "}
          · LLM + génération structurée
        </p>
      </div>
    </aside>
  );
}
