import { useState, useEffect } from 'react'
import { Hammer, Loader2, LogIn, UserPlus, AlertCircle, Lock } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { WelcomeView } from './components/WelcomeView'
import { BuilderForm } from './components/BuilderForm'
import { Workspace } from './components/Workspace'
import { GenerationOverlay } from './components/GenerationOverlay'
import { SetupScreen } from './components/SetupScreen'
import { useBackendStatus } from './useBackendStatus'
import { useProjects, type Project } from './useProjects'
import { hasNativeHttp } from './glm-native'
import { type ProjectTemplate } from './templates'
import { apiFetch } from './api'

interface AuthUser { id: string; username: string }

type View = 'welcome' | 'builder' | 'workspace'

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null)
  const [authChecking, setAuthChecking] = useState(true)

  // Check if already logged in
  useEffect(() => {
    apiFetch<{ authenticated: boolean; user: AuthUser | null }>('/api/auth/me')
      .then(data => {
        if (data.authenticated && data.user) setAuthUser(data.user)
        setAuthChecking(false)
      })
      .catch(() => setAuthChecking(false))
  }, [])

  if (authChecking) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    )
  }

  if (!authUser) {
    return <LoginScreen onSuccess={setAuthUser} />
  }

  return <MainApp user={authUser} onLogout={() => setAuthUser(null)} />
}

