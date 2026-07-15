// GLM-4.6 native client for the sovereign mobile app.
// Uses NativeHttp (Java HttpURLConnection bridge) to bypass CORS and call the GLM API directly.
// NO PC server required — the APK is fully autonomous.
//
// In a browser (web mobile same-origin), falls back to fetch() with the /api/projects/[id]/generate endpoint.
//
// IMPORTANT: The GLM token/API key is NOT hardcoded. It must be injected at build time
// via environment variables (VITE_ZAI_API_KEY or VITE_ZAI_TOKEN) or configured at runtime
// through the app settings.

declare global {
  interface Window {
    NativeHttp?: {
      post: (url: string, headersJson: string, body: string) => string
      get: (url: string, headersJson: string) => string
    }
  }
}

// Build-time or runtime configuration. For the sovereign APK, these are injected
// by the build script (build-mobile-apk.sh) from the host environment.
const GLM_ENDPOINT = import.meta.env.VITE_ZAI_BASE_URL || "https://internal-api.z.ai/v1/chat/completions"
const GLM_API_KEY = import.meta.env.VITE_ZAI_API_KEY || ""
const GLM_TOKEN = import.meta.env.VITE_ZAI_TOKEN || ""

/** Returns true if the NativeHttp bridge is available (i.e., running inside the APK). */
export function hasNativeHttp(): boolean {
  return typeof window !== 'undefined' && !!window.NativeHttp?.post
}

/** Native HTTP POST via Java HttpURLConnection — bypasses CORS entirely. */
export function nativePost(url: string, headers: Record<string, string>, body: string): { status: number; body: string; error?: string } {
  if (!hasNativeHttp()) {
    return { status: 0, body: '', error: 'NativeHttp bridge not available (not running in APK)' }
  }
  try {
    const result = window.NativeHttp!.post(url, JSON.stringify(headers), body)
    const parsed = JSON.parse(result)
    return { status: parsed.status || 0, body: parsed.body || '', error: parsed.error }
  } catch (e) {
    return { status: 0, body: '', error: e instanceof Error ? e.message : String(e) }
  }
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ChatCompletionResponse {
  content: string
  raw: unknown
  error?: string
}

/**
 * Calls the GLM-4.6 chat completions API directly from the mobile device.
 * Uses NativeHttp (native HttpURLConnection) to bypass CORS.
 * Returns the assistant's message content.
 */
export function glmChat(messages: ChatMessage[], options?: { thinking?: 'enabled' | 'disabled' }): ChatCompletionResponse {
  if (!hasNativeHttp()) {
    return { content: '', raw: null, error: 'NativeHttp bridge requis (APK uniquement). En navigateur web, utilise le serveur.' }
  }

  if (!GLM_API_KEY && !GLM_TOKEN) {
    return {
      content: '',
      raw: null,
      error: 'Aucune clé API GLM configuree. Veuillez configurer VITE_ZAI_API_KEY ou VITE_ZAI_TOKEN avant de compiler l APK.',
    }
  }

  const body = JSON.stringify({
    messages,
    thinking: { type: options?.thinking || 'disabled' },
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Z-AI-From': 'Z',
  }

  if (GLM_API_KEY) {
    headers['Authorization'] = `Bearer ${GLM_API_KEY}`
  } else if (GLM_TOKEN) {
    headers['X-Token'] = GLM_TOKEN
  }

  const result = nativePost(GLM_ENDPOINT, headers, body)

  if (result.error) {
    return { content: '', raw: result, error: `Erreur reseau native: ${result.error}` }
  }

  if (result.status < 200 || result.status >= 300) {
    return { content: '', raw: result, error: `HTTP ${result.status}` }
  }

  // Detect HTML responses (DNS redirect/proxy — common on mobile carriers)
  const bodyStr = result.body || ''
  if (bodyStr.trimStart().startsWith('<!doctype') || bodyStr.trimStart().startsWith('<html')) {
    return {
      content: '',
      raw: result,
      error: 'network_redirect: L API GLM a ete redirigee vers une page HTML (probablement DeepSeek). Votre reseau operateur bloque l acces a l API. Configurez l URL du serveur (bouton Configurer) pour utiliser le serveur comme relais.'
    }
  }

  try {
    const data = JSON.parse(result.body)
    const content = data?.choices?.[0]?.message?.content || ''
    if (!content) {
      return { content: '', raw: data, error: 'Reponse vide de GLM-4.6' }
    }
    return { content, raw: data }
  } catch (e) {
    return { content: '', raw: result.body, error: `JSON invalide: ${e instanceof Error ? e.message : String(e)}` }
  }
}

/** Async wrapper that runs glmChat in a microtask (lets the UI breathe). */
export function glmChatAsync(messages: ChatMessage[], options?: { thinking?: 'enabled' | 'disabled' }): Promise<ChatCompletionResponse> {
  return new Promise((resolve) => {
    // NativeHttp.post is synchronous (blocks the WebView thread), so we run it in a setTimeout
    // to let the UI update first (show loading state).
    setTimeout(() => {
      try {
        resolve(glmChat(messages, options))
      } catch (e) {
        resolve({ content: '', raw: null, error: e instanceof Error ? e.message : String(e) })
      }
    }, 50)
  })
}

/** Extracts JSON from a text that may contain markdown fences or extra text. */
export function extractJson(text: string): unknown | null {
  let cleaned = text.trim()
  // Strip markdown code fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim()
  }
  // Try direct parse
  try { return JSON.parse(cleaned) } catch { /* continue */ }
  // Try first { to last }
  const first = cleaned.indexOf('{')
  const last = cleaned.lastIndexOf('}')
  if (first !== -1 && last !== -1 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)) } catch { /* continue */ }
  }
  // Try first [ to last ] (for arrays)
  const firstArr = cleaned.indexOf('[')
  const lastArr = cleaned.lastIndexOf(']')
  if (firstArr !== -1 && lastArr !== -1 && lastArr > firstArr) {
    try { return JSON.parse(cleaned.slice(firstArr, lastArr + 1)) } catch { /* continue */ }
  }
  return null
}

/** Unescape JSON string values (handles \\n, \\", \\\\, etc.) */
export function unescapeJsonString(s: string): string {
  return s
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\')
    .replace(/\\r/g, '\r')
}

/** Infer language from file path extension. */
export function inferLanguage(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    ts: 'typescript', tsx: 'typescript', js: 'javascript', jsx: 'javascript',
    json: 'json', css: 'css', html: 'html', md: 'markdown',
    py: 'python', go: 'go', rs: 'rust', java: 'java',
    yml: 'yaml', yaml: 'yaml', sh: 'bash',
  }
  return map[ext] || 'text'
}
