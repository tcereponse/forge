"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  FileText,
  Code2,
  Layers,
  Download,
  ExternalLink,
  Calendar,
  Hash,
  Sparkles,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ShieldCheck,
  Play,
  Activity,
  History,
  Rocket,
  Cpu,
  Zap,
} from "lucide-react";
import { useForgeStore } from "@/hooks/use-forge-store";
import { Markdown } from "@/components/forge/markdown";
import { FileExplorer } from "@/components/forge/file-explorer";
import { ValidationPanel } from "@/components/forge/validation-panel";
import { PreviewPanel } from "@/components/forge/preview-panel";
import { DownloadButton } from "@/components/forge/download-button";
import { FeatureSummary } from "@/components/forge/feature-summary";
import { PerfIAPanel } from "@/components/forge/perf-ia-panel";
import { ArsenalPanel } from "@/components/forge/arsenal-panel";
import { SnapshotsPanel } from "@/components/forge/snapshots-panel";
import { KirovPanel } from "@/components/forge/kirov-panel";
import { KirovLauncher } from "@/components/forge/kirov-launcher";
import { DeepseekWebview } from "@/components/forge/deepseek-webview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function MetaPill({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950/40 px-2.5 py-1">
      <Icon className="h-3 w-3 text-slate-500" />
      <span className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </span>
      <span className="font-mono text-xs text-slate-300">{value}</span>
    </div>
  );
}

