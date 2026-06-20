"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  FileJson,
  FileCode2,
  FileText,
  Sparkles,
  Loader2,
  Copy,
  Check,
  Wand2,
  AlertCircle,
} from "lucide-react";
import { SectionWrapper } from "./section-wrapper";
import { Markdown } from "./markdown";
import { useExtensionData } from "@/hooks/use-extension-data";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const FILE_ICONS: Record<string, typeof FileCode2> = {
  "manifest.json": FileJson,
  "background.js": FileCode2,
  "content.js": FileCode2,
  "popup.html": FileText,
  "popup.js": FileCode2,
};

export function CodeExplorerSection() {
  const { loading, files } = useExtensionData();
  const [activeFile, setActiveFile] = useState<string>("content.js");
  const [copied, setCopied] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const current = useMemo(
    () => files.find((f) => f.name === activeFile),
    [files, activeFile]
  );

  useEffect(() => {
    setExplanation(null);
  }, [activeFile]);

  async function explain() {
    if (!current) return;
    setExplaining(true);
    setExplanation(null);
    try {
      const res = await fetch("/api/explain-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: current.name }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setExplanation(data.explanation);
      toast.success("Explication IA générée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de l’explication");
    } finally {
      setExplaining(false);
    }
  }

  async function copyCode() {
    if (!current) return;
    try {
      await navigator.clipboard.writeText(current.content);
      setCopied(true);
      toast.success("Code copié dans le presse-papier");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier");
    }
  }

  const lineCount = current?.content.split("\n").length ?? 0;
  const Icon = current ? FILE_ICONS[current.name] ?? FileCode2 : FileCode2;

  return (
    <SectionWrapper
      id="code-explorer"
      pillar="Code Source"
      title="Explorateur du code KIROV3"
      subtitle="Parcours les 5 fichiers réels de l’extension extraite du fichier GLOBAL_KIROV3.rar. Visualise le code avec coloration syntaxique, copie-le, ou demande à l’IA de l’expliquer point par point."
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* File sidebar */}
        <div className="lg:col-span-3">
          <Card className="border-slate-800 bg-slate-900/40">
            <CardContent className="p-3">
              <p className="mb-2 px-2 text-[10px] uppercase tracking-widest text-slate-500">
                GLOBAL_KIROV3/
              </p>
              <div className="space-y-1">
                {loading ? (
                  [1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="h-10 animate-pulse rounded-md bg-slate-800/40"
                    />
                  ))
                ) : (
                  files.map((f) => {
                    const FIcon = FILE_ICONS[f.name] ?? FileCode2;
                    const isActive = f.name === activeFile;
                    return (
                      <button
                        key={f.name}
                        onClick={() => setActiveFile(f.name)}
                        className={`flex w-full items-center gap-2.5 rounded-md border px-3 py-2 text-left transition ${
                          isActive
                            ? "border-cyan-500/40 bg-cyan-500/10"
                            : "border-transparent hover:border-slate-700 hover:bg-slate-800/40"
                        }`}
                      >
                        <FIcon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? "text-cyan-300" : "text-slate-500"
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p
                            className={`truncate font-mono text-xs ${
                              isActive ? "text-slate-100" : "text-slate-400"
                            }`}
                          >
                            {f.name}
                          </p>
                          <p className="text-[10px] text-slate-600">
                            {(f.size / 1024).toFixed(1)} Ko ·{" "}
                            {f.content.split("\n").length} lignes
                          </p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>

          {current && (
            <div className="mt-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">
                Rôle du fichier
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                {current.description}
              </p>
            </div>
          )}
        </div>

        {/* Code viewer */}
        <div className="lg:col-span-9">
          <Card className="border-slate-800 bg-slate-950/60">
            <CardContent className="p-0">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-cyan-300" />
                  <span className="font-mono text-sm text-slate-200">
                    {current?.name ?? "—"}
                  </span>
                  <Badge
                    variant="outline"
                    className="border-slate-700 bg-slate-900/60 font-mono text-[10px] text-slate-400"
                  >
                    {current?.language}
                  </Badge>
                  <span className="hidden text-[10px] text-slate-600 sm:inline">
                    {lineCount} lignes
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyCode}
                    disabled={!current}
                    className="h-8 text-slate-400 hover:text-slate-200"
                  >
                    {copied ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                    <span className="ml-1.5 hidden text-xs sm:inline">
                      {copied ? "Copié" : "Copier"}
                    </span>
                  </Button>
                  <Button
                    onClick={explain}
                    disabled={explaining || !current}
                    size="sm"
                    className="h-8 bg-gradient-to-r from-cyan-500 to-teal-500 text-xs text-slate-950 hover:from-cyan-400 hover:to-teal-400"
                  >
                    {explaining ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Wand2 className="h-3.5 w-3.5" />
                    )}
                    <span className="ml-1.5">
                      {explaining ? "IA…" : "Expliquer avec l’IA"}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Code */}
              <div className="custom-scroll max-h-[560px] overflow-auto">
                {current ? (
                  <SyntaxHighlighter
                    language={current.language}
                    style={oneDark}
                    showLineNumbers
                    wrapLongLines={false}
                    customStyle={{
                      margin: 0,
                      background: "transparent",
                      fontSize: "12px",
                      padding: "16px",
                    }}
                    lineNumberStyle={{
                      color: "#475569",
                      minWidth: "2.5em",
                      paddingRight: "1em",
                      userSelect: "none",
                    }}
                  >
                    {current.content}
                  </SyntaxHighlighter>
                ) : (
                  <div className="flex items-center justify-center py-20 text-sm text-slate-600">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Chargement du code…
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Explanation */}
          <AnimatePresence>
            {explaining && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className="flex items-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/5 px-4 py-3 text-sm text-cyan-300">
                  <Sparkles className="h-4 w-4 animate-pulse" />
                  L’IA analyse{" "}
                  <span className="font-mono">{current?.name}</span>…
                </div>
              </motion.div>
            )}

            {explanation && !explaining && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-lg border border-slate-800 bg-slate-900/60 p-4"
              >
                <div className="mb-3 flex items-center gap-2 border-b border-slate-800 pb-2">
                  <Sparkles className="h-4 w-4 text-cyan-300" />
                  <span className="text-sm font-semibold text-slate-100">
                    Explication IA de{" "}
                    <span className="font-mono text-cyan-300">
                      {current?.name}
                    </span>
                  </span>
                </div>
                <Markdown content={explanation} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </SectionWrapper>
  );
}
