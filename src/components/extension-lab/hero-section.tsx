"use client";

import { motion } from "framer-motion";
import { Boxes, FileCode2, Network, Sparkles, ChevronDown } from "lucide-react";
import { useExtensionData } from "@/hooks/use-extension-data";

export function HeroSection() {
  const { loading, analysis, extension } = useExtensionData();

  return (
    <header className="relative overflow-hidden border-b border-slate-800/60">
      {/* Background grid + glow */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[40rem] -translate-x-1/2 rounded-full bg-cyan-500/20 blur-[120px]" />

      <div className="relative mx-auto w-full max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-mono uppercase tracking-widest">
              Analyse en temps réel · Manifest V3
            </span>
          </div>

          <h1 className="mx-auto max-w-4xl text-balance text-4xl font-extrabold leading-tight tracking-tight text-slate-50 sm:text-5xl lg:text-6xl">
            Extensions de Navigateur{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
              augmentées par l’IA
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-slate-400 sm:text-lg">
            Exploration vivante d’une extension Chrome réelle —{" "}
            <span className="font-mono text-cyan-300">GLOBAL_KIROV3</span> —
            pour comprendre comment elle relie le navigateur à l’IA, analyse le
            DOM, agit comme copilote, et orchestre la création d’applications
            complètes.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#bridge"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-teal-400"
            >
              <Network className="h-4 w-4" />
              Explorer les 4 piliers
            </a>
            <a
              href="#code-explorer"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/60 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:border-slate-600 hover:bg-slate-800/60"
            >
              <FileCode2 className="h-4 w-4" />
              Voir le code source
            </a>
          </div>
        </motion.div>

        {/* Extension identity + metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-14 max-w-5xl"
        >
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl backdrop-blur-sm sm:p-8">
            <div className="flex flex-col gap-4 border-b border-slate-800 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
                  <Boxes className="h-6 w-6 text-cyan-300" />
                </div>
                <div>
                  <p className="font-mono text-sm font-semibold text-slate-100">
                    {loading
                      ? "Chargement…"
                      : extension?.name ?? "ELITE FORGE GLOBAL — KIROV3"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {extension
                      ? `v${extension.version} · Manifest V${extension.manifestVersion}`
                      : "Extension Chrome"}
                  </p>
                </div>
              </div>
              <p className="max-w-md text-xs leading-relaxed text-slate-400">
                {extension?.description ??
                  "Extension Maîtresse : Cycle complet P1-P5 One-Shot"}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-5 sm:grid-cols-3 lg:grid-cols-6">
              {(analysis?.metrics ?? [
                { label: "Fichiers", value: "—" },
                { label: "Lignes", value: "—" },
                { label: "Taille", value: "—" },
                { label: "Modules", value: "9" },
                { label: "Phases", value: "6" },
                { label: "Plateformes", value: "3" },
              ]).map((m, i) => (
                <motion.div
                  key={m.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-center"
                >
                  <p className="font-mono text-xl font-bold text-cyan-300">
                    {loading ? "…" : m.value}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-500">
                    {m.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-12 flex justify-center"
        >
          <ChevronDown className="h-5 w-5 animate-bounce text-slate-600" />
        </motion.div>
      </div>
    </header>
  );
}
