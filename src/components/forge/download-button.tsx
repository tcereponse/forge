"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Package,
  FileCode2,
  Loader2,
  CheckCircle2,
  ChevronDown,
  PackageCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DownloadInfo {
  fullAvailable: boolean;
  installStatus: string;
  buildStatus: string;
  workspaceExists: boolean;
  hasNodeModules: boolean;
}

export function DownloadButton({ projectId }: { projectId: string }) {
  const [info, setInfo] = useState<DownloadInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    let active = true;
    async function check() {
      try {
        const res = await fetch(`/api/projects/${projectId}/download-info`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (active && data.success) {
          setInfo(data);
        }
      } catch {
        // ignore
      }
    }
    check();
    // Poll every 3s while install is in progress
    const interval = setInterval(() => {
      if (info && (info.installStatus === "installing" || info.installStatus === "pending")) {
        check();
      }
    }, 3000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [projectId, info?.installStatus]);

  const fullAvailable = info?.fullAvailable ?? false;

  function downloadFull() {
    setMenuOpen(false);
    toast.success("Téléchargement du projet complet (avec dépendances)…");
    window.open(`/api/projects/${projectId}/download`, "_blank");
  }

  function downloadSourceOnly() {
    setMenuOpen(false);
    toast.success("Téléchargement du code source uniquement…");
    window.open(`/api/projects/${projectId}/download?source=true`, "_blank");
  }

  return (
    <div className="relative">
      <div className="flex">
        {/* Main download button */}
        <Button
          onClick={() => (fullAvailable ? downloadFull() : downloadSourceOnly())}
          className="rounded-r-none bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400"
        >
          <Download className="mr-1.5 h-4 w-4" />
          {fullAvailable ? "ZIP complet" : "ZIP source"}
          {fullAvailable && (
            <span className="ml-1.5 rounded bg-slate-950/20 px-1 py-0.5 text-[9px] font-mono">
              +deps
            </span>
          )}
        </Button>
        {/* Dropdown toggle */}
        <Button
          onClick={() => setMenuOpen((v) => !v)}
          className="rounded-l-none border-l border-slate-950/20 bg-gradient-to-r from-cyan-500 to-teal-500 px-2 text-slate-950 hover:from-cyan-400 hover:to-teal-400"
          aria-label="Options de téléchargement"
        >
          <ChevronDown
            className={cn("h-4 w-4 transition-transform", menuOpen && "rotate-180")}
          />
        </Button>
      </div>

      {/* Dropdown menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="absolute right-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg border border-slate-700 bg-slate-900 shadow-2xl"
            >
              {/* Full download option */}
              <button
                onClick={downloadFull}
                disabled={!fullAvailable}
                className={cn(
                  "flex w-full items-start gap-3 px-4 py-3 text-left transition",
                  fullAvailable
                    ? "hover:bg-cyan-500/10"
                    : "cursor-not-allowed opacity-50"
                )}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
                  <PackageCheck className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-slate-100">
                      ZIP complet
                    </p>
                    {fullAvailable && (
                      <Badge
                        variant="outline"
                        className="border-emerald-500/30 bg-emerald-500/10 px-1 py-0 text-[9px] text-emerald-300"
                      >
                        <CheckCircle2 className="mr-0.5 h-2.5 w-2.5" />
                        Prêt
                      </Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-[11px] leading-tight text-slate-400">
                    Source + node_modules + dist (build). Lance directement avec{" "}
                    <span className="font-mono text-slate-300">npm run dev</span>{" "}
                    — pas d'installation requise.
                  </p>
                  {!fullAvailable && (
                    <p className="mt-1 text-[10px] text-amber-400/80">
                      {info?.installStatus === "installing"
                        ? "⏳ Installation en cours…"
                        : "Attends que npm install termine."}
                    </p>
                  )}
                </div>
              </button>

              {/* Divider */}
              <div className="border-t border-slate-700" />

              {/* Source-only option */}
              <button
                onClick={downloadSourceOnly}
                className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-800/60"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-700/40 text-slate-400">
                  <FileCode2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-slate-200">
                    ZIP source uniquement
                  </p>
                  <p className="mt-0.5 text-[11px] leading-tight text-slate-400">
                    Code source + config. Tu devras lancer{" "}
                    <span className="font-mono text-slate-300">npm install</span>{" "}
                    avant de démarrer.
                  </p>
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Loading indicator while checking */}
      {loading && (
        <div className="absolute -bottom-5 right-0 flex items-center gap-1 text-[10px] text-slate-500">
          <Loader2 className="h-2.5 w-2.5 animate-spin" />
          Vérification…
        </div>
      )}
    </div>
  );
}
