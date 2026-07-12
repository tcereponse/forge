"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Hammer, Loader2, LogIn, UserPlus, AlertCircle, Lock, Mail, KeyRound, Trash2, X } from "lucide-react";

interface AuthUser {
  id: string;
  username: string;
  email?: string;
}

type Screen = "login" | "register" | "forgot" | "reset" | "delete";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [resetToken, setResetToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for reset token in URL
    const params = new URLSearchParams(window.location.search);
    const reset = params.get("reset");
    if (reset) setResetToken(reset);

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user) setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        initialScreen={resetToken ? "reset" : "login"}
        resetToken={resetToken}
        onSuccess={setUser}
      />
    );
  }

  return <>{children}</>;
}

function LoginScreen({
  initialScreen,
  resetToken,
  onSuccess,
}: {
  initialScreen: Screen;
  resetToken: string | null;
  onSuccess: (user: AuthUser) => void;
}) {
  const [screen, setScreen] = useState<Screen>(initialScreen);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resetUrl, setResetUrl] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);
    try {
      if (screen === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!data.success) { setError(data.error); return; }
        onSuccess(data.user);
      } else if (screen === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
        });
        const data = await res.json();
        if (!data.success) { setError(data.error); return; }
        onSuccess(data.user);
      } else if (screen === "forgot") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!data.success) { setError(data.error); return; }
        setInfo("Si cet email existe, un lien de réinitialisation a été généré.");
        if (data.resetUrl) setResetUrl(data.resetUrl);
      } else if (screen === "reset") {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: resetToken, password: newPassword }),
        });
        const data = await res.json();
        if (!data.success) { setError(data.error); return; }
        setInfo("Mot de passe réinitialisé ! Tu peux te connecter.");
        setScreen("login");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteAccount() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      const data = await res.json();
      if (!data.success) { setError(data.error); return; }
      window.location.reload();
    } catch {
      setError("Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950 p-4">
      <div className="pointer-events-none absolute h-64 w-96 rounded-full bg-cyan-500/10 blur-[100px]" />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
            <Hammer className="h-8 w-8 text-cyan-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-50">React Forge</h1>
          <p className="mt-1 text-xs text-slate-500">
            {screen === "login" && "Connecte-toi pour accéder à tes projets"}
            {screen === "register" && "Crée ton compte pour commencer"}
            {screen === "forgot" && "Récupère ton mot de passe"}
            {screen === "reset" && "Définis un nouveau mot de passe"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl">
          {/* Toggle login/register */}
          {(screen === "login" || screen === "register") && (
            <div className="mb-4 flex gap-1 rounded-lg border border-slate-800 bg-slate-950/40 p-1">
              <button onClick={() => { setScreen("login"); setError(""); }} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition ${screen === "login" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500"}`}>
                <LogIn className="h-3.5 w-3.5" /> Connexion
              </button>
              <button onClick={() => { setScreen("register"); setError(""); }} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition ${screen === "register" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500"}`}>
                <UserPlus className="h-3.5 w-3.5" /> Inscription
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Username — login + register */}
            {(screen === "login" || screen === "register") && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Nom d'utilisateur</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex: tiger" className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none" autoFocus={screen !== "register"} />
              </div>
            )}

            {/* Email — register + forgot */}
            {(screen === "register" || screen === "forgot") && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ton@email.com" className="w-full rounded-lg border border-slate-700 bg-slate-950/60 pl-10 pr-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none" autoFocus />
                </div>
              </div>
            )}

            {/* Password — login + register */}
            {(screen === "login" || screen === "register") && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Mot de passe</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="ex: 1234wqaQ!" className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none" />
              </div>
            )}

            {/* New password — reset */}
            {screen === "reset" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Nouveau mot de passe</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="ex: 1234wqaQ!" className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none" autoFocus />
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <p className="text-xs text-rose-300">{error}</p>
              </div>
            )}

            {/* Info */}
            {info && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-2.5">
                <p className="text-xs text-emerald-300">{info}</p>
              </div>
            )}

            {/* Reset URL (dev mode — in production this would be sent by email) */}
            {resetUrl && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-2.5">
                <p className="mb-1 text-[10px] text-amber-300">🔗 Lien de réinitialisation (envoyé par email en production):</p>
                <a href={resetUrl} className="break-all text-[10px] text-cyan-400 underline">{resetUrl}</a>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : screen === "login" ? <LogIn className="h-4 w-4" /> : screen === "register" ? <UserPlus className="h-4 w-4" /> : <KeyRound className="h-4 w-4" />}
              {screen === "login" ? "Se connecter" : screen === "register" ? "Créer un compte" : screen === "forgot" ? "Envoyer le lien" : "Réinitialiser"}
            </button>
          </form>

          {/* Links */}
          <div className="mt-4 flex flex-col gap-2 text-center">
            {screen === "login" && (
              <button onClick={() => { setScreen("forgot"); setError(""); setInfo(""); }} className="text-[11px] text-slate-500 hover:text-cyan-400">
                Mot de passe oublié ?
              </button>
            )}
            {(screen === "forgot" || screen === "reset") && (
              <button onClick={() => { setScreen("login"); setError(""); setInfo(""); setResetUrl(""); }} className="text-[11px] text-slate-500 hover:text-cyan-400">
                ← Retour à la connexion
              </button>
            )}
          </div>

          {/* Password rules (register only) */}
          {screen === "register" && (
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <Lock className="h-3 w-3" /> Règles du mot de passe
              </p>
              <ul className="space-y-0.5 text-[10px] text-slate-500">
                <li className={password.length >= 6 ? "text-emerald-400" : ""}>✓ 6 caractères minimum</li>
                <li className={/[0-9]/.test(password) ? "text-emerald-400" : ""}>✓ 1 chiffre</li>
                <li className={/[a-z]/.test(password) ? "text-emerald-400" : ""}>✓ 1 minuscule</li>
                <li className={/[A-Z]/.test(password) ? "text-emerald-400" : ""}>✓ 1 majuscule</li>
                <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? "text-emerald-400" : ""}>✓ 1 symbole (!@#$...)</li>
              </ul>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[10px] text-slate-600">
          Tes projets sont privés et associés à ton compte
        </p>
      </motion.div>
    </div>
  );
}
