import { useState, useEffect } from 'react'
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

type View = 'welcome' | 'builder' | 'workspace'

export default function App() {
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

  // When backend comes online (either auto or after setup), sync projects
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

  // In sovereign mode (APK with NativeHttp), skip the backend check entirely —
  // the app generates projects on-device, no server needed.
  const sovereign = hasNativeHttp()

  // Show setup screen if backend is offline AND we're not in sovereign mode
  if (!sovereign && backend.state === 'offline') {
    return <SetupScreen onConnected={handleSetupConnected} />
  }

  // Show loading while checking backend (only in server mode)
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
          <p className="mt-1 text-xs text-slate-500">React Forge Mobile</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-2.5 backdrop-blur md:hidden">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-md p-1.5 text-slate-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <span className="font-mono text-sm font-bold">React Forge</span>
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${backend.state === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} title={backend.state} />
          <button onClick={() => syncFromBackend()} className="text-[10px] text-slate-500 hover:text-cyan-400">{loading ? '...' : projects.length}</button>
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
