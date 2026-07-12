import { useState, useEffect, useCallback } from 'react'
import { Rocket, Loader2, CheckCircle2, RefreshCw, FileText, Code2, Zap } from 'lucide-react'
import { apiFetch } from '../api'

interface BridgeStatus {
  status: string
  phase: number
  phaseName?: string
  prd?: string
  files?: { path: string; content: string; language: string }[]
  fileCount?: number
  missionId?: string
  name?: string
}

export function KirovPanel() {
  const [projectName, setProjectName] = useState('')
  const [projectPrompt, setProjectPrompt] = useState('')
  const [status, setStatus] = useState<BridgeStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [starting, setStarting] = useState(false)
  const [bridgeOnline, setBridgeOnline] = useState(false)

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/bridge/mission/status'), { signal: AbortSignal.timeout(5000) } as any)
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch { /* offline */ }
  }, [])

  const checkHealth = useCallback(async () => {
    try {
      const data = await apiFetch<{ status: string }>('/api/bridge/health')
      setBridgeOnline(data.status === 'online')
    } catch { setBridgeOnline(false) }
  }, [])

  useEffect(() => {
    refreshStatus()
    checkHealth()
    const interval = setInterval(() => { refreshStatus(); checkHealth() }, 5000)
    return () => clearInterval(interval)
  }, [refreshStatus, checkHealth])

  async function handleStartMission() {
    if (!projectName.trim() || !projectPrompt.trim()) return
    setStarting(true)
    try {
      const data = await apiFetch<{ success: boolean; phase?: number; error?: string }>('/api/bridge/mission/start', {
        method: 'POST',
        body: JSON.stringify({ name: projectName, prompt: projectPrompt, stack: 'react-vite' }),
      })
      if (data.success) refreshStatus()
    } catch { /* ignore */ } finally { setStarting(false) }
  }

  async function handleReset() {
    try { await apiFetch('/api/bridge/mission/reset', { method: 'POST' }); refreshStatus() } catch { /* ignore */ }
  }

  const phase = status?.phase ?? 0
  const phaseName = status?.phaseName ?? 'Idle'
  const phaseStatus = status?.status ?? 'idle'

  return (
    <div className="custom-scroll h-full overflow-y-auto p-4">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30"><Rocket className="h-5 w-5 text-cyan-300" /></div>
          <div><h2 className="text-base font-bold text-slate-100">KIROV Bridge — DeepSeek</h2><p className="text-xs text-slate-500">Bridge integre Next.js</p></div>
          <div className="ml-auto flex items-center gap-2">
            <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium ${bridgeOnline ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}`}>
              <div className={`h-1.5 w-1.5 rounded-full ${bridgeOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              {bridgeOnline ? 'Online' : 'Offline'}
            </div>
            <button onClick={() => { setLoading(true); refreshStatus().finally(() => setLoading(false)) }} className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /></button>
          </div>
        </div>

        {(phase === 0 || phase === 5) && (
          <div className="mb-6 space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div><label className="mb-1 block text-xs font-medium text-slate-300">Nom du projet</label><input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="ex: TaskFlow..." className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none" /></div>
            <div><label className="mb-1 block text-xs font-medium text-slate-300">Description</label><textarea value={projectPrompt} onChange={e => setProjectPrompt(e.target.value)} placeholder="Decris ton app..." rows={3} className="w-full resize-none rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none" /></div>
            <button onClick={handleStartMission} disabled={starting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50">{starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />} Lancer la mission</button>
            {phase === 5 && <button onClick={handleReset} className="w-full rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-400">Reinitialiser</button>}
          </div>
        )}

        {phase > 0 && phase < 5 && (
          <div className="mb-6 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
            <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-cyan-300">Phase {phase} : {phaseName}</p><span className="flex items-center gap-1.5 text-xs text-cyan-300"><Loader2 className="h-3 w-3 animate-spin" />{phaseStatus}</span></div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-500" style={{ width: `${(phase / 4) * 100}%` }} /></div>
            <p className="mt-2 text-[11px] text-slate-500">L extension KIROV3 injecte le prompt dans DeepSeek. Ouvre chat.deepseek.com dans Chrome.</p>
          </div>
        )}

        {status?.prd && (
          <div className="mb-6"><div className="mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-cyan-300" /><h3 className="text-sm font-semibold text-slate-200">PRD genere</h3><span className="text-[10px] text-slate-500">{status.prd.length} chars</span></div><div className="custom-scroll max-h-64 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3"><pre className="whitespace-pre-wrap text-xs text-slate-300">{status.prd}</pre></div></div>
        )}

        {status?.files && status.files.length > 0 && (
          <div className="mb-6"><div className="mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /><h3 className="text-sm font-semibold text-slate-200">Fichiers ({status.files.length})</h3></div><div className="space-y-1.5">{status.files.map((f, i) => <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2"><Code2 className="h-3.5 w-3.5 text-cyan-400" /><span className="flex-1 truncate font-mono text-xs text-slate-200">{f.path}</span><span className="text-[10px] text-slate-500">{f.content.length}</span></div>)}</div></div>
        )}

        {phase === 5 && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center"><CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" /><p className="text-sm font-semibold text-emerald-300">Mission terminee !</p><p className="mt-1 text-xs text-slate-400">{status?.files?.length ?? 0} fichiers generes via DeepSeek</p></div>
        )}

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300"><Zap className="h-3.5 w-3.5" /> Comment ca marche</p>
          <ol className="space-y-1.5 text-xs text-slate-400">
            <li>1. Le bridge est integre dans Next.js</li>
            <li>2. Lance une mission — le prompt est pret</li>
            <li>3. L extension KIROV3 (Chrome) poll /api/bridge/prompt</li>
            <li>4. L extension injecte le prompt dans DeepSeek Chat</li>
            <li>5. L extension capture la reponse puis POST /api/bridge/code</li>
            <li>6. Transition automatique Phase 1 puis Phase 2 puis Done</li>
          </ol>
        </div>
      </div>
    </div>
  )
}

// local import to avoid circular dep with api.ts
import { apiUrl } from '../api'
