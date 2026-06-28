"use client";

import { motion } from "framer-motion";
import {
  CheckSquare,
  UtensilsCrossed,
  Code2,
  CloudSun,
  Wallet,
  Timer,
  FileText,
  Brain,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import type {
  StackOption,
  StylingOption,
  RoutingOption,
  StateOption,
  UiLibOption,
} from "@/lib/forge-config";

export interface ProjectTemplate {
  id: string;
  name: string;
  tagline: string;
  description: string;
  icon: LucideIcon;
  accent: string; // tailwind gradient classes
  features: string[];
  // Partial config overrides — sensible defaults per template
  config: {
    stack: StackOption;
    styling: StylingOption;
    routing: RoutingOption;
    stateMgmt: StateOption;
    uiLib: UiLibOption;
  };
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "taskflow",
    name: "TaskFlow",
    tagline: "Gestion de tâches moderne",
    description:
      "Application de gestion de tâches avec catégories colorées, priorités, statistiques hebdomadaires et filtrage avancé. Stockage local persistant.",
    icon: CheckSquare,
    accent: "from-cyan-500/20 to-blue-500/20",
    features: ["forms", "charts", "tables"],
    config: {
      stack: "vite",
      styling: "tailwind",
      routing: "router",
      stateMgmt: "zustand",
      uiLib: "shadcn",
    },
  },
  {
    id: "recipebox",
    name: "RecipeBox",
    tagline: "Carnet de recettes culinaire",
    description:
      "Carnet de recettes personnel avec recherche par ingrédient, favoris, calcul de portions et mode cuisine plein écran. Import depuis URL.",
    icon: UtensilsCrossed,
    accent: "from-amber-500/20 to-orange-500/20",
    features: ["api", "forms"],
    config: {
      stack: "vite",
      styling: "tailwind",
      routing: "router",
      stateMgmt: "zustand",
      uiLib: "shadcn",
    },
  },
  {
    id: "devportfolio",
    name: "DevPortfolio",
    tagline: "Portfolio développeur",
    description:
      "Portfolio développeur élégant avec sections projets, compétences, expérience et contact. Animations au scroll, thème sombre, responsive.",
    icon: Code2,
    accent: "from-violet-500/20 to-purple-500/20",
    features: ["animations", "darkmode"],
    config: {
      stack: "vite",
      styling: "tailwind",
      routing: "router",
      stateMgmt: "none",
      uiLib: "shadcn",
    },
  },
  {
    id: "weathercast",
    name: "WeatherCast",
    tagline: "Météo & prévisions",
    description:
      "Dashboard météo avec prévisions 7 jours, carte interactive, alertes et historique de recherche. Données mock réalistes intégrées.",
    icon: CloudSun,
    accent: "from-sky-500/20 to-teal-500/20",
    features: ["charts", "api"],
    config: {
      stack: "vite",
      styling: "tailwind",
      routing: "router",
      stateMgmt: "zustand",
      uiLib: "shadcn",
    },
  },
  {
    id: "expensetracker",
    name: "ExpenseTracker",
    tagline: "Suivi de dépenses",
    description:
      "Tracker de dépenses avec catégories, graphiques mensuels, budget cible et export CSV. Saisie rapide + statistiques visuelles.",
    icon: Wallet,
    accent: "from-emerald-500/20 to-green-500/20",
    features: ["charts", "forms", "tables"],
    config: {
      stack: "vite",
      styling: "tailwind",
      routing: "router",
      stateMgmt: "zustand",
      uiLib: "shadcn",
    },
  },
  {
    id: "pomodoro",
    name: "PomodoroPro",
    tagline: "Timer Pomodoro avancé",
    description:
      "Timer Pomodoro avec cycles travail/pause paramétrables, statistiques de productivité, sons de notification et historique des sessions.",
    icon: Timer,
    accent: "from-rose-500/20 to-pink-500/20",
    features: ["animations", "charts"],
    config: {
      stack: "vite",
      styling: "tailwind",
      routing: "router",
      stateMgmt: "zustand",
      uiLib: "shadcn",
    },
  },
  {
    id: "markdownnotes",
    name: "MarkdownNotes",
    tagline: "Éditeur de notes Markdown",
    description:
      "Éditeur de notes Markdown avec preview live, dossiers, recherche full-text, export et raccourcis clavier. Persistance locale automatique.",
    icon: FileText,
    accent: "from-slate-500/20 to-zinc-500/20",
    features: ["forms"],
    config: {
      stack: "vite",
      styling: "tailwind",
      routing: "router",
      stateMgmt: "zustand",
      uiLib: "shadcn",
    },
  },
  {
    id: "quizmaster",
    name: "QuizMaster",
    tagline: "Créateur de quiz interactifs",
    description:
      "Créateur de quiz avec éditeur de questions, mode chronométré, score en temps réel, classement et partage de liens. Banque de questions intégrée.",
    icon: Brain,
    accent: "from-indigo-500/20 to-blue-500/20",
    features: ["forms", "animations", "charts"],
    config: {
      stack: "vite",
      styling: "tailwind",
      routing: "router",
      stateMgmt: "zustand",
      uiLib: "shadcn",
    },
  },
];

interface TemplatesGalleryProps {
  onPick: (template: ProjectTemplate) => void;
}

export function TemplatesGallery({ onPick }: TemplatesGalleryProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="mt-10 rounded-xl border border-slate-800 bg-slate-950/40 p-5"
    >
      <div className="mb-4 flex items-center justify-between">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <ArrowRight className="h-3.5 w-3.5 text-cyan-300" />
          Modèles prêts à forger
        </p>
        <span className="text-[10px] text-slate-600">
          1 clic → projet généré
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PROJECT_TEMPLATES.map((tpl, i) => {
          const Icon = tpl.icon;
          return (
            <motion.button
              key={tpl.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.05 }}
              onClick={() => onPick(tpl)}
              className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-left transition hover:border-cyan-500/40 hover:bg-slate-900/70"
            >
              <div
                className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${tpl.accent} blur-2xl transition-opacity opacity-60 group-hover:opacity-100`}
              />
              <div className="relative">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950/60 ring-1 ring-slate-700/50">
                  <Icon className="h-5 w-5 text-cyan-300" />
                </div>
                <p className="text-sm font-bold text-slate-100">{tpl.name}</p>
                <p className="mt-0.5 text-[11px] font-medium text-cyan-400/80">
                  {tpl.tagline}
                </p>
                <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500">
                  {tpl.description}
                </p>
                <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-slate-600 transition group-hover:text-cyan-300">
                  <span>Forger ce modèle</span>
                  <ArrowRight className="h-3 w-3" />
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}