export function Workspace() {
  const { currentProject, loadingProject, setShowBuilder, fetchProject, validation } =
    useForgeStore();
  const [tab, setTab] = useState<"code" | "prd" | "arsenal" | "validation" | "preview" | "perf" | "snapshots" | "kirov" | "launcher" | "deepseek">("code");

  if (loadingProject && !currentProject) {
    // Structured skeleton — mirrors the real workspace layout instead of a bare spinner
    return (
      <div className="flex h-full flex-col">
        <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-slate-800" />
            <Skeleton className="h-6 w-40 bg-slate-800" />
            <Skeleton className="h-5 w-16 rounded-full bg-slate-800" />
          </div>
          <Skeleton className="mt-2 h-4 w-3/4 max-w-xl bg-slate-800" />
          <div className="mt-2.5 flex gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-6 w-20 rounded-md bg-slate-800" />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1 border-b border-slate-800 px-4 py-2 sm:px-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-7 w-20 bg-slate-800" />
          ))}
        </div>
        <div className="grid flex-1 grid-cols-1 gap-0 lg:grid-cols-12">
          <div className="border-r border-slate-800 p-3 lg:col-span-3">
            <div className="space-y-1.5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Skeleton key={i} className="h-5 w-full bg-slate-800" />
              ))}
            </div>
          </div>
          <div className="flex-1 p-4 lg:col-span-9">
            <Skeleton className="h-5 w-48 bg-slate-800" />
            <div className="mt-3 space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <Skeleton key={i} className="h-4 bg-slate-800" style={{ width: `${85 - i * 4}%` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-sm text-slate-500">
          Aucun projet sélectionné.
        </p>
        <Button
          onClick={() => setShowBuilder(true)}
          className="bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400"
        >
          Créer un nouveau projet
        </Button>
      </div>
    );
  }

  const p = currentProject;
  const isReady = p.status === "ready" && p.files.length > 0;
  const isFailed = p.status === "failed";

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowBuilder(true)}
                className="rounded-md p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
                aria-label="Retour"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <h1 className="truncate text-lg font-bold text-slate-50 sm:text-xl">
                {p.name}
              </h1>
              <Badge
                variant="outline"
                className={cn(
                  "shrink-0 text-[10px]",
                  p.status === "ready" &&
                    "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
                  p.status === "generating" &&
                    "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
                  p.status === "failed" &&
                    "border-rose-500/30 bg-rose-500/10 text-rose-300",
                  p.status === "draft" &&
                    "border-slate-700 bg-slate-900/60 text-slate-400"
                )}
              >
                {p.status === "ready" && "Prêt"}
                {p.status === "generating" && "En cours"}
                {p.status === "failed" && "Échec"}
                {p.status === "draft" && "Brouillon"}
              </Badge>
            </div>
            <p className="mt-1 line-clamp-2 max-w-3xl text-xs text-slate-400 sm:text-sm">
              {p.description}
            </p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <MetaPill icon={Layers} label="Stack" value={p.stack} />
              <MetaPill icon={Code2} label="Lang" value={p.typescript ? "TS" : "JS"} />
              <MetaPill icon={Hash} label="Style" value={p.styling} />
              <MetaPill icon={Hash} label="Fichiers" value={String(p.fileCount)} />
              <span
                className="inline-flex items-center gap-1 rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-[10px] text-cyan-300/80"
                title={p.id}
              >
                ID: {p.id}
              </span>
              <MetaPill
                icon={Calendar}
                label="Créé"
                value={new Date(p.createdAt).toLocaleDateString("fr-FR", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
            </div>
            {p.features.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {p.features.map((f) => (
                  <span
                    key={f}
                    className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-[10px] text-cyan-300/80"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          {isReady && <DownloadButton projectId={p.id} />}
        </div>
      </div>

      {/* Feature implementation summary (shows what features are detected in the code) */}
      {isReady && p.features.length > 0 && (
        <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-3 sm:px-6">
          <FeatureSummary files={p.files} features={p.features} />
        </div>
      )}

      {/* Failed state */}
      {isFailed && (
        <div className="flex-1 overflow-auto p-6">
          <Card className="border-rose-500/30 bg-rose-500/5">
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-rose-200">
                    La génération a échoué
                  </p>
                  <p className="mt-1 text-xs text-slate-400">
                    L'IA n'a pas pu produire de fichiers valides. Tu peux
                    réessayer — ajuste la description si besoin.
                  </p>
                  <Button
                    onClick={() => {
                      useForgeStore.getState().setGenerating(true);
                      useForgeStore.getState().setPhase("prd");
                      fetch(`/api/projects/${p.id}/generate`, {
                        method: "POST",
                      })
                        .then((r) => r.json())
                        .then(async (data) => {
                          if (data.success) {
                            toast.success("Régénération réussie !");
                          } else {
                            toast.error(data.error || "Échec");
                          }
                          await fetchProject(p.id);
                          useForgeStore.getState().setGenerating(false);
                          useForgeStore.getState().setPhase("done");
                        })
                        .catch(() => {
                          useForgeStore.getState().setGenerating(false);
                          useForgeStore.getState().setPhase("error");
                        });
                    }}
                    className="mt-3 bg-rose-500/20 text-rose-200 hover:bg-rose-500/30"
                  >
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Régénérer
                  </Button>
                </div>
              </div>
              {p.prd && (
                <div className="mt-4 border-t border-slate-800 pt-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
                    PRD généré (partiel)
                  </p>
                  <div className="max-h-64 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3">
                    <Markdown content={p.prd} />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ready or Failed state — show tabs (including KIROV Bridge) */}
      {(isReady || isFailed) && (
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-slate-800 px-4 sm:px-6">
            <button
              onClick={() => setTab("code")}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition",
                tab === "code"
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              <Code2 className="h-3.5 w-3.5" />
              Code source
              <span className="ml-1 rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">
                {p.files.length}
              </span>
            </button>
            <button
              onClick={() => setTab("prd")}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition",
                tab === "prd"
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              PRD
            </button>
            <button
              onClick={() => setTab("arsenal")}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition",
                tab === "arsenal"
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              <Layers className="h-3.5 w-3.5" />
              Arsenal PRD
              {p.arsenal?.documents?.length > 0 && (
                <span className="ml-0.5 rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300">
                  {p.arsenal.documents.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("validation")}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition",
                tab === "validation"
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Validation
              {validation && !validation.ok && (
                <span className="ml-0.5 rounded-full bg-amber-500/20 px-1.5 py-0.5 text-[9px] font-mono text-amber-300">
                </span>
              )}
            </button>
            <button
              onClick={() => setTab("perf")}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition",
                tab === "perf"
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              <Activity className="h-3.5 w-3.5" />
              Perf IA
            </button>
            <button
              onClick={() => setTab("preview")}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition",
                tab === "preview"
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              <Play className="h-3.5 w-3.5" />
              Aperçu
            </button>
            <button
              onClick={() => setTab("snapshots")}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition",
                tab === "snapshots"
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              <History className="h-3.5 w-3.5" />
              Snapshots
            </button>
            <button
              onClick={() => setTab("kirov")}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition",
                tab === "kirov"
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              <Rocket className="h-3.5 w-3.5" />
              KIROV Bridge
            </button>
            <button
              onClick={() => setTab("launcher")}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition",
                tab === "launcher"
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              <Zap className="h-3.5 w-3.5" />
              Launcher
            </button>
            <button
              onClick={() => setTab("deepseek")}
              className={cn(
                "flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition",
                tab === "deepseek"
                  ? "border-cyan-500 text-cyan-300"
                  : "border-transparent text-slate-500 hover:text-slate-300"
              )}
            >
              <Cpu className="h-3.5 w-3.5" />
              DeepSeek Auto
            </button>
          </div>

          {/* Tab content */}
          <div className="min-h-0 flex-1">
            {tab === "code" ? (
              <FileExplorer project={p} />
            ) : tab === "arsenal" ? (
              <ArsenalPanel arsenal={p.arsenal} />
            ) : tab === "perf" ? (
              <PerfIAPanel projectId={p.id} />
            ) : tab === "preview" ? (
              <PreviewPanel projectId={p.id} />
            ) : tab === "snapshots" ? (
              <SnapshotsPanel projectId={p.id} />
            ) : tab === "kirov" ? (
              <KirovPanel projectId={p.id} />
            ) : tab === "launcher" ? (
              <KirovLauncher />
            ) : tab === "deepseek" ? (
              <DeepseekWebview onFilesGenerated={async (generatedFiles, generatedPrd) => {
                try {
                  const res = await fetch(`/api/projects/${p.id}/deepseek-save`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ files: generatedFiles, prd: generatedPrd }),
                  });
                  const data = await res.json();
                  if (data.success) {
                    toast.success(`${generatedFiles.length} fichiers sauvegardés !`);
                    fetchProject(p.id);
                  } else {
                    toast.error("Échec de la sauvegarde");
                  }
                } catch {
                  toast.error("Erreur réseau");
                }
              }} />
            ) : tab === "validation" ? (
              <div className="custom-scroll h-full overflow-y-auto p-4 sm:p-6">
                <div className="mx-auto max-w-3xl">
                  <div className="mb-4 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-cyan-300" />
                    <h2 className="text-base font-semibold text-slate-100">
                      Rapport de validation
                    </h2>
                  </div>
                  <p className="mb-4 text-xs leading-relaxed text-slate-400">
                    Analyse post-génération : scan des imports, réconciliation
                    des dépendances, vérification de la config Tailwind, des
                    fichiers utilitaires et de l'architecture React. Le projet
                    est garanti « out of the box » —{" "}
                    <span className="font-mono text-cyan-300">
                      npm install && npm run dev
                    </span>{" "}
                    doit fonctionner du premier coup.
                  </p>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                    <ValidationPanel report={validation} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="custom-scroll h-full overflow-y-auto p-6">
                <div className="mx-auto max-w-3xl">
                  <div className="mb-4 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-cyan-300" />
                    <h2 className="text-base font-semibold text-slate-100">
                      Product Requirements Document
                    </h2>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
                    <Markdown content={p.prd || "_Aucun PRD généré._"} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Draft/generating state */}
      {!isReady && !isFailed && (
        <DraftGeneratingView projectId={p.id} />
      )}
    </div>
  );
}

function DraftGeneratingView({ projectId }: { projectId: string }) {
  const refreshCurrentProject = useForgeStore((s) => s.refreshCurrentProject);
  const currentProject = useForgeStore((s) => s.currentProject);
  const [polling, setPolling] = useState(false);

  // Check if project became ready (has files) — stop polling in that case
  const projectReady =
    currentProject?.status === "ready" &&
    (currentProject?.files?.length ?? 0) > 0;

  useEffect(() => {
    if (projectReady) return; // Stop polling once ready

    let active = true;
    async function poll() {
      if (!active) return;
      setPolling(true);
      await refreshCurrentProject();
      if (active) setPolling(false);
    }
    // Initial poll after 2s, then every 5s (slower to reduce server load)
    const initial = setTimeout(poll, 2000);
    const interval = setInterval(poll, 5000);
    return () => {
      active = false;
      clearInterval(interval);
      clearTimeout(initial);
    };
  }, [projectId, refreshCurrentProject, projectReady]);

  const isGenerating = currentProject?.status === "generating";

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 animate-pulse items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/30">
          {polling || isGenerating ? (
            <Loader2 className="h-6 w-6 animate-spin text-cyan-300" />
          ) : (
            <Sparkles className="h-6 w-6 text-cyan-300" />
          )}
        </div>
        <p className="text-sm font-medium text-slate-200">
          {isGenerating
            ? "Génération en cours sur le serveur…"
            : "Projet en attente de génération."}
        </p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
          Vérification automatique du statut toutes les 4 secondes. Si la
          génération a déjà terminé côté serveur, les fichiers apparaîtront
          automatiquement.
        </p>
        <Button
          onClick={() => refreshCurrentProject()}
          disabled={polling}
          variant="outline"
          className="mt-4 border-slate-700 bg-slate-900/60 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-300"
        >
          {polling ? (
            <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
          )}
          Actualiser maintenant
        </Button>
      </div>
    </div>
  );
}
