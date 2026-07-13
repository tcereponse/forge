// Direct GLM-4.6 API client — bypasses z-ai-web-dev-sdk (which needs .z-ai-config file).
// Uses fetch() directly, which works on Vercel, serverless, and local.
//
// Strategy:
// - If ZAI_API_KEY env var is set → use public API (api.z.ai) with Bearer auth
// - Otherwise → use internal API (internal-api.z.ai) with X-Token (works on preview server only)

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

/** Calls GLM-4.6 directly via fetch — no SDK, no config file needed. */
export async function glmChat(messages: ChatMessage[]): Promise<ChatCompletionResult> {
  const apiKey = process.env.ZAI_API_KEY;

  try {
    let res: Response;

    if (apiKey) {
      // Public API (Vercel/production) — requires real API key
      res = await fetch(PUBLIC_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "glm-4.6",
          messages,
          thinking: { type: "disabled" },
        }),
      });
    } else {
      // Internal API (preview server) — uses JWT token
      res = await fetch(INTERNAL_ENDPOINT, {
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
      });
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => "error");
      return { content: "", error: `HTTP ${res.status}: ${errText.slice(0, 200)}` };
    }

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content || "";
    if (!content) {
      return { content: "", error: "Reponse vide de GLM-4.6" };
    }
    return { content };
  } catch (e) {
    return { content: "", error: e instanceof Error ? e.message : "Erreur GLM" };
  }
}
