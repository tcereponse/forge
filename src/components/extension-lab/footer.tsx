"use client";

import { Boxes, Github, Globe, Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-800/60 bg-slate-950">
      <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
                <Boxes className="h-4 w-4 text-cyan-300" />
              </div>
              <span className="font-mono text-sm font-semibold text-slate-100">
                Extension Lab
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              Analyse interactive de l’extension{" "}
              <span className="font-mono text-slate-400">GLOBAL_KIROV3</span>{" "}
              — un orchestrateur Chrome Manifest V3 qui relie le navigateur à
              l’IA pour la création automatisée d’applications.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Les 4 piliers
            </p>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li>
                <a href="#bridge" className="transition hover:text-cyan-300">
                  → Extension comme pont (Bridge)
                </a>
              </li>
              <li>
                <a href="#navigation" className="transition hover:text-cyan-300">
                  → Navigation & Recherche IA
                </a>
              </li>
              <li>
                <a href="#copilot" className="transition hover:text-cyan-300">
                  → Aide utilisateur (Copilote)
                </a>
              </li>
              <li>
                <a
                  href="#transformation"
                  className="transition hover:text-cyan-300"
                >
                  → Transformation en application
                </a>
              </li>
            </ul>
          </div>

          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
              Stack technique
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[
                "Next.js 16",
                "TypeScript",
                "Tailwind CSS 4",
                "shadcn/ui",
                "z-ai-web-dev-sdk",
                "Framer Motion",
              ].map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-slate-800 bg-slate-900/60 px-2.5 py-1 text-[10px] text-slate-400"
                >
                  {t}
                </span>
              ))}
            </div>
            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-600">
              <Sparkles className="h-3 w-3 text-cyan-500/60" />
              Compilé avec les Skills LLM · Web-Search · Web-Reader
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-slate-800/60 pt-6 sm:flex-row">
          <p className="text-[11px] text-slate-600">
            © {new Date().getFullYear()} Extension Lab — Analyse pédagogique
            d’une extension Chrome Manifest V3.
          </p>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <Globe className="h-3 w-3" />
              Manifest V3
            </span>
            <span className="flex items-center gap-1.5">
              <Github className="h-3 w-3" />
              Open analysis
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
