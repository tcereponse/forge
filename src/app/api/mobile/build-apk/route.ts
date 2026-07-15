import { NextRequest, NextResponse } from "next/server";
import { buildApk } from "@/lib/forge-apk-builder";
import { promises as fs } from "fs";
import path from "path";
import type { ProjectConfig } from "@/lib/forge-config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

interface MobileProjectFile {
  path: string;
  content: string;
  language: string;
}

interface MobileBuildRequest {
  name: string;
  description: string;
  files: MobileProjectFile[];
  stack?: string;
  typescript?: boolean;
  styling?: string;
}

// POST /api/mobile/build-apk
// Receives a project from the mobile app, builds it with vite, and compiles
// an APK. Returns the APK file as a download.
export async function POST(request: NextRequest) {
  const tmpDir = `/tmp/mobile-build-${Date.now()}`;
  
  try {
    const body: MobileBuildRequest = await request.json();
    
    if (!body.name || !body.files || body.files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Nom et fichiers requis" },
        { status: 400 }
      );
    }

    // Create temp directory
    await fs.mkdir(tmpDir, { recursive: true });
    
    // Write all project files to temp dir
    for (const file of body.files) {
      const filePath = path.join(tmpDir, file.path);
      const fileDir = path.dirname(filePath);
      await fs.mkdir(fileDir, { recursive: true });
      await fs.writeFile(filePath, file.content, "utf-8");
    }
    
    // Run npm install
    const { spawn } = await import("child_process");
    const installResult = await new Promise<{code: number; stdout: string; stderr: string}>((resolve) => {
      const proc = spawn("npm", ["install", "--no-fund", "--no-audit"], {
        cwd: tmpDir,
        env: { ...process.env, CI: "true" },
        stdio: ["pipe", "pipe", "pipe"],
      });
      let stdout = "", stderr = "";
      proc.stdout?.on("data", (d) => stdout += d);
      proc.stderr?.on("data", (d) => stderr += d);
      proc.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
    });
    
    if (installResult.code !== 0) {
      return NextResponse.json(
        { success: false, error: "npm install failed", log: installResult.stderr },
        { status: 500 }
      );
    }
    
    // Run vite build
    const buildResult = await new Promise<{code: number; stdout: string; stderr: string}>((resolve) => {
      const proc = spawn("npm", ["run", "build"], {
        cwd: tmpDir,
        env: { ...process.env, CI: "true" },
        stdio: ["pipe", "pipe", "pipe"],
      });
      let stdout = "", stderr = "";
      proc.stdout?.on("data", (d) => stdout += d);
      proc.stderr?.on("data", (d) => stderr += d);
      proc.on("close", (code) => resolve({ code: code ?? 1, stdout, stderr }));
    });
    
    if (buildResult.code !== 0) {
      return NextResponse.json(
        { success: false, error: "vite build failed", log: buildResult.stderr },
        { status: 500 }
      );
    }
    
    // Check dist exists
    const distDir = path.join(tmpDir, "dist");
    try {
      await fs.access(distDir);
    } catch {
      return NextResponse.json(
        { success: false, error: "dist/ not found after build" },
        { status: 500 }
      );
    }
    
    // Build APK
    const config: ProjectConfig = {
      name: body.name,
      description: body.description || "",
      stack: (body.stack || "vite") as ProjectConfig["stack"],
      typescript: body.typescript !== false,
      styling: (body.styling || "tailwind") as ProjectConfig["styling"],
      routing: "router" as ProjectConfig["routing"],
      stateMgmt: "none" as ProjectConfig["stateMgmt"],
      uiLib: "none" as ProjectConfig["uiLib"],
      features: [],
      selectedPacks: [],
    };
    
    const apkResult = await buildApk(`mobile-${Date.now()}`, config, distDir);
    
    if (!apkResult.success || !apkResult.apkPath) {
      return NextResponse.json(
        { success: false, error: apkResult.error || "APK build failed", log: apkResult.log },
        { status: 500 }
      );
    }
    
    // Read APK and return as download
    const apkBuffer = await fs.readFile(apkResult.apkPath);
    const apkName = `${body.name.toLowerCase().replace(/\s+/g, "-")}.apk`;
    
    return new NextResponse(apkBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="${apkName}"`,
        "Content-Length": String(apkBuffer.length),
      },
    });
  } catch (error) {
    console.error("[/api/mobile/build-apk]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  } finally {
    // Cleanup temp dir
    try {
      await fs.rm(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}
