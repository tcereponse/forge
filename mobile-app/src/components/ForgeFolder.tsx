import { useState, useEffect } from 'react'
import { Folder, FolderOpen, FileCode2, Smartphone, Download, ChevronRight, ArrowLeft, RefreshCw, Loader2, CheckCircle2, HardDrive, FileArchive, Code2 } from 'lucide-react'
import JSZip from 'jszip'
import { saveFile, getForgePath, listForgeFiles } from '../fileSaver'
import { apiUrl, getApiBase } from '../api'
import type { Project, ProjectFile } from '../useProjects'

interface TreeNode { name: string; path: string; isFile: boolean; file?: ProjectFile; children: TreeNode[] }
interface SavedFile { name: string; size: number }

function buildTree(projects: Project[]): TreeNode {
  const root: TreeNode = { name: 'forge', path: 'forge', isFile: false, children: [] }
  for (const p of projects) {
    const dir: TreeNode = { name: p.name.toLowerCase().replace(/\s+/g, '-'), path: `forge/${p.name}`, isFile: false, children: [] }
    for (const f of p.files) {
      const parts = f.path.split('/'); let cur = dir; let cp = dir.path
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i]; cp = `${cp}/${part}`; const last = i === parts.length - 1
        let child = cur.children.find(c => c.name === part)
        if (!child) { child = { name: part, path: cp, isFile: last, file: last ? f : undefined, children: [] }; cur.children.push(child) }
        cur = child
      }
    }
    dir.children.sort((a, b) => (a.isFile === b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1))
    root.children.push(dir)
  }
  return root
}

function formatSize(b: number) { return b < 1024 ? `${b} B` : b < 1048576 ? `${(b/1024).toFixed(1)} KB` : `${(b/1048576).toFixed(1)} MB` }

