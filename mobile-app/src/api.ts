// API client for React Forge mobile app.
// Resolves the backend URL in this order:
//   1. window.AndroidFileSaver.getBackendUrl() — injected by the APK (baked at build time)
//   2. localStorage 'rf-backend-url' — user-configured URL (manual override)
//   3. window.location.origin — when served from the Next.js server (same origin, relative calls work)
//   4. '' (empty) — relative URLs, works only when same-origin

declare global {
  interface Window {
    AndroidFileSaver?: {
      saveFile: (f: string, d: string) => string
      getForgePath: () => string
      listForgeFiles: () => string
      getBackendUrl?: () => string
    }
    AndroidBridge?: {
      copyToClipboard: (t: string) => boolean
      getClipboard: () => string
    }
  }
}

/** Returns the backend base URL (no trailing slash). Empty string = use relative URLs (same origin). */
export function getApiBase(): string {
  // 1. APK-injected URL
  try {
    const injected = window.AndroidFileSaver?.getBackendUrl?.()
    if (injected && /^https?:\/\//.test(injected)) return injected.replace(/\/+$/, "")
  } catch { /* ignore */ }

  // 2. User-configured URL (manual override, saved in localStorage)
  try {
    const saved = localStorage.getItem("rf-backend-url")
    if (saved && /^https?:\/\//.test(saved)) return saved.replace(/\/+$/, "")
  } catch { /* ignore */ }

  // 3. Same-origin (served from Next.js) — use empty base so URLs are relative
  try {
    if (window.location.origin && /^https?:/.test(window.location.protocol)) return ""
  } catch { /* ignore */ }

  // 4. file:// origin (APK without injected URL) — empty (caller must handle)
  return ""
}

/** Returns true when running inside the Android APK (file:// origin or AndroidFileSaver present). */
export function isNativeAndroid(): boolean {
  return !!window.AndroidFileSaver || (typeof window !== "undefined" && window.location.protocol === "file:")
}

/** Builds a full URL from a relative API path. */
export function apiUrl(path: string): string {
  const base = getApiBase()
  const clean = path.startsWith("/") ? path : "/" + path
  return base ? base + clean : clean
}

/** Fetch wrapper that auto-prefixes the backend base URL. */
export async function apiFetch<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(apiUrl(path), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  })
  const ct = res.headers.get("content-type") || ""
  if (ct.includes("application/json")) {
    return (await res.json()) as T
  }
  const text = await res.text()
  return { success: false, error: text || `HTTP ${res.status}` } as unknown as T
}

/** Lets the user set the backend URL manually (for APK without injected URL). */
export function setBackendUrl(url: string): void {
  const clean = url.trim().replace(/\/+$/, "")
  if (clean) localStorage.setItem("rf-backend-url", clean)
  else localStorage.removeItem("rf-backend-url")
}

export function getStoredBackendUrl(): string {
  return localStorage.getItem("rf-backend-url") || ""
}
