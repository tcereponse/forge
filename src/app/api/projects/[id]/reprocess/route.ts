import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { postProcessProject } from "@/lib/forge-postprocess";
import { buildTemplateFiles, buildIndexCss } from "@/lib/forge-templates";
import { writeProjectFiles, runInstall } from "@/lib/workspace";
import { inferLanguage, type ProjectConfig, type GeneratedFile } from "@/lib/forge-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/projects/[id]/reprocess
// Re-runs the post-processing pipeline on a project's stored files and
// rewrites them to disk. Useful when the post-processor has been improved
// (e.g. shadcn ui component injection) and existing projects need to be
// fixed without regenerating from scratch via the LLM.
export async function POST(
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

    // Parse stored files
    let llmFiles: GeneratedFile[] = [];
    try {
      const parsed = JSON.parse(project.filesJson);
      if (Array.isArray(parsed)) {
        llmFiles = parsed
          .filter(
            (f): f is { path: string; content?: string; language?: string } =>
              typeof f === "object" && f !== null && "path" in f
          )
          .map((f) => ({
            path: String(f.path),
            content: String(f.content ?? ""),
            language: f.language || inferLanguage(String(f.path)),
          }));
      }
    } catch {
      return NextResponse.json(
        { success: false, error: "Impossible de lire les fichiers du projet" },
        { status: 500 }
      );
    }

    if (llmFiles.length === 0) {
      return NextResponse.json(
        { success: false, error: "Le projet n'a pas de fichiers à retraiter" },
        { status: 400 }
      );
    }

    // Rebuild the config from stored project fields
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

    // Merge template files + stored LLM files.
    // Template files (index.html, package.json, vite.config, tsconfig,
    // tailwind.config, postcss.config, src/main.tsx) ALWAYS use the latest
    // template version — stored versions are ignored for these paths. This
    // ensures template improvements (e.g. mobile viewport meta tag) are
    // applied to existing projects on reprocess.
    const templateFiles = buildTemplateFiles(config);
    const templatePaths = new Set(templateFiles.map((f) => f.path));
    const merged: GeneratedFile[] = [...templateFiles];
    for (const llmFile of llmFiles) {
      if (!templatePaths.has(llmFile.path)) {
        merged.push(llmFile);
      }
    }

    // Special case: index.css — if the stored version exists, keep it (it has
    // LLM custom styles), but the template default is used if missing.
    const hasLlmCss = llmFiles.some((f) => f.path === "src/index.css");
    if (!hasLlmCss) {
      merged.push({
        path: "src/index.css",
        language: "css",
        content: buildIndexCss(config),
      });
    }

    // Run the post-processing pipeline (this is the key step — it now
    // replaces broken ui/* stubs with complete shadcn components)
    const { files: processed, report } = postProcessProject(merged, config);

    // Write fixed files back to disk
    await writeProjectFiles(id, processed);

    // Update the stored filesJson + fileCount in DB
    await db.project.update({
      where: { id },
      data: {
        filesJson: JSON.stringify(
          processed.map((f) => ({
            path: f.path,
            content: f.content,
            language: f.language,
          }))
        ),
        fileCount: processed.length,
        validationJson: JSON.stringify(report),
        // Reset build status — files changed, needs re-install + re-build
        buildStatus: "pending",
        installStatus: "pending",
        updatedAt: new Date(),
      },
    });

    // Re-trigger npm install in the background (new deps may have been added)
    runInstall(id);

    return NextResponse.json({
      success: true,
      message: `Projet retraité : ${report.autoFixed.length} correction(s) appliquée(s)`,
      fileCount: processed.length,
      autoFixed: report.autoFixed.slice(0, 10),
      stats: report.stats,
    });
  } catch (error) {
    console.error("[/api/projects/[id]/reprocess POST]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de retraiter le projet" },
      { status: 500 }
    );
  }
}
