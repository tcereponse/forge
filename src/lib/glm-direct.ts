// Direct GLM-4.6 API client — bypasses z-ai-web-dev-sdk (which needs .z-ai-config file).
// Uses fetch() directly, which works on Vercel, serverless, and local.

const GLM_ENDPOINT = "https://internal-api.z.ai/v1/chat/completions";
const GLM_TOKEN = process.env.ZAI_TOKEN || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOGI5MGZiNDUtODVlYS00MWNkLWEwOGMtMDAwZWM2ZmQ3MmQ0IiwiY2hhdF9pZCI6ImNoYXQtZjJmODM5YmEtZjczMi00NjEzLTkwMTAtOGY0NThkMTYyMjVjIiwicGxhdGZvcm0iOiJ6YWkifQ.cKusmTSeG5NvNWXKKLfQfEw3XXRYEi4-ryqTIrTdt40";

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
  try {
    const res = await fetch(GLM_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Z-AI-From": "Z",
        "X-Token": GLM_TOKEN,
      },
      body: JSON.stringify({
        messages,
        thinking: { type: "disabled" },
      }),
    });

    if (!res.ok) {
      return { content: "", error: `HTTP ${res.status}: ${await res.text().catch(() => "error")}` };
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
