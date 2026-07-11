"use client";

import { useState } from "react";
import {
  Rocket, Loader2, CheckCircle2, AlertCircle, RefreshCw, FileText, Code2, Zap, Cpu, Key, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GeneratedFile { path: string; content: string; language: string; }
type Phase = "idle" | "prd-generating" | "prd-done" | "code-generating" | "done" | "error";
interface Props { onFilesGenerated?: (files: GeneratedFile[], prd: string) => void; }

function buildPhase1Prompt(name: string, vision: string): string {
  return `Tu es un Ingenieur Senior. Genere un PRD technique.\n\nProjet : ${name}\nVision : "${vision}"\n\nFORMAT (Markdown) :\n## Problem Statement & Solution\n## User Stories\n## Implementation Decisions (React+Vite+TS, HashRouter)\n## Testing Decisions\n## Out of Scope\n\nStack : React 18 + Vite 5 + TypeScript 5 + Tailwind 3.`;
}

function buildPhase2Prompt(name: string, prd: string): string {
  return `Tu es un generateur de code React. Reponds UNIQUEMENT en JSON.\n\nProjet : ${name}\nPRD :\n---\n${prd}\n---\n\nGenere TOUT le code. Stack : React 18 + Vite + TS + Tailwind + HashRouter.\nFichiers : index.html, vite.config.ts, package.json, tsconfig.json, tailwind.config.ts, postcss.config.js, src/main.tsx, src/App.tsx, src/index.css, src/components/MainComponent.tsx\n\nFormat : {"files":[{"path":"...","content":"...","language":"..."}]}`;
}

export function DeepseekWebview({ onFilesGenerated }: Props) {
  const [apiKey, setApiKey] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectPrompt, setProjectPrompt] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [prd, setPrd] = useState("");
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [error, setError] = useState("");

  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((p) => [...p, `[${time}] ${msg}`].slice(-20));
  };

  async function handleGeneratePrd() {
    if (!apiKey.trim()) { toast.error("Saisis ta cle API DeepSeek"); return; }
    if (!projectName.trim() || !projectPrompt.trim()) { toast.error("Nom et description requis"); return; }
    setPhase("prd-generating"); setError(""); addLog("Phase 1 — Generation PRD via DeepSeek API...");
    try {
      const res = await fetch("/api/deepseek/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey, projectName, projectDescription: projectPrompt, phase: "prd" }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPrd(data.prd); addLog(`PRD genere (${data.prd.length} chars)`); setPhase("prd-done");
    } catch (e) { const msg = e instanceof Error ? e.message : "Erreur"; addLog(`Erreur: ${msg}`); setError(msg); setPhase("error"); }
  }

  async function handleGenerateCode() {
    setPhase("code-generating"); setError(""); addLog("Phase 2 — Generation Code via DeepSeek API...");
    try {
      const res = await fetch("/api/deepseek/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ apiKey, projectName, projectDescription: projectPrompt, phase: "code", prd }) });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setFiles(data.files); addLog(`${data.files.length} fichiers generes`); setPhase("done"); onFilesGenerated?.(data.files, prd);
    } catch (e) { const msg = e instanceof Error ? e.message : "Erreur"; addLog(`Erreur: ${msg}`); setError(msg); setPhase("error"); }
  }

  function handleReset() { setPhase("idle"); setPrd(""); setFiles(""); setLogs([]); setError(""); }

  const phaseLabel: Record<Phase, string> = { idle: "En attente", "prd-generating": "Phase 1", "prd-done": "PRD pret", "code-generating": "Phase 2", done: "Termine", error: "Erreur" };
  const phaseColor: Record<Phase, string> = { idle: "border-slate-700 bg-slate-900/60 text-slate-400", "prd-generating": "border-cyan-500/30 bg-cyan-500/10 text-cyan-300", "prd-done": "border-cyan-500/30 bg-cyan-500/10 text-cyan-300", "code-generating": "border-teal-500/30 bg-teal-500/10 text-teal-300", done: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300", error: "border-rose-500/30 bg-rose-500/10 text-rose-300" };
  const isLoading = phase === "prd-generating" || phase === "code-generating";

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-cyan-300" />
          <h2 className="text-base font-bold text-slate-100">DeepSeek Auto — API</h2>
          <Badge variant="outline" className={cn("ml-auto text-[10px]", phaseColor[phase])}>{isLoading && <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />}{phaseLabel[phase]}</Badge>
        </div>
        <p className="mt-1 text-xs text-slate-400">Generation via API DeepSeek — PRD + Code source</p>
      </div>
      <div className="custom-scroll flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl">
          {(phase === "idle" || phase === "error") && (
            <>
              <div className="mb-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div className="mb-2 flex items-center gap-2"><Key className="h-4 w-4 text-cyan-300" /><h3 className="text-xs font-semibold text-slate-200">Cle API DeepSeek</h3></div>
                <Input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="sk-..." className="border-slate-700 bg-slate-950/60 font-mono text-sm text-slate-100" />
                <p className="mt-2 text-[11px] text-slate-500">Obtiens ta cle sur <a href="https://platform.deepseek.com/api_keys" target="_blank" rel="noopener noreferrer" className="text-cyan-300 underline">platform.deepseek.com/api_keys</a> (gratuit, 500 req/mois)</p>
              </div>
              <div className="mb-4 space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div><label className="mb-1 block text-xs font-medium text-slate-300">Nom du projet</label><Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="ex: TaskFlow..." className="border-slate-700 bg-slate-950/60 text-sm text-slate-100" /></div>
                <div><label className="mb-1 block text-xs font-medium text-slate-300">Description</label><Textarea value={projectPrompt} onChange={(e) => setProjectPrompt(e.target.value)} placeholder="Decris ton app..." rows={3} className="resize-none border-slate-700 bg-slate-950/60 text-sm text-slate-100" /></div>
                <Button onClick={handleGeneratePrd} disabled={isLoading || !apiKey.trim() || !projectName.trim() || !projectPrompt.trim()} className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400">
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generation...</> : <><Rocket className="mr-2 h-4 w-4" /> Phase 1 — Generer le PRD</>}
                </Button>
              </div>
              {error && (<div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3"><div className="flex items-start gap-2"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" /><div><p className="text-xs font-semibold text-rose-300">Erreur</p><p className="mt-1 text-[11px] text-slate-400">{error}</p></div></div></div>)}
              <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-cyan-300"><Zap className="h-3.5 w-3.5" /> Comment ca marche</p>
                <ol className="space-y-1 text-xs text-slate-400"><li>1. Obtiens une cle API DeepSeek (gratuite)</li><li>2. Saisis la cle + nom + description</li><li>3. Clique Phase 1 — DeepSeek genere le PRD</li><li>4. Clique Phase 2 — DeepSeek genere les fichiers</li><li>5. Fichiers sauvegardes automatiquement</li></ol>
                <p className="mt-3 rounded-lg bg-cyan-500/10 p-2 text-[11px] text-cyan-300">Pas de cle API ? Utilise le bouton "Creer un projet" sur l accueil — GLM-4.6 integre (gratuit, illimite).</p>
              </div>
            </>
          )}
          {isLoading && (<div className="flex flex-col items-center justify-center py-12"><Loader2 className="mb-4 h-12 w-12 animate-spin text-cyan-400" /><p className="text-sm font-medium text-slate-300">{phaseLabel[phase]}</p><p className="mt-1 text-xs text-slate-500">{phase === "prd-generating" ? "DeepSeek analyse (30-90s)..." : "DeepSeek ecrit les fichiers (60-120s)..."}</p></div>)}
          {phase === "prd-done" && (<><div className="mb-4"><div className="mb-2 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-cyan-300" /><h3 className="text-sm font-semibold text-slate-200">PRD genere</h3><span className="text-[10px] text-slate-500">{prd.length} chars</span></div><div className="custom-scroll max-h-64 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-3"><pre className="whitespace-pre-wrap text-xs text-slate-300">{prd}</pre></div></div><Button onClick={handleGenerateCode} disabled={isLoading} className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-slate-950 hover:from-teal-400 hover:to-cyan-400"><Code2 className="mr-2 h-4 w-4" /> Phase 2 — Generer le Code</Button></>)}
          {phase === "done" && (<><div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center"><CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" /><p className="text-sm font-semibold text-emerald-300">Mission terminee !</p><p className="mt-1 text-xs text-slate-400">{files.length} fichiers generes</p></div><div className="mb-4"><div className="mb-2 flex items-center gap-2"><Code2 className="h-4 w-4 text-emerald-300" /><h3 className="text-sm font-semibold text-slate-200">Fichiers ({files.length})</h3></div><div className="space-y-1.5">{files.map((f, i) => (<div key={i} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2"><Code2 className="h-3.5 w-3.5 text-cyan-400" /><span className="flex-1 truncate font-mono text-xs text-slate-200">{f.path}</span><span className="text-[10px] text-slate-500">{f.content.length}</span></div>))}</div></div><Button onClick={handleReset} variant="outline" className="w-full"><RefreshCw className="mr-2 h-3.5 w-3.5" /> Nouvelle mission</Button></>)}
          {logs.length > 0 && (<div className="mt-4"><div className="mb-1.5 flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-cyan-300" /><h3 className="text-xs font-semibold text-slate-200">Logs</h3></div><div className="custom-scroll max-h-32 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-2">{logs.map((l, i) => <p key={i} className="font-mono text-[10px] leading-relaxed text-slate-400">{l}</p>)}</div></div>)}
        </div>
      </div>
    </div>
  );
}
