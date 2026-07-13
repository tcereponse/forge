import { useState, useEffect } from 'react'
import { Hammer, Wifi, WifiOff, Loader2, CheckCircle2, AlertCircle, ArrowRight, Globe, Copy } from 'lucide-react'
import { testBackend } from '../useBackendStatus'
import { setBackendUrl, getStoredBackendUrl, isNativeAndroid, getApiBase } from '../api'
import { useProjects } from '../useProjects'

export function SetupScreen({ onConnected }: { onConnected: () => void }) {
  const [url, setUrl] = useState(getStoredBackendUrl())
  const [testing, setTesting] = useState(false)
  const [result, setResult] = useState<{ ok: boolean; error?: string } | null>(null)
  const { syncFromBackend } = useProjects()

  async function handleTest() {
    setTesting(true)
    setResult(null)
    // Save the URL first so testBackend uses it
    setBackendUrl(url)
    const r = await testBackend(url && /^https?:\/\//.test(url) ? url : undefined)
    setResult(r)
    setTesting(false)
    if (r.ok) {
      // Sync projects from backend, then proceed
      await syncFromBackend()
      setTimeout(() => onConnected(), 500)
    }
  }

  async function handleSkip() {
    // For web mobile (same-origin), skip setup and try anyway
    setTesting(true)
    const r = await testBackend()
    setResult(r)
    setTesting(false)
    if (r.ok) {
      await syncFromBackend()
      setTimeout(() => onConnected(), 300)
    }
  }

  const isApk = isNativeAndroid()
  const currentBase = getApiBase()

  return (
    <div className="custom-scroll h-full overflow-y-auto">
      <div className="mx-auto flex min-h-full max-w-lg flex-col items-center justify-center px-4 py-8">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="pointer-events-none mx-auto mb-4 h-24 w-48 rounded-full bg-cyan-500/20 blur-[60px]" />
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
            <Hammer className="h-8 w-8 text-cyan-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-50">React Forge</h1>
          <p className="mt-1 text-xs text-slate-500">Configuration du serveur</p>
        </div>

        {/* Status card */}
        <div className="mb-6 w-full rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 ring-1 ring-amber-500/30">
              <WifiOff className="h-5 w-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-200">Serveur injoignable</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-400">
                {isApk
                  ? "L'application mobile a besoin de l'URL du serveur React Forge pour fonctionner. Ouvre React Forge sur ton PC et copie l'URL de la barre d'adresse."
                  : "L'app ne peut pas joindre le serveur. Verifie que le serveur React Forge est demarre et accessible depuis ton telephone."}
              </p>
            </div>
          </div>
        </div>

        {/* URL input */}
        <div className="mb-4 w-full">
          <label className="mb-1.5 block text-xs font-medium text-slate-300">URL du serveur React Forge</label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && url.trim()) handleTest() }}
                placeholder="https://preview-xxx.space-z.ai"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
            <button
              onClick={handleTest}
              disabled={testing || !url.trim()}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-slate-950 disabled:opacity-50"
            >
              {testing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {testing ? 'Test...' : 'Tester'}
            </button>
          </div>
          <p className="mt-1.5 text-[10px] text-slate-500">
            Colle l'URL complete (avec https://). Sans /mobile a la fin.
          </p>
        </div>

        {/* Result */}
        {result && (
          <div className={`mb-4 w-full rounded-xl border p-3 ${result.ok ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-rose-500/30 bg-rose-500/5'}`}>
            <div className="flex items-start gap-2">
              {result.ok ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" /> : <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />}
              <div>
                <p className={`text-xs font-semibold ${result.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {result.ok ? 'Connexion reussie !' : 'Echec de la connexion'}
                </p>
                {!result.ok && result.error && <p className="mt-0.5 text-[11px] text-slate-400">{result.error}</p>}
                {result.ok && <p className="mt-0.5 text-[11px] text-slate-400">Chargement des projets...</p>}
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="w-full rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300">
            <Wifi className="h-3.5 w-3.5" /> Comment trouver l'URL
          </p>
          <ol className="space-y-1.5 text-xs text-slate-400">
            <li><span className="font-mono text-cyan-300">1.</span> Ouvre React Forge sur ton <strong className="text-slate-200">PC</strong> dans le navigateur</li>
            <li><span className="font-mono text-cyan-300">2.</span> Regarde la <strong className="text-slate-200">barre d'adresse</strong> en haut du navigateur</li>
            <li><span className="font-mono text-cyan-300">3.</span> L'URL ressemble a : <code className="rounded bg-slate-800 px-1 text-cyan-300">https://preview-xxx.space-z.ai</code></li>
            <li><span className="font-mono text-cyan-300">4.</span> Copie cette URL (sans <code className="rounded bg-slate-800 px-1">/mobile</code>) et colle-la ci-dessus</li>
            <li><span className="font-mono text-cyan-300">5.</span> Clique <strong className="text-slate-200">Tester</strong> pour verifier la connexion</li>
          </ol>
          {isApk && (
            <div className="mt-3 rounded-lg bg-cyan-500/10 p-2.5">
              <p className="text-[11px] text-cyan-300">
                <strong>APK detecte.</strong> Ton telephone et ton PC doivent etre sur le meme reseau WiFi, OU le serveur doit etre accessible via l'URL de preview (internet).
              </p>
            </div>
          )}
        </div>

        {/* Skip button (for web mobile same-origin) */}
        {!isApk && (
          <button onClick={handleSkip} disabled={testing} className="mt-4 text-xs text-slate-500 hover:text-slate-300 disabled:opacity-50">
            {testing ? 'Test en cours...' : 'Essayer sans configurer (meme origine)'}
          </button>
        )}

        {/* Current config debug */}
        {currentBase && (
          <div className="mt-6 w-full rounded-lg border border-slate-800 bg-slate-950/40 p-2 text-center">
            <p className="text-[10px] text-slate-500">URL actuelle : <span className="font-mono text-cyan-300">{currentBase}</span></p>
          </div>
        )}
      </div>
    </div>
  )
}
