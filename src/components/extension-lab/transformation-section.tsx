"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Rocket,
  Code2,
  Search,
  Eye,
  Package,
  Layers,
  ArrowRight,
  CircleDot,
} from "lucide-react";
import { SectionWrapper } from "./section-wrapper";
import { useExtensionData } from "@/hooks/use-extension-data";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const PHASE_ICONS: Record<number, typeof Rocket> = {
  1: Rocket,
  2: Code2,
  3: Search,
  4: Eye,
  5: Package,
  6: Layers,
};

const PHASE_TEMPLATES: Record<
  number,
  { title: string; excerpt: string; detail: string }
> = {
  1: {
    title: "Phase 1 — PRD & Architecture (Méthode Matt Pocock)",
    excerpt:
      "[⚡ INGENIERIE SENIOR G50+ — PHASE 1 : PRD & ARCHITECTURE]\nTu es un Ingénieur Senior. Ta mission : concevoir un PRD technique parfait, axé sur les comportements et l'encapsulation (Deep Modules).",
    detail:
      "Le PromptEngine construit un template structuré demandant : Problem Statement, User Stories numérotées exhaustives, Implementation Decisions (Deep Modules), Testing Decisions (tests d’intégration via interfaces publiques), Out of Scope. Aucun code — uniquement de la spécification Markdown. Inclut la STRUCTURE CIBLE INVIOLABLE (modèle GAME2/TETRISV3) comme référence.",
  },
  2: {
    title: "Phase 2 — Génération de Code (TDD, Vertical Slicing)",
    excerpt:
      "🛡️ PROTOCOLE SOUVERAIN DIAMOND G50+ — PHASE 2 (GÉNÉRATION)\nPHILOSOPHIE TDD : Vertical Slicing (Red→Green→Refactor). Horizontal Slicing INTERDIT.",
    detail:
      "Injecte des règles strictes : structure de fichiers inviolable (index.html, vite.config.ts, tsconfig.json à la racine, code dans src/), interdictions absolues (Vue, Expo, BrowserRouter, purple/indigo/violet), modèle package.json exact, HashRouter obligatoire pour compatibilité APK Android, Zod pour tout type externe, Lucide-react pour les icônes. Format de sortie : blocs `Fichier: chemin` uniquement, zéro blabla.",
  },
  3: {
    title: "Phase 3 — Audit & Refactoring (Mode Tech Lead)",
    excerpt:
      "🛡️ PHASE 3 (AUDIT & REFACTORING)\n[SKILL: GRILL-ME] MODE TECH LEAD ACTIF. Ta mission n'est PAS d'écrire de nouvelles features, mais d'AUDITER le code généré.",
    detail:
      "Active un audit agressif : sécurité, fuites mémoire (useEffect non nettoyés), goulots d’étranglement. Critique de l’architecture (couplage, vrais Deep Modules ?). Vérification syntaxe JSX : balises fermées, template strings avec backticks, extensions .tsx vs .ts, aucun BrowserRouter. Réponse = uniquement code corrigé + critiques cinglantes en commentaires.",
  },
  4: {
    title: "Phase 4 — Build Monitor (Capture temps réel)",
    excerpt:
      "// OutputScanner : MutationObserver avec debounce 500ms\n// Clone + nettoyage DOM + déduplication SHA-256\n// UIRenderer : overlay flottant logs colorisés",
    detail:
      "L’OutputScanner observe le conteneur de messages. À chaque mutation (debounce 500ms), il clone le dernier message, supprime les boutons UI, préserve les sauts de ligne, filtre le bruit (copy/télécharger). Si le contenu contient `Fichier:` ou ` ``` `, il le valide via ValidationOrchestrator (fichiers requis, couleurs bannies, imports) puis l’envoie au bridge. L’UIRenderer affiche un overlay « Build Monitor » avec logs colorisés (rouge erreur, vert succès, jaune warning).",
  },
  5: {
    title: "Phase 5 — Matérialisation",
    excerpt:
      "// bridge.sendCapture({ content, validation })\n// POST /v1/bridge/callback → serveur Forge\n// Toast '📦 MATÉRIALISÉ' confirme le succès",
    detail:
      "Le code validé est relayé au serveur local (127.0.0.1:5005) via POST /v1/bridge/callback. Le serveur Forge matérialise le projet : écrit les fichiers, lance npm install --legacy-peer-deps, exécute le build. Les logs remontent via GET /v1/logs et s’affichent dans l’overlay. Toasts critiques : « 📦 MATÉRIALISÉ » (succès) ou « ⚠️ ÉCHEC BUILD » (erreur).",
  },
  6: {
    title: "Phase 6 — Flat Architecture (Protocole)",
    excerpt:
      "En tant que Senior Fullstack Engineer, ta mission est d'ajouter de nouvelles fonctionnalités (Phase P6) TOUT EN MAINTENANT STRICTEMENT l'Architecture Plate (Flat Structure).",
    detail:
      "Le bouton P6 du popup copie dans le presse-papier un protocole garantissant que tous les fichiers de configuration restent à la racine absolue, que le code source reste uniquement dans src/, et qu’aucun monorepo (app/, server/) ne soit créé. L’utilisateur colle ce protocole avant sa demande dans l’interface de l’IA — un exemple concret d’injection de prompt copilote.",
  },
};

