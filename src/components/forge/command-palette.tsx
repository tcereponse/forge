"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Command as CommandIcon,
  FolderGit2,
  Plus,
  RefreshCw,
  Search,
} from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { useForgeStore } from "@/hooks/use-forge-store";
import {
  PROJECT_TEMPLATES,
  type ProjectTemplate,
} from "@/components/forge/templates-gallery";
import type { ProjectRecord } from "@/lib/forge-config";

/**
 * Global Command Palette (Cmd+K / Ctrl+K).
 *
 * Mounted once inside <ForgeApp />. Owns its open state and the global
 * keydown listener so it doesn't depend on parent logic.
 */
export function CommandPalette() {
  const [open, setOpen] = useState(false);

  // Subscribe to specific slices to keep re-renders minimal.
  const projects = useForgeStore((s) => s.projects);
  const setShowBuilder = useForgeStore((s) => s.setShowBuilder);
  const fetchProjects = useForgeStore((s) => s.fetchProjects);
  const selectProjectById = useForgeStore((s) => s.selectProjectById);
  const setPendingTemplate = useForgeStore((s) => s.setPendingTemplate);

  // Global Cmd+K (Mac) / Ctrl+K (Win/Linux) toggler.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const isModK =
        (e.metaKey || e.ctrlKey) && (e.key === "k" || e.key === "K");
      if (!isModK) return;
      e.preventDefault();
      setOpen((v) => !v);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  const handleNewProject = useCallback(() => {
    setShowBuilder(true);
    close();
  }, [setShowBuilder, close]);

  const handleRefresh = useCallback(() => {
    void fetchProjects();
    close();
  }, [fetchProjects, close]);

  const handlePickTemplate = useCallback(
    (tpl: ProjectTemplate) => {
      setPendingTemplate(tpl);
      setShowBuilder(true);
      close();
    },
    [setPendingTemplate, setShowBuilder, close],
  );

  const handlePickProject = useCallback(
    (id: string) => {
      void selectProjectById(id);
      close();
    },
    [selectProjectById, close],
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        showCloseButton={false}
        className="max-w-xl gap-0 overflow-hidden rounded-xl border-slate-800 bg-slate-950 p-0 text-slate-100 shadow-2xl shadow-cyan-500/10 sm:max-w-xl"
      >
        <DialogTitle className="sr-only">Palette de commandes</DialogTitle>
        <DialogDescription className="sr-only">
          Rechercher une action, un modèle ou un projet existant.
        </DialogDescription>

        <Command
          className="bg-transparent text-slate-100 [&_[cmdk-group-heading]]:text-slate-500 [&_[cmdk-input]]:text-slate-100"
          loop
        >
          <div className="flex items-center gap-2.5 border-b border-slate-800 px-4">
            <Search className="h-4 w-4 shrink-0 text-cyan-400" />
            <CommandInput
              placeholder="Rechercher une action, un modèle, un projet…"
              className="h-12 flex-1 border-0 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:ring-0"
            />
            <kbd
              aria-hidden
              className="hidden shrink-0 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400 sm:inline"
            >
              esc
            </kbd>
          </div>

          <CommandList className="custom-scroll max-h-[420px]">
            <CommandEmpty className="py-8 text-center text-sm text-slate-500">
              Aucun résultat.
            </CommandEmpty>

            {/* Actions */}
            <CommandGroup heading="Actions">
              <PaletteItem
                value="nouveau projet créer builder nouvelle"
                onSelect={handleNewProject}
                icon={<Plus className="h-4 w-4 text-cyan-400" />}
                title="Nouveau projet"
                meta="Ouvrir le builder"
              />
              <PaletteItem
                value="rafraîchir refresh liste projets recharger"
                onSelect={handleRefresh}
                icon={<RefreshCw className="h-4 w-4 text-cyan-400" />}
                title="Rafraîchir la liste"
                meta="Recharger"
              />
            </CommandGroup>

            <CommandSeparator className="bg-slate-800" />

            {/* Modèles */}
            <CommandGroup heading="Modèles">
              {PROJECT_TEMPLATES.map((tpl) => {
                const Icon = tpl.icon;
                return (
                  <CommandItem
                    key={tpl.id}
                    value={`${tpl.name} ${tpl.tagline} ${tpl.description}`}
                    onSelect={() => handlePickTemplate(tpl)}
                    className="data-[selected=true]:bg-cyan-500/10 data-[selected=true]:text-cyan-100"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 ring-1 ring-slate-800 data-[selected=true]:ring-cyan-500/30">
                      <Icon className="h-3.5 w-3.5 text-cyan-300" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col leading-tight">
                      <span className="truncate text-sm font-medium text-slate-100">
                        {tpl.name}
                      </span>
                      <span className="truncate text-[11px] text-slate-500">
                        {tpl.tagline}
                      </span>
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-600" />
                  </CommandItem>
                );
              })}
            </CommandGroup>

            <CommandSeparator className="bg-slate-800" />

            {/* Projets récents */}
            <CommandGroup heading="Projets récents">
              {projects.length === 0 ? (
                <div className="px-2 py-4 text-center text-xs text-slate-600">
                  Aucun projet pour l&apos;instant
                </div>
              ) : (
                projects.map((p) => (
                  <ProjectItem
                    key={p.id}
                    project={p}
                    onSelect={() => handlePickProject(p.id)}
                  />
                ))
              )}
            </CommandGroup>
          </CommandList>

          {/* Footer hint bar */}
          <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/60 px-3 py-2 text-[10px] text-slate-500">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                  ↑↓
                </kbd>
                <span className="sr-only">Naviguer</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                  ↵
                </kbd>
                <span>Sélectionner</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                  esc
                </kbd>
                <span>Fermer</span>
              </span>
            </div>
            <div className="hidden items-center gap-1.5 sm:flex">
              <CommandIcon className="h-3 w-3 text-slate-500" />
              <kbd className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-300">
                K
              </kbd>
            </div>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Local helpers ---------- */

interface PaletteItemProps {
  value: string;
  onSelect: () => void;
  icon: React.ReactNode;
  title: string;
  meta?: string;
}

function PaletteItem({ value, onSelect, icon, title, meta }: PaletteItemProps) {
  return (
    <CommandItem
      value={value}
      onSelect={onSelect}
      className="data-[selected=true]:bg-cyan-500/10 data-[selected=true]:text-cyan-100"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 ring-1 ring-slate-800 data-[selected=true]:ring-cyan-500/30">
        {icon}
      </span>
      <span className="flex-1 text-sm font-medium text-slate-100">{title}</span>
      {meta ? (
        <span className="text-[10px] uppercase tracking-wider text-slate-600">
          {meta}
        </span>
      ) : null}
    </CommandItem>
  );
}

function ProjectItem({
  project,
  onSelect,
}: {
  project: ProjectRecord;
  onSelect: () => void;
}) {
  return (
    <CommandItem
      value={`${project.name} ${project.description ?? ""} ${project.stack}`}
      onSelect={onSelect}
      className="data-[selected=true]:bg-cyan-500/10 data-[selected=true]:text-cyan-100"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-900 ring-1 ring-slate-800 data-[selected=true]:ring-cyan-500/30">
        <FolderGit2 className="h-3.5 w-3.5 text-cyan-300" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-slate-100">
            {project.name}
          </span>
          <StatusDot status={project.status} />
        </span>
        <span className="truncate text-[11px] text-slate-500">
          {project.stack} · {project.fileCount} fichier(s)
        </span>
      </span>
      <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-600" />
    </CommandItem>
  );
}

function StatusDot({ status }: { status: ProjectRecord["status"] }) {
  const color =
    status === "ready"
      ? "bg-emerald-400"
      : status === "generating"
        ? "bg-amber-400 animate-pulse"
        : status === "failed"
          ? "bg-rose-400"
          : "bg-slate-500";
  return (
    <span
      className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${color}`}
      title={status}
      aria-label={`Statut: ${status}`}
    />
  );
}
