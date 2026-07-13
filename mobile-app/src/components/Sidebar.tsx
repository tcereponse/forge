import { Hammer, Plus, Trash2, FolderGit2, CheckCircle2, Cloud } from 'lucide-react'
import type { Project } from '../useProjects'
function timeAgo(ts: number | string) { const t = typeof ts === 'string' ? new Date(ts).getTime() : ts; const d = Date.now() - t; if (isNaN(d)) return ''; const m = Math.floor(d/60000); if (m<1) return "a l'instant"; if (m<60) return `il y a ${m} min`; const h = Math.floor(m/60); if (h<24) return `il y a ${h} h`; return `il y a ${Math.floor(h/24)} j` }
export function Sidebar({ projects, onNew, onSelect, onHome, onDelete, currentId }: { projects: Project[]; onNew: () => void; onSelect: (p: Project) => void; onHome: () => void; onDelete: (id: string) => void; currentId?: string }) {
  return (
    <div className="flex h-full w-full flex-col border-r border-slate-800 bg-slate-950">
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30"><Hammer className="h-4 w-4 text-cyan-300" /></div>
        <div><p className="font-mono text-sm font-bold">React Forge</p><p className="text-[9px] uppercase tracking-wider text-slate-500">Mobile</p></div>
      </div>
      <div className="p-3"><button onClick={onNew} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950"><Plus className="h-4 w-4" /> Nouveau projet</button></div>
      <div className="px-3 pb-2"><button onClick={onHome} className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-400 hover:bg-slate-900"><FolderGit2 className="h-3.5 w-3.5" /> Accueil</button></div>
      <div className="custom-scroll flex-1 overflow-y-auto px-2 pb-2">
        <p className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-600">Projets ({projects.length})</p>
        {projects.length === 0 ? <div className="px-3 py-8 text-center"><FolderGit2 className="mx-auto mb-2 h-8 w-8 text-slate-700" /><p className="text-[11px] text-slate-600">Aucun projet</p></div> : projects.map(p => (
          <div key={p.id} onClick={() => onSelect(p)} className={`group mb-1 cursor-pointer rounded-lg p-2.5 transition ${currentId === p.id ? 'bg-cyan-500/10 ring-1 ring-cyan-500/30' : 'hover:bg-slate-900'}`}>
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1"><div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" /><p className="truncate text-xs font-medium text-slate-200">{p.name}</p></div><p className="mt-0.5 text-[10px] text-slate-500">{p.stack} - {p.files.length} fichiers - {timeAgo(p.createdAt)}</p></div>
              <button onClick={(e) => { e.stopPropagation(); onDelete(p.id) }} className="shrink-0 rounded p-1 text-slate-600 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-400 group-hover:opacity-100"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-slate-800 p-3"><div className="flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[10px] font-medium text-cyan-300"><Cloud className="h-3 w-3" /><span>GLM-4.6 integre</span></div></div>
    </div>
  )
}
