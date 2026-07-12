import { useState, useRef, useCallback } from 'react'
import { Rocket, Loader2, CheckCircle2, AlertCircle, RefreshCw, Code2, FileText, Zap, Send, ClipboardPaste, ArrowRight } from 'lucide-react'
import { hasNativeHttp } from '../glm-native'
import { apiFetch } from '../api'
import type { Project } from '../useProjects'

type Phase = 'idle' | 'prompt' | 'waiting' | 'capturing' | 'parsing' | 'done' | 'error'

export function DeepSeekBridge({ project, onFilesGenerated }: {
  project: Project
  onFilesGenerated?: (files: { path: string; content: string; language: string }[], prd: string) => void
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [prd, setPrd] = useState('')
  const [files, setFiles] = useState<{ path: string; content: string; language: string }[]>([])
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState('')
  const [deepseekUrl] = useState('https://chat.deepseek.com/')
  const [showWebView, setShowWebView] = useState(false)
  const [manualResponse, setManualResponse] = useState('')
  const [showManualCapture, setShowManualCapture] = useState(false)

  const addLog = (msg: string) => {
    const t = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    setLogs(p => [...p, `[${t}] ${msg}`].slice(-30))
  }

  /** Generate the Gold Grade prompts for DeepSeek. */
  function generatePrompts() {
    const name = project.name
    const desc = project.description
    const features = project.features?.join(', ') || 'aucune'

    const prdPrompt = `Tu es un expert en conception de produits. Génère un PRD en Markdown pour:
Application: "${name}"
Description: "${desc}"
Features: ${features}

Sections: Vue d'ensemble, Objectifs, User Stories, Interface, Stack (React 18, TypeScript, Vite, Tailwind CSS).
Réponds UNIQUEMENT avec le Markdown.`

    const codePrompt = `Tu es un ingénieur React senior. Génère 3 fichiers React pour "${name}": ${desc}
Features: ${features}

Génère EXACTEMENT:
1. "src/App.tsx" — HashRouter + route "/" affiche MainComponent
2. "src/components/MainComponent.tsx" — composant métier avec useState, interactions réelles
3. "src/index.css" — directives @tailwind + styles globaux

TypeScript strict, Tailwind, export default. Format JSON:
{"files":[{"path":"src/App.tsx","content":"...","language":"tsx"},{"path":"src/components/MainComponent.tsx","content":"...","language":"tsx"},{"path":"src/index.css","content":"...","language":"css"}]}

Réponds UNIQUEMENT avec le JSON.`

    return { prdPrompt, codePrompt }
  }

  /** Copy text to clipboard (native or browser). */
  async function copyToClipboard(text: string): Promise<boolean> {
    try {
      // Try native bridge first (APK)
      if (window.AndroidBridge?.copyToClipboard) {
        return window.AndroidBridge.copyToClipboard(text)
      }
      // Browser fallback
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      return false
    }
  }

  /** Get clipboard content (native or browser). */
  async function getFromClipboard(): Promise<string> {
    try {
      if (window.AndroidBridge?.getClipboard) {
        return window.AndroidBridge.getClipboard()
      }
      return await navigator.clipboard.readText()
    } catch {
      return ''
    }
  }

  /** Phase 1: Generate and copy PRD prompt, open DeepSeek. */
  async function handleStep1PRD() {
    setPhase('prompt')
    setError('')
    addLog('Génération du prompt PRD...')
    const { prdPrompt } = generatePrompts()
    const ok = await copyToClipboard(prdPrompt)
    if (ok) {
      addLog('Prompt PRD copié dans le presse-papier')
      addLog('Ouverture de DeepSeek...')
      window.open(deepseekUrl, '_blank')
      setShowManualCapture(true)
      setPhase('waiting')
      addLog('Colle le prompt dans DeepSeek, envoie, puis copie la réponse')
    } else {
      addLog('Erreur: impossible de copier le prompt')
      setPhase('error')
    }
  }

  /** Capture PRD response from clipboard. */
  async function handleCapturePRD() {
    setPhase('capturing')
    addLog('Capture de la réponse PRD...')
    let response = manualResponse
    if (!response) {
      response = await getFromClipboard()
    }
    if (!response || response.length < 50) {
      // Use manual textarea
      response = manualResponse
    }
    if (!response || response.length < 50) {
      addLog('Erreur: réponse trop courte ou vide')
      setPhase('error')
      return
    }
    setPrd(response)
    addLog(`PRD capturé (${response.length} chars)`)
    setManualResponse('')
    setPhase('idle')
    setShowManualCapture(false)
  }

  /** Phase 2: Generate and copy code prompt. */
  async function handleStep2Code() {
    if (!prd) {
      setError('Captures d\'abord le PRD (étape 1)')
      return
    }
    setPhase('prompt')
    setError('')
    addLog('Génération du prompt code...')
    const { codePrompt } = generatePrompts()
    const ok = await copyToClipboard(codePrompt)
    if (ok) {
      addLog('Prompt code copié dans le presse-papier')
      addLog('Ouverture de DeepSeek...')
      window.open(deepseekUrl, '_blank')
      setShowManualCapture(true)
      setPhase('waiting')
      addLog('Colle le prompt dans DeepSeek, envoie, puis copie la réponse')
    } else {
      addLog('Erreur: impossible de copier le prompt')
      setPhase('error')
    }
  }

  /** Capture code response and parse files. */
  async function handleCaptureCode() {
    setPhase('capturing')
    addLog('Capture de la réponse code...')
    let response = manualResponse
    if (!response) {
      response = await getFromClipboard()
    }
    if (!response || response.length < 100) {
      response = manualResponse
    }
    if (!response || response.length < 100) {
      addLog('Erreur: réponse trop courte ou vide')
      setPhase('error')
      return
    }

    addLog('Analyse des fichiers générés...')
    const parsed = extractJson(response) as { files?: any[] } | null
    if (!parsed?.files || !Array.isArray(parsed.files)) {
      addLog('Erreur: format JSON invalide')
      setPhase('error')
      return
    }

    const newFiles = parsed.files.map((f: any) => ({
      path: f.path || '',
      content: f.content || '',
      language: f.language || 'text',
    })).filter((f: any) => f.path)

    setFiles(newFiles)
    addLog(`${newFiles.length} fichiers capturés`)
    setPhase('done')
    setManualResponse('')
    setShowManualCapture(false)
    onFilesGenerated?.(newFiles, prd)
    addLog('Projet Gold Grade créé via DeepSeek !')
  }

  function reset() {
    setPhase('idle')
    setPrd('')
    setFiles([])
    setLogs([])
    setError('')
    setManualResponse('')
    setShowManualCapture(false)
  }

  const labels: Record<Phase, string> = {
    idle: 'Prêt', prompt: 'Préparation prompt', waiting: 'En attente',
    capturing: 'Capture...', parsing: 'Analyse...', done: 'Terminé', error: 'Erreur'
  }
  const colors: Record<Phase, string> = {
    idle: 'border-slate-700 bg-slate-900/60 text-slate-400',
    prompt: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    waiting: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
    capturing: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    parsing: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    done: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    error: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  }
  const loading = phase === 'prompt' || phase === 'waiting' || phase === 'capturing' || phase === 'parsing'

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-amber-300" />
          <h2 className="text-base font-bold text-slate-100">DeepSeek Bridge — Gold Grade</h2>
          <span className={`ml-auto flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium ${colors[phase]}`}>
            {loading && <Loader2 className="h-2.5 w-2.5 animate-spin" />}{labels[phase]}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">100% gratuit via chat.deepseek.com — prompts injectés et capturés</p>
      </div>

      <div className="custom-scroll flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl space-y-4">
          {/* Project info */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <p className="text-xs font-semibold text-slate-200">{project.name}</p>
            <p className="mt-0.5 text-[11px] text-slate-500">{project.description}</p>
            {project.features && project.features.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {project.features.map(f => <span key={f} className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-[10px] text-cyan-300/80">{f}</span>)}
              </div>
            )}
          </div>

          {error && (
            <div className="rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
              <div className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" /><p className="text-xs text-rose-300">{error}</p></div>
            </div>
          )}

          {/* Manual capture textarea */}
          {showManualCapture && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
              <p className="mb-2 text-xs font-semibold text-amber-300">Capture de la réponse DeepSeek</p>
              <p className="mb-2 text-[11px] text-slate-400">Colle la réponse de DeepSeek ci-dessous (ou clique "Capturer depuis le presse-papier") :</p>
              <textarea
                value={manualResponse}
                onChange={e => setManualResponse(e.target.value)}
                placeholder="Colle ici la réponse de DeepSeek..."
                rows={6}
                className="mb-2 w-full resize-none rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:border-amber-500/50 focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { if (phase === 'waiting' && !prd) handleCapturePRD(); else handleCaptureCode() }}
                  className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-2 text-xs font-medium text-amber-300 hover:bg-amber-500/30"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Capturer la réponse
                </button>
                <button
                  onClick={async () => { const clip = await getFromClipboard(); setManualResponse(clip) }}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Coller depuis presse-papier
                </button>
              </div>
            </div>
          )}

          {/* Step 1: PRD */}
          {(phase === 'idle' || phase === 'done' || phase === 'error') && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full ${prd ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-300'}`}>
                  {prd ? <CheckCircle2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Étape 1 : PRD (Product Requirements Document)</p>
                  <p className="text-[11px] text-slate-500">{prd ? `Capturé (${prd.length} chars)` : 'Génère le prompt, ouvre DeepSeek, capture la réponse'}</p>
                </div>
              </div>
              {!prd ? (
                <button onClick={handleStep1PRD} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-xs font-semibold text-slate-950 disabled:opacity-50">
                  <Send className="h-3.5 w-3.5" /> Générer prompt PRD + ouvrir DeepSeek
                </button>
              ) : (
                <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 max-h-24 overflow-y-auto">
                  <pre className="whitespace-pre-wrap text-[10px] text-slate-400">{prd.slice(0, 200)}...</pre>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Code */}
          {prd && (phase === 'idle' || phase === 'done' || phase === 'error') && (
            <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className={`flex h-7 w-7 items-center justify-center rounded-full ${files.length > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-cyan-500/20 text-cyan-300'}`}>
                  {files.length > 0 ? <CheckCircle2 className="h-4 w-4" /> : <Code2 className="h-4 w-4" />}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">Étape 2 : Code source (Gold Grade)</p>
                  <p className="text-[11px] text-slate-500">{files.length > 0 ? `${files.length} fichiers capturés` : 'Génère le prompt, ouvre DeepSeek, capture la réponse'}</p>
                </div>
              </div>
              {files.length === 0 ? (
                <button onClick={handleStep2Code} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-xs font-semibold text-slate-950 disabled:opacity-50">
                  <Send className="h-3.5 w-3.5" /> Générer prompt Code + ouvrir DeepSeek
                </button>
              ) : (
                <div className="space-y-1">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded border border-slate-800 bg-slate-900/40 p-1.5">
                      <Code2 className="h-3 w-3 text-cyan-400" />
                      <span className="flex-1 truncate font-mono text-[11px] text-slate-200">{f.path}</span>
                      <span className="text-[9px] text-slate-500">{f.content.length}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Done */}
          {phase === 'done' && (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-300">Projet Gold Grade créé via DeepSeek !</p>
              <p className="mt-1 text-xs text-slate-400">{files.length} fichiers générés</p>
              <button onClick={reset} className="mt-3 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400">Nouveau projet</button>
            </div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div>
              <div className="mb-1.5 flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-cyan-300" /><h3 className="text-xs font-semibold text-slate-200">Logs</h3></div>
              <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                {logs.map((l, i) => <p key={i} className="font-mono text-[10px] leading-relaxed text-slate-400">{l}</p>)}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300"><Zap className="h-3.5 w-3.5" /> Comment ça marche</p>
            <ol className="space-y-1.5 text-xs text-slate-400">
              <li><strong className="text-cyan-300">1.</strong> Clique "Générer prompt PRD" → le prompt est copié + DeepSeek s'ouvre</li>
              <li><strong className="text-cyan-300">2.</strong> Colle le prompt dans DeepSeek (Ctrl+V) et envoie</li>
              <li><strong className="text-cyan-300">3.</strong> Copie la réponse de DeepSeek (sélectionne tout + Ctrl+C)</li>
              <li><strong className="text-cyan-300">4.</strong> Reviens dans l'app et clique "Capturer la réponse"</li>
              <li><strong className="text-cyan-300">5.</strong> Répète pour l'étape 2 (Code source)</li>
              <li><strong className="text-cyan-300">6.</strong> Le projet Gold Grade est créé !</li>
            </ol>
            <p className="mt-3 rounded-lg bg-emerald-500/10 p-2 text-[11px] text-emerald-300">100% gratuit — via chat.deepseek.com. Aucune clé API nécessaire. Les prompts sont injectés et les réponses capturées.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Extract JSON from text (handles markdown fences + truncated). */
function extractJson(text: string): unknown | null {
  let cleaned = text.trim()
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch) cleaned = fenceMatch[1].trim()
  try { return JSON.parse(cleaned) } catch { /* continue */ }
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)) } catch { /* continue */ }
  }
  const firstArr = cleaned.indexOf('[')
  const lastArr = cleaned.lastIndexOf(']')
  if (firstArr !== -1 && lastArr !== -1 && lastArr > firstArr) {
    try { return JSON.parse(cleaned.slice(firstArr, lastArr + 1)) } catch { /* continue */ }
  }
  return null
}
