// GPU Service Types & Interfaces
// Shared types for the GPU-first architecture (Phase 1)

// ── GPU Capabilities ─────────────────────────────────────────────
export interface GpuCapabilities {
  gpuAvailable: boolean;
  backend: GpuBackend;
  deviceName?: string;
  memoryTotalMB?: number;
  memoryFreeMB?: number;
  supportsEmbeddings: boolean;
  supportsCodegen: boolean;
  supportsPRD: boolean;
  supportsRepair: boolean;
  fallbackMode: FallbackMode;
  modelLoaded: boolean;
}

export type GpuBackend = "tensorrt-llm" | "webgpu" | "cpu" | "remote" | "zai-cloud";
export type FallbackMode = "cpu" | "remote" | "zai-cloud";
export type GpuMode = "auto" | "gpu-only" | "cpu-only" | "remote";

// ── AI Service Configuration ─────────────────────────────────────
export interface AiServiceConfig {
  url: string;            // URL du service GPU local (ex: http://localhost:5006)
  gpuMode: GpuMode;       // Mode de fonctionnement
  timeout: number;        // Timeout en ms (default: 120000)
  retryCount: number;     // Nombre de retries sur erreur GPU
  fallbackToZai: boolean; // Fallback vers z-ai-web-dev-sdk si service GPU down
}

export const DEFAULT_AI_CONFIG: AiServiceConfig = {
  url: process.env.GPU_SERVICE_URL || "http://localhost:5006",
  gpuMode: "auto",
  timeout: 120000,
  retryCount: 2,
  fallbackToZai: true,
};

// ── Generation Metrics ───────────────────────────────────────────
export interface GenerationMetrics {
  latencyMs: number;
  backend: GpuBackend;
  computeMode: "gpu" | "cpu" | "remote";
  deviceName?: string;
  tokensInput?: number;
  tokensOutput?: number;
  tokensPerSecond?: number;
  gpuUsagePercent?: number;
  vramUsedMB?: number;
  vramTotalMB?: number;
  fallbackTriggered: boolean;
  fallbackReason?: string;
}

// ── PRD Generation Request/Response ──────────────────────────────
export interface PrdGenerateRequest {
  projectId: string;
  prompt: string;
  features: string[];
  packs: string[];
  stack: {
    framework: string;
    typescript: boolean;
    styling: string;
    routing: string;
  };
  gpuMode: GpuMode;
}

export interface PrdGenerateResponse {
  projectId: string;
  gpuUsed: boolean;
  backend: GpuBackend;
  documents: Array<{
    id: string;
    name: string;
    filename: string;
    role: string;
    content: string;
  }>;
  metrics: GenerationMetrics;
}

// ── Code Generation Request/Response ─────────────────────────────
export interface CodeGenerateRequest {
  projectId: string;
  prdArsenal: { documents: Array<{ id: string; content: string }> };
  stack: {
    framework: string;
    typescript: boolean;
    styling: string;
    routing: string;
  };
  features: string[];
  packs: string[];
  packUIDirectives?: string;
  gpuMode: GpuMode;
}

export interface CodeGenerateResponse {
  projectId: string;
  gpuUsed: boolean;
  backend: GpuBackend;
  files: Array<{
    path: string;
    content: string;
    language: string;
  }>;
  metrics: GenerationMetrics;
}

// ── Repair Request/Response ──────────────────────────────────────
export interface RepairRequest {
  projectId: string;
  files: Array<{ path: string; content: string }>;
  detectedIssues: string[];
  gpuMode: GpuMode;
}

export interface RepairResponse {
  projectId: string;
  gpuUsed: boolean;
  backend: GpuBackend;
  fixedFiles: Array<{ path: string; content: string }>;
  addedDependencies: string[];
  metrics: GenerationMetrics;
}

// ── Event Types (for streaming) ──────────────────────────────────
export type AiEventType =
  | "project.create"
  | "prd.generate"
  | "prd.complete"
  | "code.generate"
  | "code.complete"
  | "dependency.resolve"
  | "repair.request"
  | "repair.result"
  | "build.start"
  | "build.progress"
  | "build.success"
  | "build.failure"
  | "export.ready"
  | "gpu.fallback";

export interface AiEvent {
  type: AiEventType;
  projectId: string;
  step?: string;
  progress?: number;
  message?: string;
  metrics?: GenerationMetrics;
  timestamp: string;
}

// ── Interfaces (dependency inversion) ────────────────────────────
export interface IPrdGenerator {
  generate(request: PrdGenerateRequest): Promise<PrdGenerateResponse>;
  getCapabilities(): Promise<GpuCapabilities>;
}

export interface ICodeGenerator {
  generate(request: CodeGenerateRequest): Promise<CodeGenerateResponse>;
}

export interface IRepairEngine {
  repair(request: RepairRequest): Promise<RepairResponse>;
}

// ── GPU Status for UI ────────────────────────────────────────────
export interface GpuStatus {
  available: boolean;
  backend: GpuBackend;
  deviceName?: string;
  mode: GpuMode;
  active: boolean;  // Currently processing a request
  lastLatencyMs?: number;
  totalRequests: number;
  gpuRequests: number;
  cpuFallbacks: number;
}

export function createEmptyGpuStatus(): GpuStatus {
  return {
    available: false,
    backend: "zai-cloud",
    mode: "auto",
    active: false,
    totalRequests: 0,
    gpuRequests: 0,
    cpuFallbacks: 0,
  };
}
