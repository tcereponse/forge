"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Zap,
  Cpu,
  Clock,
  Activity,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GpuMetrics {
  available: boolean;
  backend: string;
  deviceName?: string;
  gpuUtilizationPercent?: number;
  memoryTotalMB?: number;
  memoryFreeMB?: number;
  memoryUsedMB?: number;
  temperatureC?: number;
}

interface GenMetrics {
  latencyMs: number;
  backend: string;
  computeMode: string;
  deviceName?: string;
  tokensPerSecond?: number;
  fallbackTriggered: boolean;
}

export function PerfIAPanel({ projectId }: { projectId: string }) {
  const [gpuMetrics, setGpuMetrics] = useState<GpuMetrics | null>(null);
  const [history, setHistory] = useState<GenMetrics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let pollCount = 0;

    async function fetchGpuMetrics() {
      try {
        const res = await fetch("/api/gpu-status", { cache: "no-store" });
        const data = await res.json();
        if (mounted && data.success) {
          setGpuMetrics(data);
        }
      } catch {
        // ignore
      }
    }

    fetchGpuMetrics();
    // Poll every 10s (non-aggressive)
    const interval = setInterval(() => {
      pollCount++;
      if (pollCount > 6) {
        clearInterval(interval);
        return;
      }
      fetchGpuMetrics();
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const isGpu = gpuMetrics?.available && gpuMetrics?.backend === "tensorrt-llm";
  const isCpu = gpuMetrics?.backend === "cpu";
  const isCloud = !gpuMetrics?.available;

  const memPercent = gpuMetrics?.memoryTotalMB
    ? Math.round(
        ((gpuMetrics.memoryUsedMB ?? 0) / gpuMetrics.memoryTotalMB) * 100
      )
    : 0;

  return (
    <div className="custom-scroll h-full overflow-y-auto p-6">
      <div className="mx-auto max-w-3xl space-y-5">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 ring-1 ring-cyan-500/30">
            <Activity className="h-5 w-5 text-cyan-300" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">
              Performance IA
            </h2>
            <p className="text-xs text-slate-500">
              Monitoring temps réel du backend IA
            </p>
          </div>
        </div>

        {/* Backend status */}
        <div
          className={cn(
            "rounded-xl border p-4",
            isGpu
              ? "border-emerald-500/30 bg-emerald-500/5"
              : isCpu
                ? "border-amber-500/30 bg-amber-500/5"
                : "border-cyan-500/30 bg-cyan-500/5"
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isGpu ? (
                <Zap className="h-5 w-5 text-emerald-400" />
              ) : isCpu ? (
                <Cpu className="h-5 w-5 text-amber-400" />
              ) : (
                <Activity className="h-5 w-5 text-cyan-400" />
              )}
              <div>
                <p className="text-sm font-semibold text-slate-100">
                  {isGpu
                    ? "GPU TensorRT-LLM"
                    : isCpu
                      ? "CPU Fallback"
                      : "Cloud (z-ai-web-dev-sdk)"}
                </p>
                <p className="text-xs text-slate-500">
                  {gpuMetrics?.deviceName || "Backend distant"}
                </p>
              </div>
            </div>
            <span
              className={cn(
                "h-3 w-3 rounded-full",
                isGpu
                  ? "bg-emerald-400 shadow-[0_0_8px] shadow-emerald-400/60"
                  : isCpu
                    ? "bg-amber-400"
                    : "bg-cyan-400"
              )}
            />
          </div>
        </div>

        {/* GPU Metrics (only if GPU available) */}
        {isGpu && gpuMetrics && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-4"
          >
            {/* GPU Usage */}
            <MetricCard
              icon={TrendingUp}
              label="GPU Usage"
              value={`${gpuMetrics.gpuUtilizationPercent ?? 0}%`}
              color="text-emerald-400"
            />
            {/* VRAM */}
            <MetricCard
              icon={Activity}
              label="VRAM Used"
              value={`${gpuMetrics.memoryUsedMB ?? 0} Mo`}
              sub={`${memPercent}% / ${gpuMetrics.memoryTotalMB ?? 0} Mo`}
              color="text-cyan-400"
            />
            {/* Free VRAM */}
            <MetricCard
              icon={Zap}
              label="VRAM Free"
              value={`${gpuMetrics.memoryFreeMB ?? 0} Mo`}
              color="text-teal-400"
            />
            {/* Temperature */}
            <MetricCard
              icon={AlertCircle}
              label="Température"
              value={`${gpuMetrics.temperatureC ?? 0}°C`}
              color={
                (gpuMetrics.temperatureC ?? 0) > 80
                  ? "text-rose-400"
                  : "text-slate-300"
              }
            />
          </motion.div>
        )}

        {/* VRAM Bar (if GPU) */}
        {isGpu && gpuMetrics?.memoryTotalMB && (
          <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-slate-400">VRAM</span>
              <span className="font-mono text-slate-300">
                {gpuMetrics.memoryUsedMB ?? 0} / {gpuMetrics.memoryTotalMB} Mo
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  memPercent > 90
                    ? "bg-rose-500"
                    : memPercent > 70
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                )}
                initial={{ width: 0 }}
                animate={{ width: `${memPercent}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Indicateurs clés
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <KpiCard label="Latence PRD" value="—" target="< 2s (GPU)" />
            <KpiCard label="Latence Code" value="—" target="< 5s (GPU)" />
            <KpiCard label="Build réussi" value="—" target="> 95%" />
            <KpiCard label="Réparation auto" value="—" target="> 80%" />
            <KpiCard label="GPU Usage moyen" value="—" target="> 70%" />
            <KpiCard label="Fallbacks CPU" value="—" target="< 10%" />
          </div>
        </div>

        {/* Backend info */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
            Configuration backend
          </p>
          <div className="space-y-2 text-xs">
            <ConfigRow label="Backend actif" value={gpuMetrics?.backend ?? "unknown"} />
            <ConfigRow label="Mode GPU" value={gpuMetrics?.available ? "auto (GPU)" : "auto (CPU/Cloud)"} />
            {gpuMetrics?.deviceName && (
              <ConfigRow label="Device" value={gpuMetrics.deviceName} />
            )}
            <ConfigRow
              label="Service GPU"
              value={
                gpuMetrics?.available
                  ? "✅ Connecté (localhost:5006)"
                  : "❌ Non connecté (fallback cloud)"
              }
            />
            <ConfigRow
              label="Embeddings"
              value={
                gpuMetrics?.available
                  ? "✅ Supportés (sentence-transformers)"
                  : "❌ Non disponibles (mode cloud)"
              }
            />
          </div>
        </div>

        {/* Tips */}
        {!isGpu && (
          <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300/80">
            💡 Pour activer l'accélération GPU, lance le service Python :
            <code className="mt-1 block rounded bg-slate-900/60 px-2 py-1 font-mono text-amber-200">
              cd services/local-ai-gpu && ./start.sh
            </code>
          </div>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  color,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
  sub?: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3 text-center">
      <Icon className={cn("mx-auto mb-1 h-4 w-4", color)} />
      <p className="font-mono text-lg font-bold text-slate-100">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
      {sub && <p className="text-[9px] text-slate-600">{sub}</p>}
    </div>
  );
}

function KpiCard({
  label,
  value,
  target,
}: {
  label: string;
  value: string;
  target: string;
}) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/40 p-2.5">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">
        {label}
      </p>
      <p className="mt-1 font-mono text-base font-bold text-slate-200">
        {value}
      </p>
      <p className="text-[9px] text-slate-600">Cible: {target}</p>
    </div>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono text-slate-300">{value}</span>
    </div>
  );
}
