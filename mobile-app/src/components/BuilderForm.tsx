import { useState } from 'react'
import { Sparkles, ArrowLeft, Check, Loader2, AlertCircle, Wifi, Cpu } from 'lucide-react'
import { apiFetch, getApiBase, getStoredBackendUrl, setBackendUrl, isNativeAndroid } from '../api'
import { hasNativeHttp } from '../glm-native'
import { generateProjectOnDevice } from '../sovereign-generator'
import type { Project } from '../useProjects'

const TEMPLATES = [
  { id: 'taskflow', name: 'TaskFlow', desc: 'Gestion de taches avec ajout, suppression et marquage termine' },
  { id: 'recipebox', name: 'RecipeBox', desc: 'Carnet de recettes avec recherche et filtrage par categorie' },
  { id: 'devportfolio', name: 'DevPortfolio', desc: 'Portfolio developpeur avec projets et competences' },
  { id: 'weathercast', name: 'WeatherCast', desc: 'Application meteo avec previsions sur 5 jours' },
  { id: 'expensetracker', name: 'ExpenseTracker', desc: 'Suivi de depenses avec categories et graphiques' },
  { id: 'pomodoropro', name: 'PomodoroPro', desc: 'Timer pomodoro avec statistiques de productivite' },
  { id: 'markdownnotes', name: 'MarkdownNotes', desc: 'Notes markdown avec apercu en temps reel' },
  { id: 'quizmaster', name: 'QuizMaster', desc: 'Quiz interactif avec score et timer' },
]
const FEATURES = ['darkmode', 'auth', 'api', 'forms', 'charts', 'tables', 'pwa', 'i18n', 'tests', 'animations']

export function BuilderForm({ onCreate, onCancel, onGeneratingStart, onGeneratingError, onProgress }: {
  onCreate: (p: Project) => void
  onCancel: () => void
  onGeneratingStart?: () => void
  onGeneratingError?: () => void
  onProgress?: (phase: 'prd' | 'code' | 'merge' | 'done', message: string) => void
}) {
  const [name, setName] = useState('')
  const [desc, setDesc] = useState('')
  const [tpl, setTpl] = useState(0)
  const [features, setFeatures] = useState<string[]>([])
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')

  function toggle(f: string) { setFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]) }

  async function handleGenerate() {
    setError('')
    const t = TEMPLATES[tpl]
    const projectName = name.trim() || t.name
    const projectDesc = desc.trim() || t.desc
    if (projectDesc.length < 10) { setError('Decris ton application (10 caracteres min.)'); return }

    setGenerating(true)
    onGeneratingStart?.()
    try {
      const native = hasNativeHttp()
      let result

      if (native) {
        // ── Sovereign mode: generate on-device via GLM-4.6 (NativeHttp bridge) ──
        result = await generateProjectOnDevice(projectName, projectDesc, features, (phase, msg) => {
          onProgress?.(phase, msg)
        })

        if (!result.success || result.files.length === 0) {
          throw new Error(result.error || 'Echec de la generation on-device')
        }

        const realProject: Project = {
          id: `local_${Date.now()}`,
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
      } else {
        // ── Server mode: use the PC backend (web mobile same-origin) ──
        const createData = await apiFetch<{ success: boolean; project: any; error?: string }>('/api/projects', {
          method: 'POST',
          body: JSON.stringify({
            name: projectName,
            description: projectDesc,
            stack: 'vite',
            typescript: true,
            styling: 'tailwind',
            routing: 'router',
            stateMgmt: 'none',
            uiLib: 'none',
            features,
            selectedPacks: [],
          }),
        })
        if (!createData.success || !createData.project) throw new Error(createData.error || 'Echec creation projet')
        const projectId = createData.project.id

        onProgress?.('code', 'Generation via serveur GLM-4.6...')
        const genData = await apiFetch<{ success: boolean; project: any; error?: string }>(`/api/projects/${projectId}/generate`, {
          method: 'POST',
        })
        if (!genData.success || !genData.project) throw new Error(genData.error || 'Echec generation')

        const realProject: Project = {
          id: genData.project.id,
          name: genData.project.name,
          description: genData.project.description,
          slug: genData.project.slug,
          stack: genData.project.stack,
          typescript: genData.project.typescript,
          styling: genData.project.styling,
          routing: genData.project.routing,
          stateMgmt: genData.project.stateMgmt,
          uiLib: genData.project.uiLib,
          features: genData.project.features || [],
          files: genData.project.files || [],
          prd: genData.project.prd || '',
          arsenal: genData.project.arsenal && Array.isArray(genData.project.arsenal.documents) ? genData.project.arsenal.documents : null,
          status: 'ready',
          createdAt: genData.project.createdAt || Date.now(),
        }
        setGenerating(false)
        onCreate(realProject)
      }
    } catch (e) {
      let msg = e instanceof Error ? e.message : 'Erreur'
      if (/failed to fetch/i.test(msg)) {
        msg = 'Connexion au serveur impossible. En APK, la generation est on-device (pas de serveur). En navigateur web, verifie que le serveur React Forge est demarre.'
      }
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
        </div>

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
          <div className="flex gap-2 overflow-x-auto pb-1">{TEMPLATES.map((t, i) => <button key={t.id} onClick={() => setTpl(i)} className={`shrink-0 rounded-lg border p-2 text-xs transition ${tpl === i ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200' : 'border-slate-800 text-slate-400'}`}>{t.name}</button>)}</div>
        </div>

        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="mb-2 text-xs font-medium text-slate-300">Fonctionnalites</p>
          <div className="flex flex-wrap gap-1.5">{FEATURES.map(f => { const a = features.includes(f); return <button key={f} onClick={() => toggle(f)} className={`flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs transition ${a ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-200' : 'border-slate-800 text-slate-400'}`}>{a && <Check className="h-3 w-3" />} {f}</button> })}</div>
        </div>

        <button onClick={handleGenerate} disabled={generating} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-6 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">{generating ? <><Loader2 className="h-4 w-4 animate-spin" /> Generation IA en cours...</> : <><Sparkles className="h-4 w-4" /> Generer le projet</>}</button>
        <p className="mt-2 text-center text-[10px] text-slate-500">
          {native
            ? 'GLM-4.6 natif integre - 100% autonome, sans serveur PC. Generation on-device (30-120s).'
            : 'GLM-4.6 via serveur - 100% gratuit, sans cle API. Generation reelle (30-120s).'}
        </p>
      </div>
    </div>
  )
}
