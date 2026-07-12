import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

// Re-export password functions from password-crypto (AES-256 reversible)
export { encryptPassword as hashPassword, decryptPassword, verifyPassword, validatePassword } from "./password-crypto";

const SESSIONS_FILE = path.join(process.cwd(), "db", "sessions.json");

interface Session {
  userId: string;
  username: string;
  createdAt: number;
}

/** Reads sessions from the JSON file. */
async function readSessions(): Promise<Record<string, Session>> {
  try {
    const data = await fs.readFile(SESSIONS_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

/** Writes sessions to the JSON file. */
async function writeSessions(sessions: Record<string, Session>): Promise<void> {
  await fs.writeFile(SESSIONS_FILE, JSON.stringify(sessions, null, 2), "utf-8");
}

/** Creates a new session token and stores it. */
export async function createSession(userId: string, username: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  const sessions = await readSessions();
  sessions[token] = { userId, username, createdAt: Date.now() };
  await writeSessions(sessions);
  return token;
}

/** Gets the session from a token. Returns null if not found or expired. */
export async function getSession(token: string | null | undefined): Promise<Session | null> {
  if (!token) return null;
  const sessions = await readSessions();
  const session = sessions[token];
  if (!session) return null;
  // Session expires after 30 days
  if (Date.now() - session.createdAt > 30 * 24 * 60 * 60 * 1000) {
    delete sessions[token];
    await writeSessions(sessions);
    return null;
  }
  return session;
}

/** Deletes a session (logout). */
export async function deleteSession(token: string | null | undefined): Promise<void> {
  if (!token) return;
  const sessions = await readSessions();
  delete sessions[token];
  await writeSessions(sessions);
}

/** Extracts the session token from a request (cookie or Authorization header). */
export function getTokenFromRequest(request: Request): string | null {
  // Try cookie first
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(/auth-token=([^;]+)/);
  if (match) return match[1];
  // Try Authorization header
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}
