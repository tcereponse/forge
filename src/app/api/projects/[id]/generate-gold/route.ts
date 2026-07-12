import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { type ProjectConfig } from "@/lib/forge-config";
import { runPipeline, type PipelinePhase } from "@/lib/forge-pipeline";
import { buildAllGoldTemplates } from "@/lib/forge-gold-templates";
import { postProcessProject } from "@/lib/forge-postprocess";
import { writeProjectFiles, runInstall } from "@/lib/workspace";
import { generateArsenal } from "@/lib/forge-arsenal";
import { buildExtensionDirective } from "@/lib/extension-parser";

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(
  request: NextRequest,
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

    // ── Phase 0: Arsenal PRD (optional, non-blocking) ──
    let arsenal;
    let prd = "";
    try {
      const extensionDirective = await buildExtensionDirective(
        config.features,
        config.selectedPacks ?? []
      );
      arsenal = await generateArsenal(config, extensionDirective);
      prd =
        arsenal.documents.find((d) => d.id === "vision")?.content ??
        arsenal.documents[0]?.content ??
        "";
    } catch (arsenalErr) {
      console.error("[generate-gold] Arsenal failed:", arsenalErr);
      arsenal = { documents: [] };
    }

    // ── Phase 1-5: Run the multi-pass pipeline ──
    const pipelineResult = await runPipeline(config, undefined, id);

    if (!pipelineResult.success || pipelineResult.files.length === 0) {
      await db.project.update({
        where: { id },
        data: { status: "failed", prd },
      });
      return NextResponse.json(
        {
          success: false,
          error: pipelineResult.error || "Échec du pipeline de génération",
          prd,
          phases: pipelineResult.phases,
        },
        { status: 422 }
      );
    }

    // ── Merge LLM files with Gold templates ──
    const goldTemplates = buildAllGoldTemplates(config);
    const templatePaths = new Set(goldTemplates.map((f) => f.path));

    // LLM files win on src/ paths; templates win on config paths
    let files = [...goldTemplates];
    for (const f of pipelineResult.files) {
      if (!templatePaths.has(f.path)) {
        files.push(f);
      }
    }

    // ── Post-process (existing validators + auto-repair) ──
    const { files: finalFiles, report: validationReport } =
      postProcessProject(files, config);
    files = finalFiles;

    // ── Save to database ──
    await db.project.update({
      where: { id },
      data: {
        status: "ready",
        prd,
        arsenalJson: JSON.stringify(arsenal),
        filesJson: JSON.stringify(files),
        fileCount: files.length,
        validationJson: JSON.stringify({
          ...validationReport,
          pipeline: {
            ok: pipelineResult.validation.ok,
            totalErrors: pipelineResult.validation.totalErrors,
            totalWarnings: pipelineResult.validation.totalWarnings,
            phases: pipelineResult.phases,
          },
        }),
        installStatus: "pending",
        buildStatus: "pending",
      },
    });

    // ── Write files to disk + auto-install ──
    try {
      await writeProjectFiles(id, files);
      runInstall(id);
    } catch (diskErr) {
      console.error("[generate-gold] writeProjectFiles failed:", diskErr);
    }

    return NextResponse.json({
      success: true,
      project: {
        ...project,
        features: JSON.parse(project.features || "[]"),
        prd,
        files,
        fileCount: files.length,
        status: "ready" as const,
      },
      validation: validationReport,
      pipeline: {
        phases: pipelineResult.phases,
        ok: pipelineResult.validation.ok,
        totalErrors: pipelineResult.validation.totalErrors,
        totalWarnings: pipelineResult.validation.totalWarnings,
      },
    });
  } catch (error) {
    console.error("[/api/projects/[id]/generate-gold]", error);
    try {
      const { id } = await params;
      await db.project.update({
        where: { id },
        data: { status: "failed" },
      });
    } catch {
      /* ignore */
    }
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Échec de la génération Gold Grade",
      },
      { status: 500 }
    );
  }
}
