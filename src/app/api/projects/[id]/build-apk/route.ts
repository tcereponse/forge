import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildApk } from "@/lib/forge-apk-builder";
import { getDistDir, getReconciledStatus } from "@/lib/workspace";
import { promises as fs } from "fs";
import type { ProjectConfig } from "@/lib/forge-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

// POST /api/projects/[id]/build-apk
// Compiles a real .apk file from the project's built dist/ using the Android
// SDK (aapt2, d8, javac, apksigner). Returns the APK file as a download.
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

    // Check that the project has been built (dist/ must exist)
    const status = await getReconciledStatus(id);
    if (status.build !== "built") {
      return NextResponse.json(
        {
          success: false,
          error:
            "Le projet doit être buildé d'abord. Ouvre l'onglet Aperçu et clique sur « Builder ».",
        },
        { status: 400 }
      );
    }

    // Verify dist/ exists on disk
    const distDir = getDistDir(id);
    try {
      await fs.access(distDir);
    } catch {
      return NextResponse.json(
        { success: false, error: "Le dossier dist/ est introuvable. Rebuild le projet." },
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

    // Build the APK
    const result = await buildApk(id, config, distDir);

    if (!result.success || !result.apkPath) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || "Échec de la compilation APK",
          log: result.log,
        },
        { status: 500 }
      );
    }

    // Read the APK file and return it as a download
    const apkBuffer = await fs.readFile(result.apkPath);
    const apkName = `${project.slug}.apk`;

    return new NextResponse(apkBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="${apkName}"`,
        "Content-Length": String(apkBuffer.length),
      },
    });
  } catch (error) {
    console.error("[/api/projects/[id]/build-apk]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de compiler l'APK" },
      { status: 500 }
    );
  }
}
