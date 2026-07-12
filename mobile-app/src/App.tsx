import { useState } from 'react'
import { Sidebar } from './components/Sidebar'
import { WelcomeView } from './components/WelcomeView'
import { BuilderForm } from './components/BuilderForm'
import { Workspace } from './components/Workspace'
import { GenerationOverlay } from './components/GenerationOverlay'
import { useProjects, type Project } from './useProjects'

type View = 'welcome' | 'builder' | 'workspace'

export default function App() {
  const { projects, addProject, deleteProject, syncFromBackend, loading } = useProjects()
  const [view, setView] = useState<View>('welcome')
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [genPhase, setGenPhase] = useState<'prd' | 'arsenal' | 'code' | 'saving' | 'done' | 'error'>('prd')

  function updateProject(id: string, files: { path: string; content: string; language: string }[], prd: string) {
    const proj = projects.find(p => p.id === id) || currentProject
    if (!proj) return
    const updated = { ...proj, files, prd, status: 'ready' as const }
    setCurrentProject(updated)
    addProject(updated) // updates the store + localStorage
  }

  // Called by BuilderForm when real generation STARTS (user clicked "Generer")
  function handleGeneratingStart() {
    setGenerating(true)
    setGenPhase('prd')
  }

  // Called by BuilderForm when real generation SUCCEEDS (real project with real files)
  function handleCreate(p: Project) {
    // Animate through phases briefly so the user sees progress, then reveal workspace
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

  // Called by BuilderForm when real generation FAILS
  function handleGeneratingError() {
    setGenPhase('error')
    setTimeout(() => setGenerating(false), 1200)
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Mobile top bar */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-slate-800 bg-slate-950/90 px-4 py-2.5 backdrop-blur md:hidden">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="rounded-md p-1.5 text-slate-400">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
        </button>
        <span className="font-mono text-sm font-bold">React Forge</span>
        <button onClick={() => syncFromBackend()} className="text-[10px] text-slate-500 hover:text-cyan-400">{loading ? '...' : projects.length}</button>
      </div>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed z-30 h-full w-72 transition-transform md:translate-x-0 md:static md:z-0`}>
        <Sidebar projects={projects} onNew={() => { setView('builder'); setSidebarOpen(false) }} onSelect={(p) => { setCurrentProject(p); setView('workspace'); setSidebarOpen(false) }} onHome={() => { setView('welcome'); setCurrentProject(null); setSidebarOpen(false) }} onDelete={deleteProject} currentId={currentProject?.id} />
      </div>
      <main className="relative flex min-w-0 flex-1 flex-col pt-12 md:pt-0">
        <div className="relative min-h-0 flex-1 overflow-hidden">
          {view === 'welcome' && <WelcomeView onNew={() => setView('builder')} projectCount={projects.length} />}
          {view === 'builder' && <BuilderForm onCreate={handleCreate} onCancel={() => setView('welcome')} onGeneratingStart={handleGeneratingStart} onGeneratingError={handleGeneratingError} />}
          {view === 'workspace' && currentProject && <Workspace project={currentProject} onBack={() => setView('welcome')} onUpdateProject={(files, prd) => updateProject(currentProject.id, files, prd)} allProjects={projects} />}
        </div>
      </main>
      {generating && <GenerationOverlay phase={genPhase} projectName={currentProject?.name || 'Nouveau projet'} />}
    </div>
  )
}
