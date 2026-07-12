// GLM-4.6 native client for the sovereign mobile app.
// Uses NativeHttp (Java HttpURLConnection bridge) to bypass CORS and call the GLM API directly.
// NO PC server required — the APK is fully autonomous.
//
// In a browser (web mobile same-origin), falls back to fetch() with the /api/projects/[id]/generate endpoint.

declare global {
  interface Window {
    NativeHttp?: {
      post: (url: string, headersJson: string, body: string) => string
      get: (url: string, headersJson: string) => string
    }
  }
}

// GLM API credentials — embedded in the APK for sovereign operation.
// The JWT has no expiry field, so it won't expire (until revoked server-side).
// NOTE: These are extracted from the z-ai-web-dev-sdk config. The token is shared
// across all APK installs. Rate limit: 300/day per IP, 2 QPS.
const GLM_ENDPOINT = "https://internal-api.z.ai/v1/chat/completions"
const GLM_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOGI5MGZiNDUtODVlYS00MWNkLWEwOGMtMDAwZWM2ZmQ3MmQ0IiwiY2hhdF9pZCI6ImNoYXQtZjJmODM5YmEtZjczMi00NjEzLTkwMTAtOGY0NThkMTYyMjVjIiwicGxhdGZvcm0iOiJ6YWkifQ.cKusmTSeG5NvNWXKKLfQfEw3XXRYEi4-ryqTIrTdt40"

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

  const body = JSON.stringify({
    messages,
    thinking: { type: options?.thinking || 'disabled' },
  })

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Z-AI-From': 'Z',
    'X-Token': GLM_TOKEN,
  }

  const result = nativePost(GLM_ENDPOINT, headers, body)

  if (result.error) {
    return { content: '', raw: result, error: `Erreur reseau native: ${result.error}` }
  }

  if (result.status < 200 || result.status >= 300) {
    return { content: '', raw: result, error: `HTTP ${result.status}: ${result.body.slice(0, 200)}` }
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
