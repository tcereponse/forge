"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Hammer, Loader2, LogIn, UserPlus, AlertCircle, Lock } from "lucide-react";

interface AuthUser {
  id: string;
  username: string;
}

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
    return <LoginScreen onSuccess={setUser} />;
  }

  return <>{children}</>;
}

function LoginScreen({ onSuccess }: { onSuccess: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Erreur");
        return;
      }
      onSuccess(data.user);
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950 p-4">
      {/* Background glow */}
      <div className="pointer-events-none absolute h-64 w-96 rounded-full bg-cyan-500/10 blur-[100px]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-sm"
      >
        {/* Logo */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
            <Hammer className="h-8 w-8 text-cyan-300" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-50">React Forge</h1>
          <p className="mt-1 text-xs text-slate-500">Connecte-toi pour accéder à tes projets</p>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl">
          {/* Toggle */}
          <div className="mb-4 flex gap-1 rounded-lg border border-slate-800 bg-slate-950/40 p-1">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition ${
                mode === "login" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <LogIn className="h-3.5 w-3.5" />
              Connexion
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition ${
                mode === "register" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Inscription
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Nom d'utilisateur</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ex: tiger"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                autoComplete="username"
                autoFocus
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-400">Mot de passe</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ex: 1234wqaQ!"
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none focus:ring-2 focus:ring-cyan-500/20"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <p className="text-xs text-rose-300">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !username || !password}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:from-cyan-400 hover:to-teal-400 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : mode === "login" ? (
                <LogIn className="h-4 w-4" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              {mode === "login" ? "Se connecter" : "Créer un compte"}
            </button>
          </form>

          {/* Password rules (register only) */}
          {mode === "register" && (
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
