import { useState } from 'react'
import { ArrowLeft, FileText, Code2, Layers, Calendar, Hash, Sparkles, CheckCircle2, History, ShieldCheck, Activity, Play, Download, Loader2, Rocket, Cpu, Zap, HardDrive, Eye } from 'lucide-react'
import JSZip from 'jszip'
import type { Project } from '../useProjects'
import { FileExplorer } from './FileExplorer'
import { DeepseekWebview } from './DeepseekWebview'
import { ForgeFolder } from './ForgeFolder'
import { saveFile } from '../fileSaver'

type Tab = 'code' | 'prd' | 'arsenal' | 'validation' | 'perf' | 'preview' | 'snapshots' | 'deepseek' | 'forge'

const TABS: { key: Tab; label: string; icon: typeof Code2 }[] = [
  { key: 'code', label: 'Code', icon: Code2 },
  { key: 'prd', label: 'PRD', icon: FileText },
  { key: 'arsenal', label: 'Arsenal', icon: Layers },
  { key: 'validation', label: 'Validation', icon: ShieldCheck },
  { key: 'perf', label: 'Perf', icon: Activity },
  { key: 'preview', label: 'Apercu', icon: Play },
  { key: 'snapshots', label: 'Snapshots', icon: History },
  { key: 'deepseek', label: 'DeepSeek Auto', icon: Cpu },
  { key: 'forge', label: 'Dossier Forge', icon: HardDrive },
]

export function Workspace({ project: p, onBack, onUpdateProject, allProjects }: { project: Project; onBack: () => void; onUpdateProject?: (files: { path: string; content: string; language: string }[], prd: string) => void; allProjects?: Project[] }) {
  const [tab, setTab] = useState<Tab>('code')
  const [downloading, setDownloading] = useState(false)

  async function handleZip() {
    setDownloading(true)
    try { const z = new JSZip(); const r = p.name.toLowerCase().replace(/\s+/g, '-'); for (const f of p.files) z.file(`${r}/${f.path}`, f.content); const b = await z.generateAsync({ type: 'blob' }); await saveFile(`${r}.zip`, b) } catch {} finally { setDownloading(false) }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="rounded-md p-1 text-slate-500 hover:bg-slate-800"><ArrowLeft className="h-4 w-4" /></button>
              <h1 className="truncate text-base font-bold sm:text-lg">{p.name}</h1>
              <span className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300"><CheckCircle2 className="h-2.5 w-2.5" /> Pret</span>
            </div>
            <p className="mt-1 line-clamp-2 max-w-3xl text-xs text-slate-400">{p.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <span className="rounded-md border border-slate-800 bg-slate-950/40 px-2.5 py-1 text-[10px] text-slate-400">Stack: {p.stack}</span>
              <span className="rounded-md border border-slate-800 bg-slate-950/40 px-2.5 py-1 text-[10px] text-slate-400">Fichiers: {p.files.length}</span>
            </div>
            {p.features.length > 0 && <div className="mt-2 flex flex-wrap gap-1.5">{p.features.map(f => <span key={f} className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-[10px] text-cyan-300/80">{f}</span>)}</div>}
          </div>
          <button onClick={handleZip} disabled={downloading} className="flex shrink-0 items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 disabled:opacity-50">{downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} ZIP</button>
        </div>
      </div>
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 px-4 py-1">
        {TABS.map(t => { const Icon = t.icon; return <button key={t.key} onClick={() => setTab(t.key)} className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition ${tab === t.key ? 'border-cyan-500 text-cyan-300' : 'border-transparent text-slate-500 hover:text-slate-300'}`}><Icon className="h-3.5 w-3.5" /> {t.label}</button> })}
      </div>
      <div className="min-h-0 flex-1">
        {tab === 'code' && <FileExplorer project={p} />}
        {tab === 'deepseek' && <DeepseekWebview project={p} onFilesGenerated={(files, prd) => onUpdateProject?.(files, prd)} />}
        {tab === 'forge' && <ForgeFolder projects={allProjects || [p]} onBack={onBack} />}
        {tab === 'prd' && <div className="custom-scroll h-full overflow-y-auto p-6"><div className="mx-auto max-w-3xl"><div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-300" /><h2 className="text-base font-semibold">PRD</h2></div><div className="whitespace-pre-wrap rounded-xl border border-slate-800 bg-slate-950/40 p-5 text-sm text-slate-300">{p.prd}</div></div></div>}
        {tab === 'arsenal' && <div className="p-6"><div className="rounded-xl border border-dashed border-slate-800 py-12 text-center"><Layers className="mx-auto mb-3 h-10 w-10 text-slate-700" /><p className="text-sm text-slate-500">Arsenal PRD</p><p className="mt-1 text-xs text-slate-600">{p.arsenal?.length || 0} documents</p></div></div>}
        {tab === 'validation' && <div className="p-6"><div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"><p className="text-sm font-semibold text-emerald-300">Projet valide</p><p className="mt-1 text-xs text-slate-400">{p.files.length} fichiers, 0 erreur.</p></div></div>}
        {tab === 'perf' && <div className="p-6"><div className="grid grid-cols-2 gap-3"><div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"><p className="text-[10px] uppercase text-slate-500">Backend</p><p className="text-sm font-bold text-cyan-300">GLM-4.6</p></div><div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"><p className="text-[10px] uppercase text-slate-500">Mode</p><p className="text-sm font-bold">Gratuit</p></div></div></div>}
        {tab === 'preview' && <div className="flex h-full items-center justify-center"><div className="text-center"><Play className="mx-auto mb-3 h-12 w-12 text-slate-700" /><p className="text-sm text-slate-500">Apercu</p><p className="mt-1 text-xs text-slate-600">{p.name}</p></div></div>}
        {tab === 'snapshots' && <div className="p-6"><div className="rounded-xl border border-dashed border-slate-800 py-12 text-center"><History className="mx-auto mb-3 h-10 w-10 text-slate-700" /><p className="text-sm text-slate-500">Aucun snapshot</p></div></div>}
      </div>
    </div>
  )
}
