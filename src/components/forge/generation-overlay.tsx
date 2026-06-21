"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Code2,
  Save,
  CheckCircle2,
  XCircle,
  Loader2,
  Cpu,
} from "lucide-react";
import { useForgeStore } from "@/hooks/use-forge-store";

const PHASES = [
  {
    key: "prd",
    label: "PRD & Architecture",
    desc: "Rédaction du Product Requirements Document",
    icon: FileText,
  },
  {
    key: "code",
    label: "Génération du code",
    desc: "L'LLM produit les fichiers du projet (JSON structuré)",
    icon: Code2,
  },
  {
    key: "saving",
    label: "Sauvegarde",
    desc: "Persistance en base + indexation des fichiers",
    icon: Save,
  },
  {
    key: "done",
    label: "Terminé",
    desc: "Le projet est prêt à être exploré",
    icon: CheckCircle2,
  },
] as const;

export function GenerationOverlay() {
  const { generating, generationPhase, generationError } = useForgeStore();

  return (
    <AnimatePresence>
      {generating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
                <Cpu className="h-5 w-5 text-cyan-300" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  Forge en cours
                </p>
                <p className="text-[11px] text-slate-500">
                  Génération IA du projet React
                </p>
              </div>
              <Loader2 className="ml-auto h-4 w-4 animate-spin text-cyan-400" />
            </div>

            {/* Phases */}
            <div className="space-y-2.5">
              {PHASES.map((phase, i) => {
                const currentIdx = PHASES.findIndex(
                  (p) => p.key === generationPhase
                );
                const isError = generationPhase === "error";
                const isDone =
                  generationPhase === "done" ||
                  (generationPhase !== "error" && i < currentIdx);
                const isActive = phase.key === generationPhase;
                const Icon = phase.icon;

                return (
                  <motion.div
                    key={phase.key}
                    initial={{ opacity: 0.4 }}
                    animate={{
                      opacity: isActive || isDone ? 1 : 0.4,
                    }}
                    className={`flex items-center gap-3 rounded-lg border p-3 transition ${
                      isActive
                        ? "border-cyan-500/40 bg-cyan-500/5"
                        : isDone
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-slate-800 bg-slate-950/40"
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-md ${
                        isDone
                          ? "bg-emerald-500/20 text-emerald-400"
                          : isActive
                            ? "bg-cyan-500/20 text-cyan-300"
                            : "bg-slate-900 text-slate-600"
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : isActive ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Icon className="h-4 w-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium ${
                          isDone
                            ? "text-emerald-300"
                            : isActive
                              ? "text-slate-100"
                              : "text-slate-400"
                        }`}
                      >
                        {phase.label}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {phase.desc}
                      </p>
                    </div>
                    {i < PHASES.length - 1 && (
                      <span
                        className={`font-mono text-[10px] ${
                          isActive || isDone
                            ? "text-cyan-400"
                            : "text-slate-700"
                        }`}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Error */}
            {generationPhase === "error" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="mt-3 flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"
              >
                <XCircle className="h-4 w-4 shrink-0" />
                {generationError || "Une erreur est survenue pendant la génération."}
              </motion.div>
            )}

            <p className="mt-4 text-center text-[10px] text-slate-600">
              La génération peut prendre 30 à 90 secondes selon la complexité.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
