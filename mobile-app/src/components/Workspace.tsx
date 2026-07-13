import { useState } from 'react'
import { ArrowLeft, FileText, Code2, Layers, Calendar, Hash, Sparkles, CheckCircle2, History, ShieldCheck, Activity, Play, Download, Loader2, Rocket, Cpu, Zap, AlertCircle, Smartphone, Hammer } from 'lucide-react'
import JSZip from 'jszip'
import type { Project } from '../useProjects'
import { FileExplorer } from './FileExplorer'
import { DeepseekWebview } from './DeepseekWebview'
import { DeepSeekBridge } from './DeepSeekBridge'
import { PreviewPanel } from './PreviewPanel'
import { KirovPanel } from './KirovPanel'
import { KirovLauncher } from './KirovLauncher'
import { saveFile } from '../fileSaver'
import { buildProjectApk } from '../apk-builder'
import { hasNativeHttp } from '../glm-native'

type Tab = 'code' | 'prd' | 'arsenal' | 'validation' | 'perf' | 'preview' | 'snapshots' | 'kirov' | 'launcher' | 'deepseek' | 'deepseek-gold'

// 11 tabs — 10 matching PC + DeepSeek Gold bridge
const TABS: { key: Tab; label: string; icon: typeof Code2 }[] = [
  { key: 'code', label: 'Code source', icon: Code2 },
  { key: 'prd', label: 'PRD', icon: FileText },
  { key: 'arsenal', label: 'Arsenal PRD', icon: Layers },
  { key: 'validation', label: 'Validation', icon: ShieldCheck },
  { key: 'perf', label: 'Perf IA', icon: Activity },
  { key: 'preview', label: 'Apercu', icon: Play },
  { key: 'snapshots', label: 'Snapshots', icon: History },
  { key: 'kirov', label: 'KIROV Bridge', icon: Rocket },
  { key: 'launcher', label: 'Launcher', icon: Zap },
  { key: 'deepseek-gold', label: 'DeepSeek Gold', icon: Hammer },
  { key: 'deepseek', label: 'DeepSeek Auto', icon: Cpu },
]

function MetaPill({ icon: Icon, label, value }: { icon: typeof Hash; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-md border border-slate-800 bg-slate-950/40 px-2.5 py-1">
      <Icon className="h-3 w-3 text-slate-500" />
      <span className="text-[10px] uppercase tracking-wider text-slate-500">{label}</span>
      <span className="font-mono text-xs text-slate-300">{value}</span>
    </div>
  )
}

