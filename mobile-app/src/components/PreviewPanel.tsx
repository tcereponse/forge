import { useState } from 'react'
import { Package, Hammer, Loader2, CheckCircle2, XCircle, Terminal, Eye, RefreshCw, ChevronDown, ChevronRight, Smartphone } from 'lucide-react'
import { useProcessStatus } from '../useProcessStatus'
import { apiUrl, apiFetch, getApiBase } from '../api'
import { saveFile } from '../fileSaver'
import { hasNativeHttp } from '../glm-native'

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { label: string; color: string; icon: typeof Loader2 }> = {
    pending: { label: 'En attente', color: 'border-slate-700 bg-slate-900/60 text-slate-400', icon: ChevronRight },
    installing: { label: 'Installation…', color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300', icon: Loader2 },
    building: { label: 'Build…', color: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300', icon: Loader2 },
    installed: { label: 'Installé', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', icon: CheckCircle2 },
    built: { label: 'Prêt', color: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300', icon: CheckCircle2 },
    failed: { label: 'Échec', color: 'border-rose-500/30 bg-rose-500/10 text-rose-300', icon: XCircle },
  }
  const c = config[status] ?? config.pending
  const Icon = c.icon
  const spin = status === 'installing' || status === 'building'
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${c.color}`}>
      <Icon className={`h-2.5 w-2.5 ${spin ? 'animate-spin' : ''}`} />
      {c.label}
    </span>
  )
}

export function PreviewPanel({ projectId, projectName }: { projectId: string; projectName: string }) {
  const { status, triggerInstall, triggerBuild } = useProcessStatus(projectId, true)
  const [showLogs, setShowLogs] = useState<'install' | 'build' | null>(null)
  const [apkBuilding, setApkBuilding] = useState(false)
  const [apkStatus, setApkStatus] = useState('')

  const installDone = status?.install === 'installed'
  const buildDone = status?.build === 'built'
  const buildFailed = status?.build === 'failed'
  const installFailed = status?.install === 'failed'
  const installPending = !status || status.install === 'pending'

  async function handleApk() {
    setApkBuilding(true)
    setApkStatus('Compilation APK...')
    try {
      const res = await fetch(apiUrl('/api/build-apk'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, backendUrl: getApiBase() }),
      })
      if (!res.ok) {
        let errMsg = `HTTP ${res.status}`
        try { const ej = await res.json(); errMsg = ej.error || errMsg } catch {}
        throw new Error(errMsg)
      }
      const blob = await res.blob()
      if (blob.size < 1000) throw new Error('APK trop petit')
      const apkName = `${projectName.toLowerCase().replace(/\s+/g, '-')}.apk`
      const result = await saveFile(apkName, blob)
      setApkStatus(result.success ? `APK sauvegardé: ${result.path} (${(blob.size / 1024).toFixed(0)} Ko)` : `Erreur: ${result.error}`)
    } catch (e) {
      setApkStatus(`Erreur APK: ${e instanceof Error ? e.message : e}`)
    } finally {
      setApkBuilding(false)
      setTimeout(() => setApkStatus(''), 8000)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Status bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 bg-slate-950/40 px-4 py-3">
        <div className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[11px] text-slate-400">Dépendances</span>
          <StatusBadge status={status?.install ?? 'pending'} />
        </div>
        <div className="flex items-center gap-1.5">
          <Hammer className="h-3.5 w-3.5 text-slate-500" />
          <span className="text-[11px] text-slate-400">Build</span>
          <StatusBadge status={status?.build ?? 'pending'} />
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          {(installPending || installFailed) && (
            <button onClick={triggerInstall} disabled={status?.install === 'installing'} className="flex items-center gap-1 rounded-md border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1.5 text-[11px] font-medium text-cyan-300 disabled:opacity-50">
              {status?.install === 'installing' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Package className="h-3 w-3" />}
              {installFailed ? 'Réessayer' : 'Installer'}
            </button>
          )}
          <button onClick={handleApk} disabled={apkBuilding} className="flex items-center gap-1 rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 px-2.5 py-1.5 text-[11px] font-semibold text-slate-950 disabled:opacity-50">
            {apkBuilding ? <Loader2 className="h-3 w-3 animate-spin" /> : <Smartphone className="h-3 w-3" />}
            APK
          </button>
          <button onClick={triggerBuild} disabled={status?.build === 'building'} className="flex items-center gap-1 rounded-md border border-slate-700 px-2.5 py-1.5 text-[11px] text-slate-300 disabled:opacity-50">
            {status?.build === 'building' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Hammer className="h-3 w-3" />}
            {buildDone ? 'Rebuilder' : 'Builder'}
          </button>
        </div>
      </div>

      {/* APK status */}
      {apkStatus && (
        <div className="border-b border-cyan-500/20 bg-cyan-500/5 px-4 py-2">
          <p className="text-[11px] text-cyan-300">{apkStatus}</p>
        </div>
      )}

      {/* Error states */}
      {installFailed && (
        <div className="border-b border-rose-500/20 bg-rose-500/5 px-4 py-2">
          <p className="text-[11px] text-rose-300">❌ L'installation a échoué. Vérifie les logs.</p>
        </div>
      )}
      {buildFailed && (
        <div className="border-b border-rose-500/20 bg-rose-500/5 px-4 py-2">
          <p className="text-[11px] text-rose-300">❌ Le build a échoué. Vérifie les logs.</p>
        </div>
      )}

      {/* Log toggles */}
      <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-1.5">
        <button onClick={() => setShowLogs(showLogs === 'install' ? null : 'install')} className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950/40 px-2 py-1 text-[10px] text-slate-400">
          <Terminal className="h-2.5 w-2.5" /> Logs install {showLogs === 'install' ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
        </button>
        <button onClick={() => setShowLogs(showLogs === 'build' ? null : 'build')} className="flex items-center gap-1 rounded-md border border-slate-800 bg-slate-950/40 px-2 py-1 text-[10px] text-slate-400">
          <Terminal className="h-2.5 w-2.5" /> Logs build {showLogs === 'build' ? <ChevronDown className="h-2.5 w-2.5" /> : <ChevronRight className="h-2.5 w-2.5" />}
        </button>
      </div>

      {/* Logs */}
      {showLogs && (
        <div className="border-b border-slate-800">
          <pre className="custom-scroll max-h-40 overflow-auto bg-slate-950 p-3 font-mono text-[10px] leading-relaxed text-slate-400">
            {showLogs === 'install' ? (status?.installLog || 'En attente…') : (status?.buildLog || 'En attente…')}
          </pre>
        </div>
      )}

      {/* Preview iframe */}
      <div className="relative min-h-0 flex-1 bg-slate-950">
        {buildDone ? (
          <div className="flex h-full flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900/60 px-4 py-1">
              <div className="flex items-center gap-1.5">
                <Eye className="h-3 w-3 text-cyan-300" />
                <span className="text-[10px] font-medium text-slate-300">Aperçu en direct</span>
              </div>
              <a href={apiUrl(`/api/preview/${projectId}/`)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-slate-500">
                Ouvrir ↗
              </a>
            </div>
            <iframe
              src={apiUrl(`/api/preview/${projectId}/`)}
              className="min-h-0 w-full flex-1 border-0 bg-white"
              title="Aperçu"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-900 ring-1 ring-slate-800">
              {status?.install === 'installing' || status?.build === 'building' ? (
                <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
              ) : buildFailed ? (
                <XCircle className="h-6 w-6 text-rose-400" />
              ) : !installDone ? (
                <Package className="h-6 w-6 text-slate-600" />
              ) : (
                <Hammer className="h-6 w-6 text-slate-600" />
              )}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-300">
                {status?.install === 'installing' ? 'Installation des dépendances…' :
                 status?.build === 'building' ? 'Build en cours…' :
                 buildFailed ? 'Le build a échoué' :
                 installFailed ? 'L\'installation a échoué' :
                 !installDone ? 'Installe les dépendances d\'abord' :
                 'Clique « Builder » pour générer l\'aperçu'}
              </p>
              <p className="mt-1 text-[10px] text-slate-500">
                {installDone && !buildDone ? 'npm run build génère l\'aperçu visible' : 'npm install --legacy-peer-deps'}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
