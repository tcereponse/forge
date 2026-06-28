"use client";

import { motion } from "framer-motion";
import {
  Globe,
  ArrowLeftRight,
  ServerCog,
  MessageSquareText,
  ShieldCheck,
  Activity,
  Database,
  Cpu,
  Eye,
  Layers,
} from "lucide-react";
import { SectionWrapper } from "./section-wrapper";
import { useExtensionData } from "@/hooks/use-extension-data";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const FLOW_NODES = [
  {
    id: "ai-platforms",
    title: "Plateformes d’IA",
    subtitle: "DeepSeek · ChatGPT · Gemini",
    icon: Globe,
    color: "text-cyan-300",
    ring: "ring-cyan-500/30",
    bg: "from-cyan-500/10 to-cyan-500/5",
  },
  {
    id: "content",
    title: "Content Script",
    subtitle: "content.js · injecté dans la page",
    icon: MessageSquareText,
    color: "text-teal-300",
    ring: "ring-teal-500/30",
    bg: "from-teal-500/10 to-teal-500/5",
  },
  {
    id: "bridge",
    title: "Bridge Client",
    subtitle: "Polling · Circuit Breaker · Queue",
    icon: ArrowLeftRight,
    color: "text-emerald-300",
    ring: "ring-emerald-500/30",
    bg: "from-emerald-500/10 to-emerald-500/5",
  },
  {
    id: "server",
    title: "Serveur Local",
    subtitle: "127.0.0.1:5005 · Forge",
    icon: ServerCog,
    color: "text-amber-300",
    ring: "ring-amber-500/30",
    bg: "from-amber-500/10 to-amber-500/5",
  },
];

const MODULE_ICONS: Record<string, typeof Eye> = {
  KirovLogger: Activity,
  EventBus: ArrowLeftRight,
  StateManager: Database,
  BridgeClient: ArrowLeftRight,
  PlatformDetector: Globe,
  PromptEngine: MessageSquareText,
  ValidationOrchestrator: ShieldCheck,
  OutputScanner: Eye,
  UIRenderer: Layers,
};

export function BridgeSection() {
  const { loading, analysis } = useExtensionData();

  return (
    <SectionWrapper
      id="bridge"
      pillar="Pilier 1 · Bridge"
      title="L’extension comme pont entre le navigateur et l’IA"
      subtitle="Dans KIROV3, le content script injecté sur les plateformes d’IA communique avec un service worker (background.js) qui relaie les requêtes réseau pour contourner CSP. Un Bridge Client résilient orchestre le polling, gère les échecs via un Circuit Breaker, et persiste une file d’attente hors-ligne."
    >
      {/* Architecture flow */}
      <div className="mb-14">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {FLOW_NODES.map((node, i) => {
            const Icon = node.icon;
            return (
              <div key={node.id} className="relative">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12 }}
                  className={`h-full rounded-xl border border-slate-800 bg-gradient-to-br ${node.bg} p-5 ring-1 ${node.ring}`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950/60 ${node.color}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="font-semibold text-slate-100">{node.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{node.subtitle}</p>
                </motion.div>
                {/* Connector arrow */}
                {i < FLOW_NODES.length - 1 && (
                  <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 md:block">
                    <ArrowLeftRight className="h-4 w-4 text-slate-600" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bidirectional flow note */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              dir: "→",
              label: "Polling descendant",
              detail:
                "GET /v1/bridge/poll récupère la phase courante et le prompt à injecter",
            },
            {
              dir: "←",
              label: "Capture montante",
              detail:
                "POST /v1/bridge/callback renvoie la sortie IA validée au serveur",
            },
            {
              dir: "↔",
              label: "Relais background",
              detail:
                "chrome.runtime.onMessage FETCH contourne CSP / Mixed-Content",
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-slate-800 bg-slate-950/40 p-3"
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-lg text-cyan-300">
                  {item.dir}
                </span>
                <p className="text-sm font-medium text-slate-200">
                  {item.label}
                </p>
              </div>
              <p className="mt-1 text-xs text-slate-500">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Manifest V3 permissions */}
      <div className="mb-14 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-100">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              Permissions déclarées
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {loading ? (
              <p className="text-xs text-slate-500">Chargement…</p>
            ) : (
              (analysis?.permissions ?? []).map((p) => (
                <Badge
                  key={p}
                  variant="outline"
                  className="border-cyan-500/30 bg-cyan-500/10 font-mono text-xs text-cyan-200"
                >
                  {p}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-800 bg-slate-900/40">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base text-slate-100">
              <Globe className="h-4 w-4 text-teal-300" />
              Host permissions
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {loading ? (
              <p className="text-xs text-slate-500">Chargement…</p>
            ) : (
              (analysis?.hostPermissions ?? []).map((h) => (
                <Badge
                  key={h}
                  variant="outline"
                  className="border-teal-500/30 bg-teal-500/10 font-mono text-xs text-teal-200"
                >
                  {h}
                </Badge>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modules grid */}
      <div>
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-100">
          <Cpu className="h-5 w-5 text-cyan-300" />
          Architecture modulaire de{" "}
          <span className="font-mono text-cyan-300">content.js</span>
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(analysis?.modules ?? []).map((m, i) => {
            const Icon = MODULE_ICONS[m.name] ?? Cpu;
            return (
              <motion.div
                key={m.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                className="group rounded-xl border border-slate-800 bg-slate-950/40 p-4 transition hover:border-cyan-500/40 hover:bg-slate-900/60"
              >
                <div className="mb-2 flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-slate-900 text-cyan-300 ring-1 ring-slate-800 group-hover:ring-cyan-500/30">
                    <Icon className="h-4 w-4" />
                  </div>
                  <p className="font-mono text-sm font-semibold text-slate-100">
                    {m.name}
                  </p>
                </div>
                <p className="text-xs font-medium text-cyan-300/80">{m.role}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-400">
                  {m.pattern}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </SectionWrapper>
  );
}
