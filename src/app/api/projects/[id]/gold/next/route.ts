import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { type ProjectConfig } from "@/lib/forge-config";
import { deserializeState, runNextPass, finalizeFiles, serializeState } from "@/lib/forge-gold-async";
import { writeProjectFiles, runInstall } from "@/lib/workspace";

export const runtime = "nodejs";
export const maxDuration = 120;

/**
 * POST /api/projects/[id]/gold/next
 * Runs the next pending pass of the Gold pipeline.
 * When all 6 passes are done, finalizes (merge + templates + save).
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

    // Load state from arsenalJson
    const state = deserializeState(project.arsenalJson || "");
    if (!state) {
      return NextResponse.json(
        { success: false, error: "Pipeline non initialisé. Appelle /gold/start d'abord." },
        { status: 400 }
      );
    }

    if (state.currentPass > 6) {
      // Already done
      return NextResponse.json({
        success: true,
        pass: 7,
        passName: "Done",
        filesGenerated: 0,
        done: true,
        currentPass: 7,
        phases: state.phases,
        finalized: true,
        fileCount: project.fileCount,
      });
    }

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

    // Run next pass
    const result = await runNextPass(config, state);
    const newState = result.state;

    // Save updated state
    await db.project.update({
      where: { id },
      data: { arsenalJson: serializeState(newState) },
    });

    // If all passes done, finalize
    if (result.done) {
      const finalFiles = finalizeFiles(newState, config);
      const prd = newState.arch
        ? `# Architecture Plan\n\nFeatures: ${newState.arch.features.join(", ")}\nComponents: ${newState.arch.components.join(", ")}\nFolders: ${newState.arch.folders.join(", ")}`
        : "";

      await db.project.update({
        where: { id },
        data: {
          status: "ready",
          prd,
          filesJson: JSON.stringify(finalFiles),
          fileCount: finalFiles.length,
          installStatus: "pending",
          buildStatus: "pending",
        },
      });

      // Write to disk + install
      try {
        await writeProjectFiles(id, finalFiles);
        runInstall(id);
      } catch (e) {
        console.error("[gold/next] writeProjectFiles failed:", e);
      }

      return NextResponse.json({
        success: true,
        pass: 7,
        passName: "Done",
        filesGenerated: finalFiles.length,
        done: true,
        finalized: true,
        fileCount: finalFiles.length,
        currentPass: 7,
        phases: newState.phases,
      });
    }

    return NextResponse.json({
      success: result.success,
      pass: state.currentPass,
      passName: result.passName,
      filesGenerated: result.filesGenerated,
      done: result.done,
      error: result.error,
      currentPass: newState.currentPass,
      phases: newState.phases,
    });
  } catch (error) {
    console.error("[gold/next]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
