"use client";

import { useEffect, useState } from "react";
import { Cpu, Zap, Cloud, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GpuStatus {
  available: boolean;
  backend: string;
  deviceName?: string;
  mode: string;
  active: boolean;
}

export function GpuBadge() {
  const [status, setStatus] = useState<GpuStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function check() {
      try {
        const res = await fetch("/api/gpu-status", { cache: "no-store" });
        const data = await res.json();
        if (mounted && data.success) {
          setStatus(data);
        }
      } catch {
        if (mounted) {
          setStatus({
            available: false,
            backend: "zai-cloud",
            mode: "auto",
            active: false,
          });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    check();
    // Check every 30s (not aggressive)
    const interval = setInterval(check, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-1.5 rounded-full border border-slate-800 bg-slate-900/40 px-2.5 py-1 text-[10px] text-slate-600">
        <Cpu className="h-3 w-3 animate-pulse" />
        <span>Vérification GPU…</span>
      </div>
    );
  }

  if (!status) return null;

  const isGpu = status.available && status.backend === "tensorrt-llm";
  const isCpu = status.backend === "cpu";
  const isCloud = status.backend === "zai-cloud" || status.backend === "remote";

  const config = {
    gpu: {
      icon: Zap,
      color: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
      label: status.deviceName
        ? `GPU: ${status.deviceName.slice(0, 20)}`
        : "GPU TensorRT-LLM",
    },
    cpu: {
      icon: Cpu,
      color: "border-amber-500/30 bg-amber-500/10 text-amber-300",
      label: "CPU Fallback",
    },
    cloud: {
      icon: Cloud,
      color: "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
      label: "Cloud (z-ai)",
    },
  };

  const current = isGpu ? config.gpu : isCpu ? config.cpu : config.cloud;
  const Icon = current.icon;

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium",
        current.color
      )}
      title={`Backend: ${status.backend} | Mode: ${status.mode}`}
    >
      <Icon className={cn("h-3 w-3", status.active && "animate-pulse")} />
      <span className="hidden sm:inline">{current.label}</span>
      <span className="sm:hidden">
        {isGpu ? "GPU" : isCpu ? "CPU" : "Cloud"}
      </span>
      {status.active && (
        <span className="ml-0.5 h-1.5 w-1.5 animate-pulse rounded-full bg-current" />
      )}
    </div>
  );
}
