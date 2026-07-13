import crypto from "crypto";
import { db } from "./db";

// Re-export password functions from password-crypto (AES-256 reversible)
export { encryptPassword as hashPassword, decryptPassword, verifyPassword, validatePassword } from "./password-crypto";

/** Creates a new session token and stores it in the database. */
export async function createSession(userId: string, username: string): Promise<string> {
  const token = crypto.randomBytes(32).toString("hex");
  await db.session.create({
    data: { token, userId, username },
  });
  return token;
}

/** Gets the session from a token. Returns null if not found or expired. */
export async function getSession(token: string | null | undefined): Promise<{ userId: string; username: string } | null> {
  if (!token) return null;
  const session = await db.session.findUnique({ where: { token } });
  if (!session) return null;
  // Session expires after 30 days
  if (Date.now() - session.createdAt.getTime() > 30 * 24 * 60 * 60 * 1000) {
    await db.session.delete({ where: { id: session.id } });
    return null;
  }
  return { userId: session.userId, username: session.username };
}

/** Deletes a session (logout). */
export async function deleteSession(token: string | null | undefined): Promise<void> {
  if (!token) return;
  try {
    await db.session.deleteMany({ where: { token } });
  } catch { /* ignore */ }
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
