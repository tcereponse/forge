// Direct GLM-4.6 / Z.ai API client — no hardcoded credentials.
// Uses fetch() directly with multi-endpoint fallback + retry logic.
//
// Strategy (in order):
// 1. If ZAI_API_KEY env var is set → public API (api.z.ai) or custom ZAI_BASE_URL with Bearer auth
// 2. Internal API (internal-api.z.ai) with X-Token — only if ZAI_TOKEN is provided
// 3. GenSpark OpenAI Proxy — if OPENAI_API_KEY is set
// 4. Fallback: z-ai-web-dev-sdk (requires .z-ai-config created from env vars)
//
// All endpoints have retry with exponential backoff (3 attempts).
// On Vercel serverless, the internal API may be blocked — fallback handles it.

import { ensureZaiConfig } from "./zai-config";

const DEFAULT_PUBLIC_ENDPOINT = "https://api.z.ai/api/paas/v4/chat/completions";
const DEFAULT_INTERNAL_ENDPOINT = "https://internal-api.z.ai/v1/chat/completions";
const DEFAULT_OPENAI_BASE_URL = "https://www.genspark.ai/api/llm_proxy/v1";
const DEFAULT_MODEL = "glm-4.6";
const DEFAULT_OPENAI_MODEL = "gpt-5";

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

function getEnv(name: string): string | undefined {
  try {
    return process.env[name];
  } catch {
    return undefined;
  }
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
async function callInternalAPI(
  token: string,
  endpoint: string,
  messages: ChatMessage[]
): Promise<ChatCompletionResult> {
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Z-AI-From": "Z",
            "X-Token": token,
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
  endpoint: string,
  model: string,
  messages: ChatMessage[]
): Promise<ChatCompletionResult> {
  let lastError = "";
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
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

/** Strategy 3: GenSpark OpenAI Proxy — uses OPENAI_API_KEY + OPENAI_BASE_URL */
async function callOpenAI(messages: ChatMessage[]): Promise<ChatCompletionResult> {
  const apiKey = getEnv("OPENAI_API_KEY");
  if (!apiKey) {
    return { content: "", error: "OPENAI_API_KEY not set" };
  }
  const endpoint = (getEnv("OPENAI_BASE_URL") || DEFAULT_OPENAI_BASE_URL) + "/chat/completions";
  const model = getEnv("OPENAI_MODEL") || DEFAULT_OPENAI_MODEL;

  let lastError = "";
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetchWithTimeout(
        endpoint,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages,
          }),
        },
        INITIAL_TIMEOUT_MS * 2 // 60s for LLM response
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
        lastError = "Empty response from OpenAI proxy";
        if (attempt < MAX_RETRIES) {
          await sleep(1000 * attempt);
          continue;
        }
        return { content: "", error: lastError };
      }
      return { content };
    } catch (e) {
      lastError = e instanceof Error ? e.message : "Network error";
      if (attempt < MAX_RETRIES) {
        await sleep(1000 * attempt * 2);
        continue;
      }
    }
  }
  return { content: "", error: lastError };
}

/** Fallback: use z-ai-web-dev-sdk (creates .z-ai-config from environment) */
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
 * Calls the configured LLM with automatic endpoint fallback.
 *
 * Required environment variables (choose one):
 * - ZAI_API_KEY → uses Bearer auth on ZAI_BASE_URL or api.z.ai
 * - ZAI_TOKEN → uses X-Token auth on internal-api.z.ai
 * - OPENAI_API_KEY → uses GenSpark OpenAI proxy
 * - Or rely on z-ai-web-dev-sdk with .z-ai-config / env vars
 *
 * Optional: ZAI_BASE_URL, ZAI_MODEL, OPENAI_BASE_URL, OPENAI_MODEL
 */
export async function glmChat(messages: ChatMessage[]): Promise<ChatCompletionResult> {
  const apiKey = getEnv("ZAI_API_KEY");
  const token = getEnv("ZAI_TOKEN");
  const baseUrl = getEnv("ZAI_BASE_URL");
  const model = getEnv("ZAI_MODEL") || DEFAULT_MODEL;
  const errors: string[] = [];

  // Strategy 1: Public/custom API (if key available)
  if (apiKey) {
    const endpoint = baseUrl || DEFAULT_PUBLIC_ENDPOINT;
    const result = await callPublicAPI(apiKey, endpoint, model, messages);
    if (result.content) return result;
    if (result.error) errors.push(`GLM public: ${result.error}`);
  }

  // Strategy 2: Internal API (only if token provided)
  if (token) {
    const endpoint = baseUrl || DEFAULT_INTERNAL_ENDPOINT;
    const internalResult = await callInternalAPI(token, endpoint, messages);
    if (internalResult.content) return internalResult;
    if (internalResult.error) errors.push(`GLM internal: ${internalResult.error}`);
  }

  // Strategy 3: GenSpark OpenAI Proxy (uses OPENAI_API_KEY)
  const openaiResult = await callOpenAI(messages);
  if (openaiResult.content) {
    console.log("[glmChat] ✓ Fallback OpenAI/GenSpark OK");
    return openaiResult;
  }
  if (openaiResult.error) errors.push(`openai: ${openaiResult.error}`);

  // Strategy 4: SDK fallback (z-ai-web-dev-sdk)
  const sdkResult = await callSDKFallback(messages);
  if (sdkResult.content) return sdkResult;
  if (sdkResult.error) errors.push(`sdk: ${sdkResult.error}`);

  // All strategies failed
  if (errors.length === 0) {
    return {
      content: "",
      error:
        "Aucune configuration LLM trouvee. Definissez ZAI_API_KEY, ZAI_TOKEN, OPENAI_API_KEY ou installez z-ai-web-dev-sdk avec .z-ai-config.",
    };
  }

  return {
    content: "",
    error: `All LLM endpoints failed — ${errors.join(" | ")}`,
  };
}
