import { useState } from 'react'
import { Rocket, Loader2, CheckCircle2, AlertCircle, RefreshCw, FileText, Code2, Zap, Cpu } from 'lucide-react'
import { apiFetch } from '../api'
import { hasNativeHttp } from '../glm-native'
import { generateProjectOnDevice } from '../sovereign-generator'
import type { Project } from '../useProjects'

type Phase = 'idle' | 'generating' | 'done' | 'error'

export function DeepseekWebview({ project, onFilesGenerated }: { project: Project; onFilesGenerated?: (files: { path: string; content: string; language: string }[], prd: string) => void }) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [prd, setPrd] = useState(project.prd || '')
  const [files, setFiles] = useState<{ path: string; content: string; language: string }[]>(project.files || [])
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState('')

  const addLog = (msg: string) => { const t = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); setLogs(p => [...p, `[${t}] ${msg}`].slice(-20)) }

  async function handleGenerate() {
    setPhase('generating'); setError(''); setPrd(''); setFiles([])
    const native = hasNativeHttp()
    addLog(`Regeneration du projet "${project.name}" via GLM-4.6...`)
    if (native) addLog('Mode souverain : generation on-device (NativeHttp bridge)')
    else addLog('Mode serveur : appel /api/projects/[id]/generate')
    try {
      let newPrd = ''
      let newFiles: { path: string; content: string; language: string }[] = []

      if (native) {
        // Sovereign mode: generate on-device
        const result = await generateProjectOnDevice(project.name, project.description, project.features || [], (ph, msg) => addLog(msg))
        if (!result.success || result.files.length === 0) throw new Error(result.error || 'Echec generation on-device')
        newPrd = result.prd
        newFiles = result.files
      } else {
        // Server mode
        const data = await apiFetch<{ success: boolean; project: any; error?: string }>(`/api/projects/${project.id}/generate`, {
          method: 'POST',
        })
        if (!data.success || !data.project) throw new Error(data.error || 'Echec de la generation')
        newPrd = data.project.prd || ''
        newFiles = data.project.files || []
      }
      setPrd(newPrd); setFiles(newFiles)
      addLog(`PRD genere (${newPrd.length} chars)`)
      addLog(`${newFiles.length} fichiers generes via GLM-4.6`)
      setPhase('done')
      onFilesGenerated?.(newFiles, newPrd)
      addLog('Projet regenere avec succes !')
    } catch (e) { const m = e instanceof Error ? e.message : 'Erreur'; addLog(`Erreur: ${m}`); setError(m); setPhase('error') }
  }

  function reset() { setPhase('idle'); setPrd(project.prd || ''); setFiles(project.files || []); setLogs([]); setError('') }

  const labels: Record<Phase, string> = { idle: 'Pret', generating: 'Generation GLM-4.6', done: 'Termine', error: 'Erreur' }
  const colors: Record<Phase, string> = { idle: 'border-slate-700 bg-slate-900/60 text-slate-400', generating: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300', done: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', error: 'border-rose-500/30 bg-rose-500/10 text-rose-300' }
  const loading = phase === 'generating'

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-3">
        <div className="flex items-center gap-2"><Cpu className="h-5 w-5 text-cyan-300" /><h2 className="text-base font-bold text-slate-100">DeepSeek Auto - GLM-4.6</h2><span className={`ml-auto flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${colors[phase]}`}>{loading && <Loader2 className="h-2.5 w-2.5 animate-spin" />}{labels[phase]}</span></div>
        <p className="mt-1 text-xs text-slate-400">{hasNativeHttp() ? '100% autonome - GLM-4.6 natif on-device, sans serveur PC.' : '100% gratuit - GLM-4.6 via serveur, sans cle API.'}</p>
      </div>
      <div className="custom-scroll flex-1 overflow-y-auto p-4"><div className="mx-auto max-w-3xl">
        {(phase === 'idle' || phase === 'error') && (<>
          <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4"><p className="text-xs font-semibold text-slate-200">{project.name}</p><p className="mt-0.5 text-[11px] text-slate-500">{project.description}</p>
            <button onClick={handleGenerate} disabled={loading} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-2.5 text-xs font-semibold text-slate-950 disabled:opacity-50">{loading ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Generation...</> : <><Rocket className="h-3.5 w-3.5" /> Regenerer le projet</>}</button>
          </div>
          {error && <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3"><div className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" /><div><p className="text-xs font-semibold text-rose-300">Erreur</p><p className="mt-1 text-[11px] text-slate-400">{error}</p></div></div></div>}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4"><p className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-300"><Zap className="h-3.5 w-3.5" /> 100% Gratuit - Sans cle API</p><ol className="space-y-1 text-xs text-slate-400"><li>1. Clique "Regenerer le projet"</li><li>2. GLM-4.6 genere PRD + Arsenal + code (30-120s)</li><li>3. Les fichiers sont sauvegardes dans le projet</li></ol><p className="mt-3 rounded-lg bg-cyan-500/10 p-2 text-[11px] text-cyan-300">Aucune cle API. GLM-4.6 est integre dans le serveur React Forge. La generation est identique au PC.</p></div>
        </>)}
        {loading && <div className="flex flex-col items-center justify-center py-12"><Loader2 className="mb-4 h-12 w-12 animate-spin text-cyan-400" /><p className="text-sm font-medium text-slate-300">Generation GLM-4.6 en cours</p><p className="mt-1 text-xs text-slate-500">Le serveur genere PRD + Arsenal + code (30-120s)...</p></div>}
        {phase === 'done' && (<>
          <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center"><CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" /><p className="text-sm font-semibold text-emerald-300">Projet regenere !</p><p className="mt-1 text-xs text-slate-400">{files.length} fichiers generes via GLM-4.6</p></div>
          {prd && <div className="mb-4"><div className="mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-cyan-300" /><h3 className="text-sm font-semibold text-slate-200">PRD</h3></div><div className="max-h-32 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-2"><pre className="whitespace-pre-wrap text-[11px] text-slate-300">{prd}</pre></div></div>}
          <div className="mb-4"><div className="mb-2 flex items-center gap-2"><Code2 className="h-4 w-4 text-emerald-300" /><h3 className="text-sm font-semibold text-slate-200">Fichiers ({files.length})</h3></div><div className="space-y-1">{files.map((f, i) => <div key={i} className="flex items-center gap-2 rounded border border-slate-800 bg-slate-900/40 p-1.5"><Code2 className="h-3 w-3 text-cyan-400" /><span className="flex-1 truncate font-mono text-[11px] text-slate-200">{f.path}</span><span className="text-[9px] text-slate-500">{f.content.length}</span></div>)}</div></div>
          <button onClick={reset} className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400"><RefreshCw className="h-3.5 w-3.5" /> Retour</button>
        </>)}
        {logs.length > 0 && <div className="mt-4"><div className="mb-1.5 flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-cyan-300" /><h3 className="text-xs font-semibold text-slate-200">Logs</h3></div><div className="max-h-32 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-2">{logs.map((l, i) => <p key={i} className="font-mono text-[10px] leading-relaxed text-slate-400">{l}</p>)}</div></div>}
      </div></div>
    </div>
  )
}
