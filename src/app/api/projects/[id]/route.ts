import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { type GeneratedFile, inferLanguage } from "@/lib/forge-config";
import { deleteWorkspace, getReconciledStatus } from "@/lib/workspace";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function parseFeatures(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

function parseFiles(s: string): GeneratedFile[] {
  try {
    const v = JSON.parse(s);
    if (!Array.isArray(v)) return [];
    return v
      .filter((f): f is { path: string; content?: string; language?: string } =>
        typeof f === "object" && f !== null && "path" in f
      )
      .map((f) => ({
        path: String(f.path),
        content: String(f.content ?? ""),
        language: f.language || inferLanguage(String(f.path)),
      }));
  } catch {
    return [];
  }
}

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
    const files = parseFiles(project.filesJson);
    // Return the persisted validation report (from generation time)
    let validation = null;
    if (project.validationJson) {
      try {
        validation = JSON.parse(project.validationJson);
      } catch {
        validation = null;
      }
    }
    // Return the Arsenal PRD documents
    let arsenal = null;
    if (project.arsenalJson) {
      try {
        arsenal = JSON.parse(project.arsenalJson);
      } catch {
        arsenal = null;
      }
    }
    // Include reconciled install/build status (checks disk reality)
    const processStatus = await getReconciledStatus(id);
    return NextResponse.json({
      success: true,
      project: {
        ...project,
        features: parseFeatures(project.features),
        files,
        prd: project.prd,
        arsenal,
      },
      validation,
      process: {
        install: processStatus.install,
        build: processStatus.build,
        installLog: processStatus.installLog,
        buildLog: processStatus.buildLog,
      },
    });
  } catch (error) {
    console.error("[/api/projects/[id] GET]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de charger le projet" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await db.project.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Projet introuvable" },
        { status: 404 }
      );
    }
    await db.project.delete({ where: { id } });
    // Clean up the workspace on disk + kill any running processes
    try {
      await deleteWorkspace(id);
    } catch {
      // Non-fatal: workspace may not exist
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[/api/projects/[id] DELETE]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de supprimer le projet" },
      { status: 500 }
    );
  }
}
