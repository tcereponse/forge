import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { db } from "@/lib/db";
import { type GeneratedFile, type ProjectConfig, inferLanguage } from "@/lib/forge-config";
import { buildTemplateFiles } from "@/lib/forge-templates";
import { generateAndroidTemplate } from "@/lib/forge-android-template";

export const runtime = "nodejs";
export const maxDuration = 60;

function parseFiles(s: string): GeneratedFile[] {
  try {
    const v = JSON.parse(s);
    if (!Array.isArray(v)) return [];
    return v
      .filter((f: { path?: string }) => typeof f === "object" && f !== null && "path" in f)
      .map((f: { path: string; content?: string; language?: string }) => ({
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

    let files = parseFiles(project.filesJson);
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier. Génère le projet d'abord." },
        { status: 400 }
      );
    }

    // Ensure template files exist
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
    files = [
      ...templateFiles.filter((f) => !existingPaths.has(f.path)),
      ...files,
    ];

    // Generate Android template
    const androidFiles = generateAndroidTemplate(config);

    // Create ZIP
    const zip = new JSZip();
    const root = zip.folder(project.slug) ?? zip;

    for (const file of files) {
      root.file(file.path, file.content);
    }
    for (const file of androidFiles) {
      root.file(file.path, file.content);
    }

    // Build scripts
    root.file("build-apk.sh", `#!/bin/bash
echo "Building web app..."
npm install && npm run build
echo "Copying dist to Android assets..."
mkdir -p android/app/src/main/assets/www
cp -r dist/* android/app/src/main/assets/www/
echo "Building APK..."
cd android
chmod +x gradlew 2>/dev/null
./gradlew assembleDebug
APK="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK" ]; then
    echo "✅ APK: $APK"
    cp "$APK" "../${project.name}.apk"
else
    echo "❌ Build failed"
fi
`);

    root.file("build-apk.bat", `@echo off
echo Building web app...
call npm install
call npm run build
echo Copying dist to Android assets...
mkdir android\\app\\src\\main\\assets\\www 2>nul
xcopy /E /I /Y dist android\\app\\src\\main\\assets\\www
echo Building APK...
cd android
call gradlew.bat assembleDebug
set APK=app\\build\\outputs\\apk\\debug\\app-debug.apk
if exist "%APK%" (
    echo APK: %APK%
    copy "%APK%" "..\\..\\${project.name}.apk"
) else (
    echo Build failed.
)
pause
`);

    const buffer = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${project.slug}-apk.zip"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (error) {
    console.error("[/api/projects/[id]/apk]", error);
    return NextResponse.json(
      { success: false, error: "Impossible de générer le ZIP APK" },
      { status: 500 }
    );
  }
}
