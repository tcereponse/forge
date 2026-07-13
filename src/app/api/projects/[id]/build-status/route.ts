import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/projects/[id]/build-status
 *
 * Called by the Vercel Sovereign Build Worker (VERCEL_BUILD_WORKER.py) to
 * notify the server that the local build completed successfully.
 *
 * Body:
 *   { "status": "completed" | "failed", "buildLog"?: "...", "durationMs"?: 12345 }
 *
 * Updates the project's buildStatus to "built" (or "failed") so the UI
 * shows the green ✅ status.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const status = body.status; // "completed" | "failed"

    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Projet introuvable" },
        { status: 404 }
      );
    }

    const buildOk = status === "completed";
    const buildLog = String(body.buildLog || "").slice(0, 50000); // cap log size
    const durationMs = Number(body.durationMs) || 0;

    await db.project.update({
      where: { id },
      data: {
        buildStatus: buildOk ? "built" : "failed",
        installStatus: buildOk ? "installed" : project.installStatus,
        // Store the build log in validationJson (reusing existing field)
        validationJson: JSON.stringify({
          ...(project.validationJson ? (() => { try { return JSON.parse(project.validationJson); } catch { return {}; } })() : {}),
          localBuild: {
            status: buildOk ? "built" : "failed",
            buildLog,
            durationMs,
            timestamp: Date.now(),
            builder: "VERCEL_BUILD_WORKER.py (Sovereign Build Worker)",
          },
        }),
      },
    });

    console.log(`[build-status] Project ${id}: ${buildOk ? "✅ built" : "❌ failed"} (${durationMs}ms)`);

    return NextResponse.json({
      success: true,
      projectId: id,
      buildStatus: buildOk ? "built" : "failed",
      message: buildOk
        ? "Build local réussi — statut mis à jour ✅"
        : "Build local échoué — statut mis à jour ❌",
    });
  } catch (error) {
    console.error("[build-status]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
