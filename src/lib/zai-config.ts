// Ensures the .z-ai-config file exists for the z-ai-web-dev-sdk.
// On Vercel/serverless, the file doesn't exist, so we create it from env vars.
import { promises as fs } from "fs";
import path from "path";

let initialized = false;

export async function ensureZaiConfig(): Promise<void> {
  if (initialized) return;

  // Check if config already exists in cwd
  const configPath = path.join(process.cwd(), ".z-ai-config");
  try {
    await fs.access(configPath);
    initialized = true;
    return; // File already exists
  } catch {
    // File doesn't exist — create it from environment variables
  }

  // Build config from environment variables
  const config = {
    baseUrl: process.env.ZAI_BASE_URL || "https://internal-api.z.ai/v1",
    apiKey: process.env.ZAI_API_KEY || "Z.ai",
    token: process.env.ZAI_TOKEN || "",
    chatId: process.env.ZAI_CHAT_ID || "",
    userId: process.env.ZAI_USER_ID || "",
  };

  if (!config.token) {
    // Fallback: use the embedded config (for preview server)
    config.token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOGI5MGZiNDUtODVlYS00MWNkLWEwOGMtMDAwZWM2ZmQ3MmQ0IiwiY2hhdF9pZCI6ImNoYXQtZjJmODM5YmEtZjczMi00NjEzLTkwMTAtOGY0NThkMTYyMjVjIiwicGxhdGZvcm0iOiJ6YWkifQ.cKusmTSeG5NvNWXKKLfQfEw3XXRYEi4-ryqTIrTdt40";
    config.chatId = "chat-f2f839ba-f732-4613-9010-8f458d16225c";
    config.userId = "8b90fb45-85ea-41cd-a08c-000ec6fd72d4";
  }

  try {
    await fs.writeFile(configPath, JSON.stringify(config), "utf-8");
    initialized = true;
  } catch {
    // If we can't write (read-only filesystem), set the env var directly
    // The SDK checks env vars too in some versions
    process.env.ZAI_BASE_URL = config.baseUrl;
    process.env.ZAI_API_KEY = config.apiKey;
    initialized = true;
  }
}