export function TransformationSection() {
  const { loading, analysis } = useExtensionData();
  const [activePhase, setActivePhase] = useState(1);
  const phases = analysis?.phases ?? [];
  const template = PHASE_TEMPLATES[activePhase];
  const ActiveIcon = PHASE_ICONS[activePhase] ?? Rocket;

  return (
    <SectionWrapper
      id="transformation"
      pillar="Pilier 4 · Transformation en Application"
      title="Du prompt à l’application : le cycle P1–P6"
      subtitle="KIROV3 ne se contente pas d’assister — il orchestre un cycle complet de création d’applications. Chaque phase correspond à un prompt ingénierisé différent injecté dans l’IA, une capture de la sortie, une validation, puis une matérialisation. Clique sur une phase pour explorer son template réel."
    >
      {/* Phase stepper */}
      <div className="mb-8">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {(loading ? Array.from({ length: 6 }, (_, i) => ({ id: i + 1, name: "", description: "" })) : phases).map(
            (phase, i) => {
              const Icon = PHASE_ICONS[phase.id] ?? CircleDot;
              const isActive = activePhase === phase.id;
              return (
                <motion.button
                  key={phase.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  onClick={() => setActivePhase(phase.id)}
                  className={`group relative rounded-xl border p-3 text-left transition ${
                    isActive
                      ? "border-cyan-500/50 bg-gradient-to-br from-cyan-500/15 to-teal-500/10 ring-1 ring-cyan-500/30"
                      : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        isActive
                          ? "bg-cyan-500/20 text-cyan-300"
                          : "bg-slate-900 text-slate-500 group-hover:text-slate-300"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <span
                      className={`font-mono text-[10px] font-bold ${
                        isActive ? "text-cyan-300" : "text-slate-600"
                      }`}
                    >
                      P{phase.id}
                    </span>
                  </div>
                  <p
                    className={`mt-2 text-xs font-medium ${
                      isActive ? "text-slate-100" : "text-slate-400"
                    }`}
                  >
                    {loading
                      ? "Chargement…"
                      : phase.name || `Phase ${phase.id}`}
                  </p>
                </motion.button>
              );
            }
          )}
        </div>
      </div>

      {/* Active phase detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activePhase}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 gap-4 lg:grid-cols-5"
        >
          {/* Detail */}
          <Card className="border-slate-800 bg-slate-900/40 lg:col-span-2">
            <CardContent className="p-5">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
                  <ActiveIcon className="h-5 w-5 text-cyan-300" />
                </div>
                <div>
                  <Badge
                    variant="outline"
                    className="border-cyan-500/30 bg-cyan-500/10 font-mono text-[10px] text-cyan-300"
                  >
                    PHASE {activePhase} / 6
                  </Badge>
                </div>
              </div>
              <h3 className="text-base font-semibold text-slate-100">
                {template.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                {template.detail}
              </p>

              <div className="mt-4 border-t border-slate-800 pt-3">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  Description officielle
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">
                  {phases.find((p) => p.id === activePhase)?.description ??
                    template.detail}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Template excerpt */}
          <Card className="border-slate-800 bg-slate-950/60 lg:col-span-3">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
                  </div>
                  <span className="ml-2 font-mono text-xs text-slate-500">
                    PromptEngine.buildTemplate() — phase {activePhase}
                  </span>
                </div>
                <span className="font-mono text-[10px] text-slate-600">
                  content.js
                </span>
              </div>
              <pre className="custom-scroll max-h-[340px] overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-300">
                <code>{template.excerpt}</code>
              </pre>
              <div className="border-t border-slate-800 px-4 py-2.5 text-[11px] text-slate-500">
                <span className="text-cyan-300">↑</span> Extrait réel du prompt
                injecté dans le textarea de l’IA (DeepSeek/ChatGPT/Gemini)
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Flow summary */}
      <div className="mt-8 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
        <p className="mb-4 text-center text-xs uppercase tracking-widest text-slate-500">
          Flux complet — du prompt à l’application
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          {[
            "Bridge poll",
            "PromptEngine.inject()",
            "IA génère",
            "OutputScanner capture",
            "ValidationOrchestrator",
            "Bridge callback",
            "Forge matérialise",
          ].map((step, i, arr) => (
            <div key={step} className="flex items-center gap-2">
              <span className="rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 font-mono text-slate-300">
                {step}
              </span>
              {i < arr.length - 1 && (
                <ArrowRight className="h-3 w-3 text-cyan-500/60" />
              )}
            </div>
          ))}
        </div>
      </div>
    </SectionWrapper>
  );
}
