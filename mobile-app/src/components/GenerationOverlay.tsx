import { Loader2, CheckCircle2, FileText, Code2, Layers, Save, Sparkles } from 'lucide-react'
const PHASES = [
  { key: 'prd', label: 'Generation du PRD', icon: FileText },
  { key: 'arsenal', label: 'Arsenal PRD (10 docs)', icon: Layers },
  { key: 'code', label: 'Generation du code', icon: Code2 },
  { key: 'saving', label: 'Sauvegarde', icon: Save },
]
export function GenerationOverlay({ phase, projectName, message }: { phase: string; projectName: string; message?: string }) {
  const idx = PHASES.findIndex(p => p.key === phase)
  const done = phase === 'done'
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/30">
            {done ? <CheckCircle2 className="h-7 w-7 text-emerald-400" /> : <Sparkles className="h-7 w-7 text-cyan-300 animate-pulse" />}
          </div>
          <h2 className="text-lg font-bold">{done ? 'Projet genere !' : 'Generation en cours'}</h2>
          <p className="mt-1 text-xs text-slate-400">{projectName}</p>
        </div>
        <div className="space-y-3">
          {PHASES.map((p, i) => {
            const Icon = p.icon; const active = phase === p.key; const completed = idx > i || done
            return (
              <div key={p.key} className={`flex items-start gap-3 rounded-lg p-2.5 transition ${active ? 'bg-cyan-500/10 ring-1 ring-cyan-500/30' : ''}`}>
                <div className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${completed ? 'bg-emerald-500/20 text-emerald-400' : active ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-600'}`}>
                  {completed ? <CheckCircle2 className="h-4 w-4" /> : active ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${completed ? 'text-slate-400' : active ? 'text-cyan-200' : 'text-slate-500'}`}>{p.label}</p>
                  {active && message && <p className="mt-0.5 truncate text-[10px] text-slate-500">{message}</p>}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-5 h-1 overflow-hidden rounded-full bg-slate-800">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-500" style={{ width: `${done ? 100 : (idx + 1) * 25}%` }} />
        </div>
      </div>
    </div>
  )
}
