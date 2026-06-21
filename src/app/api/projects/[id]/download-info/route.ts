import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  getProcessStatus,
  workspaceExists,
  nodeModulesExists,
} from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Projet introuvable" },
        { status: 404 }
      );
    }

    const status = getProcessStatus(id);
    const wsExists = await workspaceExists(id);
    const hasNodeModules = await nodeModulesExists(id);
    // Full ZIP is available if node_modules exists on disk, regardless of
    // in-memory status (which resets on server restart).
    const fullAvailable = wsExists && hasNodeModules;

    return NextResponse.json({
      success: true,
      fullAvailable,
      installStatus: status.install,
      buildStatus: status.build,
      workspaceExists: wsExists,
      hasNodeModules,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Impossible de vérifier le statut" },
      { status: 500 }
    );
  }
}
