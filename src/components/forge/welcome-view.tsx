"use client";

import { motion } from "framer-motion";
import {
  Hammer,
  Sparkles,
  Wand2,
  FolderTree,
  Download,
  Cpu,
  ArrowRight,
  FolderGit2,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { useForgeStore } from "@/hooks/use-forge-store";
import { Button } from "@/components/ui/button";
import {
  TemplatesGallery,
  type ProjectTemplate,
} from "@/components/forge/templates-gallery";

const FEATURES = [
  {
    icon: Wand2,
    title: "Génération IA",
    desc: "L'LLM produit un projet React complet : composants, config, pages.",
  },
  {
    icon: FolderTree,
    title: "Explorable",
    desc: "Arborescence de fichiers navigable + coloration syntaxique.",
  },
  {
    icon: Download,
    title: "Téléchargeable",
    desc: "Exporte ton projet en ZIP, prêt à npm install && npm run dev.",
  },
  {
    icon: Cpu,
    title: "Stack configurable",
    desc: "Vite/Next, TS, Tailwind, Router, Zustand, shadcn/ui, features…",
  },
];

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof FolderGit2;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${accent}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">
          {label}
        </p>
        <p className="truncate text-sm font-bold text-slate-100">{value}</p>
      </div>
    </div>
  );
}

export function WelcomeView() {
  const { setShowBuilder, setPendingTemplate, projects } = useForgeStore();

  const readyCount = projects.filter((p) => p.status === "ready").length;
  const lastProject = projects[0];

  function handlePickTemplate(tpl: ProjectTemplate) {
    setPendingTemplate(tpl);
    setShowBuilder(true);
  }

  return (
    <div className="custom-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-6 py-10 sm:py-16">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="pointer-events-none mx-auto mb-6 h-40 w-80 rounded-full bg-cyan-500/20 blur-[100px]" />
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-mono uppercase tracking-widest">
              Générateur de projets React
            </span>
          </div>
          <h1 className="mx-auto max-w-2xl text-balance text-4xl font-extrabold leading-tight tracking-tight text-slate-50 sm:text-5xl">
            Forge des applications{" "}
            <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 bg-clip-text text-transparent">
              React
            </span>{" "}
            avec l&rsquo;IA
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-relaxed text-slate-400 sm:text-base">
            Décris ton application, configure ta stack, et l&rsquo;IA génère un
            projet React complet, fonctionnel et téléchargeable — code source,
            configuration et composants inclus.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button
              onClick={() => setShowBuilder(true)}
              className="h-11 bg-gradient-to-r from-cyan-500 to-teal-500 px-6 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-teal-400"
            >
              <Hammer className="mr-2 h-4 w-4" />
              Créer un projet
            </Button>
          </div>
        </motion.div>

        {/* Health dashboard — quick stats */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3"
        >
          <StatCard
            icon={FolderGit2}
            label="Projets créés"
            value={projects.length}
            accent="bg-cyan-500/10 ring-cyan-500/20 text-cyan-300"
          />
          <StatCard
            icon={CheckCircle2}
            label="Projets prêts"
            value={readyCount}
            accent="bg-emerald-500/10 ring-emerald-500/20 text-emerald-300"
          />
          <StatCard
            icon={Zap}
            label="Dernier projet"
            value={lastProject ? lastProject.name : "—"}
            accent="bg-violet-500/10 ring-violet-500/20 text-violet-300"
          />
        </motion.div>

        {/* Features */}
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20">
                  <Icon className="h-4 w-4 text-cyan-300" />
                </div>
                <p className="text-sm font-semibold text-slate-100">
                  {f.title}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Templates Gallery */}
        <TemplatesGallery onPick={handlePickTemplate} />

        {/* Legacy sample ideas — kept for free-form inspiration */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40 p-5"
        >
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Ou décris ta propre idée
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              "Une app de gestion de tâches avec catégories et statistiques",
              "Un portfolio développeur avec projets et contact",
              "Un convertisseur de devises avec historique",
              "Un lecteur de podcasts avec favoris",
            ].map((idea) => (
              <button
                key={idea}
                onClick={() => setShowBuilder(true)}
                className="group flex items-center justify-between gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2.5 text-left text-xs text-slate-400 transition hover:border-cyan-500/40 hover:bg-slate-900 hover:text-slate-200"
              >
                <span>{idea}</span>
                <ArrowRight className="h-3.5 w-3.5 shrink-0 text-slate-600 transition group-hover:text-cyan-400" />
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
