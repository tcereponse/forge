"use client";

import { useState } from "react";
import { Loader2, LogOut, User, Trash2, X } from "lucide-react";

interface AuthUser {
  id: string;
  username: string;
}

export function AuthPanel() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [checked, setChecked] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

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

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    window.location.reload();
  }

  async function handleDeleteAccount() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/delete-account", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  if (!checked) {
    return <div className="flex items-center gap-2 text-xs text-slate-500"><Loader2 className="h-3 w-3 animate-spin" /></div>;
  }

  if (user) {
    return (
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900/60 px-2.5 py-1.5 text-xs">
            <User className="h-3 w-3 text-cyan-400" />
            <span className="text-slate-300">{user.username}</span>
          </div>
          <div className="flex gap-1">
            <button onClick={handleLogout} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-rose-400" title="Déconnexion">
              <LogOut className="h-3.5 w-3.5" />
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-800 hover:text-rose-400" title="Supprimer mon compte">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
            <p className="mb-2 text-[11px] text-rose-300">⚠️ Supprimer définitivement ton compte et tous tes projets ?</p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 rounded-md bg-rose-500/20 px-2 py-1.5 text-[11px] font-medium text-rose-300 hover:bg-rose-500/30 disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Oui, supprimer"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 rounded-md border border-slate-700 px-2 py-1.5 text-[11px] text-slate-400"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
