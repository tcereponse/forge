import { useState, useEffect, useCallback } from 'react'
import { apiFetch, getApiBase, isNativeAndroid } from './api'

export interface ProjectFile { path: string; content: string; language: string }
export interface ArsenalDoc { id: string; name: string; filename: string; role: string; content: string }
export interface Project {
  id: string; name: string; description: string; slug?: string;
  stack: string; typescript: boolean; styling: string; routing: string; stateMgmt: string; uiLib: string;
  features: string[]; files: ProjectFile[]; prd: string; arsenal: ArsenalDoc[] | null;
  status: 'draft' | 'generating' | 'ready' | 'failed'; createdAt: string | number;
}

const KEY = 'rf-mobile-projects'

function loadLocal(): Project[] {
  try { const r = localStorage.getItem(KEY); return r ? JSON.parse(r) : [] } catch { return [] }
}
function saveLocal(p: Project[]) {
  try { localStorage.setItem(KEY, JSON.stringify(p)) } catch {}
}

/** Normalise a project record coming from the backend API into our mobile Project shape. */
function normalize(raw: any): Project {
  return {
    id: String(raw.id),
    name: String(raw.name || ''),
    description: String(raw.description || ''),
    slug: raw.slug,
    stack: String(raw.stack || 'vite'),
    typescript: raw.typescript ?? true,
    styling: String(raw.styling || 'tailwind'),
    routing: String(raw.routing || 'router'),
    stateMgmt: String(raw.stateMgmt || 'none'),
    uiLib: String(raw.uiLib || 'none'),
    features: Array.isArray(raw.features) ? raw.features : [],
    files: Array.isArray(raw.files) ? raw.files : [],
    prd: String(raw.prd || ''),
    arsenal: raw.arsenal && Array.isArray(raw.arsenal.documents) ? raw.arsenal.documents : (Array.isArray(raw.arsenal) ? raw.arsenal : null),
    status: raw.status || 'draft',
    createdAt: raw.createdAt || Date.now(),
  }
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>(loadLocal)
  const [loading, setLoading] = useState(false)
  const [synced, setSynced] = useState(false)

  // Sync from backend on mount (when backend is reachable)
  const syncFromBackend = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ success: boolean; projects: any[] }>('/api/projects')
      if (data.success && Array.isArray(data.projects)) {
        // For the list view we only have summaries (no files). Fetch full details for each.
        const full: Project[] = []
        for (const p of data.projects) {
          try {
            const detail = await apiFetch<{ success: boolean; project: any }>(`/api/projects/${p.id}`)
            if (detail.success && detail.project) full.push(normalize(detail.project))
          } catch { /* skip */ }
        }
        if (full.length > 0) {
          setProjects(full)
          saveLocal(full)
        }
      }
    } catch { /* offline — keep local cache */ }
    finally { setLoading(false); setSynced(true) }
  }, [])

  useEffect(() => { syncFromBackend() }, [syncFromBackend])

  const addProject = useCallback((p: Project) => {
    setProjects(prev => {
      const idx = prev.findIndex(x => x.id === p.id)
      const next = idx >= 0 ? [...prev.slice(0, idx), p, ...prev.slice(idx + 1)] : [p, ...prev]
      saveLocal(next)
      return next
    })
  }, [])

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setProjects(prev => {
      const idx = prev.findIndex(x => x.id === id)
      if (idx < 0) return prev
      const updated = { ...prev[idx], ...patch }
      const next = [...prev.slice(0, idx), updated, ...prev.slice(idx + 1)]
      saveLocal(next)
      return next
    })
  }, [])

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => {
      const next = prev.filter(p => p.id !== id)
      saveLocal(next)
      return next
    })
  }, [])

  return { projects, addProject, updateProject, deleteProject, syncFromBackend, loading, synced }
}