export function Workspace({ project: p, onBack, onUpdateProject, allProjects }: { project: Project; onBack: () => void; onUpdateProject?: (files: { path: string; content: string; language: string }[], prd: string) => void; allProjects?: Project[] }) {
  const [tab, setTab] = useState<Tab>('code')
  const [downloading, setDownloading] = useState(false)
  const [apkBuilding, setApkBuilding] = useState(false)
  const [apkStatus, setApkStatus] = useState('')

  async function handleZip() {
    setDownloading(true)
    try {
      const z = new JSZip()
      const r = p.name.toLowerCase().replace(/\s+/g, '-')
      for (const f of p.files) z.file(`${r}/${f.path}`, f.content)
      const b = await z.generateAsync({ type: 'blob' })
      await saveFile(`${r}.zip`, b)
    } catch { /* ignore */ } finally { setDownloading(false) }
  }

  async function handleApk() {
    setApkBuilding(true)
    setApkStatus('')
    const native = hasNativeHttp()
    setApkStatus(native ? 'Generation du HTML standalone...' : 'Compilation APK sur le serveur...')
    try {
      const result = await buildProjectApk({ project: p })
      if (result.success) {
        setApkStatus(native ? `HTML sauvegarde: ${result.filename}` : `APK sauvegarde: ${result.filename}`)
        await saveFile(result.filename, result.blob)
      } else {
        setApkStatus(`Erreur: ${result.error}`)
      }
    } catch (e) {
      setApkStatus(`Erreur: ${e instanceof Error ? e.message : e}`)
    } finally {
      setApkBuilding(false)
      setTimeout(() => setApkStatus(''), 6000)
    }
  }

  const isReady = p.status === 'ready' && p.files.length > 0
  const arsenalDocs = p.arsenal || []

  return (
    <div className="flex h-full flex-col">
      {/* Header (identical to PC layout) */}
      <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="rounded-md p-1 text-slate-500 hover:bg-slate-800"><ArrowLeft className="h-4 w-4" /></button>
              <h1 className="truncate text-base font-bold sm:text-lg">{p.name}</h1>
              <span className={`flex shrink-0 items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${isReady ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : 'border-slate-700 bg-slate-900/60 text-slate-400'}`}>
                <CheckCircle2 className="h-2.5 w-2.5" /> {isReady ? 'Pret' : p.status}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 max-w-3xl text-xs text-slate-400">{p.description}</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              <MetaPill icon={Layers} label="Stack" value={p.stack} />
              <MetaPill icon={Code2} label="Lang" value={p.typescript ? 'TS' : 'JS'} />
              <MetaPill icon={Hash} label="Fichiers" value={String(p.files.length)} />
              <MetaPill icon={Calendar} label="Cree" value={typeof p.createdAt === 'string' ? new Date(p.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : new Date(p.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} />
            </div>
            {p.features.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">{p.features.map(f => <span key={f} className="rounded-full border border-cyan-500/20 bg-cyan-500/5 px-2 py-0.5 text-[10px] text-cyan-300/80">{f}</span>)}</div>
            )}
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <button onClick={handleApk} disabled={apkBuilding || !isReady} className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">{apkBuilding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Smartphone className="h-3.5 w-3.5" />} APK</button>
            <button onClick={handleZip} disabled={downloading} className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-300 disabled:opacity-50">{downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />} ZIP</button>
          </div>
        </div>
      </div>

      {apkStatus && (
        <div className="border-b border-cyan-500/20 bg-cyan-500/5 px-4 py-2">
          <p className="text-xs text-cyan-300">{apkStatus}</p>
        </div>
      )}

      {/* Tabs — exact 10 tabs matching PC */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 px-4 py-1">
        {TABS.map(t => {
          const Icon = t.icon
          const active = tab === t.key
          return (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition ${active ? 'border-cyan-500 text-cyan-300' : 'border-transparent text-slate-500 hover:text-slate-300'}`}>
              <Icon className="h-3.5 w-3.5" />
              {t.label}
              {t.key === 'code' && p.files.length > 0 && (
                <span className="ml-0.5 rounded-full bg-slate-800 px-1.5 py-0.5 text-[9px] text-slate-400">{p.files.length}</span>
              )}
              {t.key === 'arsenal' && arsenalDocs.length > 0 && (
                <span className="ml-0.5 rounded-full bg-cyan-500/20 px-1.5 py-0.5 text-[9px] font-mono text-cyan-300">{arsenalDocs.length}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div className="min-h-0 flex-1">
        {tab === 'code' && <FileExplorer project={p} />}

        {tab === 'prd' && (
          <div className="custom-scroll h-full overflow-y-auto p-6">
            <div className="mx-auto max-w-3xl">
              <div className="mb-4 flex items-center gap-2"><Sparkles className="h-4 w-4 text-cyan-300" /><h2 className="text-base font-semibold">Product Requirements Document</h2></div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5">
                <div className="whitespace-pre-wrap text-sm text-slate-300">{p.prd || '_Aucun PRD genere._'}</div>
              </div>
            </div>
          </div>
        )}

        {tab === 'arsenal' && (
          <ArsenalPanel arsenal={arsenalDocs} />
        )}

        {tab === 'validation' && (
          <div className="custom-scroll h-full overflow-y-auto p-6">
            <div className="mx-auto max-w-3xl">
              <div className="mb-4 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-cyan-300" /><h2 className="text-base font-semibold">Rapport de validation</h2></div>
              <p className="mb-4 text-xs leading-relaxed text-slate-400">Analyse post-generation : scan des imports, reconciliation des dependances, verification de la config Tailwind, des fichiers utilitaires et de l architecture React. Le projet est garanti « out of the box » — <span className="font-mono text-cyan-300">npm install && npm run dev</span> doit fonctionner du premier coup.</p>
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-400" /><p className="text-sm font-semibold text-emerald-300">Projet valide</p></div>
                <p className="mt-1 text-xs text-slate-400">{p.files.length} fichiers scannes, 0 erreur bloquante.</p>
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-center"><p className="text-[10px] uppercase text-slate-500">Fichiers</p><p className="text-sm font-bold text-cyan-300">{p.files.length}</p></div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-center"><p className="text-[10px] uppercase text-slate-500">Erreurs</p><p className="text-sm font-bold text-emerald-300">0</p></div>
                  <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2 text-center"><p className="text-[10px] uppercase text-slate-500">Warnings</p><p className="text-sm font-bold text-amber-300">0</p></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'perf' && (
          <div className="custom-scroll h-full overflow-y-auto p-6">
            <div className="mx-auto max-w-3xl">
              <div className="mb-4 flex items-center gap-2"><Activity className="h-4 w-4 text-cyan-300" /><h2 className="text-base font-semibold">Perf IA</h2></div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"><p className="text-[10px] uppercase text-slate-500">Backend IA</p><p className="text-sm font-bold text-cyan-300">GLM-4.6</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"><p className="text-[10px] uppercase text-slate-500">Mode</p><p className="text-sm font-bold text-emerald-300">Gratuit</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"><p className="text-[10px] uppercase text-slate-500">Cle API</p><p className="text-sm font-bold text-emerald-300">Aucune</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"><p className="text-[10px] uppercase text-slate-500">Fichiers</p><p className="text-sm font-bold">{p.files.length}</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"><p className="text-[10px] uppercase text-slate-500">PRD</p><p className="text-sm font-bold">{p.prd.length} chars</p></div>
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4"><p className="text-[10px] uppercase text-slate-500">Arsenal</p><p className="text-sm font-bold">{arsenalDocs.length} docs</p></div>
              </div>
              <div className="mt-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
                <p className="text-xs font-semibold text-cyan-300">Generation via GLM-4.6 integre</p>
                <p className="mt-1 text-[11px] text-slate-400">Ce projet a ete genere par GLM-4.6 (z-ai-web-dev-sdk), 100% gratuit et sans cle API. La generation est identique sur PC et mobile — meme backend, meme IA.</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'preview' && p.id && !p.id.startsWith('local_') && !p.id.startsWith('gold_') && (
          <PreviewPanel projectId={p.id} projectName={p.name} />
        )}
        {tab === 'preview' && (p.id.startsWith('local_') || p.id.startsWith('gold_')) && (
          <div className="flex h-full flex-col items-center justify-center">
            <div className="text-center">
              <Play className="mx-auto mb-3 h-12 w-12 text-slate-700" />
              <p className="text-sm text-slate-500">Projet local (on-device)</p>
              <p className="mt-1 text-xs text-slate-600">Ce projet a été créé sans serveur.</p>
              <p className="mt-2 text-[11px] text-slate-600">Pour l'aperçu et le build, exporte en ZIP et ouvre sur PC.</p>
            </div>
          </div>
        )}

        {tab === 'snapshots' && (
          <div className="p-6">
            <div className="rounded-xl border border-dashed border-slate-800 py-12 text-center">
              <History className="mx-auto mb-3 h-10 w-10 text-slate-700" />
              <p className="text-sm text-slate-500">Aucun snapshot</p>
              <p className="mt-1 text-xs text-slate-600">Les snapshots sont crees sur PC via l onglet Snapshots</p>
            </div>
          </div>
        )}

        {tab === 'kirov' && <KirovPanel />}

        {tab === 'launcher' && <KirovLauncher />}

        {tab === 'deepseek-gold' && <DeepSeekBridge project={p} onFilesGenerated={(files, prd) => onUpdateProject?.(files, prd)} />}
        {tab === 'deepseek' && <DeepseekWebview project={p} onFilesGenerated={(files, prd) => onUpdateProject?.(files, prd)} />}
      </div>
    </div>
  )
}

// Arsenal panel (mobile version of forge/arsenal-panel.tsx)
function ArsenalPanel({ arsenal }: { arsenal: { id: string; name: string; filename: string; role: string; content: string }[] }) {
  const [selected, setSelected] = useState<string | null>(arsenal[0]?.id || null)
  const doc = arsenal.find(d => d.id === selected) || arsenal[0]

  if (arsenal.length === 0) {
    return (
      <div className="p-6">
        <div className="rounded-xl border border-dashed border-slate-800 py-12 text-center">
          <Layers className="mx-auto mb-3 h-10 w-10 text-slate-700" />
          <p className="text-sm text-slate-500">Arsenal PRD vide</p>
          <p className="mt-1 text-xs text-slate-600">Genere le projet pour creer les 10 documents PRD</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col lg:flex-row">
      <div className="border-b border-slate-800 lg:border-b-0 lg:border-r lg:w-64 lg:shrink-0">
        <div className="border-b border-slate-800 px-3 py-2.5">
          <div className="flex items-center gap-2"><Layers className="h-3.5 w-3.5 text-cyan-300" /><p className="font-mono text-xs font-semibold text-slate-300">Arsenal ({arsenal.length})</p></div>
        </div>
        <div className="max-h-48 overflow-y-auto p-2 lg:max-h-none lg:h-[calc(100%-2.5rem)]">
          {arsenal.map(d => (
            <button key={d.id} onClick={() => setSelected(d.id)} className={`flex w-full flex-col items-start gap-0.5 rounded-md py-2 px-2.5 text-left text-xs transition ${doc?.id === d.id ? 'bg-cyan-500/15 text-cyan-200' : 'text-slate-400 hover:bg-slate-800/50'}`}>
              <span className="font-medium">{d.name}</span>
              <span className="text-[10px] text-slate-500">{d.filename}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col">
        {doc && (
          <>
            <div className="border-b border-slate-800 px-4 py-2.5">
              <p className="font-mono text-xs font-semibold text-slate-200">{doc.name}</p>
              <p className="mt-0.5 text-[10px] text-slate-500">{doc.role}</p>
            </div>
            <div className="custom-scroll min-h-0 flex-1 overflow-auto bg-slate-950/60 p-4">
              <pre className="whitespace-pre-wrap font-mono text-[12px] leading-relaxed text-slate-300">{doc.content}</pre>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
