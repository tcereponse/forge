"use client";

import { useState } from "react";
import {
  Rocket, Loader2, CheckCircle2, AlertCircle, RefreshCw, FileText, Code2, Zap, Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface GeneratedFile { path: string; content: string; language: string; }
type Phase = "idle" | "generating" | "prd-done" | "code-generating" | "done" | "error";

interface Props {
  onFilesGenerated?: (files: GeneratedFile[], prd: string) => void;
}

export function DeepseekWebview({ onFilesGenerated }: Props) {
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

  // Generate PRD using GLM-4.6 (free, no API key needed)
  async function generatePrd(): Promise<string> {
    const prompt = `Tu es un Ingenieur Senior. Genere un PRD technique pour ce projet.

Projet : ${projectName}
Description : ${projectPrompt}

FORMAT (Markdown uniquement) :
## Problem Statement & Solution
## User Stories
## Implementation Decisions (React+Vite+TS, HashRouter)
## Testing Decisions
## Out of Scope

Stack : React 18 + Vite 5 + TypeScript 5 + Tailwind 3.`;

    addLog("Phase 1 : Generation du PRD via GLM-4.6...");
    const res = await fetch("/api/deepseek/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectName, projectDescription: projectPrompt, phase: "prd" }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Echec PRD");
    addLog(`PRD genere (${data.prd.length} chars)`);
    return data.prd;
  }

  // Generate code using GLM-4.6
  async function generateCode(prdText: string): Promise<GeneratedFile[]> {
    const prompt = `Tu es un generateur de code React expert. Reponds UNIQUEMENT en JSON.

Projet : ${projectName}
PRD :
---
${prdText}
---

Genere TOUT le code source. Stack : React 18 + Vite + TS + Tailwind + HashRouter.
Fichiers : index.html, vite.config.ts, package.json, tsconfig.json, tailwind.config.ts, postcss.config.js, src/main.tsx, src/App.tsx, src/index.css, src/components/MainComponent.tsx

Format : {"files":[{"path":"...","content":"...","language":"..."}]}`;

    addLog("Phase 2 : Generation du code via GLM-4.6...");
    const res = await fetch("/api/deepseek/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectName, projectDescription: projectPrompt, phase: "code", prd: prdText }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Echec code");
    addLog(`${data.files.length} fichiers generes`);
    return data.files;
  }

  // Main: Generate everything in one click — PRD + Code
  async function handleGenerate() {
    if (!projectName.trim() || !projectPrompt.trim()) {
      toast.error("Nom et description requis");
      return;
    }

    setPhase("generating");
    setError("");
    setPrd("");
    setFiles([]);
    addLog(`Generation du projet "${projectName}" via GLM-4.6 (gratuit)...`);

    try {
      // Phase 1: PRD
      const prdText = await generatePrd();
      setPrd(prdText);
      setPhase("prd-done");

      // Phase 2: Code (automatic transition)
      setPhase("code-generating");
      const generatedFiles = await generateCode(prdText);
      setFiles(generatedFiles);
      setPhase("done");
      onFilesGenerated?.(generatedFiles, prdText);
      addLog(`Projet genere avec succes ! ${generatedFiles.length} fichiers`);
      toast.success(`${generatedFiles.length} fichiers generes !`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur";
      addLog(`Erreur: ${msg}`);
      setError(msg);
      setPhase("error");
      toast.error(msg);
    }
  }

  function handleReset() {
    setPhase("idle");
    setPrd("");
    setFiles([]);
    setLogs([]);
    setError("");
  }

  const phaseLabel: Record<Phase, string> = {
    idle: "Pret", generating: "Phase 1 — PRD", "prd-done": "Phase 1 — PRD pret",
    "code-generating": "Phase 2 — Code", done: "Termine", error: "Erreur",
  };
  const phaseColor: Record<Phase, string> = {
    idle: "border-slate-700 bg-slate-900/60 text-slate-400",
    generating: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    "prd-done": "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    "code-generating": "border-teal-500/30 bg-teal-500/10 text-teal-300",
    done: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    error: "border-rose-500/30 bg-rose-500/10 text-rose-300",
  };

  const isLoading = phase === "generating" || phase === "code-generating";

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-800 bg-slate-950/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-cyan-300" />
          <h2 className="text-base font-bold text-slate-100">DeepSeek Auto — GLM-4.6</h2>
          <Badge variant="outline" className={cn("ml-auto text-[10px]", phaseColor[phase])}>
            {isLoading && <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" />}
            {phaseLabel[phase]}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-slate-400">100% gratuit — GLM-4.6 integre, sans cle API, sans PC</p>
      </div>

      <div className="custom-scroll flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-3xl">
          {(phase === "idle" || phase === "error") && (
            <>
              <div className="mb-4 space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Nom du projet</label>
                  <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="ex: TaskFlow, RecipeBox..." className="border-slate-700 bg-slate-950/60 text-sm text-slate-100" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-300">Description / Vision</label>
                  <Textarea value={projectPrompt} onChange={(e) => setProjectPrompt(e.target.value)} placeholder="Decris ton application en detail..." rows={4} className="resize-none border-slate-700 bg-slate-950/60 text-sm text-slate-100" />
                </div>
                <Button
                  onClick={handleGenerate}
                  disabled={isLoading || !projectName.trim() || !projectPrompt.trim()}
                  className="w-full bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400"
                >
                  {isLoading ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generation en cours...</>
                  ) : (
                    <><Rocket className="mr-2 h-4 w-4" /> Generer le projet</>
                  )}
                </Button>
              </div>

              {error && (
                <div className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/5 p-3">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <div>
                      <p className="text-xs font-semibold text-rose-300">Erreur</p>
                      <p className="mt-1 text-[11px] text-slate-400">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-300">
                  <Zap className="h-3.5 w-3.5" /> 100% Gratuit — Sans cle API
                </p>
                <p className="text-xs text-slate-400">
                  Clique <strong className="text-slate-200">Generer le projet</strong> et l'IA GLM-4.6 fait tout :
                </p>
                <ol className="mt-2 space-y-1 text-xs text-slate-400">
                  <li>1. GLM-4.6 genere le PRD (document de requirements)</li>
                  <li>2. GLM-4.6 genere le code source complet (10+ fichiers)</li>
                  <li>3. Les fichiers sont sauvegardes dans le projet</li>
                </ol>
                <p className="mt-3 rounded-lg bg-cyan-500/10 p-2 text-[11px] text-cyan-300">
                  Aucune cle API, aucun DeepSeek, aucun PC requis. GLM-4.6 est integre dans React Forge.
                </p>
              </div>
            </>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="mb-4 h-12 w-12 animate-spin text-cyan-400" />
              <p className="text-sm font-medium text-slate-300">{phaseLabel[phase]}</p>
              <p className="mt-1 text-xs text-slate-500">
                {phase === "generating" ? "GLM-4.6 analyse ta demande (30-90s)..." : "GLM-4.6 ecrit les fichiers (60-120s)..."}
              </p>
            </div>
          )}

          {phase === "done" && (
            <>
              <div className="mb-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-center">
                <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-400" />
                <p className="text-sm font-semibold text-emerald-300">Projet genere !</p>
                <p className="mt-1 text-xs text-slate-400">{files.length} fichiers generes via GLM-4.6</p>
              </div>
              {prd && (
                <div className="mb-4">
                  <div className="mb-2 flex items-center gap-2"><FileText className="h-4 w-4 text-cyan-300" /><h3 className="text-sm font-semibold text-slate-200">PRD</h3></div>
                  <div className="custom-scroll max-h-32 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-2"><pre className="whitespace-pre-wrap text-[11px] text-slate-300">{prd}</pre></div>
                </div>
              )}
              <div className="mb-4">
                <div className="mb-2 flex items-center gap-2"><Code2 className="h-4 w-4 text-emerald-300" /><h3 className="text-sm font-semibold text-slate-200">Fichiers ({files.length})</h3></div>
                <div className="space-y-1.5">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 p-2"><Code2 className="h-3.5 w-3.5 text-cyan-400" /><span className="flex-1 truncate font-mono text-xs text-slate-200">{f.path}</span><span className="text-[10px] text-slate-500">{f.content.length}</span></div>
                  ))}
                </div>
              </div>
              <Button onClick={handleReset} variant="outline" className="w-full"><RefreshCw className="mr-2 h-3.5 w-3.5" /> Nouveau projet</Button>
            </>
          )}

          {logs.length > 0 && (
            <div className="mt-4">
              <div className="mb-1.5 flex items-center gap-2"><Zap className="h-3.5 w-3.5 text-cyan-300" /><h3 className="text-xs font-semibold text-slate-200">Logs</h3></div>
              <div className="custom-scroll max-h-32 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/60 p-2">
                {logs.map((l, i) => <p key={i} className="font-mono text-[10px] leading-relaxed text-slate-400">{l}</p>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
