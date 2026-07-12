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
  Sparkles,
  Layers,
  TestTube,
  Palette,
  Hammer,
  Zap,
  Clock,
  FileCode2,
  AlertCircle,
} from "lucide-react";
import { useProgress, type ProgressPhase } from "@/hooks/use-progress";
import { useForgeStore } from "@/hooks/use-forge-store";
import { useEffect, useState } from "react";

// Icon mapping for phase names
const PHASE_ICONS: Record<string, typeof FileText> = {
  "Architecture": Layers,
  "Scaffold (Design System + Data Layer + Features)": Palette,
  "Types (LLM)": FileText,
  "Business Logic (LLM)": Code2,
  "UI Components (LLM)": Hammer,
  "Tests (LLM)": TestTube,
  "PRD & Architecture": FileText,
  "Génération du code": Code2,
  "Sauvegarde": Save,
  "Terminé": CheckCircle2,
};

// Description mapping for phase names
const PHASE_DESCRIPTIONS: Record<string, string> = {
  "Architecture": "Plan JSON : dossiers, features, dépendances, routes, composants",
  "Scaffold (Design System + Data Layer + Features)": "32 composants UI + ApiClient + repository pattern + hooks Query",
  "Types (LLM)": "Interfaces TypeScript + schémas Zod par feature",
  "Business Logic (LLM)": "Composants + hooks TanStack Query + repository (utilisent le design system)",
  "UI Components (LLM)": "Composants UI spécifiques au projet (états loading/error/empty)",
  "Tests (LLM)": "Tests Vitest + React Testing Library par composant",
  "PRD & Architecture": "Rédaction du Product Requirements Document",
  "Génération du code": "L'LLM produit les fichiers du projet (JSON structuré)",
  "Sauvegarde": "Persistance en base + indexation des fichiers",
  "Terminé": "Le projet est prêt à être exploré",
};

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const remS = s % 60;
  return `${m}m ${remS}s`;
}

