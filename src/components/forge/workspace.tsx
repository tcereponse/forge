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
} from "lucide-react";
import { useForgeStore } from "@/hooks/use-forge-store";
import { Markdown } from "@/components/forge/markdown";
import { FileExplorer } from "@/components/forge/file-explorer";
import { ValidationPanel } from "@/components/forge/validation-panel";
import { PreviewPanel } from "@/components/forge/preview-panel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
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
  const [tab, setTab] = useState<"code" | "prd" | "validation" | "preview">("code");

  if (loadingProject && !currentProject) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500/30 border-t-cyan-400" />
          Chargement du projet…
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

          {isReady && (
            <a href={`/api/projects/${p.id}/download`} target="_blank" rel="noopener noreferrer">
              <Button className="bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400">
                <Download className="mr-1.5 h-4 w-4" />
                ZIP
              </Button>
            </a>
          )}
        </div>
      </div>

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

      {/* Ready state — tabs + content */}
      {isReady && (
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
                  {validation.issues.filter((i) => i.severity === "warning").length}
                </span>
              )}
              {validation && validation.ok && (
                <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              )}
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
          </div>

          {/* Tab content */}
          <div className="min-h-0 flex-1">
            {tab === "code" ? (
              <FileExplorer project={p} />
            ) : tab === "preview" ? (
              <PreviewPanel projectId={p.id} />
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
  const [polling, setPolling] = useState(false);

  // Auto-poll every 4s while the project is in draft/generating state,
  // in case the generation completed on the backend but the client lost the response.
  useEffect(() => {
    let active = true;
    async function poll() {
      setPolling(true);
      await refreshCurrentProject();
      if (active) setPolling(false);
    }
    const interval = setInterval(poll, 4000);
    // Also poll immediately after a short delay
    const initial = setTimeout(poll, 1500);
    return () => {
      active = false;
      clearInterval(interval);
      clearTimeout(initial);
    };
  }, [projectId, refreshCurrentProject]);

  const cur = useForgeStore((s) => s.currentProject);
  const isGenerating = cur?.status === "generating";

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
