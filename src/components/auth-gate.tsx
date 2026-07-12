"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Hammer, Loader2, LogIn, UserPlus, AlertCircle, Lock, Mail, CheckCircle2, KeyRound, Eye, EyeOff } from "lucide-react";

interface AuthUser {
  id: string;
  username: string;
  email?: string;
}

type Screen = "login" | "register" | "forgot";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
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
  const [screen, setScreen] = useState<Screen>("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

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
          credentials: "include",
        });
        const data = await res.json();
        if (!data.success) { setError(data.error); return; }
        onSuccess(data.user);
        window.location.reload();
      } else if (screen === "register") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, email, password }),
          credentials: "include",
        });
        const data = await res.json();
        if (!data.success) { setError(data.error); return; }
        onSuccess(data.user);
        window.location.reload();
      } else if (screen === "forgot") {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!data.success) { setError(data.error); return; }
        setInfo(data.message || "Ton mot de passe t'a été envoyé par email.");
        setScreen("login");
      }
    } catch {
      setError("Erreur réseau");
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
            {screen === "forgot" && "Reçois ton mot de passe par email"}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-2xl">
          {/* Toggle login/register */}
          {(screen === "login" || screen === "register") && (
            <div className="mb-4 flex gap-1 rounded-lg border border-slate-800 bg-slate-950/40 p-1">
              <button onClick={() => { setScreen("login"); setError(""); setInfo(""); }} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition ${screen === "login" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500"}`}>
                <LogIn className="h-3.5 w-3.5" /> Connexion
              </button>
              <button onClick={() => { setScreen("register"); setError(""); setInfo(""); }} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition ${screen === "register" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500"}`}>
                <UserPlus className="h-3.5 w-3.5" /> Inscription
              </button>
            </div>
          )}

          {/* Info message (success) */}
          {info && (
            <div className="mb-4 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <p className="text-xs text-emerald-300">{info}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Username — login + register */}
            {(screen === "login" || screen === "register") && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Nom d'utilisateur</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="ex: tiger" className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none" autoFocus={screen === "login"} />
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
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="ex: 1234wqaQ!"
                    className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 pr-10 text-sm text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-cyan-400"
                    title={showPassword ? "Masquer" : "Afficher"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg border border-rose-500/30 bg-rose-500/5 p-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                <p className="text-xs text-rose-300">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 px-4 py-3 text-sm font-semibold text-slate-950 disabled:opacity-50">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : screen === "login" ? <LogIn className="h-4 w-4" /> : screen === "register" ? <UserPlus className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              {screen === "login" ? "Se connecter" : screen === "register" ? "Créer un compte" : "Recevoir mon mot de passe"}
            </button>
          </form>

          {/* Links */}
          <div className="mt-4 flex flex-col gap-2 text-center">
            {screen === "login" && (
              <button onClick={() => { setScreen("forgot"); setError(""); setInfo(""); }} className="text-[11px] text-slate-500 hover:text-cyan-400">
                Mot de passe oublié ?
              </button>
            )}
            {screen === "forgot" && (
              <button onClick={() => { setScreen("login"); setError(""); setInfo(""); }} className="text-[11px] text-slate-500 hover:text-cyan-400">
                Retour a la connexion
              </button>
            )}
          </div>

          {/* Password rules (register only) */}
          {screen === "register" && (
            <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                <Lock className="h-3 w-3" /> Regles du mot de passe
              </p>
              <ul className="space-y-0.5 text-[10px] text-slate-500">
                <li className={password.length >= 6 ? "text-emerald-400" : ""}>6 caracteres minimum</li>
                <li className={/[0-9]/.test(password) ? "text-emerald-400" : ""}>1 chiffre</li>
                <li className={/[a-z]/.test(password) ? "text-emerald-400" : ""}>1 minuscule</li>
                <li className={/[A-Z]/.test(password) ? "text-emerald-400" : ""}>1 majuscule</li>
                <li className={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? "text-emerald-400" : ""}>1 symbole (!@#$...)</li>
              </ul>
            </div>
          )}
        </div>

        <p className="mt-4 text-center text-[10px] text-slate-600">
          Tes projets sont prives et associes a ton compte
        </p>
      </motion.div>
    </div>
  );
}
