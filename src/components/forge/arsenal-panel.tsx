"use client";

import { useState, memo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  ChevronRight,
  ChevronDown,
  Target,
  Boxes,
  Palette,
  Database,
  ShieldCheck,
  Globe,
  Sparkles,
  FlaskConical,
  Rocket,
  TrendingUp,
} from "lucide-react";
import { Markdown } from "@/components/forge/markdown";
import { cn } from "@/lib/utils";

interface ArsenalDocument {
  id: string;
  name: string;
  filename: string;
  role: string;
  content: string;
}

const DOC_ICONS: Record<string, typeof Target> = {
  vision: Target,
  architecture: Boxes,
  interface: Palette,
  database: Database,
  security: ShieldCheck,
  api: Globe,
  ux: Sparkles,
  tests: FlaskConical,
  deployment: Rocket,
  maintenance: TrendingUp,
};

// Memoized — arsenal is a stable reference from the store unless the project
// is re-fetched, so this skips re-render on tab switches / polling.
export const ArsenalPanel = memo(function ArsenalPanel({ arsenal }: { arsenal: { documents: ArsenalDocument[] } | null }) {
  const [activeId, setActiveId] = useState<string>("vision");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  if (!arsenal?.documents || arsenal.documents.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-center">
        <div>
          <FileText className="mx-auto mb-3 h-10 w-10 text-slate-700" />
          <p className="text-sm text-slate-500">
            Arsenal PRD non disponible pour ce projet.
          </p>
        </div>
      </div>
    );
  }

  const activeDoc = arsenal.documents.find((d) => d.id === activeId) ?? arsenal.documents[0];

  return (
    <div className="flex h-full">
      {/* Sidebar — list of 10 documents */}
      <div
        className={cn(
          "flex shrink-0 flex-col border-r border-slate-800 bg-slate-950/60 transition-all",
          sidebarOpen ? "w-64" : "w-12"
        )}
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2.5">
          {sidebarOpen && (
            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Arsenal PRD ({arsenal.documents.length})
            </p>
          )}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="rounded p-1 text-slate-500 transition hover:bg-slate-800 hover:text-slate-300"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? (
              <ChevronDown className="h-3.5 w-3.5 rotate-90" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
        <div className="custom-scroll flex-1 overflow-y-auto p-1.5">
          {arsenal.documents.map((doc, i) => {
            const Icon = DOC_ICONS[doc.id] ?? FileText;
            const isActive = doc.id === activeId;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveId(doc.id)}
                className={cn(
                  "mb-0.5 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left transition",
                  isActive
                    ? "bg-cyan-500/10 text-cyan-200 ring-1 ring-cyan-500/30"
                    : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
                  !sidebarOpen && "justify-center"
                )}
                title={!sidebarOpen ? doc.name : undefined}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 shrink-0",
                    isActive ? "text-cyan-300" : "text-slate-500"
                  )}
                />
                {sidebarOpen && (
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium">
                      {i + 1}. {doc.name}
                    </p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content — active document */}
      <div className="custom-scroll min-w-0 flex-1 overflow-y-auto bg-slate-950/40">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeDoc.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mx-auto max-w-3xl p-6"
          >
            {/* Header */}
            <div className="mb-4 flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
                {(() => {
                  const Icon = DOC_ICONS[activeDoc.id] ?? FileText;
                  return <Icon className="h-5 w-5 text-cyan-300" />;
                })()}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold text-slate-100">
                  {activeDoc.name}
                </h2>
                <p className="mt-0.5 text-xs text-slate-500">{activeDoc.role}</p>
              </div>
              <span className="rounded bg-slate-800 px-2 py-1 font-mono text-[10px] text-slate-400">
                {activeDoc.filename}
              </span>
            </div>

            {/* Content */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <Markdown content={activeDoc.content} />
            </div>

            {/* Footer — navigation */}
            <div className="mt-4 flex items-center justify-between border-t border-slate-800 pt-3">
              {(() => {
                const idx = arsenal.documents.findIndex((d) => d.id === activeId);
                const prev = idx > 0 ? arsenal.documents[idx - 1] : null;
                const next = idx < arsenal.documents.length - 1 ? arsenal.documents[idx + 1] : null;
                return (
                  <>
                    {prev ? (
                      <button
                        onClick={() => setActiveId(prev.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-300"
                      >
                        <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                        {prev.name}
                      </button>
                    ) : (
                      <span />
                    )}
                    {next ? (
                      <button
                        onClick={() => setActiveId(next.id)}
                        className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-1.5 text-xs text-slate-400 transition hover:border-cyan-500/40 hover:text-cyan-300"
                      >
                        {next.name}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <span />
                    )}
                  </>
                );
              })()}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
});