function LoginScreen({ onSuccess }: { onSuccess: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const data = await apiFetch<{ success: boolean; user: AuthUser; error?: string }>(endpoint, {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      if (!data.success) { setError(data.error || 'Erreur'); return }
      onSuccess(data.user)
    } catch { setError('Erreur réseau') } finally { setLoading(false) }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950 p-4">
      <div className="pointer-events-none absolute h-64 w-96 rounded-full bg-cyan-500/10 blur-[100px]" />
      <div className="relative w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
            <Hammer className="h-8 w-8 text-cyan-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-50">React Forge</h1>
          <p className="mt-1 text-xs text-slate-500">Connecte-toi pour accéder à tes projets</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl">
          <div className="mb-4 flex gap-1 rounded-lg border border-slate-800 bg-slate-950/40 p-1">
            <button onClick={() => { setMode('login'); setError('') }} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition ${mode === 'login' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500'}`}>
              <LogIn className="h-3.5 w-3.5" /> Connexion
            </button>
            <button onClick={() => { setMode('register'); setError('') }} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition ${mode === 'register' ? 'bg-cyan-500/20 text-cyan-300' : 'text-slate-500'}`}>
              <UserPlus className="h-3.5 w-3.5" /> Inscription
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Nom d'utilisateur" className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none" autoFocus />
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Mot de passe" className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none" />
            {error && <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" /><p className="text-xs text-rose-300">{error}</p></div>}
            <button type="submit" disabled={loading || !username || !password} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : mode === 'login' ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
              {mode === 'login' ? 'Se connecter' : 'Créer un compte'}
            </button>
          </form>
          {mode === 'register' && (
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400"><Lock className="h-3 w-3" /> Mot de passe: 6+ chars, 1 chiffre, 1 majuscule, 1 minuscule, 1 symbole</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MainApp({ user, onLogout }: { user: AuthUser; onLogout: () => void }) {
  const { projects, addProject, deleteProject, syncFromBackend, loading } = useProjects()
  const backend = useBackendStatus(true)
  const [view, setView] = useState<View>('welcome')
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genPhase, setGenPhase] = useState<'prd' | 'arsenal' | 'code' | 'saving' | 'done' | 'error'>('prd')
  const [genMessage, setGenMessage] = useState('')
  const [setupDone, setSetupDone] = useState(false)
  const [pendingTemplate, setPendingTemplate] = useState<ProjectTemplate | null>(null)
  const [pendingIdea, setPendingIdea] = useState<string | null>(null)

  useEffect(() => {
    if (backend.state === 'online' && !setupDone) {
      syncFromBackend()
      setSetupDone(true)
    }
  }, [backend.state, setupDone, syncFromBackend])

  function updateProject(id: string, files: { path: string; content: string; language: string }[], prd: string) {
    const proj = projects.find(p => p.id === id) || currentProject
    if (!proj) return
    const updated = { ...proj, files, prd, status: 'ready' as const }
    setCurrentProject(updated)
    addProject(updated)
  }

  function handleGeneratingStart() {
    setGenerating(true)
    setGenPhase('prd')
    setGenMessage('Initialisation...')
  }

  function handleProgress(phase: 'prd' | 'code' | 'merge' | 'done', message: string) {
    setGenMessage(message)
    if (phase === 'prd') setGenPhase('prd')
    else if (phase === 'code') setGenPhase('code')
    else if (phase === 'merge') setGenPhase('saving')
    else if (phase === 'done') setGenPhase('done')
  }

  function handleCreate(p: Project) {
    setGenPhase('arsenal')
    setTimeout(() => setGenPhase('code'), 300)
    setTimeout(() => setGenPhase('saving'), 600)
    setTimeout(() => {
      setGenPhase('done')
      addProject(p)
      setCurrentProject(p)
      setView('workspace')
      setTimeout(() => setGenerating(false), 500)
    }, 900)
  }

  function handleGeneratingError() {
    setGenPhase('error')
    setTimeout(() => setGenerating(false), 1200)
  }

  function handleSetupConnected() {
    setSetupDone(true)
    backend.recheck()
  }

  function handlePickTemplate(tpl: ProjectTemplate) {
    setPendingTemplate(tpl)
    setPendingIdea(null)
    setView('builder')
    setSidebarOpen(false)
  }

  function handlePickIdea(idea: string) {
    setPendingIdea(idea)
    setPendingTemplate(null)
    setView('builder')
    setSidebarOpen(false)
  }

  function handleNewBlank() {
    setPendingTemplate(null)
    setPendingIdea(null)
    setView('builder')
    setSidebarOpen(false)
  }

  async function handleLogout() {
    try { await apiFetch('/api/auth/logout', { method: 'POST' }) } catch {}
    onLogout()
  }

  const sovereign = hasNativeHttp()

  if (!sovereign && backend.state === 'offline') {
    return <SetupScreen onConnected={handleSetupConnected} />
  }

  if (!sovereign && backend.state === 'checking') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-500/10 ring-1 ring-cyan-500/30">
            <svg className="h-7 w-7 animate-spin text-cyan-300" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-slate-300">Connexion au serveur...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-2.5 backdrop-blur md:hidden">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-md p-1.5 text-slate-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <span className="font-mono text-sm font-bold">React Forge</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-cyan-400">{user.username}</span>
          <button onClick={handleLogout} className="text-[10px] text-slate-500 hover:text-rose-400">Déconnexion</button>
        </div>
      </div>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed z-30 h-full w-72 transition-transform md:translate-x-0 md:static md:z-0`}>
        <Sidebar projects={projects} onNew={handleNewBlank} onSelect={(p) => { setCurrentProject(p); setView('workspace'); setSidebarOpen(false) }} onHome={() => { setView('welcome'); setCurrentProject(null); setSidebarOpen(false) }} onDelete={deleteProject} currentId={currentProject?.id} />
      </div>
      <main className="relative flex min-w-0 flex-1 flex-col pt-12 md:pt-0">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {view === 'welcome' && <WelcomeView onNew={handleNewBlank} onPickTemplate={handlePickTemplate} onPickIdea={handlePickIdea} projects={projects} />}
          {view === 'builder' && <BuilderForm onCreate={handleCreate} onCancel={() => setView('welcome')} onGeneratingStart={handleGeneratingStart} onGeneratingError={handleGeneratingError} onProgress={handleProgress} pendingTemplate={pendingTemplate} pendingIdea={pendingIdea} />}
          {view === 'workspace' && currentProject && <Workspace project={currentProject} onBack={() => setView('welcome')} onUpdateProject={(files, prd) => updateProject(currentProject.id, files, prd)} allProjects={projects} />}
        </div>
      </main>
      {generating && <GenerationOverlay phase={genPhase} projectName={currentProject?.name || 'Nouveau projet'} message={genMessage} />}
    </div>
  )
}
