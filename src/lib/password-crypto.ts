import crypto from "crypto";

// AES-256-GCM encryption for reversible password storage.
// The key is derived from NEXTAUTH_SECRET so it's unique per deployment.
const ENCRYPTION_KEY = crypto
  .createHash("sha256")
  .update(process.env.NEXTAUTH_SECRET || "react-forge-default-secret")
  .digest();

const ALGORITHM = "aes-256-gcm";

/** Encrypts a password (reversible). Returns "iv:authTag:encrypted". */
export function encryptPassword(password: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(password, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag();
  return `${iv.toString("hex")}:${authTag.toString("hex")}:${encrypted}`;
}

/** Decrypts a password. Returns the plaintext password. */
export function decryptPassword(stored: string): string {
  const [ivHex, authTagHex, encrypted] = stored.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/** Verifies a password against a stored encrypted password. */
export function verifyPassword(password: string, stored: string): boolean {
  try {
    return decryptPassword(stored) === password;
  } catch {
    return false;
  }
}

/** Validates password strength: min 6 chars, 1 digit, 1 upper, 1 lower, 1 symbol. */
export function validatePassword(password: string): { ok: boolean; error?: string } {
  if (password.length < 6) return { ok: false, error: "Mot de passe: 6 caractères minimum" };
  if (!/[0-9]/.test(password)) return { ok: false, error: "Mot de passe: 1 chiffre minimum" };
  if (!/[a-z]/.test(password)) return { ok: false, error: "Mot de passe: 1 minuscule minimum" };
  if (!/[A-Z]/.test(password)) return { ok: false, error: "Mot de passe: 1 majuscule minimum" };
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return { ok: false, error: "Mot de passe: 1 symbole minimum (!@#$...)" };
  return { ok: true };
}
