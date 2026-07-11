"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Rocket, Loader2, CheckCircle2, AlertCircle, RefreshCw, FileText, Code2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface BridgeStatus {
  status: string;
  phase: number;
  phaseName?: string;
  prd?: string;
  files?: { path: string; content: string; language: string }[];
  fileCount?: number;
  missionId?: string;
  name?: string;
}

export function KirovPanel() {
  const [projectName, setProjectName] = useState("");
  const [projectPrompt, setProjectPrompt] = useState("");
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  const checkBridge = useCallback(async () => {
    try {
      const res = await fetch(`/api/bridge/health`, { signal: AbortSignal.timeout(5000) });
      return res.ok;
    } catch {
      return false;
    }
  }, []);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/bridge/mission/status`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
      // offline
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReconnect = useCallback(async () => {
    setLoading(true);
    await refreshStatus();
    setLoading(false);
  }, [refreshStatus]);

  useEffect(() => {
    refreshStatus();
    const interval = setInterval(refreshStatus, 5000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  async function handleStartMission() {
    if (!projectName.trim() || !projectPrompt.trim()) {
      toast.error("Donne un nom et une description");
      return;
    }
    setStarting(true);
    try {
      const res = await fetch(`/api/bridge/mission/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, prompt: projectPrompt, stack: "react-vite" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Mission lancee — Phase ${data.phase}`);
        refreshStatus();
      } else {
        toast.error("Echec du lancement");
      }
    } catch {
      toast.error("Erreur reseau");
    } finally {
      setStarting(false);
    }
  }

  async function handleReset() {
    try {
      await fetch(`/api/bridge/mission/reset`, { method: "POST" });
      refreshStatus();
    } catch {
      // ignore
    }
  }

  const phase = status?.phase ?? 0;
  const phaseName = status?.phaseName ?? "Idle";
  const phaseStatus = status?.status ?? "idle";
  const bridgeOnline = status !== null;

  return (
    <div className="custom-scroll h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
            <Rocket className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">KIROV Bridge — DeepSeek</h2>
            <p className="text-xs text-slate-500">Bridge integre Next.js — accessible via proxy</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium",
              bridgeOnline ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            )}>
              <div className={cn("h-1.5 w-1.5 rounded-full", bridgeOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-400")} />
              {bridgeOnline ? "Online" : "Offline"}
            </div>
            <Button onClick={handleReconnect} variant="ghost" size="sm" className="h-8 w-8 p-0">
              <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            </Button>
          </div>
        </div>

        {(phase === 0 || phase === 5) && (
          <div className="mb-6 space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Nom du projet</label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="ex: TaskFlow..." className="border-slate-700 bg-slate-950/60 text-sm text-slate-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Description</label>
              <Textarea value={projectPrompt} onChange={(e) => setProjectPrompt(e.target.value)} placeholder="Decris ton app..." rows={3} className="resize-none border-slate-700 bg-slate-950/60 text-sm text-slate-100" />
            </div>
            <Button onClick={handleStartMission} disabled={starting} className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400">
              {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
              Lancer la mission
            </Button>
            {phase === 5 && <Button onClick={handleReset} variant="outline" className="w-full">Reinitialiser</Button>}
          </div>
        )}

        {phase > 0 && phase < 5 && (
          <div className="mb-6 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-cyan-300">Phase {phase} : {phaseName}</p>
              <span className="flex items-center gap-1.5 text-xs text-cyan-300"><Loader2 className="h-3 w-3 animate-spin" />{phaseStatus}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-500" style={{ width: `${(phase / 4) * 100}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-slate-500">L extension KIROV3 injecte le prompt dans DeepSeek. Ouvre chat.deepseek.com dans Chrome.</p>
          </div>
        )}

        {status?.prd && (
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-cyan-300" /><h3 className="text-sm font-semibold text-slate-200">PRD genere</h3><span className="text-[10px] text-slate-500">{status.prd.length} chars</span></div>
            <div className="custom-scroll max-h-64 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3"><pre className="whitespace-pre-wrap text-xs text-slate-300">{status.prd}</pre></div>
          </div>
        )}

        {status?.files && status.files.length > 0 && (
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /><h3 className="text-sm font-semibold text-slate-200">Fichiers ({status.files.length})</h3></div>
            <div className="space-y-1.5">
              {status.files.map((f, i) => (
                <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2"><Code2 className="h-3.5 w-3.5 text-cyan-400" /><span className="flex-1 truncate font-mono text-xs text-slate-200">{f.path}</span><span className="text-[10px] text-slate-500">{f.content.length}</span></div>
              ))}
            </div>
          </div>
        )}

        {phase === 5 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
            <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
            <p className="text-sm font-semibold text-emerald-300">Mission terminee !</p>
            <p className="mt-1 text-xs text-slate-400">{status?.files?.length ?? 0} fichiers generes via DeepSeek</p>
          </motion.div>
        )}

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300"><Zap className="h-3.5 w-3.5" /> Comment ca marche</p>
          <ol className="space-y-1.5 text-xs text-slate-400">
            <li>1. Le bridge est integre dans Next.js (plus de serveur separe)</li>
            <li>2. Lance une mission — le prompt est pret pour l extension KIROV3</li>
            <li>3. L extension KIROV3 (Chrome) poll /api/bridge/prompt</li>
            <li>4. L extension injecte le prompt dans DeepSeek Chat</li>
            <li>5. L extension capture la reponse → POST /api/bridge/code</li>
            <li>6. Transition automatique Phase 1 → Phase 2 → Done</li>
          </ol>
          <p className="mt-3 rounded-lg bg-cyan-500/10 p-2 text-[11px] text-cyan-300">
            Le bridge est maintenant integre dans Next.js. Plus besoin de serveur separe sur le port 5005.
            L extension KIROV3 doit pointer vers : <code className="rounded bg-slate-800 px-1">/api/bridge/prompt</code> et <code className="rounded bg-slate-800 px-1">/api/bridge/code</code>
          </p>
        </div>
      </div>
    </div>
  );
}
