"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Rocket,
  Loader2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  FileText,
  Code2,
  Zap,
} from "lucide-react";
import { useForgeStore } from "@/hooks/use-forge-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BRIDGE_URL = "http://localhost:5005";

interface BridgeStatus {
  status: string;
  phase: number;
  phaseName?: string;
  prd?: string;
  files?: { path: string; content: string; language: string }[];
  fileCount?: number;
  capturedLength?: number;
  missionId?: string;
  name?: string;
  projectId?: string;
}

export function KirovPanel() {
  const [projectName, setProjectName] = useState("");
  const [projectPrompt, setProjectPrompt] = useState("");
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const [bridgeOnline, setBridgeOnline] = useState(false);

  const checkBridge = useCallback(async () => {
    try {
      const res = await fetch(`${BRIDGE_URL}/health`, {
        mode: "cors",
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        setBridgeOnline(true);
        return await res.json();
      }
      setBridgeOnline(false);
    } catch {
      setBridgeOnline(false);
    }
    return null;
  }, []);

  const refreshStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${BRIDGE_URL}/v1/mission/status`, {
        mode: "cors",
        signal: AbortSignal.timeout(5000),
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, []);

  const handleReconnect = useCallback(async () => {
    setLoading(true);
    await checkBridge();
    await refreshStatus();
    setLoading(false);
  }, [checkBridge, refreshStatus]);

  useEffect(() => {
    checkBridge();
    refreshStatus();
    const interval = setInterval(() => {
      checkBridge();
      refreshStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [checkBridge, refreshStatus]);

  async function handleStartMission() {
    if (!projectName.trim() || !projectPrompt.trim()) {
      toast.error("Donne un nom et une description");
      return;
    }
    setStarting(true);
    try {
      const res = await fetch(`${BRIDGE_URL}/v1/mission/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, prompt: projectPrompt, stack: "react-vite" }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Mission lancée — Phase ${data.phase} active`);
        refreshStatus();
      }
    } catch {
      toast.error("Bridge hors-ligne");
    } finally {
      setStarting(false);
    }
  }

  async function handleReset() {
    try {
      await fetch(`${BRIDGE_URL}/v1/mission/reset`, { method: "POST" });
      refreshStatus();
    } catch {}
  }

  const phase = status?.phase ?? 0;
  const phaseName = status?.phaseName ?? "Idle";
  const phaseStatus = status?.status ?? "idle";

  return (
    <div className="custom-scroll h-full overflow-y-auto p-4 sm:p-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
            <Rocket className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">KIROV Bridge — DeepSeek</h2>
            <p className="text-xs text-slate-500">Extension KIROV3 + serveur bridge (port 5005)</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className={cn(
              "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium",
              bridgeOnline ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-rose-500/30 bg-rose-500/10 text-rose-300"
            )}>
              <div className={cn("h-1.5 w-1.5 rounded-full", bridgeOnline ? "bg-emerald-400" : "bg-rose-400")} />
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
            <Button onClick={handleStartMission} disabled={starting || !bridgeOnline} className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400">
              {starting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Rocket className="mr-2 h-4 w-4" />}
              Lancer la mission
            </Button>
            {phase === 5 && <Button onClick={handleReset} variant="outline" className="w-full">Réinitialiser</Button>}
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
          </div>
        )}

        {status?.prd && (
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-cyan-300" /><h3 className="text-sm font-semibold text-slate-200">PRD généré</h3><span className="text-[10px] text-slate-500">{status.prd.length} chars</span></div>
            <div className="custom-scroll max-h-64 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3"><pre className="whitespace-pre-wrap text-xs text-slate-300">{status.prd}</pre></div>
          </div>
        )}

        {status?.files && status.files.length > 0 && (
          <div className="mb-6">
            <div className="mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /><h3 className="text-sm font-semibold text-slate-200">Fichiers générés ({status.files.length})</h3></div>
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
            <p className="text-sm font-semibold text-emerald-300">Mission terminée !</p>
            <p className="mt-1 text-xs text-slate-400">{status?.files?.length ?? 0} fichiers générés via DeepSeek</p>
          </motion.div>
        )}

        {!bridgeOnline && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-300">Bridge hors-ligne</p>
                <p className="mt-1 text-xs text-slate-400">Clique "Reconnecter" (icône Actualiser en haut à droite).</p>
                <p className="mt-2 text-xs text-slate-400">Si le problème persiste :<code className="mt-1 block rounded bg-slate-800 px-2 py-1 text-[11px]">cd mini-services/kirov-bridge && bun run dev</code></p>
                <Button onClick={handleReconnect} disabled={loading} size="sm" className="mt-3 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30">
                  {loading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="mr-2 h-3.5 w-3.5" />}Reconnecter
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300"><Zap className="h-3.5 w-3.5" /> Comment ça marche</p>
          <ol className="space-y-1.5 text-xs text-slate-400">
            <li>1. Le serveur bridge (port 5005) démarre avec npm run dev</li>
            <li>2. L'extension KIROV3 dans Chrome poll le bridge</li>
            <li>3. Lance une mission → l'extension injecte le prompt dans DeepSeek</li>
            <li>4. DeepSeek génère → l'extension capture → sauvegarde automatique</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
