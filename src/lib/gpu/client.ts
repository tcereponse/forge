// GPU Service Client
import { ensureZaiConfig } from "@/lib/zai-config";
// Communicates with the local Python TensorRT-LLM service (Phase 3)
// Falls back to z-ai-web-dev-sdk if the GPU service is unavailable.

import ZAI from "z-ai-web-dev-sdk";
import {
  type AiServiceConfig,
  type GpuCapabilities,
  type GpuMode,
  type IPrdGenerator,
  type ICodeGenerator,
  type IRepairEngine,
  type PrdGenerateRequest,
  type PrdGenerateResponse,
  type CodeGenerateRequest,
  type CodeGenerateResponse,
  type RepairRequest,
  type RepairResponse,
  type GenerationMetrics,
  DEFAULT_AI_CONFIG,
} from "./types";

// ── Fallback capabilities (when GPU service is down) ─────────────
const CLOUD_CAPABILITIES: GpuCapabilities = {
  gpuAvailable: false,
  backend: "zai-cloud",
  supportsEmbeddings: false,
  supportsCodegen: true,
  supportsPRD: true,
  supportsRepair: true,
  fallbackMode: "zai-cloud",
  modelLoaded: true,
};

// ── GPU Service Client ───────────────────────────────────────────
export class GpuServiceClient implements IPrdGenerator, ICodeGenerator, IRepairEngine {
  private config: AiServiceConfig;
  private capabilities: GpuCapabilities | null = null;
  private lastCheck: number = 0;
  private readonly CACHE_TTL = 5000; // 5s cache for capabilities

  constructor(config: Partial<AiServiceConfig> = {}) {
    this.config = { ...DEFAULT_AI_CONFIG, ...config };
  }

