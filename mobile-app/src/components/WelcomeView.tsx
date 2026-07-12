import { motion } from 'framer-motion'
import { Hammer, Sparkles, Wand2, FolderTree, Download, Cpu, ArrowRight, FolderGit2, CheckCircle2, Zap, Smartphone } from 'lucide-react'
const FEATURES = [
  { icon: Wand2, title: 'Generation IA', desc: 'GLM-4.6 genere un projet React complet.' },
  { icon: FolderTree, title: 'Explorable', desc: 'Arborescence navigable + coloration.' },
  { icon: Download, title: 'Telechargeable', desc: 'Exporte ton projet en ZIP.' },
  { icon: Cpu, title: 'Stack configurable', desc: 'Vite/Next, TS, Tailwind, shadcn/ui.' },
]
export function WelcomeView({ onNew, projectCount }: { onNew: () => void; projectCount: number }) {
  return (
    <div className="custom-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center">
          <div className="pointer-events-none mx-auto mb-6 h-32 w-64 rounded-full bg-cyan-500/20 blur-[80px]" />
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-medium text-cyan-300"><Sparkles className="h-3.5 w-3.5" /><span className="font-mono uppercase tracking-widest">Generateur de projets React</span></div>
          <h1 className="mx-auto max-w-2xl text-3xl font-extrabold leading-tight tracking-tight text-slate-50 sm:text-4xl">Forge des applications <span className="bg-gradient-to-r from-cyan-300 via-cyan-400 to-teal-300 bg-clip-text text-transparent">React</span> avec l IA</h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-slate-400">Decris ton application, configure ta stack, et genere un projet React complet - code source, configuration et composants inclus.</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button onClick={onNew} className="inline-flex h-11 items-center gap-2 rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 px-6 text-sm font-semibold text-slate-950 shadow-lg shadow-cyan-500/20"><Hammer className="h-4 w-4" /> Creer un projet</button>
            <a href="/react-forge-mobile.apk" download className="inline-flex h-11 items-center gap-2 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-6 text-sm font-semibold text-emerald-300"><Smartphone className="h-4 w-4" /> APK Mobile</a>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20"><FolderGit2 className="h-4 w-4 text-cyan-300" /></div><div><p className="text-[10px] uppercase tracking-wider text-slate-500">Projets</p><p className="text-sm font-bold">{projectCount}</p></div></div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 ring-1 ring-emerald-500/20"><CheckCircle2 className="h-4 w-4 text-emerald-300" /></div><div><p className="text-[10px] uppercase tracking-wider text-slate-500">Prets</p><p className="text-sm font-bold">{projectCount}</p></div></div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 ring-1 ring-violet-500/20"><Zap className="h-4 w-4 text-violet-300" /></div><div><p className="text-[10px] uppercase tracking-wider text-slate-500">IA</p><p className="text-sm font-bold">GLM-4.6</p></div></div>
        </motion.div>
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">{FEATURES.map((f, i) => { const Icon = f.icon; return <motion.div key={f.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }} className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"><div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-cyan-500/10 ring-1 ring-cyan-500/20"><Icon className="h-4 w-4 text-cyan-300" /></div><p className="text-sm font-semibold">{f.title}</p><p className="mt-1 text-xs text-slate-400">{f.desc}</p></motion.div> })}</div>
      </div>
    </div>
  )
}
