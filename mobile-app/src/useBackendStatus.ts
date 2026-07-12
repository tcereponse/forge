import { useState, useEffect, useCallback } from 'react'
import { apiFetch, apiUrl, getApiBase, getStoredBackendUrl, setBackendUrl, isNativeAndroid } from './api'

export type BackendState = 'checking' | 'online' | 'offline'

export interface BackendStatus {
  state: BackendState
  error?: string
  lastCheck?: number
}

/** Tests connectivity to the backend by calling /api/projects. */
export async function testBackend(url?: string): Promise<{ ok: boolean; error?: string }> {
  const testUrl = url ? url.replace(/\/+$/, '') + '/api/projects' : apiUrl('/api/projects')
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 8000)
    const res = await fetch(testUrl, {
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
    })
    clearTimeout(timeout)
    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status} ${res.statusText}` }
    }
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) {
      return { ok: false, error: 'Reponse non-JSON (mauvaise URL?)' }
    }
    const data = await res.json()
    if (data.success === false) {
      return { ok: false, error: data.error || 'Reponse inattendue' }
    }
    return { ok: true }
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return { ok: false, error: 'Timeout (8s) — serveur injoignable' }
    }
    if (e instanceof TypeError && /fetch/i.test(e.message)) {
      return { ok: false, error: 'Connexion impossible — URL incorrecte ou serveur eteint' }
    }
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur inconnue' }
  }
}

export function useBackendStatus(autoCheck = true): BackendStatus & { recheck: () => Promise<void> } {
  const [status, setStatus] = useState<BackendStatus>({ state: 'checking' })

  const recheck = useCallback(async () => {
    setStatus({ state: 'checking' })
    const result = await testBackend()
    setStatus({
      state: result.ok ? 'online' : 'offline',
      error: result.error,
      lastCheck: Date.now(),
    })
  }, [])

  useEffect(() => {
    if (autoCheck) recheck()
  }, [autoCheck, recheck])

  return { ...status, recheck }
}