  // Check if the GPU service is available
  async getCapabilities(): Promise<GpuCapabilities> {
    // Use cached capabilities if fresh
    if (this.capabilities && Date.now() - this.lastCheck < this.CACHE_TTL) {
      return this.capabilities;
    }

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);
      const res = await fetch(`${this.config.url}/v1/health`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const capsRes = await fetch(`${this.config.url}/v1/capabilities`, {
        signal: controller.signal,
      });
      const data = await capsRes.json();

      this.capabilities = {
        gpuAvailable: data.gpuAvailable ?? false,
        backend: data.backend ?? "cpu",
        deviceName: data.deviceName,
        memoryTotalMB: data.memoryTotalMB,
        memoryFreeMB: data.memoryFreeMB,
        supportsEmbeddings: data.supportsEmbeddings ?? false,
        supportsCodegen: data.supportsCodegen ?? true,
        supportsPRD: data.supportsPRD ?? true,
        supportsRepair: data.supportsRepair ?? true,
        fallbackMode: data.fallbackMode ?? "cpu",
        modelLoaded: data.modelLoaded ?? false,
      };
      this.lastCheck = Date.now();
      return this.capabilities;
    } catch {
      // GPU service unavailable — use cloud fallback
      this.capabilities = CLOUD_CAPABILITIES;
      this.lastCheck = Date.now();
      return this.capabilities;
    }
  }

  // Decide whether to use GPU or fallback
  private async shouldUseGpu(): Promise<{ useGpu: boolean; reason?: string }> {
    const caps = await this.getCapabilities();

    if (this.config.gpuMode === "cpu-only") {
      return { useGpu: false, reason: "cpu-only mode" };
    }
    if (this.config.gpuMode === "remote") {
      return { useGpu: false, reason: "remote mode" };
    }
    if (this.config.gpuMode === "gpu-only" && !caps.gpuAvailable) {
      throw new Error("GPU required but not available");
    }
    // auto mode
    if (!caps.gpuAvailable || !caps.modelLoaded) {
      return { useGpu: false, reason: "GPU not available or model not loaded" };
    }
    return { useGpu: true };
  }

  // ── PRD Generation ─────────────────────────────────────────────
  async generate(request: PrdGenerateRequest): Promise<PrdGenerateResponse> {
    const { useGpu, reason } = await this.shouldUseGpu();

    if (useGpu) {
      try {
        return await this.callGpuService<PrdGenerateResponse>(
          "/v1/prd/generate",
          request
        );
      } catch (err) {
        console.warn("[GPU] PRD generation failed, falling back to cloud:", err);
        return this.fallbackPrdGeneration(request, reason ?? "GPU error");
      }
    }

    return this.fallbackPrdGeneration(request, reason ?? "GPU not available");
  }

  // ── Code Generation ────────────────────────────────────────────
  async generateCode(request: CodeGenerateRequest): Promise<CodeGenerateResponse> {
    const { useGpu, reason } = await this.shouldUseGpu();

    if (useGpu) {
      try {
        return await this.callGpuService<CodeGenerateResponse>(
          "/v1/code/generate",
          request
        );
      } catch (err) {
        console.warn("[GPU] Code generation failed, falling back to cloud:", err);
        return this.fallbackCodeGeneration(request, reason ?? "GPU error");
      }
    }

    return this.fallbackCodeGeneration(request, reason ?? "GPU not available");
  }

  // ── Repair ─────────────────────────────────────────────────────
  async repair(request: RepairRequest): Promise<RepairResponse> {
    const { useGpu, reason } = await this.shouldUseGpu();

    if (useGpu) {
      try {
        return await this.callGpuService<RepairResponse>(
          "/v1/code/repair",
          request
        );
      } catch (err) {
        console.warn("[GPU] Repair failed, falling back to CPU:", err);
        return this.fallbackRepair(request, reason ?? "GPU error");
      }
    }

    return this.fallbackRepair(request, reason ?? "GPU not available");
  }

  // ── GPU service call ───────────────────────────────────────────
  private async callGpuService<T>(endpoint: string, body: unknown): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const res = await fetch(`${this.config.url}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`GPU service HTTP ${res.status}`);
      }

      return (await res.json()) as T;
    } catch (err) {
      clearTimeout(timeout);
      throw err;
    }
  }

  // ── Cloud fallback (z-ai-web-dev-sdk) ──────────────────────────
  private async fallbackPrdGeneration(
    request: PrdGenerateRequest,
    fallbackReason: string
  ): Promise<PrdGenerateResponse> {
    const start = Date.now();
    await ensureZaiConfig();
    const zai = await ZAI.create();

    // Use the existing arsenal generation logic
    const { generateArsenal } = await import("@/lib/forge-arsenal");
    const { buildExtensionDirective } = await import("@/lib/extension-parser");
    const { buildStackDirective } = await import("@/lib/forge-config");

    const config = {
      name: request.prompt.slice(0, 50),
      description: request.prompt,
      stack: request.stack.framework as "vite",
      typescript: request.stack.typescript,
      styling: request.stack.styling as "tailwind",
      routing: request.stack.routing as "router",
      stateMgmt: "none" as const,
      uiLib: "none" as const,
      features: request.features,
      selectedPacks: request.packs,
    };

    const extensionDirective = await buildExtensionDirective(
      request.features,
      request.packs
    );

    const arsenal = await generateArsenal(config, extensionDirective);

    const metrics: GenerationMetrics = {
      latencyMs: Date.now() - start,
      backend: "zai-cloud",
      computeMode: "remote",
      fallbackTriggered: true,
      fallbackReason,
    };

    return {
      projectId: request.projectId,
      gpuUsed: false,
      backend: "zai-cloud",
      documents: arsenal.documents,
      metrics,
    };
  }

  private async fallbackCodeGeneration(
    request: CodeGenerateRequest,
    fallbackReason: string
  ): Promise<CodeGenerateResponse> {
    const start = Date.now();

    // The actual code generation is handled by the existing generate route
    // This is a marker response — the real generation happens in the route
    const metrics: GenerationMetrics = {
      latencyMs: Date.now() - start,
      backend: "zai-cloud",
      computeMode: "remote",
      fallbackTriggered: true,
      fallbackReason,
    };

    return {
      projectId: request.projectId,
      gpuUsed: false,
      backend: "zai-cloud",
      files: [], // Will be filled by the calling route
      metrics,
    };
  }

  private async fallbackRepair(
    request: RepairRequest,
    fallbackReason: string
  ): Promise<RepairResponse> {
    const start = Date.now();

    // Use the existing postprocess logic
    const { postProcessProject } = await import("@/lib/forge-postprocess");
    const { unescapeJsonString } = await import("@/lib/forge-anticorruption");

    const files = request.files.map((f) => ({
      path: f.path,
      content: f.content,
      language: "tsx",
    }));

    const { files: fixedFiles } = postProcessProject(files, {
      name: "repair",
      description: "repair",
      stack: "vite",
      typescript: true,
      styling: "tailwind",
      routing: "none",
      stateMgmt: "none",
      uiLib: "none",
      features: [],
    });

    const metrics: GenerationMetrics = {
      latencyMs: Date.now() - start,
      backend: "cpu",
      computeMode: "cpu",
      fallbackTriggered: true,
      fallbackReason,
    };

    return {
      projectId: request.projectId,
      gpuUsed: false,
      backend: "cpu",
      fixedFiles: fixedFiles.map((f) => ({
        path: f.path,
        content: f.content,
      })),
      addedDependencies: [],
      metrics,
    };
  }
}

// ── Singleton instance ───────────────────────────────────────────
let clientInstance: GpuServiceClient | null = null;

export function getGpuServiceClient(): GpuServiceClient {
  if (!clientInstance) {
    clientInstance = new GpuServiceClient();
  }
  return clientInstance;
}

// ── GPU Status API route (for UI badge) ──────────────────────────
export async function getGpuStatusForUI() {
  const client = getGpuServiceClient();
  const caps = await client.getCapabilities();

  return {
    available: caps.gpuAvailable,
    backend: caps.backend,
    deviceName: caps.deviceName,
    mode: process.env.GPU_MODE as GpuMode || "auto",
    active: false,
    totalRequests: 0,
    gpuRequests: 0,
    cpuFallbacks: 0,
  };
}