function PhaseRow({ phase, index, isLast }: { phase: ProgressPhase; index: number; isLast: boolean }) {
  const Icon = PHASE_ICONS[phase.name] ?? FileText;
  const isActive = phase.status === "running";
  const isDone = phase.status === "done";
  const isFailed = phase.status === "failed";
  const isSkipped = phase.status === "skipped";
  const isPending = phase.status === "pending";

  const phaseDuration = phase.startedAt && phase.completedAt
    ? phase.completedAt - phase.startedAt
    : phase.startedAt && isActive
      ? Date.now() - phase.startedAt
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="relative"
    >
      {/* Connector line */}
      {!isLast && (
        <div
          className={`absolute left-[19px] top-10 h-[calc(100%-16px)] w-0.5 ${
            isDone ? "bg-emerald-500/40" : isActive ? "bg-cyan-500/40" : "bg-slate-800"
          }`}
        />
      )}

      <div
        className={`flex items-start gap-3 rounded-xl border p-3 transition-all ${
          isActive
            ? "border-cyan-500/40 bg-cyan-500/5 shadow-lg shadow-cyan-500/10"
            : isDone
              ? "border-emerald-500/30 bg-emerald-500/5"
              : isFailed
                ? "border-rose-500/30 bg-rose-500/5"
                : isSkipped
                  ? "border-slate-800 bg-slate-950/20 opacity-50"
                  : "border-slate-800 bg-slate-950/40"
        }`}
      >
        {/* Icon circle */}
        <div
          className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isDone
              ? "bg-emerald-500/20 text-emerald-400"
              : isActive
                ? "bg-cyan-500/20 text-cyan-300"
                : isFailed
                  ? "bg-rose-500/20 text-rose-400"
                  : "bg-slate-900 text-slate-600"
          }`}
        >
          {isDone ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : isFailed ? (
            <XCircle className="h-4 w-4" />
          ) : isActive ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {/* Pulsing ring */}
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-cyan-500/50"
                animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            </>
          ) : (
            <Icon className="h-4 w-4" />
          )}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p
                className={`text-sm font-medium ${
                  isDone
                    ? "text-emerald-300"
                    : isActive
                      ? "text-cyan-200"
                      : isFailed
                        ? "text-rose-300"
                        : "text-slate-400"
                }`}
              >
                {phase.name}
              </p>
              {phase.retries && phase.retries > 0 && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-mono text-amber-300">
                  retry ×{phase.retries}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {phaseDuration && (
                <span className="flex items-center gap-1 text-[10px] text-slate-500">
                  <Clock className="h-2.5 w-2.5" />
                  {formatDuration(phaseDuration)}
                </span>
              )}
              {phase.filesGenerated !== undefined && phase.filesGenerated > 0 && (
                <span className="flex items-center gap-1 text-[10px] text-cyan-400">
                  <FileCode2 className="h-2.5 w-2.5" />
                  {phase.filesGenerated}
                </span>
              )}
              <span
                className={`font-mono text-[9px] ${
                  isActive ? "text-cyan-400" : isDone ? "text-emerald-500" : "text-slate-700"
                }`}
              >
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>
          </div>

          {/* Description */}
          <p className="mt-0.5 text-[11px] text-slate-500">
            {PHASE_DESCRIPTIONS[phase.name] ?? phase.name}
          </p>

          {/* Live message */}
          {phase.message && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-1 truncate text-[10px] ${
                isActive ? "text-cyan-400/80" : isDone ? "text-emerald-500/60" : "text-slate-600"
              }`}
            >
              {phase.message}
            </motion.p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function StandardOverlay() {
  const { generationPhase, generationError } = useForgeStore();

  const phases = [
    { key: "prd", label: "PRD & Architecture", desc: "Rédaction du Product Requirements Document", icon: FileText },
    { key: "code", label: "Génération du code", desc: "L'LLM produit les fichiers du projet (JSON structuré)", icon: Code2 },
    { key: "saving", label: "Sauvegarde", desc: "Persistance en base + indexation des fichiers", icon: Save },
    { key: "done", label: "Terminé", desc: "Le projet est prêt à être exploré", icon: CheckCircle2 },
  ];

  const currentIdx = phases.findIndex((p) => p.key === generationPhase);
  const isError = generationPhase === "error";

  return (
    <div className="space-y-2.5">
      {phases.map((phase, i) => {
        const isDone = generationPhase === "done" || (generationPhase !== "error" && i < currentIdx);
        const isActive = phase.key === generationPhase && !isError;
        const Icon = phase.icon;

        return (
          <motion.div
            key={phase.key}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: isActive || isDone ? 1 : 0.4 }}
            className={`flex items-center gap-3 rounded-lg border p-3 transition ${
              isActive ? "border-cyan-500/40 bg-cyan-500/5" : isDone ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-800 bg-slate-950/40"
            }`}
          >
            <div className={`flex h-8 w-8 items-center justify-center rounded-md ${isDone ? "bg-emerald-500/20 text-emerald-400" : isActive ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-900 text-slate-600"}`}>
              {isDone ? <CheckCircle2 className="h-4 w-4" /> : isActive ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${isDone ? "text-emerald-300" : isActive ? "text-slate-100" : "text-slate-400"}`}>{phase.label}</p>
              <p className="text-[11px] text-slate-500">{phase.desc}</p>
            </div>
            <span className={`font-mono text-[10px] ${isActive || isDone ? "text-cyan-400" : "text-slate-700"}`}>
              {String(i + 1).padStart(2, "0")}
            </span>
          </motion.div>
        );
      })}

      {isError && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
          <XCircle className="h-4 w-4 shrink-0" />
          {generationError || "Une erreur est survenue pendant la génération."}
        </motion.div>
      )}
    </div>
  );
}

function GoldOverlay({ projectId }: { projectId: string }) {
  const { progress } = useProgress(projectId, { interval: 800 });
  const [elapsed, setElapsed] = useState(0);

  // Live elapsed timer
  useEffect(() => {
    if (!progress) return;
    const timer = setInterval(() => {
      setElapsed(Date.now() - progress.startedAt);
    }, 100);
    return () => clearInterval(timer);
  }, [progress]);

  if (!progress) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
      </div>
    );
  }

  const phases = progress.phases;
  const completedPhases = phases.filter((p) => p.status === "done" || p.status === "skipped").length;
  const totalPhases = phases.length;
  const progressPercent = totalPhases > 0 ? (completedPhases / totalPhases) * 100 : 0;
  const totalFiles = progress.totalFiles || phases.reduce((s, p) => s + (p.filesGenerated || 0), 0);

  const isReady = progress.projectStatus === "ready";
  const isFailed = progress.projectStatus === "failed" || phases.some((p) => p.status === "failed");

  return (
    <div className="space-y-4">
      {/* Progress bar + stats */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-medium text-slate-300">Pipeline Gold Grade</span>
          </div>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1 text-cyan-400">
              <FileCode2 className="h-3 w-3" />
              {totalFiles} fichiers
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="h-3 w-3" />
              {formatDuration(elapsed)}
            </span>
          </div>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 via-cyan-500 to-teal-500"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[10px] text-slate-500">
          <span>{completedPhases} / {totalPhases} passes</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-2">
        {phases.map((phase, i) => (
          <PhaseRow key={i} phase={phase} index={i} isLast={i === phases.length - 1} />
        ))}
      </div>

      {/* Error */}
      {isFailed && progress.error && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Erreur du pipeline</p>
            <p className="mt-0.5 opacity-80">{progress.error}</p>
          </div>
        </motion.div>
      )}

      {/* Success message */}
      {isReady && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-emerald-300">Projet généré avec succès !</p>
            <p className="text-[11px] text-slate-400">
              {totalFiles} fichiers • {formatDuration(elapsed)} • Prêt à explorer
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function GenerationOverlay() {
  const { generating, generationPhase } = useForgeStore();
  const [goldProjectId, setGoldProjectId] = useState<string | null>(null);

  // Detect Gold mode by checking URL or store — simplified: check if we have a projectId in session storage
  useEffect(() => {
    const stored = sessionStorage.getItem("gold-generating-project-id");
    if (stored) {
      setGoldProjectId(stored);
    } else {
      setGoldProjectId(null);
    }
  }, [generating, generationPhase]);

  // Clear session storage when generation is done
  useEffect(() => {
    if (!generating) {
      sessionStorage.removeItem("gold-generating-project-id");
      setGoldProjectId(null);
    }
  }, [generating]);

  const isGoldMode = !!goldProjectId;

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
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="custom-scroll max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl"
          >
            {/* Header */}
            <div className="mb-5 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${
                isGoldMode
                  ? "bg-gradient-to-br from-amber-500/20 to-yellow-500/20 ring-amber-500/30"
                  : "bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-cyan-500/30"
              }`}>
                {isGoldMode ? (
                  <Sparkles className="h-5 w-5 text-amber-300" />
                ) : (
                  <Cpu className="h-5 w-5 text-cyan-300" />
                )}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {isGoldMode ? "Gold Grade en cours" : "Forge en cours"}
                </p>
                <p className="text-[11px] text-slate-500">
                  {isGoldMode
                    ? "Pipeline 5 passes • Architecture → Types → Logic → UI → Tests"
                    : "Génération IA du projet React"}
                </p>
              </div>
              <Loader2 className={`ml-auto h-4 w-4 animate-spin ${isGoldMode ? "text-amber-400" : "text-cyan-400"}`} />
            </div>

            {/* Body */}
            {isGoldMode && goldProjectId ? (
              <GoldOverlay projectId={goldProjectId} />
            ) : (
              <StandardOverlay />
            )}

            {/* Footer */}
            <p className="mt-4 text-center text-[10px] text-slate-600">
              {isGoldMode
                ? "Le pipeline Gold génère 80-100 fichiers (design system, tests, Docker, CI/CD, docs). 3-6 min selon la complexité."
                : "La génération peut prendre 30 à 90 secondes selon la complexité."}
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Call this before launching Gold generation to enable the Gold overlay. */
export function setGoldGeneratingProjectId(projectId: string) {
  sessionStorage.setItem("gold-generating-project-id", projectId);
}