export function ForgeFolder({ projects, onBack }: { projects: Project[]; onBack: () => void }) {
  const [tree] = useState(() => buildTree(projects))
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['forge']))
  const [selected, setSelected] = useState<ProjectFile | null>(null)
  const [building, setBuilding] = useState<string | null>(null)
  const [status, setStatus] = useState('')
  const [saved, setSaved] = useState<SavedFile[]>([])
  const [path] = useState(getForgePath())

  useEffect(() => { setSaved(listForgeFiles()) }, [])

  function toggle(p: string) { setExpanded(prev => { const n = new Set(prev); if (n.has(p)) n.delete(p); else n.add(p); return n }) }

  function renderNode(node: TreeNode, depth: number): React.ReactNode {
    if (node.isFile) return <button key={node.path} onClick={() => setSelected(node.file || null)} style={{ paddingLeft: `${depth*12+12}px` }} className={`flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-xs ${selected?.path === node.file?.path ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-400 hover:bg-slate-800/50'}`}><FileCode2 className="h-4 w-4 text-cyan-400" /><span className="truncate font-mono">{node.name}</span></button>
    const children = [...node.children].sort((a, b) => (a.isFile === b.isFile ? a.name.localeCompare(b.name) : a.isFile ? 1 : -1))
    return <div key={node.path}><button onClick={() => toggle(node.path)} style={{ paddingLeft: `${depth*12+8}px` }} className="flex w-full items-center gap-1.5 rounded-md py-1.5 pr-2 text-left text-xs text-slate-300 hover:bg-slate-800/50"><ChevronRight className={`h-3 w-3 text-slate-500 transition-transform ${expanded.has(node.path) ? 'rotate-90' : ''}`} />{expanded.has(node.path) ? <FolderOpen className="h-4 w-4 text-cyan-400/70" /> : <Folder className="h-4 w-4 text-cyan-400/70" />}<span className="truncate font-mono font-medium">{node.name}</span></button>{expanded.has(node.path) && children.map(c => renderNode(c, depth + 1))}</div>
  }

  async function handleZip(p: Project) {
    setBuilding(p.id); setStatus(`Creation ZIP...`)
    try { const z = new JSZip(); const r = p.name.toLowerCase().replace(/\s+/g, '-'); for (const f of p.files) z.file(`${r}/${f.path}`, f.content); const b = await z.generateAsync({ type: 'blob' }); const res = await saveFile(`${r}.zip`, b); if (res.success) { setStatus(`ZIP sauvegarde: ${res.path}`); setSaved(listForgeFiles()) } else setStatus(`Erreur: ${res.error}`) } catch (e) { setStatus(`Erreur: ${e}`) } finally { setBuilding(null); setTimeout(() => setStatus(''), 5000) }
  }

  async function handleApk(p: Project) {
    setBuilding(p.id); setStatus(`Compilation APK reelle pour "${p.name}"...`)
    try {
      // Real APK compilation on the server — POST /api/build-apk returns a binary .apk file.
      const res = await fetch(apiUrl('/api/build-apk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: p.id, backendUrl: getApiBase() }),
      })
      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`
        try { const ej = await res.json(); errMsg = ej.error || errMsg } catch {}
        throw new Error(errMsg)
      }
      const apkBlob = await res.blob()
      if (apkBlob.size < 1000) throw new Error('APK trop petit (compilation echouee)')
      const apkName = `${p.name.toLowerCase().replace(/\s+/g, '-')}.apk`
      const saveRes = await saveFile(apkName, apkBlob)
      if (saveRes.success) {
        setStatus(`APK compile et sauvegarde: ${saveRes.path} (${(apkBlob.size / 1024).toFixed(0)} Ko)`)
        setSaved(listForgeFiles())
      } else {
        setStatus(`Erreur sauvegarde: ${saveRes.error}`)
      }
    } catch (e) { setStatus(`Erreur APK: ${e instanceof Error ? e.message : e}`) } finally { setBuilding(null); setTimeout(() => setStatus(''), 8000) }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-3">
        <div className="flex items-center gap-2"><button onClick={onBack} className="rounded-md p-1 text-slate-500 hover:bg-slate-800"><ArrowLeft className="h-4 w-4" /></button><HardDrive className="h-5 w-5 text-cyan-300" /><h2 className="text-base font-bold">Dossier Forge</h2><span className="rounded border border-slate-700 bg-slate-900/60 px-1.5 py-0.5 text-[10px] text-slate-400">{projects.length} projets</span></div>
        <p className="mt-1 text-xs text-slate-400">Stockage: <span className="font-mono text-cyan-300">{path}</span></p>
      </div>
      {status && <div className="border-b border-cyan-500/20 bg-cyan-500/5 px-4 py-2"><p className="text-xs text-cyan-300">{status}</p></div>}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="border-b border-slate-800 lg:border-b-0 lg:border-r lg:w-80 lg:shrink-0">
          <div className="border-b border-slate-800 px-3 py-2"><p className="font-mono text-xs font-semibold text-cyan-300">forge/</p></div>
          <div className="max-h-64 overflow-y-auto p-2 lg:max-h-none lg:h-[calc(100%-2.5rem)]">{projects.length === 0 ? <div className="px-3 py-8 text-center"><Folder className="mx-auto mb-2 h-10 w-10 text-slate-700" /><p className="text-xs text-slate-600">Dossier vide</p></div> : renderNode(tree, 0)}</div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">
          {selected ? <><div className="border-b border-slate-800 px-4 py-2"><span className="font-mono text-xs text-slate-200">{selected.path}</span></div><div className="min-h-0 flex-1 overflow-auto bg-slate-950/60"><pre className="p-4 font-mono text-[12px] text-slate-300"><code>{selected.content}</code></pre></div></> : (
            <div className="flex flex-1 flex-col">
              <div className="mb-6">
                <div className="mb-3 flex items-center gap-2"><FileArchive className="h-4 w-4 text-emerald-300" /><h3 className="text-sm font-semibold text-slate-200">Fichiers sauvegardes</h3></div>
                {saved.length === 0 ? <div className="rounded-lg border border-dashed border-slate-800 p-4 text-center"><p className="text-xs text-slate-500">Aucun fichier</p></div> : <div className="space-y-1.5">{saved.map(f => <div key={f.name} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2.5"><FileArchive className="h-4 w-4 text-emerald-400" /><span className="flex-1 truncate text-xs font-mono text-slate-200">{f.name}</span><span className="text-[10px] text-slate-500">{formatSize(f.size)}</span></div>)}</div>}
              </div>
              <div>
                <div className="mb-3 flex items-center gap-2"><Smartphone className="h-4 w-4 text-cyan-300" /><h3 className="text-sm font-semibold text-slate-200">Compiler un APK</h3></div>
                {projects.length === 0 ? <p className="text-xs text-slate-500">Cree un projet d abord</p> : <div className="space-y-2">{projects.map(p => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 p-2.5">
                    <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-200">{p.name}</p><p className="text-[10px] text-slate-500">{p.files.length} fichiers</p></div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <button onClick={() => handleZip(p)} disabled={building === p.id} className="flex items-center gap-1 rounded-md border border-slate-700 px-2 py-1.5 text-[11px] text-slate-300 hover:text-cyan-300 disabled:opacity-50">{building === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Download className="h-3 w-3" />} ZIP</button>
                      <button onClick={() => handleApk(p)} disabled={building === p.id} className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50">{building === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Smartphone className="h-3 w-3" />} APK</button>
                    </div>
                  </div>
                ))}</div>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
