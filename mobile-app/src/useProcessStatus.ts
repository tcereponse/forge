import { useState, useEffect, useCallback, useRef } from 'react'
import { apiUrl, apiFetch } from './api'

export interface ProcessStatus {
  install: 'pending' | 'installing' | 'installed' | 'failed'
  build: 'pending' | 'building' | 'built' | 'failed'
  installLog: string
  buildLog: string
}

const POLL_INTERVAL = 2000

export function useProcessStatus(projectId: string | null, enabled: boolean) {
  const [status, setStatus] = useState<ProcessStatus | null>(null)
  const [polling, setPolling] = useState(false)
  const statusRef = useRef<ProcessStatus | null>(null)
  const errorCount = useRef(0)

  useEffect(() => { statusRef.current = status }, [status])

  const refresh = useCallback(async () => {
    if (!projectId) return
    try {
      const data = await apiFetch<{ success: boolean; install: any; build: any }>(`/api/projects/${projectId}/status`)
      if (data.success) {
        const newStatus: ProcessStatus = {
          install: data.install.status,
          build: data.build.status,
          installLog: data.install.log || '',
          buildLog: data.build.log || '',
        }
        setStatus(newStatus)
        statusRef.current = newStatus
        errorCount.current = 0
      }
    } catch { errorCount.current++ }
  }, [projectId])

  // Initial fetch + start polling
  useEffect(() => {
    if (!projectId || !enabled) return
    errorCount.current = 0
    refresh()
    setPolling(true)
  }, [projectId, enabled, refresh])

  // Polling loop
  useEffect(() => {
    if (!projectId || !enabled || !polling) return
    const interval = setInterval(async () => {
      if (errorCount.current >= 5) { setPolling(false); clearInterval(interval); return }
      const s = statusRef.current
      const active = s?.install === 'installing' || s?.build === 'building'
      if (!active) { setPolling(false); clearInterval(interval); return }
      await refresh()
    }, POLL_INTERVAL)
    return () => clearInterval(interval)
  }, [projectId, enabled, polling, refresh])

  const triggerInstall = useCallback(async () => {
    if (!projectId) return
    try {
      // Optimistic update
      const optimistic: ProcessStatus = {
        ...(statusRef.current ?? { install: 'pending', build: 'pending', installLog: '', buildLog: '' }),
        install: 'installing',
        installLog: '$ npm install --legacy-peer-deps\n',
      }
      setStatus(optimistic)
      statusRef.current = optimistic
      setPolling(true)
      await fetch(apiUrl(`/api/projects/${projectId}/install`), { method: 'POST' }).catch(() => {})
      setTimeout(() => refresh(), 500)
      setTimeout(() => refresh(), 2000)
    } catch { errorCount.current++ }
  }, [projectId, refresh])

  const triggerBuild = useCallback(async () => {
    if (!projectId) return
    try {
      const optimistic: ProcessStatus = {
        ...(statusRef.current ?? { install: 'pending', build: 'pending', installLog: '', buildLog: '' }),
        build: 'building',
        buildLog: '$ npm run build\n',
      }
      setStatus(optimistic)
      statusRef.current = optimistic
      setPolling(true)
      await fetch(apiUrl(`/api/projects/${projectId}/build`), { method: 'POST' }).catch(() => {})
      setTimeout(() => refresh(), 500)
      setTimeout(() => refresh(), 3000)
    } catch { errorCount.current++ }
  }, [projectId, refresh])

  return { status, triggerInstall, triggerBuild, refresh, polling, setPolling }
}
