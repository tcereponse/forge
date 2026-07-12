import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

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

/** Hashes a password using scrypt. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/** Verifies a password against a stored hash. */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  const verifyHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return hash === verifyHash;
}

/** Validates password strength: min 8 chars, 1 digit, 1 upper, 1 lower, 1 symbol. */
export function validatePassword(password: string): { ok: boolean; error?: string } {
  if (password.length < 6) return { ok: false, error: "Mot de passe: 6 caractères minimum" };
  if (!/[0-9]/.test(password)) return { ok: false, error: "Mot de passe: 1 chiffre minimum" };
  if (!/[a-z]/.test(password)) return { ok: false, error: "Mot de passe: 1 minuscule minimum" };
  if (!/[A-Z]/.test(password)) return { ok: false, error: "Mot de passe: 1 majuscule minimum" };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return { ok: false, error: "Mot de passe: 1 symbole minimum (!@#$...)" };
  return { ok: true };
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
