"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package,
  Hammer,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Terminal,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useProcessStatus } from "@/hooks/use-process-status";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; icon: typeof Loader2 }> = {
    pending: { label: "En attente", color: "border-slate-700 bg-slate-900/60 text-slate-400", icon: ChevronRight },
    installing: { label: "Installation…", color: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300", icon: Loader2 },
    building: { label: "Build…", color: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300", icon: Loader2 },
    installed: { label: "Installé", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", icon: CheckCircle2 },
    built: { label: "Prêt", color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", icon: CheckCircle2 },
    failed: { label: "Échec", color: "border-rose-500/30 bg-rose-500/10 text-rose-300", icon: XCircle },
  };
  const c = config[status] ?? config.pending;
  const Icon = c.icon;
  return (
    <Badge variant="outline" className={cn("gap-1 text-[10px]", c.color)}>
      <Icon className={cn("h-3 w-3", (status === "installing" || status === "building") && "animate-spin")} />
      {c.label}
    </Badge>
  );
}

export function PreviewPanel({ projectId }: { projectId: string }) {
  const { status, triggerBuild, refresh } = useProcessStatus(projectId, true);
  const [showLogs, setShowLogs] = useState<"install" | "build" | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  const installDone = status?.install === "installed";
  const buildDone = status?.build === "built";
  const buildFailed = status?.build === "failed";
  const installFailed = status?.install === "failed";

  async function handleBuild() {
    if (!installDone) {
      toast.error("Attends la fin de l'installation des dépendances");
      return;
    }
    toast.success("Build démarré…");
    await triggerBuild();
  }

  function handleRefreshPreview() {
    setPreviewKey((k) => k + 1);
  }

  return (
    <div className="flex h-full flex-col">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 bg-slate-950/40 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-slate-500" />
          <span className="text-xs text-slate-400">Dépendances</span>
          <StatusBadge status={status?.install ?? "pending"} />
        </div>
        <div className="flex items-center gap-2">
          <Hammer className="h-4 w-4 text-slate-500" />
          <span className="text-xs text-slate-400">Build</span>
          <StatusBadge status={status?.build ?? "pending"} />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            onClick={handleBuild}
            disabled={!installDone || status?.build === "building"}
            size="sm"
            className="h-8 bg-gradient-to-r from-cyan-500 to-teal-500 text-xs text-slate-950 hover:from-cyan-400 hover:to-teal-400"
          >
            {status?.build === "building" ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Hammer className="mr-1.5 h-3.5 w-3.5" />
            )}
            {buildDone ? "Rebuilder" : "Builder"}
          </Button>
          {buildDone && (
            <Button
              onClick={handleRefreshPreview}
              size="sm"
              variant="outline"
              className="h-8 border-slate-700 text-slate-300 hover:text-cyan-300"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
          )}
        </div>
      </div>

      {/* Error states */}
      {installFailed && (
        <div className="border-b border-rose-500/20 bg-rose-500/5 px-4 py-2.5 sm:px-6">
          <p className="text-xs text-rose-300">
            ❌ L'installation a échoué. Vérifie les logs ci-dessous.
          </p>
        </div>
      )}
      {buildFailed && (
        <div className="border-b border-rose-500/20 bg-rose-500/5 px-4 py-2.5 sm:px-6">
          <p className="text-xs text-rose-300">
            ❌ Le build a échoué. Vérifie les logs ci-dessous.
          </p>
        </div>
      )}

      {/* Log toggles */}
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2 sm:px-6">
        <button
          onClick={() => setShowLogs(showLogs === "install" ? null : "install")}
          className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950/40 px-2.5 py-1 text-[11px] text-slate-400 transition hover:text-slate-200"
        >
          <Terminal className="h-3 w-3" />
          Logs npm install
          {showLogs === "install" ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
        <button
          onClick={() => setShowLogs(showLogs === "build" ? null : "build")}
          className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950/40 px-2.5 py-1 text-[11px] text-slate-400 transition hover:text-slate-200"
        >
          <Terminal className="h-3 w-3" />
          Logs build
          {showLogs === "build" ? (
            <ChevronDown className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
      </div>

      {/* Logs */}
      <AnimatePresence>
        {showLogs && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-slate-800"
          >
            <pre className="custom-scroll max-h-48 overflow-auto bg-slate-950 p-3 font-mono text-[11px] leading-relaxed text-slate-400">
              {showLogs === "install"
                ? status?.installLog || "En attente…"
                : status?.buildLog || "En attente…"}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview iframe */}
      <div className="relative min-h-0 flex-1 bg-slate-950">
        {buildDone ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-1.5">
              <div className="flex items-center gap-2">
                <Eye className="h-3.5 w-3.5 text-cyan-300" />
                <span className="text-[11px] font-medium text-slate-300">
                  Aperçu en direct
                </span>
              </div>
              <a
                href={`/api/preview/${projectId}/`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[11px] text-slate-500 transition hover:text-cyan-300"
              >
                <ExternalLink className="h-3 w-3" />
                Ouvrir
              </a>
            </div>
            <iframe
              key={previewKey}
              src={`/api/preview/${projectId}/`}
              className="min-h-0 w-full flex-1 border-0 bg-white"
              title="Aperçu du projet"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-800">
              {status?.install === "installing" || status?.build === "building" ? (
                <Loader2 className="h-7 w-7 animate-spin text-cyan-400" />
              ) : buildFailed ? (
                <XCircle className="h-7 w-7 text-rose-400" />
              ) : (
                <Play className="h-7 w-7 text-slate-600" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-slate-300">
                {status?.install === "installing"
                  ? "Installation des dépendances…"
                  : status?.build === "building"
                    ? "Build du projet en cours…"
                    : buildFailed
                      ? "Le build a échoué"
                      : installFailed
                        ? "L'installation a échoué"
                        : !installDone
                          ? "Préparation de l'installation…"
                          : "Prêt à builder"}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {buildFailed || installFailed
                  ? "Consulte les logs pour diagnostiquer."
                  : !installDone
                    ? "npm install se lance automatiquement après la génération."
                    : "Clique sur « Builder » pour générer l'aperçu."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
