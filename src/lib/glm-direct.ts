// Direct GLM-4.6 API client — bypasses z-ai-web-dev-sdk config file issues.
// Uses fetch() directly with multi-endpoint fallback + retry logic.
//
// Strategy (in order):
// 1. If ZAI_API_KEY env var is set → public API (api.z.ai) with Bearer auth
// 2. Internal API (internal-api.z.ai) with X-Token — works on preview server
// 3. Fallback: z-ai-web-dev-sdk (creates .z-ai-config from embedded token)
//
// All endpoints have retry with exponential backoff (3 attempts).
// On Vercel serverless, the internal API may be blocked — fallback handles it.

import { ensureZaiConfig } from "./zai-config";

const INTERNAL_ENDPOINT = "https://internal-api.z.ai/v1/chat/completions";
const PUBLIC_ENDPOINT = "https://api.z.ai/api/paas/v4/chat/completions";
const INTERNAL_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOGI5MGZiNDUtODVlYS00MWNkLWEwOGMtMDAwZWM2ZmQ3MmQ0IiwiY2hhdF9pZCI6ImNoYXQtZjJmODM5YmEtZjczMi00NjEzLTkwMTAtOGY0NThkMTYyMjVjIiwicGxhdGZvcm0iOiJ6YWkifQ.cKusmTSeG5NvNWXKKLfQfEw3XXRYEi4-ryqTIrTdt40";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionResult {
  content: string;
  error?: string;
}

const MAX_RETRIES = 3;
const INITIAL_TIMEOUT_MS = 30000; // 30s per attempt

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Fetch with timeout using AbortController */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Call internal API (preview server) with X-Token JWT */
async function callInternalAPI(messages: ChatMessage[]): Promise<ChatCompletionResult> {
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(
        INTERNAL_ENDPOINT,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Z-AI-From": "Z",
            "X-Token": INTERNAL_TOKEN,
          },
          body: JSON.stringify({
            messages,
            thinking: { type: "disabled" },
          }),
        },
        INITIAL_TIMEOUT_MS
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "error");
        lastError = `HTTP ${res.status}: ${errText.slice(0, 200)}`;
        // Don't retry on 4xx (client errors) except 429
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          return { content: "", error: lastError };
        }
        // Retry on 429 and 5xx
        if (attempt < MAX_RETRIES) {
          await sleep(1000 * attempt);
          continue;
        }
        return { content: "", error: lastError };
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "";
      if (!content) {
        lastError = "Reponse vide de GLM-4.6 (internal)";
        if (attempt < MAX_RETRIES) {
          await sleep(1000 * attempt);
          continue;
        }
        return { content: "", error: lastError };
      }
      return { content };
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Erreur reseau internal API";
      // Network errors: retry with backoff
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * attempt * 2);
        continue;
      }
    }
  }
  return { content: "", error: lastError };
}

/** Call public API (Vercel/production) with Bearer API key */
async function callPublicAPI(
  apiKey: string,
  messages: ChatMessage[]
): Promise<ChatCompletionResult> {
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(
        PUBLIC_ENDPOINT,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "glm-4.6",
            messages,
            thinking: { type: "disabled" },
          }),
        },
        INITIAL_TIMEOUT_MS
      );

      if (!res.ok) {
        const errText = await res.text().catch(() => "error");
        lastError = `HTTP ${res.status}: ${errText.slice(0, 200)}`;
        if (res.status >= 400 && res.status < 500 && res.status !== 429) {
          return { content: "", error: lastError };
        }
        if (attempt < MAX_RETRIES) {
          await sleep(1000 * attempt);
          continue;
        }
        return { content: "", error: lastError };
      }

      const data = await res.json();
      const content = data?.choices?.[0]?.message?.content || "";
      if (!content) {
        lastError = "Reponse vide de GLM-4.6 (public)";
        if (attempt < MAX_RETRIES) {
          await sleep(1000 * attempt);
          continue;
        }
        return { content: "", error: lastError };
      }
      return { content };
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Erreur reseau public API";
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * attempt * 2);
        continue;
      }
    }
  }
  return { content: "", error: lastError };
}

/** Fallback: use z-ai-web-dev-sdk (creates .z-ai-config from embedded token) */
async function callSDKFallback(messages: ChatMessage[]): Promise<ChatCompletionResult> {
  try {
    await ensureZaiConfig();
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const zai = await ZAI.create();

    // Convert messages to SDK format (SDK accepts system/user/assistant)
    const sdkMessages = messages.map((m) => ({
      role: m.role as "system" | "user" | "assistant",
      content: m.content,
    }));

    const completion = await zai.chat.completions.create({
      messages: sdkMessages,
      thinking: { type: "disabled" as const },
    });

    const content = completion?.choices?.[0]?.message?.content || "";
    if (!content) {
      return { content: "", error: "Reponse vide du SDK ZAI" };
    }
    return { content };
  } catch (e) {
    return {
      content: "",
      error: `SDK fallback failed: ${e instanceof Error ? e.message : "unknown"}`,
    };
  }
}

/**
 * Calls GLM-4.6 with automatic endpoint fallback:
 * 1. Public API (if ZAI_API_KEY set) — works on Vercel
 * 2. Internal API (preview server) — works locally
 * 3. SDK fallback (z-ai-web-dev-sdk) — creates config from embedded token
 *
 * Returns the first successful response, or the last error if all fail.
 */
export async function glmChat(messages: ChatMessage[]): Promise<ChatCompletionResult> {
  const apiKey = process.env.ZAI_API_KEY;
  const errors: string[] = [];

  // Strategy 1: Public API (if key available)
  if (apiKey) {
    const result = await callPublicAPI(apiKey, messages);
    if (result.content) return result;
    if (result.error) errors.push(`public: ${result.error}`);
  }

  // Strategy 2: Internal API (works on preview server / local)
  const internalResult = await callInternalAPI(messages);
  if (internalResult.content) return internalResult;
  if (internalResult.error) errors.push(`internal: ${internalResult.error}`);

  // Strategy 3: SDK fallback (z-ai-web-dev-sdk)
  const sdkResult = await callSDKFallback(messages);
  if (sdkResult.content) return sdkResult;
  if (sdkResult.error) errors.push(`sdk: ${sdkResult.error}`);

  // All strategies failed
  return {
    content: "",
    error: `All GLM endpoints failed — ${errors.join(" | ")}`,
  };
}
