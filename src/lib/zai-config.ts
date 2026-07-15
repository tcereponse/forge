// Ensures a .z-ai-config file exists for the z-ai-web-dev-sdk.
// On Vercel/serverless, the file is created from environment variables.
// If no credentials are available, the SDK fallback is skipped cleanly.

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
  const apiKey = process.env.ZAI_API_KEY;
  const token = process.env.ZAI_TOKEN;
  const baseUrl = process.env.ZAI_BASE_URL || "https://api.z.ai/v1";
  const chatId = process.env.ZAI_CHAT_ID || "";
  const userId = process.env.ZAI_USER_ID || "";

  // If no auth credentials are provided, the SDK cannot work. Do not write
  // a fake config and do not throw; let the caller report a clear error.
  if (!apiKey && !token) {
    initialized = true;
    throw new Error(
      "Configuration file not found or invalid. Please set ZAI_API_KEY or ZAI_TOKEN, or create .z-ai-config in your project, home directory, or /etc."
    );
  }

  const config = {
    baseUrl,
    apiKey: apiKey || "Z.ai",
    token: token || "",
    chatId,
    userId,
  };

  try {
    await fs.writeFile(configPath, JSON.stringify(config, null, 2), "utf-8");
    initialized = true;
  } catch {
    // If we can't write (read-only filesystem), set the env var directly
    // The SDK checks env vars too in some versions
    process.env.ZAI_BASE_URL = config.baseUrl;
    if (apiKey) process.env.ZAI_API_KEY = apiKey;
    if (token) process.env.ZAI_TOKEN = token;
    initialized = true;
  }
}
