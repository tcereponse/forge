"use client";

import { useState } from "react";
import { Hammer, Loader2, LogIn, UserPlus, LogOut, User } from "lucide-react";

interface AuthUser {
  id: string;
  username: string;
}

export function AuthPanel() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);

  // Check if already logged in
  useState(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated && data.user) setUser(data.user);
        setChecked(true);
      })
      .catch(() => setChecked(true));
  });

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
      setUser(data.user);
      setUsername("");
      setPassword("");
      // Reload to refresh projects
      window.location.reload();
    } catch {
      setError("Erreur réseau");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.reload();
  }

  if (!checked) {
    return <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-3 w-3 animate-spin" /></div>;
  }

  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-xs">
          <User className="h-3 w-3 text-cyan-400" />
          <span className="text-slate-300">{user.username}</span>
        </div>
        <button onClick={handleLogout} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-rose-400" title="Déconnexion">
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-2">
      <div className="flex gap-1 rounded-md border border-slate-800 bg-slate-950/40 p-1">
        <button onClick={() => setMode("login")} className={`flex-1 rounded px-2 py-1 text-[11px] font-medium transition ${mode === "login" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500"}`}>
          Connexion
        </button>
        <button onClick={() => setMode("register")} className={`flex-1 rounded px-2 py-1 text-[11px] font-medium transition ${mode === "register" ? "bg-cyan-500/20 text-cyan-300" : "text-slate-500"}`}>
          Inscription
        </button>
      </div>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Nom d'utilisateur"
          className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
          autoComplete="username"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />
        {error && <p className="text-[10px] text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-1.5 rounded-md bg-gradient-to-r from-cyan-500 to-teal-500 px-3 py-1.5 text-[11px] font-semibold text-slate-950 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : mode === "login" ? <LogIn className="h-3 w-3" /> : <UserPlus className="h-3 w-3" />}
          {mode === "login" ? "Se connecter" : "Créer un compte"}
        </button>
      </form>
      {mode === "register" && (
        <p className="text-[9px] leading-tight text-slate-600">
          Mot de passe: 6+ caractères, 1 chiffre, 1 majuscule, 1 minuscule, 1 symbole (!@#$...)
        </p>
      )}
    </div>
  );
}
