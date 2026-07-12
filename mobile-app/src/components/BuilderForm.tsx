import { useState, useEffect } from 'react'
import { Sparkles, ArrowLeft, Check, Loader2, AlertCircle, Wifi, Cpu, ChevronRight } from 'lucide-react'
import { apiFetch, getApiBase, getStoredBackendUrl, setBackendUrl, isNativeAndroid } from '../api'
import { hasNativeHttp } from '../glm-native'
import { generateProjectOnDevice, generateGoldProjectOnDevice } from '../sovereign-generator'
import { PROJECT_TEMPLATES, type ProjectTemplate } from '../templates'
import type { Project } from '../useProjects'

const FEATURES = ['darkmode', 'auth', 'api', 'forms', 'charts', 'tables', 'pwa', 'i18n', 'tests', 'animations']

export function BuilderForm({ onCreate, onCancel, onGeneratingStart, onGeneratingError, onProgress, pendingTemplate, pendingIdea }: {
  onCreate: (p: Project) => void
  onCancel: () => void
  onGeneratingStart?: () => void
  onGeneratingError?: () => void
  onProgress?: (phase: 'prd' | 'code' | 'merge' | 'done', message: string) => void
  pendingTemplate?: ProjectTemplate | null
  pendingIdea?: string | null
}) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [tpl, setTpl] = useState(0)
  const [features, setFeatures] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [showConfig, setShowConfig] = useState(false)
  const [backendInput, setBackendInput] = useState(getStoredBackendUrl())

  // Pre-fill from a picked template (from WelcomeView gallery) or a sample idea
  useEffect(() => {
    if (pendingTemplate) {
      setName(pendingTemplate.name)
      setDesc(pendingTemplate.description)
      setFeatures(pendingTemplate.features || [])
      const idx = PROJECT_TEMPLATES.findIndex(t => t.id === pendingTemplate.id)
      if (idx >= 0) setTpl(idx)
    } else if (pendingIdea) {
      setDesc(pendingIdea)
      setName('')
    }
  }, [pendingTemplate, pendingIdea])

  function toggle(f: string) { setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]) }

  async function handleGenerate() {
    setError('')
    const t = PROJECT_TEMPLATES[tpl]
    const projectName = name.trim() || t.name
    const projectDesc = desc.trim() || t.description
    if (projectDesc.length < 10) { setError('Decris ton application (10 caracteres min.)'); return }

    setGenerating(true)
    onGeneratingStart?.()
    try {
      // generateProjectOnDevice handles both sovereign (on-device GLM) and server (fallback) modes.
      // If the GLM API is unreachable from the phone, it automatically falls back to the server.
      const result = await generateProjectOnDevice(projectName, projectDesc, features, (phase, msg) => {
        onProgress?.(phase, msg)
      })

      if (!result.success || result.files.length === 0) {
        throw new Error(result.error || 'Echec de la generation')
      }

      // Build the project object — use server ID if server mode, local ID if sovereign
      const realProject: Project = {
        id: result.mode === 'server' && result.files[0]
          ? `server_${Date.now()}`
          : `local_${Date.now()}`,
        name: projectName,
        description: projectDesc,
        slug: projectName.toLowerCase().replace(/\s+/g, '-'),
        stack: 'vite',
        typescript: true,
        styling: 'tailwind',
        routing: 'router',
        stateMgmt: 'none',
        uiLib: 'none',
        features,
        files: result.files,
        prd: result.prd,
        arsenal: null,
        status: 'ready',
        createdAt: Date.now(),
      }
      setGenerating(false)
      onCreate(realProject)
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'Erreur'
      if (/failed to fetch/i.test(msg)) {
        msg = 'Connexion impossible. Clique sur "Configurer" et entre l URL du serveur React Forge (l URL dans le navigateur PC) pour utiliser le serveur comme relais.'
      }
      if (/network_redirect|redirigee|html|operateur/i.test(msg)) {
        msg = 'Votre reseau operateur bloque l API GLM-4.6. Cliquez sur "Configurer" et entrez l URL du serveur React Forge (l URL affichee dans le navigateur PC) pour creer des projets via le serveur.'
      }
      // Truncate long HTML errors
      if (msg.length > 300) {
        msg = msg.slice(0, 300) + '...'
      }
      setError(msg)
      setGenerating(false)
      onGeneratingError?.()
    }
  }

  // Gold Grade generation — pipeline 5 passes (Architecture → Types → Logic → UI → Tests)
  async function handleGoldGenerate() {
    setError('')
    const t = PROJECT_TEMPLATES[tpl]
    const projectName = name.trim() || t.name
    const projectDesc = desc.trim() || t.description
    if (projectDesc.length < 10) { setError('Decris ton application (10 caracteres min.)'); return }

    setGenerating(true)
    onGeneratingStart?.()
    try {
      const result = await generateGoldProjectOnDevice(projectName, projectDesc, features, (phase, msg) => {
        onProgress?.(phase, msg)
      })

      if (!result.success || result.files.length === 0) {
        throw new Error(result.error || 'Echec du pipeline Gold')
      }

      const realProject: Project = {
        id: `gold_${Date.now()}`,
        name: projectName,
        description: projectDesc,
        slug: projectName.toLowerCase().replace(/\s+/g, '-'),
        stack: 'vite',
        typescript: true,
        styling: 'tailwind',
        routing: 'router',
        stateMgmt: 'none',
        uiLib: 'none',
        features,
        files: result.files,
        prd: result.prd,
        arsenal: null,
        status: 'ready',
        createdAt: Date.now(),
      }
      setGenerating(false)
      onCreate(realProject)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur Gold'
      setError(msg)
      setGenerating(false)
      onGeneratingError?.()
    }
  }

  const native = hasNativeHttp()
  const apiBase = getApiBase()

  return (
    <div className="custom-scroll h-full overflow-y-auto">
      <div className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6 flex items-center gap-2">
          <button onClick={onCancel} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800"><ArrowLeft className="h-4 w-4" /></button>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-0.5 text-[10px] text-cyan-300"><Sparkles className="h-3 w-3" /><span className="font-mono uppercase tracking-widest">Nouveau projet</span></div>
            <h2 className="mt-1 text-xl font-bold">Decris ton application</h2>
          </div>
        </div>

        {/* Sovereign mode indicator */}
        <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2">
          <div className="flex items-center gap-2">
            {native ? <Cpu className="h-3.5 w-3.5 text-emerald-400" /> : <Wifi className={`h-3.5 w-3.5 ${apiBase === '' && !isNativeAndroid() ? 'text-emerald-400' : apiBase ? 'text-cyan-400' : 'text-amber-400'}`} />}
            <span className="text-[11px] text-slate-400">
              {native
                ? 'Mode souverain : generation on-device (GLM-4.6 natif, sans serveur PC)'
                : apiBase === '' && !isNativeAndroid()
                  ? 'Mode serveur : backend local (meme origine)'
                  : apiBase
                    ? `Mode serveur : ${apiBase}`
                    : 'Aucun backend configure'}
            </span>
          </div>
          {native && <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-medium text-emerald-300">100% AUTONOME</span>}
          <button onClick={() => setShowConfig(!showConfig)} className="text-[10px] text-cyan-400 hover:underline">Configurer</button>
        </div>

        {showConfig && (
          <div className="mb-4 rounded-lg border border-slate-800 bg-slate-900/40 p-3">
            <label className="mb-1 block text-[11px] font-medium text-slate-300">URL du serveur React Forge (relais)</label>
            <div className="flex gap-2">
              <input value={backendInput} onChange={e => setBackendInput(e.target.value)} placeholder="https://preview-xxx.space-z.ai" className="flex-1 rounded-md border border-slate-700 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none" />
              <button onClick={() => { setBackendUrl(backendInput); setShowConfig(false) }} className="rounded-md bg-cyan-500/20 px-3 py-1.5 text-xs font-medium text-cyan-300">OK</button>
            </div>
            <p className="mt-1.5 text-[10px] text-slate-500">
              IMPORTANT : Entrez l URL du serveur React Forge (commence par https://preview-), PAS l URL de DeepSeek.
              Ouvrez React Forge sur PC et copiez l URL de la barre d adresse.
              Si l API GLM est bloquee par votre reseau, l app utilisera ce serveur pour creer les projets.
            </p>
          </div>
        )}

        {/* Warning: sovereign mode without server fallback — GLM API might be unreachable */}
        {native && !apiBase && (
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
              <div>
                <p className="text-xs font-semibold text-amber-300">Configuration recommandee</p>
                <p className="mt-1 text-[11px] text-slate-400">
                  L APK utilise GLM-4.6 on-device. Si votre reseau operateur bloque l API, la generation echouera.
                  Cliquez <strong className="text-amber-200">Configurer</strong> et entrez l URL du serveur React Forge (PC) pour activer le fallback automatique.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
            <div className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" /><div><p className="text-xs font-semibold text-rose-300">Erreur</p><p className="mt-1 text-[11px] text-slate-400">{error}</p></div></div>
          </div>
        )}

        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3">
          <div><label className="mb-1 block text-xs font-medium text-slate-300">Nom du projet</label><input value={name} onChange={e => setName(e.target.value)} placeholder="ex: TaskFlow..." className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none" /></div>
          <div><label className="mb-1 block text-xs font-medium text-slate-300">Description</label><textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Decris ce que fait ton app en detail..." rows={3} className="w-full resize-none rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none" /></div>
        </div>

        <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="mb-2 text-xs font-medium text-slate-300">Modele de base</p>
          <div className="flex gap-2 overflow-x-auto pb-1">{PROJECT_TEMPLATES.map((t, i) => <button key={t.id} onClick={() => setTpl(i)} className={`shrink-0 rounded-lg border p-2 text-xs transition ${tpl === i ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200' : 'border-slate-800 text-slate-400'}`}>{t.name}</button>)}</div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="mb-2 text-xs font-medium text-slate-300">Fonctionnalites</p>
          <div className="flex flex-wrap gap-1.5">{FEATURES.map(f => { const a = features.includes(f); return <button key={f} onClick={() => toggle(f)} className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition ${a ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200' : 'border-slate-800 text-slate-400'}`}>{a && <Check className="h-3 w-3" />} {f}</button> })}</div>
        </div>

        <button onClick={handleGenerate} disabled={generating} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generation IA en cours...</> : <><Sparkles className="h-4 w-4" /> Generer le projet</>}</button>

        {/* Gold Grade Industrial — pipeline 5 passes */}
        <button onClick={handleGoldGenerate} disabled={generating} className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-amber-500/50 bg-gradient-to-r from-amber-500/10 to-yellow-500/10 px-6 py-3 text-sm font-semibold text-amber-300 disabled:opacity-50">{generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Pipeline Gold en cours...</> : <><Sparkles className="h-4 w-4" /> Generer Gold Grade Industrial <ChevronRight className="h-4 w-4" /></>}</button>

        <p className="mt-2 text-center text-[10px] text-slate-500">
          {native
            ? 'GLM-4.6 natif - 100% autonome. Standard: 30-120s. Gold: 3-6min (5 passes + design system).'
            : 'GLM-4.6 via serveur - Standard: 30-120s. Gold: 3-6min (Architecture → Types → Logic → UI → Tests).'}
        </p>
      </div>
    </div>
  )
}
