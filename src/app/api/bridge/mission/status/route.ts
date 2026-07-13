import { NextResponse } from "next/server";
import { withCORS, handlePreflight } from "@/lib/cors";
import { bridgeState } from "@/lib/bridge-state";
import { db } from "@/lib/db";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() { return handlePreflight(); }

/**
 * GET /api/bridge/mission/status
 *
 * Returns the current mission status. Format compatible with the Vercel
 * Sovereign Build Worker (VERCEL_BUILD_WORKER.py):
 *   - The worker polls this endpoint every 10s
 *   - It looks for `mission.status === "ready_for_build"` or `"code_generated"`
 *   - When found, it downloads the project and builds it locally
 *
 * Backward compatible: still returns the flat fields for the existing UI.
 * New: also returns a `mission` object wrapping the same data.
 */
export async function GET() {
  const m = await bridgeState.getMission();
  if (!m) {
    return withCORS(NextResponse.json({
      status: "idle",
      phase: 0,
      mission: null,
    }));
  }

  // Determine build status for the worker
  // phase 5 = code generation done → ready_for_build
  // phase 10 = one-shot done → ready_for_build (if projectId linked)
  let workerStatus = m.status;
  if (m.phase === 5 || (m.phase === 10 && m.files.length > 0)) {
    workerStatus = "ready_for_build";
  } else if (m.phase === 10) {
    workerStatus = "code_generated";
  }

  // Try to find the linked project's projectId (for the worker to download)
  let linkedProjectId = m.projectId;
  if (!linkedProjectId) {
    // Try to find the most recent "ready" project
    try {
      const recentProject = await db.project.findFirst({
        where: { status: "ready" },
        orderBy: { updatedAt: "desc" },
      });
      if (recentProject) {
        linkedProjectId = recentProject.id;
      }
    } catch {
      // DB not available — continue without linkedProjectId
    }
  }

  const phaseName = m.phase === 1
    ? "PRD Generation"
    : m.phase === 2
      ? "Code Generation"
      : m.phase === 5
        ? "Done"
        : m.phase === 10
          ? "One-Shot (Gold)"
          : "Unknown";

  // Flat fields (backward compatible with existing UI)
  const flatFields = {
    status: m.status,
    phase: m.phase,
    phaseName,
    prd: m.prd,
    files: m.files,
    fileCount: m.files.length,
    capturedContent: m.capturedContent,
    capturedLength: m.capturedContent.length,
    missionId: m.id,
    name: m.name,
    projectId: m.projectId,
  };

  // Mission object (for the build worker)
  const missionObject = {
    id: m.id,
    name: m.name,
    status: workerStatus,           // "ready_for_build" | "code_generated" | "done" | ...
    phase: m.phase,
    fileCount: m.files.length,
    projectId: linkedProjectId,     // worker uses this to download files
    updatedAt: m.updatedAt,
  };

  return withCORS(NextResponse.json({
    ...flatFields,
    mission: missionObject,
  }));
}
