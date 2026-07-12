/**
 * Fetch wrapper with exponential backoff retry.
 * Retries on network errors and 5xx responses (transient failures).
 * Does NOT retry on 4xx (client errors are not transient).
 *
 * @param url - relative URL (e.g. "/api/projects")
 * @param init - fetch init
 * @param retries - max retry attempts (default 2 → up to 3 total tries)
 * @param baseDelay - initial backoff in ms (default 500, doubles each retry)
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  retries = 2,
  baseDelay = 500,
): Promise<Response> {
  let lastError: unknown = null;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { credentials: "include", ...init });
      // Retry only on 5xx (server errors are often transient: cold start,
      // gateway timeout, etc.). 4xx are client errors — don't retry.
      if (res.status >= 500 && attempt < retries) {
        await sleep(baseDelay * Math.pow(2, attempt));
        continue;
      }
      return res;
    } catch (err) {
      // Network error (server down, DNS, CORS) — retry
      lastError = err;
      if (attempt < retries) {
        await sleep(baseDelay * Math.pow(2, attempt));
        continue;
      }
    }
  }
  // All retries exhausted — rethrow the last network error, or throw a
  // generic error so callers' catch blocks handle it.
  throw lastError ?? new Error("fetchWithRetry: exhausted retries");
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
