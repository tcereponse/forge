import { motion } from 'framer-motion'
import {
  Hammer, Sparkles, Wand2, FolderTree, Download, Cpu, ArrowRight,
  FolderGit2, CheckCircle2, Zap, Smartphone,
} from 'lucide-react'
import { PROJECT_TEMPLATES, SAMPLE_IDEAS, type ProjectTemplate } from '../templates'
import type { Project } from '../useProjects'

const FEATURES = [
  { icon: Wand2, title: 'Generation IA', desc: 'L LLM produit un projet React complet : composants, config, pages.' },
  { icon: FolderTree, title: 'Explorable', desc: 'Arborescence de fichiers navigable + coloration syntaxique.' },
  { icon: Download, title: 'Telechargeable', desc: 'Exporte ton projet en ZIP, pret a npm install && npm run dev.' },
  { icon: Cpu, title: 'Stack configurable', desc: 'Vite/Next, TS, Tailwind, Router, Zustand, shadcn/ui, features...' },
]

function StatCard({ icon: Icon, label, value, accent }: { icon: typeof FolderGit2; label: string; value: string | number; accent: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3">
      <div className={`flex h-9 w-9 items-center justify-center rounded-lg ring-1 ${accent}`}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-500">{label}</p>
        <p className="truncate text-sm font-bold text-slate-100">{value}</p>
      </div>
    </div>
  )
}

export function WelcomeView({
  onNew,
  onPickTemplate,
  onPickIdea,
  projects,
}: {
  onNew: () => void
  onPickTemplate?: (tpl: ProjectTemplate) => void
  onPickIdea?: (idea: string) => void
  projects: Project[]
}) {
  const readyCount = projects.filter(p => p.status === 'ready').length
  const lastProject = projects[0]

  return (
    <div className="custom-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="pointer-events-none mx-auto mb-6 h-32 w-64 rounded-full bg-cyan-500/20 blur-[80px]" />
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            <span className="font-mono uppercase tracking-widest">Generateur de projets React</span>
          </div>
          <h1 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-slate-50 sm:text-4xl">
            Forge des applications{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 bg-clip-text text-transparent">React</span>{' '}
            avec l IA
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Decris ton application, configure ta stack, et l IA genere un projet React complet, fonctionnel et telechargeable — code source, configuration et composants inclus.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button onClick={onNew} className="inline-flex h-11 items-center gap-2 rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 px-6 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-teal-400">
              <Hammer className="h-4 w-4" />
              Creer un projet
            </button>
          </div>
        </motion.div>

        {/* Health dashboard — quick stats */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatCard icon={FolderGit2} label="Projets crees" value={projects.length} accent="bg-cyan-500/10 ring-cyan-500/20 text-cyan-300" />
          <StatCard icon={CheckCircle2} label="Projets prets" value={readyCount} accent="bg-emerald-500/10 ring-emerald-500/20 text-emerald-300" />
          <StatCard icon={Zap} label="Dernier projet" value={lastProject ? lastProject.name : '—'} accent="bg-violet-500/10 ring-violet-500/20 text-violet-300" />
        </motion.div>

        {/* Features */}
        <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => {
            const Icon = f.icon
            return (
              <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20">
                  <Icon className="h-4 w-4 text-cyan-300" />
                </div>
                <p className="text-sm font-semibold text-slate-100">{f.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-400">{f.desc}</p>
              </motion.div>
            )
          })}
        </div>

        {/* Templates Gallery */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-10 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
          <div className="mb-4 flex items-center justify-between">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <ArrowRight className="h-3.5 w-3.5 text-cyan-300" />
              Modeles prets a forger
            </p>
            <span className="text-[10px] text-slate-600">1 clic → projet genere</span>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {PROJECT_TEMPLATES.map((tpl, i) => {
              const Icon = tpl.icon
              return (
                <motion.button
                  key={tpl.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 + i * 0.05 }}
                  onClick={() => onPickTemplate ? onPickTemplate(tpl) : onNew()}
                  className="group relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/40 p-4 text-left transition hover:border-cyan-500/40 hover:bg-slate-900/70"
                >
                  <div className={`pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br ${tpl.accent} blur-2xl opacity-60 transition-opacity group-hover:opacity-100`} />
                  <div className="relative">
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950/60 ring-1 ring-slate-700/50">
                      <Icon className="h-5 w-5 text-cyan-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-100">{tpl.name}</p>
                    <p className="mt-0.5 text-[11px] font-medium text-cyan-400/80">{tpl.tagline}</p>
                    <p className="mt-2 line-clamp-2 text-[11px] leading-relaxed text-slate-500">{tpl.description}</p>
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-medium text-slate-600 transition group-hover:text-cyan-300">
                      <span>Forger ce modele</span>
                      <ArrowRight className="h-3 w-3" />
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>
        </motion.div>

        {/* Sample ideas */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40 p-5">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
            Ou decris ta propre idee
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {SAMPLE_IDEAS.map(idea => (
              <button
                key={idea}
                onClick={() => onPickIdea ? onPickIdea(idea) : onNew()}
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
  )
}
