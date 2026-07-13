import { useState, useEffect, useCallback } from 'react'
import { Rocket, Loader2, CheckCircle2, RefreshCw, FileText, Code2, Zap, ExternalLink, Play } from 'lucide-react'
import { apiFetch, apiUrl } from '../api'

type Phase = 'idle' | 'p0' | 'p1' | 'p2' | 'p3' | 'done' | 'error'

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

export function KirovLauncher() {
  const [projectName, setProjectName] = useState('')
  const [projectDesc, setProjectDesc] = useState('')
  const [stack, setStack] = useState('vite')
  const [aiUrl, setAiUrl] = useState('https://chat.deepseek.com/')
  const [phase, setPhase] = useState<Phase>('idle')
  const [status, setStatus] = useState<BridgeStatus | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [bridgeOnline, setBridgeOnline] = useState(false)

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(prev => [...prev, `[${time}] ${msg}`].slice(-30))
  }

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch(apiUrl('/api/bridge/mission/status'), { signal: AbortSignal.timeout(5000) } as any)
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
        if (data.phase === 5 && phase !== 'done') {
          setPhase('done')
          addLog(`Mission terminee ! ${data.fileCount} fichiers generes`)
        }
      }
    } catch { /* ignore */ }
  }, [phase])

  useEffect(() => {
    refreshStatus()
    apiFetch<{ status: string }>('/api/bridge/health').then(d => setBridgeOnline(d.status === 'online')).catch(() => setBridgeOnline(false))
    const interval = setInterval(() => {
      refreshStatus()
      apiFetch<{ status: string }>('/api/bridge/health').then(d => setBridgeOnline(d.status === 'online')).catch(() => setBridgeOnline(false))
    }, 3000)
    return () => clearInterval(interval)
  }, [refreshStatus])

  async function triggerP0() {
    if (!projectName.trim() || !projectDesc.trim()) return
    setPhase('p0'); setLoading(true)
    addLog(`P0 : Initialisation de ${projectName.toUpperCase()}...`)
    try {
      const data = await apiFetch<{ success: boolean }>('/api/bridge/mission/start', {
        method: 'POST',
        body: JSON.stringify({ name: projectName, prompt: projectDesc, stack }),
      })
      if (data.success) {
        addLog(`P0 reussi. Prompt de cadrage pret.`)
        window.open(aiUrl, '_blank')
        addLog(`IA ouverte dans un nouvel onglet`)
      }
    } catch (e) { addLog(`Erreur P0`); setPhase('error') } finally { setLoading(false) }
  }

  async function triggerP1() {
    setPhase('p1'); setLoading(true)
    addLog(`P1 : Generation des PRDs...`)
    try {
      const data = await apiFetch<{ success: boolean }>('/api/bridge/mission/start', {
        method: 'POST',
        body: JSON.stringify({ name: projectName, prompt: projectDesc, stack }),
      })
      if (data.success) {
        addLog(`P1 lance. Le prompt PRD est pret pour l extension KIROV3.`)
        window.open(aiUrl, '_blank')
        addLog(`DeepSeek ouvert — l extension va injecter le prompt`)
      }
    } catch (e) { addLog(`Erreur P1`); setPhase('error') } finally { setLoading(false) }
  }

  async function triggerP2() {
    setPhase('p2'); setLoading(true)
    addLog(`P2 : Generation du code source...`)
    try {
      if (status?.phase === 2) {
        addLog(`PRD capture detecte. Le prompt Code est pret.`)
        window.open(aiUrl, '_blank')
        addLog(`DeepSeek ouvert — l extension va injecter le prompt Code`)
      } else {
        addLog(`Pas de PRD capture. Lance P1 d abord et attends la capture.`)
        setPhase('idle')
      }
    } finally { setLoading(false) }
  }

  function handleReset() {
    apiFetch('/api/bridge/mission/reset', { method: 'POST' }).catch(() => {})
    setPhase('idle'); setLogs([]); setStatus(null)
    addLog('Mission reinitialisee')
  }

  const phaseLabel: Record<Phase, string> = {
    idle: 'Pret', p0: 'P0 — Reveil Cognitif', p1: 'P1 — Generation PRD',
    p2: 'P2 — Generation Code', p3: 'P3 — Validation', done: 'Termine', error: 'Erreur',
  }
  const phaseColor: Record<Phase, string> = {
    idle: 'border-slate-700 bg-slate-900/60 text-slate-400',
    p0: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    p1: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    p2: 'border-teal-500/30 bg-teal-500/10 text-teal-300',
    p3: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    done: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    error: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  }

  const currentPhase = status?.phase ?? 0

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-cyan-300" />
          <h2 className="text-base font-bold text-slate-100">ELITE FORGE — KIROV Launcher</h2>
          <span className={`ml-auto flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${phaseColor[phase]}`}>
            {loading && <Loader2 className="h-2.5 w-2.5 animate-spin" />}{phaseLabel[phase]}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Phases P0-P3 — via DeepSeek Chat (gratuit, sans cle API)</p>
      </div>

      <div className="custom-scroll flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-4xl">
          {/* Project form */}
          <div className="mb-4 space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div><label className="mb-1 block text-xs font-medium text-slate-300">Nom du projet</label><input value={projectName} onChange={e => setProjectName(e.target.value)} placeholder="ex: TaskFlow..." className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none" /></div>
            <div><label className="mb-1 block text-xs font-medium text-slate-300">Stack</label><select value={stack} onChange={e => setStack(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"><option value="vite">Vite + React + TS</option><option value="next">Next.js</option><option value="cra">Create React App</option></select></div>
            <div><label className="mb-1 block text-xs font-medium text-slate-300">Description / Vision</label><textarea value={projectDesc} onChange={e => setProjectDesc(e.target.value)} placeholder="Decris ton application en detail..." rows={3} className="w-full resize-none rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none" /></div>
            <div><label className="mb-1 block text-xs font-medium text-slate-300">IA cible</label><select value={aiUrl} onChange={e => setAiUrl(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100"><option value="https://chat.deepseek.com/">DeepSeek Chat (gratuit)</option><option value="https://chatgpt.com">ChatGPT</option><option value="https://gemini.google.com">Gemini</option></select></div>
          </div>

          {/* Phase buttons */}
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <button onClick={triggerP0} disabled={loading || !projectName.trim() || !projectDesc.trim()} className="flex flex-col items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-center transition hover:bg-cyan-500/20 disabled:opacity-50"><Zap className="h-5 w-5 text-cyan-300" /><span className="text-xs font-bold text-cyan-300">P0</span><span className="text-[10px] text-slate-400">Reveil Cognitif</span></button>
            <button onClick={triggerP1} disabled={loading || !projectName.trim()} className="flex flex-col items-center gap-1.5 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-3 text-center transition hover:bg-cyan-500/20 disabled:opacity-50"><FileText className="h-5 w-5 text-cyan-300" /><span className="text-xs font-bold text-cyan-300">P1</span><span className="text-[10px] text-slate-400">Generation PRD</span></button>
            <button onClick={triggerP2} disabled={loading} className="flex flex-col items-center gap-1.5 rounded-xl border border-teal-500/30 bg-teal-500/10 p-3 text-center transition hover:bg-teal-500/20 disabled:opacity-50"><Code2 className="h-5 w-5 text-teal-300" /><span className="text-xs font-bold text-teal-300">P2</span><span className="text-[10px] text-slate-400">Generation Code</span></button>
            <button onClick={() => { setPhase('p3'); addLog('P3: Validation (a venir)') }} className="flex flex-col items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-center transition hover:bg-amber-500/20"><CheckCircle2 className="h-5 w-5 text-amber-300" /><span className="text-xs font-bold text-amber-300">P3</span><span className="text-[10px] text-slate-400">Validation</span></button>
          </div>

          {/* Bridge status */}
          <div className={`mb-4 flex items-center justify-between rounded-xl border p-3 ${bridgeOnline ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${bridgeOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className={`text-xs font-semibold ${bridgeOnline ? 'text-emerald-300' : 'text-rose-300'}`}>Bridge {bridgeOnline ? 'Online' : 'Offline'}</span>
              {currentPhase > 0 && <span className="text-[10px] text-slate-500">— Phase {currentPhase} active</span>}
            </div>
            <a href="https://chat.deepseek.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/20"><ExternalLink className="h-3 w-3" /> DeepSeek</a>
          </div>

          {/* Phase progress */}
          {currentPhase > 0 && currentPhase < 5 && (
            <div className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
              <div className="mb-2 flex items-center justify-between"><p className="text-sm font-semibold text-cyan-300">Phase {currentPhase} : {status?.phaseName}</p><span className="flex items-center gap-1.5 text-xs text-cyan-300"><Loader2 className="h-3 w-3 animate-spin" />{status?.status}</span></div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-500" style={{ width: `${(currentPhase / 4) * 100}%` }} /></div>
              <p className="mt-2 text-[11px] text-slate-500">L extension KIROV3 (Chrome) injecte le prompt dans DeepSeek.</p>
            </div>
          )}

          {/* PRD output */}
          {status?.prd && (
            <div className="mb-4"><div className="mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-cyan-300" /><h3 className="text-sm font-semibold text-slate-200">PRD genere</h3><span className="text-[10px] text-slate-500">{status.prd.length} chars</span></div><div className="custom-scroll max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3"><pre className="whitespace-pre-wrap text-xs text-slate-300">{status.prd}</pre></div></div>
          )}

          {/* Files output */}
          {status?.files && status.files.length > 0 && (
            <div className="mb-4"><div className="mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /><h3 className="text-sm font-semibold text-slate-200">Fichiers generes ({status.files.length})</h3></div><div className="space-y-1.5">{status.files.map((f, i) => <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2"><Code2 className="h-3.5 w-3.5 text-cyan-400" /><span className="flex-1 truncate font-mono text-xs text-slate-200">{f.path}</span><span className="text-[10px] text-slate-500">{f.content.length}</span></div>)}</div></div>
          )}

          {/* Done */}
          {phase === 'done' && (
            <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-300">Mission terminee !</p>
              <p className="mt-1 text-xs text-slate-400">{status?.files?.length ?? 0} fichiers generes via DeepSeek</p>
              <button onClick={handleReset} className="mt-3 rounded-lg border border-slate-700 px-4 py-2 text-xs text-slate-400">Nouvelle mission</button>
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div className="mb-4"><div className="mb-1.5 flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-cyan-300" /><h3 className="text-xs font-semibold text-slate-200">Logs</h3></div><div className="custom-scroll max-h-40 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-2">{logs.map((log, i) => <p key={i} className="font-mono text-[10px] leading-relaxed text-slate-400">{log}</p>)}</div></div>
          )}

          {/* Instructions */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300"><Zap className="h-3.5 w-3.5" /> Comment ca marche</p>
            <ol className="space-y-1.5 text-xs text-slate-400">
              <li>1. Remplis le nom + description + stack</li>
              <li>2. Choisis DeepSeek Chat (gratuit) comme IA</li>
              <li>3. Clique P0 — initialise la mission</li>
              <li>4. Clique P1 — genere le PRD (ouvre DeepSeek)</li>
              <li>5. L extension KIROV3 injecte le prompt dans DeepSeek</li>
              <li>6. DeepSeek genere puis l extension capture puis transition P2</li>
              <li>7. Clique P2 — genere le code (ouvre DeepSeek)</li>
            </ol>
            <p className="mt-3 rounded-lg bg-emerald-500/10 p-2 text-[11px] text-emerald-300">100% gratuit — via chat.deepseek.com. Aucune cle API necessaire. L extension KIROV3 (Chrome) pilote DeepSeek automatiquement.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
