import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { type ProjectConfig } from "@/lib/forge-config";
import { initState, runNextPass, serializeState, type GoldPassState } from "@/lib/forge-gold-async";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/projects/[id]/gold/start
 * Initializes the Gold pipeline and runs pass 1 (Architecture).
 * Returns the state + pass 1 result.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ success: false, error: "Projet introuvable" }, { status: 404 });
    }

    // Mark as generating
    await db.project.update({
      where: { id },
      data: { status: "generating" },
    });

    const config: ProjectConfig = {
      name: project.name,
      description: project.description,
      stack: project.stack as ProjectConfig["stack"],
      typescript: project.typescript,
      styling: project.styling as ProjectConfig["styling"],
      routing: project.routing as ProjectConfig["routing"],
      stateMgmt: project.stateMgmt as ProjectConfig["stateMgmt"],
      uiLib: project.uiLib as ProjectConfig["uiLib"],
      features: JSON.parse(project.features || "[]"),
      selectedPacks: JSON.parse(project.selectedPacks || "[]"),
    };

    // Initialize state
    let state: GoldPassState = initState();

    // Run pass 1
    const result = await runNextPass(config, state);
    state = result.state;

    // Save state to arsenalJson
    await db.project.update({
      where: { id },
      data: { arsenalJson: serializeState(state) },
    });

    return NextResponse.json({
      success: result.success,
      pass: 1,
      passName: result.passName,
      filesGenerated: result.filesGenerated,
      done: result.done,
      error: result.error,
      currentPass: state.currentPass,
      phases: state.phases,
    });
  } catch (error) {
    console.error("[gold/start]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
