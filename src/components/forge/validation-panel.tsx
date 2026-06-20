"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  ShieldCheck,
  Wrench,
  Package,
  FileCode2,
  ChevronDown,
  ChevronRight,
  Settings2,
} from "lucide-react";
import { useState } from "react";
import type { ValidationReport, ValidationIssue } from "@/lib/forge-config";
import { cn } from "@/lib/utils";

const SEVERITY_CONFIG = {
  error: {
    icon: AlertCircle,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/30",
    label: "Erreur",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    label: "Avertissement",
  },
  info: {
    icon: Info,
    color: "text-sky-400",
    bg: "bg-sky-500/10",
    border: "border-sky-500/30",
    label: "Info",
  },
} as const;

const CATEGORY_ICONS = {
  dependencies: Package,
  config: Settings2,
  utils: FileCode2,
  architecture: ShieldCheck,
  css: FileCode2,
} as const;

function IssueRow({ issue }: { issue: ValidationIssue }) {
  const cfg = SEVERITY_CONFIG[issue.severity];
  const Icon = cfg.icon;
  const CatIcon = CATEGORY_ICONS[issue.category] ?? Info;

  return (
    <div
      className={cn(
        "flex items-start gap-2.5 rounded-lg border p-2.5",
        cfg.bg,
        cfg.border
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", cfg.color)} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            <CatIcon className="mr-0.5 inline h-3 w-3" />
            {issue.category}
          </span>
          {issue.file && (
            <span className="rounded bg-slate-800/60 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
              {issue.file}
            </span>
          )}
        </div>
        <p className="mt-1 text-xs leading-relaxed text-slate-300">
          {issue.message}
        </p>
        {issue.fix && (
          <p className="mt-1 flex items-center gap-1 font-mono text-[10px] text-emerald-400/80">
            <Wrench className="h-2.5 w-2.5" />
            {issue.fix}
          </p>
        )}
      </div>
    </div>
  );
}

export function ValidationPanel({
  report,
}: {
  report: ValidationReport | null;
}) {
  const [expanded, setExpanded] = useState(true);

  if (!report) return null;

  const errors = report.issues.filter((i) => i.severity === "error");
  const warnings = report.issues.filter((i) => i.severity === "warning");
  const infos = report.issues.filter((i) => i.severity === "info");

  return (
    <div className="border-t border-slate-800 bg-slate-950/60">
      {/* Header — clickable to collapse */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 transition hover:bg-slate-900/40 sm:px-6"
      >
        <div className="flex items-center gap-2.5">
          {report.ok ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-400" />
          )}
          <span className="text-sm font-semibold text-slate-100">
            Validation du projet
          </span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium",
              report.ok
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                : "border-amber-500/30 bg-amber-500/10 text-amber-300"
            )}
          >
            {report.ok ? "Prêt à l'emploi" : "Points d'attention"}
          </span>
          {/* Quick stats */}
          <div className="hidden items-center gap-2 text-[10px] text-slate-500 sm:flex">
            <span>{report.stats.importsFound} imports</span>
            <span>·</span>
            <span>{report.stats.packagesAdded} packages ajoutés</span>
            <span>·</span>
            <span>{report.autoFixed.length} auto-fixes</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {errors.length > 0 && (
            <span className="rounded bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-mono text-rose-300">
              {errors.length} err
            </span>
          )}
          {warnings.length > 0 && (
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-mono text-amber-300">
              {warnings.length} warn
            </span>
          )}
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-slate-500" />
          ) : (
            <ChevronRight className="h-4 w-4 text-slate-500" />
          )}
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-4 pb-4 sm:px-6">
              {/* Auto-fixed items */}
              {report.autoFixed.length > 0 && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-300">
                    <Wrench className="h-3 w-3" />
                    Corrections automatiques ({report.autoFixed.length})
                  </p>
                  <ul className="space-y-1">
                    {report.autoFixed.map((fix, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-1.5 text-xs text-slate-300"
                      >
                        <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-emerald-400" />
                        {fix}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Issues */}
              {report.issues.length > 0 ? (
                <div className="space-y-2">
                  {report.issues.map((issue, i) => (
                    <IssueRow key={i} issue={issue} />
                  ))}
                </div>
              ) : report.autoFixed.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 text-sm text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" />
                  Aucun problème détecté — toutes les dépendances sont
                  résolues, la config est complète et l'architecture est saine.
                </div>
              ) : null}

              {/* Summary stats */}
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-800 pt-3 text-[10px] text-slate-500">
                <span className="flex items-center gap-1">
                  <FileCode2 className="h-3 w-3" />
                  {report.stats.filesScanned} fichiers scannés
                </span>
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {report.stats.importsFound} imports analysés
                </span>
                <span className="flex items-center gap-1">
                  <Wrench className="h-3 w-3" />
                  {report.stats.packagesAdded} packages ajoutés au package.json
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
