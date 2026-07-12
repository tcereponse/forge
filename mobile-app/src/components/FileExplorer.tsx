import { useState, useMemo } from 'react'
import { FileCode2, FileText, Folder, FolderOpen, ChevronRight, Copy, Check } from 'lucide-react'
import type { Project, ProjectFile } from '../useProjects'
function FileIcon({ name }: { name: string }) { const e = name.split('.').pop(); if (e === 'tsx' || e === 'jsx') return <FileCode2 className="h-4 w-4 text-cyan-400" />; if (e === 'json') return <FileCode2 className="h-4 w-4 text-amber-400" />; return <FileText className="h-4 w-4 text-slate-400" /> }
export function FileExplorer({ project }: { project: Project }) {
  const [active, setActive] = useState('')
  const [copied, setCopied] = useState(false)
  const file = useMemo(() => active ? project.files.find(f => f.path === active) : project.files.find(f => /App\.(tsx|jsx)$/.test(f.path)) || project.files[0], [project.files, active])
  async function copy() { if (!file) return; try { await navigator.clipboard.writeText(file.content); setCopied(true); setTimeout(() => setCopied(false), 2000) } catch {} }
  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="border-b border-slate-800 lg:border-b-0 lg:border-r lg:w-56 lg:shrink-0">
        <div className="border-b border-slate-800 px-3 py-2.5"><p className="font-mono text-xs font-semibold text-slate-300">{project.name.toLowerCase()}/</p></div>
        <div className="max-h-48 overflow-y-auto p-2 lg:max-h-none lg:h-[calc(100%-2.5rem)]">
          {project.files.map(f => <button key={f.path} onClick={() => setActive(f.path)} className={`flex w-full items-center gap-1.5 rounded-md py-1.5 px-2 text-left text-xs transition ${file?.path === f.path ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-400 hover:bg-slate-800/50'}`}><FileIcon name={f.path} /><span className="truncate font-mono">{f.path.split('/').pop()}</span></button>)}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2"><div className="flex items-center gap-2">{file && <FileIcon name={file.path} />}<span className="font-mono text-xs text-slate-200">{file?.path || '-'}</span></div><button onClick={copy} className="rounded-md px-2 py-1 text-xs text-slate-400 hover:text-slate-200">{copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}</button></div>
        <div className="min-h-0 flex-1 overflow-auto bg-slate-950/60">{file ? <pre className="p-4 font-mono text-[12px] leading-relaxed text-slate-300"><code>{file.content}</code></pre> : <div className="flex h-full items-center justify-center text-sm text-slate-600">Selectionne un fichier</div>}</div>
      </div>
    </div>
  )
}
