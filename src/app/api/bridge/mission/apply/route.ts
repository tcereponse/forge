import { NextRequest, NextResponse } from "next/server";
import { withCORS, handlePreflight } from "@/lib/cors";
import { bridgeState } from "@/lib/bridge-state";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS() { return handlePreflight(); }

/**
 * POST /api/bridge/mission/apply
 * Body: { projectId: "cmq..." }
 *
 * Takes the captured PRD + files from the current bridge mission
 * and applies them to the specified Forge project.
 *   - PRD → project.prd (shows in "PRD" + "Arsenal PRD" tabs)
 *   - Files → project.filesJson (shows in "Code source" tab)
 *   - Status → "ready" (if files) or "generating" (if only PRD)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const projectId = body.projectId;
    if (!projectId) {
      return withCORS(NextResponse.json(
        { success: false, error: "projectId requis" },
        { status: 400 }
      ));
    }

    const result = await bridgeState.applyToProject(projectId);

    if (!result.success) {
      return withCORS(NextResponse.json(
        { success: false, error: "Aucune mission bridge active" },
        { status: 404 }
      ));
    }

    return withCORS(NextResponse.json({
      success: true,
      projectId,
      fileCount: result.fileCount,
      prdLength: result.prdLength,
      message: result.fileCount > 0
        ? `Projet mis à jour: ${result.fileCount} fichiers + PRD (${result.prdLength} chars)`
        : `Projet mis à jour: PRD uniquement (${result.prdLength} chars)`,
    }));
  } catch (e) {
    return withCORS(NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : "Erreur" },
      { status: 500 }
    ));
  }
}
