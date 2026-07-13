"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Rocket, Loader2, CheckCircle2, AlertCircle, RefreshCw,
  FileText, Code2, Zap, Cpu, ExternalLink, Play, FolderGit2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Phase = "idle" | "p0" | "p1" | "p2" | "p3" | "done" | "error";

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

export function KirovLauncher() {
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [stack, setStack] = useState("vite");
  const [aiUrl, setAiUrl] = useState("https://chat.deepseek.com/");
  const [phase, setPhase] = useState<Phase>("idle");
  const [status, setStatus] = useState<BridgeStatus | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(prev => [...prev, `[${time}] ${msg}`].slice(-30));
  };

  const refreshStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/bridge/mission/status`, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
        if (data.phase === 5 && phase !== "done") {
          setPhase("done");
          addLog(`Mission terminee ! ${data.fileCount} fichiers generes`);
        }
      }
    } catch {}
  }, [phase]);

  const [bridgeOnline, setBridgeOnline] = useState(false);
  const [extStatus, setExtStatus] = useState("");

  useEffect(() => {
    refreshStatus();
    // Check bridge health
    fetch(`/api/bridge/health`).then(r => r.json()).then(d => {
      setBridgeOnline(d.status === "online");
    }).catch(() => setBridgeOnline(false));
    const interval = setInterval(() => {
      refreshStatus();
      fetch(`/api/bridge/health`).then(r => r.json()).then(d => {
        setBridgeOnline(d.status === "online");
      }).catch(() => setBridgeOnline(false));
    }, 3000);
    return () => clearInterval(interval);
  }, [refreshStatus]);

  async function triggerP0() {
    if (!projectName.trim() || !projectDesc.trim()) {
      toast.error("Nom et description obligatoires");
      return;
    }
    setPhase("p0");
    setLoading(true);
    addLog(`🚀 P0 : Initialisation de ${projectName.toUpperCase()}...`);

    try {
      const res = await fetch(`/api/bridge/mission/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, prompt: projectDesc, stack }),
      });
      const data = await res.json();
      if (data.success) {
        addLog(`✅ P0 reussi. Prompt de cadrage pret.`);
        // Open AI in new tab
        window.open(aiUrl, "_blank");
        addLog(`🌐 IA ouverte dans un nouvel onglet`);
      }
    } catch (e) {
      addLog(`❌ Erreur P0: ${e instanceof Error ? e.message : "inconnue"}`);
      setPhase("error");
    } finally {
      setLoading(false);
    }
  }

  async function triggerP1() {
    setPhase("p1");
    setLoading(true);
    addLog(`🔥 P1 : Generation des PRDs...`);

    try {
      const res = await fetch(`/api/bridge/mission/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName, prompt: projectDesc, stack }),
      });
      const data = await res.json();
      if (data.success) {
        addLog(`🔥 P1 lance. Le prompt PRD est pret pour l'extension KIROV3.`);
        window.open(aiUrl, "_blank");
        addLog(`🌐 DeepSeek ouvert — l'extension va injecter le prompt`);
      }
    } catch (e) {
      addLog(`❌ Erreur P1: ${e instanceof Error ? e.message : "inconnue"}`);
      setPhase("error");
    } finally {
      setLoading(false);
    }
  }

  async function triggerP2() {
    setPhase("p2");
    setLoading(true);
    addLog(`🏗️ P2 : Generation du code source...`);

    try {
      // Check if PRD was captured
      if (status?.phase === 2) {
        addLog(`📋 PRD capture detecte. Le prompt Code est pret.`);
        window.open(aiUrl, "_blank");
        addLog(`🌐 DeepSeek ouvert — l'extension va injecter le prompt Code`);
      } else {
        addLog(`⚠️ Pas de PRD capture. Lance P1 d'abord et attends la capture.`);
        setPhase("idle");
      }
    } finally {
      setLoading(false);
    }
  }

  function handleReset() {
    fetch(`/api/bridge/mission/reset`, { method: "POST" });
    setPhase("idle");
    setLogs([]);
    setStatus(null);
    addLog("Mission reinitialisee");
  }

  const phaseLabel: Record<Phase, string> = {
    idle: "Pret", p0: "P0 — Reveil Cognitif", p1: "P1 — Generation PRD",
    p2: "P2 — Generation Code", p3: "P3 — Validation", done: "Termine", error: "Erreur",
  };
  const phaseColor: Record<Phase, string> = {
    idle: "border-slate-700 bg-slate-900/60 text-slate-400",
    p0: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    p1: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    p2: "border-teal-500/30 bg-teal-500/10 text-teal-300",
    p3: "border-amber-500/30 bg-amber-500/10 text-amber-300",
    done: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    error: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  };

  const currentPhase = status?.phase ?? 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-cyan-300" />
          <h2 className="text-base font-bold text-slate-100">ELITE FORGE — KIROV Launcher</h2>
          <span className={cn("ml-auto flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-medium", phaseColor[phase])}>
            {loading && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
            {phaseLabel[phase]}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Phases P0-P3 — via DeepSeek Chat (gratuit, sans cle API)</p>
      </div>

      <div className="custom-scroll flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-4xl">
          {/* Project form */}
          <div className="mb-4 grid grid-cols-1 gap-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Nom du projet</label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="ex: TaskFlow..." className="border-slate-700 bg-slate-950/60 text-sm text-slate-100" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-300">Stack</label>
              <select value={stack} onChange={(e) => setStack(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100">
                <option value="vite">Vite + React + TS</option>
                <option value="next">Next.js</option>
                <option value="cra">Create React App</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-300">Description / Vision</label>
              <Textarea value={projectDesc} onChange={(e) => setProjectDesc(e.target.value)} placeholder="Decris ton application en detail..." rows={3} className="resize-none border-slate-700 bg-slate-950/60 text-sm text-slate-100" />
            </div>
            <div className="md:col-span-2">
              <label className="mb-1 block text-xs font-medium text-slate-300">IA cible</label>
              <select value={aiUrl} onChange={(e) => setAiUrl(e.target.value)} className="w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100">
                <option value="https://chat.deepseek.com/">🐋 DeepSeek Chat (gratuit)</option>
                <option value="https://chatgpt.com">🤖 ChatGPT</option>
                <option value="https://gemini.google.com">✨ Gemini</option>
              </select>
            </div>
          </div>

          {/* Phase buttons */}
          <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <button onClick={triggerP0} disabled={loading || !projectName.trim() || !projectDesc.trim()}
              className="flex flex-col items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-center transition hover:bg-cyan-500/20 disabled:opacity-50">
              <Zap className="h-6 w-6 text-cyan-300" />
              <span className="text-xs font-bold text-cyan-300">P0</span>
              <span className="text-[10px] text-slate-400">Reveil Cognitif</span>
            </button>
            <button onClick={triggerP1} disabled={loading || !projectName.trim()}
              className="flex flex-col items-center gap-2 rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-center transition hover:bg-cyan-500/20 disabled:opacity-50">
              <FileText className="h-6 w-6 text-cyan-300" />
              <span className="text-xs font-bold text-cyan-300">P1</span>
              <span className="text-[10px] text-slate-400">Generation PRD</span>
            </button>
            <button onClick={triggerP2} disabled={loading}
              className="flex flex-col items-center gap-2 rounded-xl border border-teal-500/30 bg-teal-500/10 p-4 text-center transition hover:bg-teal-500/20 disabled:opacity-50">
              <Code2 className="h-6 w-6 text-teal-300" />
              <span className="text-xs font-bold text-teal-300">P2</span>
              <span className="text-[10px] text-slate-400">Generation Code</span>
            </button>
            <button onClick={() => { setPhase("p3"); addLog("P3: Validation (a venir)"); }}
              className="flex flex-col items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center transition hover:bg-amber-500/20">
              <CheckCircle2 className="h-6 w-6 text-amber-300" />
              <span className="text-xs font-bold text-amber-300">P3</span>
              <span className="text-[10px] text-slate-400">Validation</span>
            </button>
          </div>

          {/* Progress bar */}
          {/* Bridge status */}
          <div className={cn("mb-4 flex items-center justify-between rounded-xl border p-3", bridgeOnline ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5")}>
            <div className="flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", bridgeOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-400")} />
              <span className={cn("text-xs font-semibold", bridgeOnline ? "text-emerald-300" : "text-rose-300")}>
                Bridge {bridgeOnline ? "Online" : "Offline"}
              </span>
              {currentPhase > 0 && <span className="text-[10px] text-slate-500">— Phase {currentPhase} active, prompt pret</span>}
            </div>
            <div className="flex items-center gap-2">
              <a href="https://chat.deepseek.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-300 hover:bg-cyan-500/20">
                <ExternalLink className="h-3 w-3" /> Ouvrir DeepSeek
              </a>
            </div>
          </div>

          {/* Extension status warning */}
          <div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
            <p className="text-[11px] font-semibold text-amber-300">⚠️ Le prompt ne s injecte pas dans DeepSeek ?</p>
            <ol className="mt-1 space-y-0.5 text-[10px] text-slate-400">
              <li>1. Ouvre <code className="rounded bg-slate-800 px-1">chrome://extensions/</code></li>
              <li>2. Clique <strong>Actualiser</strong> sur l extension KIROV3</li>
              <li>3. Recharge <code className="rounded bg-slate-800 px-1">chat.deepseek.com</code> (Ctrl+Shift+R)</li>
              <li>4. La console doit afficher : <code className="rounded bg-slate-800 px-1">Server detecte: https://preview-chat-xxx.space-z.ai</code></li>
            </ol>
          </div>

          {currentPhase > 0 && currentPhase < 5 && (
            <div className="mb-4 rounded-xl border border-cyan-500/30 bg-cyan-500/5 p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-semibold text-cyan-300">Phase {currentPhase} : {status?.phaseName}</p>
                <span className="flex items-center gap-1.5 text-xs text-cyan-300"><Loader2 className="h-3 w-3 animate-spin" />{status?.status}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 transition-all duration-500" style={{ width: `${(currentPhase / 4) * 100}%` }} />
              </div>
              <p className="mt-2 text-[11px] text-slate-500">
                L extension KIROV3 (Chrome) injecte le prompt dans DeepSeek. Ouvre {aiUrl.replace("https://", "")} dans Chrome.
              </p>
            </div>
          )}

          {/* PRD output */}
          {status?.prd && (
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-cyan-300" /><h3 className="text-sm font-semibold text-slate-200">PRD genere</h3><span className="text-[10px] text-slate-500">{status.prd.length} chars</span></div>
              <div className="custom-scroll max-h-48 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3"><pre className="whitespace-pre-wrap text-xs text-slate-300">{status.prd}</pre></div>
            </div>
          )}

          {/* Files output */}
          {status?.files && status.files.length > 0 && (
            <div className="mb-4">
              <div className="mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-300" /><h3 className="text-sm font-semibold text-slate-200">Fichiers generes ({status.files.length})</h3></div>
              <div className="space-y-1.5">
                {status.files.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2"><Code2 className="h-3.5 w-3.5 text-cyan-400" /><span className="flex-1 truncate font-mono text-xs text-slate-200">{f.path}</span><span className="text-[10px] text-slate-500">{f.content.length}</span></div>
                ))}
              </div>
            </div>
          )}

          {/* Done */}
          {phase === "done" && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
              <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
              <p className="text-sm font-semibold text-emerald-300">Mission terminee !</p>
              <p className="mt-1 text-xs text-slate-400">{status?.files?.length ?? 0} fichiers generes via DeepSeek</p>
              <Button onClick={handleReset} variant="outline" size="sm" className="mt-3">Nouvelle mission</Button>
            </motion.div>
          )}

          {/* Logs */}
          {logs.length > 0 && (
            <div className="mb-4">
              <div className="mb-1.5 flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-cyan-300" /><h3 className="text-xs font-semibold text-slate-200">Logs</h3></div>
              <div className="custom-scroll max-h-40 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                {logs.map((log, i) => <p key={i} className="font-mono text-[10px] leading-relaxed text-slate-400">{log}</p>)}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300"><Zap className="h-3.5 w-3.5" /> Comment ca marche</p>
            <ol className="space-y-1.5 text-xs text-slate-400">
              <li>1. Remplis le nom + description + stack</li>
              <li>2. Choisis DeepSeek Chat (gratuit) comme IA</li>
              <li>3. Clique <strong className="text-cyan-300">P0</strong> — initialise la mission</li>
              <li>4. Clique <strong className="text-cyan-300">P1</strong> — genere le PRD (ouvre DeepSeek)</li>
              <li>5. L extension KIROV3 injecte le prompt dans DeepSeek</li>
              <li>6. DeepSeek genere → l extension capture → transition P2</li>
              <li>7. Clique <strong className="text-teal-300">P2</strong> — genere le code (ouvre DeepSeek)</li>
              <li>8. DeepSeek genere les fichiers → capture → sauvegarde</li>
            </ol>
            <p className="mt-3 rounded-lg bg-emerald-500/10 p-2 text-[11px] text-emerald-300">
              💡 100% gratuit — via chat.deepseek.com. Aucune cle API necessaire. L extension KIROV3 (Chrome) pilote DeepSeek automatiquement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
