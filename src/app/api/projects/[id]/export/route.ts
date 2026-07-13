import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildTemplateFiles } from "@/lib/forge-templates";
import type { GeneratedFile, ProjectConfig } from "@/lib/forge-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/projects/[id]/export
 *
 * Returns the full project source code as JSON.
 * Used by the Vercel Sovereign Build Worker (VERCEL_BUILD_WORKER.py) to
 * download the code and build it locally (bypassing Vercel /tmp limits).
 *
 * Response: { files: [{ path, content, language }], name, fileCount }
 */
export async function GET(
  _req: NextRequest,
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

    // Parse files from DB
    let files: GeneratedFile[] = [];
    try {
      const parsed = JSON.parse(project.filesJson || "[]");
      if (Array.isArray(parsed)) {
        files = parsed.map((f: any) => ({
          path: String(f.path || ""),
          content: String(f.content ?? ""),
          language: f.language || "text",
        }));
      }
    } catch {
      // filesJson corrupted
    }

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier dans le projet", files: [] },
        { status: 422 }
      );
    }

    // Merge with template files (config files that may be missing)
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
    const templateFiles = buildTemplateFiles(config);
    const existingPaths = new Set(files.map((f) => f.path));
    const allFiles = [
      ...templateFiles.filter((f) => !existingPaths.has(f.path)),
      ...files,
    ];

    return NextResponse.json({
      success: true,
      name: project.name,
      projectId: id,
      fileCount: allFiles.length,
      files: allFiles.map((f) => ({
        path: f.path,
        content: f.content,
        language: f.language || "text",
      })),
    });
  } catch (error) {
    console.error("[export]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
