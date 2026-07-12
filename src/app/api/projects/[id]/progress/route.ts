import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// In-memory progress store (keyed by projectId)
// The generate-gold endpoint updates this as the pipeline progresses.
interface ProgressEntry {
  projectId: string;
  mode: "standard" | "gold";
  phases: Array<{
    name: string;
    pass: number;
    status: "pending" | "running" | "done" | "failed" | "skipped";
    message?: string;
    filesGenerated?: number;
    retries?: number;
    startedAt?: number;
    completedAt?: number;
  }>;
  currentPhase: number;
  totalFiles: number;
  error?: string;
  startedAt: number;
  updatedAt: number;
}

const progressStore = new Map<string, ProgressEntry>();

/** Called by the generate-gold endpoint to update progress. */
export function updateProgress(
  projectId: string,
  patch: Partial<ProgressEntry>
): void {
  const existing = progressStore.get(projectId) ?? {
    projectId,
    mode: "gold" as const,
    phases: [],
    currentPhase: 0,
    totalFiles: 0,
    startedAt: Date.now(),
    updatedAt: Date.now(),
  };
  const updated = { ...existing, ...patch, updatedAt: Date.now() };
  progressStore.set(projectId, updated);
}

/** Called by the pipeline to update a specific phase. */
export function updatePhaseProgress(
  projectId: string,
  phaseIndex: number,
  phasePatch: Partial<ProgressEntry["phases"][number]>
): void {
  const entry = progressStore.get(projectId);
  if (!entry) return;
  if (!entry.phases[phaseIndex]) return;
  entry.phases[phaseIndex] = { ...entry.phases[phaseIndex], ...phasePatch };
  entry.currentPhase = phaseIndex;
  entry.updatedAt = Date.now();
  progressStore.set(projectId, entry);
}

/** Initialize progress for a project. */
export function initProgress(
  projectId: string,
  mode: "standard" | "gold",
  phases: Array<{ name: string; pass: number }>
): void {
  progressStore.set(projectId, {
    projectId,
    mode,
    phases: phases.map((p) => ({
      name: p.name,
      pass: p.pass,
      status: "pending" as const,
    })),
    currentPhase: 0,
    totalFiles: 0,
    startedAt: Date.now(),
    updatedAt: Date.now(),
  });
}

/** Clear progress for a project. */
export function clearProgress(projectId: string): void {
  progressStore.delete(projectId);
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const progress = progressStore.get(id);

    const project = await db.project.findUnique({
      where: { id },
      select: {
        status: true,
        fileCount: true,
        name: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Projet introuvable" },
        { status: 404 }
      );
    }

    // If project is ready or failed, mark running phases accordingly
    let finalProgress = progress;
    if (progress && (project.status === "ready" || project.status === "failed")) {
      finalProgress = {
        ...progress,
        phases: progress.phases.map((p) => ({
          ...p,
          status:
            project.status === "ready"
              ? ("done" as const)
              : p.status === "running"
                ? ("failed" as const)
                : p.status,
          completedAt: p.completedAt ?? Date.now(),
        })),
        totalFiles: project.fileCount,
      };
    }

    return NextResponse.json({
      success: true,
      progress: finalProgress
        ? {
            ...finalProgress,
            elapsedMs: Date.now() - finalProgress.startedAt,
            projectStatus: project.status,
            projectName: project.name,
          }
        : null,
      project: {
        status: project.status,
        fileCount: project.fileCount,
        name: project.name,
      },
    });
  } catch (error) {
    console.error("[/api/projects/[id]/progress GET]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de récupérer la progression" },
      { status: 500 }
    );
  }
}
