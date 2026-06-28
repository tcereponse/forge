import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { writeProjectFiles, runInstall, nodeModulesExists } from "@/lib/workspace";
import { buildTemplateFiles } from "@/lib/forge-templates";
import type { GeneratedFile, ProjectConfig } from "@/lib/forge-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseFiles(s: string): GeneratedFile[] {
  try {
    const v = JSON.parse(s);
    if (!Array.isArray(v)) return [];
    return v
      .filter((f: { path?: string }) => typeof f === "object" && f !== null && "path" in f)
      .map((f: { path: string; content?: string; language?: string }) => ({
        path: String(f.path),
        content: String(f.content ?? ""),
        language: f.language || "text",
      }));
  } catch {
    return [];
  }
}

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

    if (await nodeModulesExists(id)) {
      return NextResponse.json({ success: true, message: "Déjà installé" });
    }

    const files = parseFiles(project.filesJson);
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier" },
        { status: 400 }
      );
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

    const templateFiles = buildTemplateFiles(config);
    const existingPaths = new Set(files.map((f) => f.path));
    const allFiles = [
      ...templateFiles.filter((f) => !existingPaths.has(f.path)),
      ...files,
    ];

    await writeProjectFiles(id, allFiles);
    runInstall(id);

    return NextResponse.json({ success: true, message: "Installation démarrée" });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Impossible de démarrer l'installation" },
      { status: 500 }
    );
  }
}
