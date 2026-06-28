"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Globe,
  FileText,
  Loader2,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Clock,
  Zap,
} from "lucide-react";
import { SectionWrapper } from "./section-wrapper";
import { Markdown } from "./markdown";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface SearchResult {
  position: number;
  title: string;
  url: string;
  snippet: string;
  domain: string;
  date: string;
}

interface SummaryResult {
  url: string;
  title: string;
  publishedTime?: string;
  summary: string;
  extractedLength?: number;
  aiPowered: boolean;
}

const SEARCH_PRESETS = [
  "Chrome Manifest V3 extensions AI",
  "content script DOM injection technique",
  "browser extension copilot automation",
];

const SUMMARIZE_PRESETS = [
  "https://developer.chrome.com/docs/extensions/mv3/intro/",
  "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts",
];

export function NavigationSection() {
  // Search state
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searchMeta, setSearchMeta] = useState<{
    query: string;
    count: number;
  } | null>(null);

  // Summarize state
  const [url, setUrl] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [summary, setSummary] = useState<SummaryResult | null>(null);

  async function runSearch(q?: string) {
    const finalQuery = (q ?? query).trim();
    if (!finalQuery) {
      toast.error("Saisis une requête de recherche");
      return;
    }
    if (q) setQuery(q);
    setSearching(true);
    setResults([]);
    setSearchMeta(null);
    try {
      const res = await fetch("/api/ai-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: finalQuery, num: 6 }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setResults(data.results);
      setSearchMeta({ query: data.query, count: data.count });
      toast.success(`${data.count} résultats trouvés`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec de la recherche");
    } finally {
      setSearching(false);
    }
  }

  async function runSummarize(u?: string) {
    const finalUrl = (u ?? url).trim();
    if (!finalUrl) {
      toast.error("Saisis une URL à résumer");
      return;
    }
    if (u) setUrl(u);
    setSummarizing(true);
    setSummary(null);
    try {
      const res = await fetch("/api/summarize-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: finalUrl }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSummary(data);
      toast.success("Page analysée et résumée");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Échec du résumé");
    } finally {
      setSummarizing(false);
    }
  }

  return (
    <SectionWrapper
      id="navigation"
      pillar="Pilier 2 · Navigation & Recherche IA"
      title="Analyser le web en temps réel grâce à l’IA"
      subtitle="KIROV3 utilise un OutputScanner (MutationObserver) pour capturer dynamiquement la sortie des IA. Ce pilier illustre comment une extension peut enrichir la navigation : recherche web augmentée et résumé automatique de n’importe quelle page — exactement comme le fait le content script de KIROV3 avec les réponses des LLM."
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* AI Search */}
        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base text-slate-100">
              <Search className="h-4 w-4 text-cyan-300" />
              Recherche Web Augmentée
            </CardTitle>
            <p className="text-xs text-slate-500">
              Skill{" "}
              <span className="font-mono text-cyan-300">web_search</span> du SDK
              z-ai-web-dev
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSearch()}
                placeholder="Rechercher sur le web…"
                className="border-slate-700 bg-slate-950/60 font-mono text-sm text-slate-100 placeholder:text-slate-600 focus-visible:ring-cyan-500/40"
              />
              <Button
                onClick={() => runSearch()}
                disabled={searching}
                className="shrink-0 bg-gradient-to-r from-cyan-500 to-teal-500 text-slate-950 hover:from-cyan-400 hover:to-teal-400"
              >
                {searching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SEARCH_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => runSearch(p)}
                  disabled={searching}
                  className="rounded-full border border-slate-700 bg-slate-950/40 px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-300 disabled:opacity-50"
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="max-h-[420px] space-y-2 overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/40 p-2 custom-scroll">
              <AnimatePresence mode="wait">
                {searching && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500"
                  >
                    <Loader2 className="h-4 w-4 animate-spin text-cyan-400" />
                    Recherche en cours…
                  </motion.div>
                )}

                {!searching && searchMeta && results.length === 0 && (
                  <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
                    <AlertCircle className="h-4 w-4" />Aucun résultat pour «{" "}
                    {searchMeta.query} »
                  </div>
                )}

                {!searching &&
                  results.map((r) => (
                    <motion.a
                      key={r.url}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="block rounded-lg border border-slate-800 bg-slate-900/50 p-3 transition hover:border-cyan-500/40 hover:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/15 font-mono text-[10px] font-bold text-cyan-300">
                            {r.position}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {r.domain}
                          </span>
                          {r.date && (
                            <span className="flex items-center gap-1 text-[10px] text-slate-600">
                              <Clock className="h-2.5 w-2.5" />
                              {r.date}
                            </span>
                          )}
                        </div>
                        <ExternalLink className="h-3 w-3 shrink-0 text-slate-600" />
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-slate-200 group-hover:text-cyan-300">
                        {r.title}
                      </p>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-400">
                        {r.snippet}
                      </p>
                    </motion.a>
                  ))}

                {!searching && !searchMeta && (
                  <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-slate-600">
                    <Globe className="h-8 w-8 text-slate-700" />
                    Lance une recherche pour voir les résultats enrichis
                  </div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* URL Summarizer */}
        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-base text-slate-100">
              <FileText className="h-4 w-4 text-teal-300" />
              Résumé de Page (Reader + LLM)
            </CardTitle>
            <p className="text-xs text-slate-500">
              Skills{" "}
              <span className="font-mono text-teal-300">page_reader</span> +{" "}
              <span className="font-mono text-cyan-300">chat.completions</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runSummarize()}
                placeholder="https://exemple.com/article"
                className="border-slate-700 bg-slate-950/60 font-mono text-xs text-slate-100 placeholder:text-slate-600 focus-visible:ring-teal-500/40"
              />
              <Button
                onClick={() => runSummarize()}
                disabled={summarizing}
                className="shrink-0 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:from-teal-400 hover:to-emerald-400"
              >
                {summarizing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SUMMARIZE_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => runSummarize(p)}
                  disabled={summarizing}
                  className="max-w-full truncate rounded-full border border-slate-700 bg-slate-950/40 px-2.5 py-1 text-[11px] text-slate-400 transition hover:border-teal-500/40 hover:text-teal-300 disabled:opacity-50"
                >
                  {p.replace(/^https?:\/\//, "").slice(0, 32)}…
                </button>
              ))}
            </div>

            <div className="max-h-[420px] overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/40 p-3 custom-scroll">
              <AnimatePresence mode="wait">
                {summarizing && (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex flex-col items-center gap-3 py-10 text-sm text-slate-500"
                  >
                    <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
                    Lecture et synthèse de la page…
                  </motion.div>
                )}

                {!summarizing && summary && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2 border-b border-slate-800 pb-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-100">
                          {summary.title}
                        </p>
                        <a
                          href={summary.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-0.5 flex items-center gap-1 text-[11px] text-teal-400 hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          {summary.url}
                        </a>
                      </div>
                      {summary.aiPowered && (
                        <Badge
                          variant="outline"
                          className="shrink-0 border-teal-500/30 bg-teal-500/10 text-[10px] text-teal-300"
                        >
                          <Zap className="mr-1 h-2.5 w-2.5" />
                          IA
                        </Badge>
                      )}
                    </div>
                    <Markdown content={summary.summary} />
                    {summary.extractedLength ? (
                      <p className="mt-3 border-t border-slate-800 pt-2 text-[10px] text-slate-600">
                        {summary.extractedLength.toLocaleString("fr-FR")}{" "}
                        caractères extraits
                        {summary.publishedTime
                          ? ` · publié le ${new Date(summary.publishedTime).toLocaleDateString("fr-FR")}`
                          : ""}
                      </p>
                    ) : null}
                  </motion.div>
                )}

                {!summarizing && !summary && (
                  <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-slate-600">
                    <FileText className="h-8 w-8 text-slate-700" />
                    Colle une URL — l’IA va l’extraire et la résumer
                  </div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>
    </SectionWrapper>
  );
}
