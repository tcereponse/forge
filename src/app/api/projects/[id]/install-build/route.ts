import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { writeProjectFiles, getDistDir } from "@/lib/workspace";
import { buildTemplateFiles } from "@/lib/forge-templates";
import type { GeneratedFile, ProjectConfig } from "@/lib/forge-config";

export const runtime = "nodejs";
export const maxDuration = 300;

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

/**
 * Builds a safe environment for npm on Vercel serverless.
 * Vercel sets HOME=/home/sbx_user1051 (non-writable) which causes:
 *   ENOENT: no such file or directory, mkdir '/home/sbx_user1051'
 * We redirect HOME + npm cache to /tmp (always writable on Vercel).
 *
 * IMPORTANT: we also prepend ./node_modules/.bin to PATH so that
 * "npm run build" can find tsc and vite (npm scripts normally do this
 * automatically, but our custom env may lose it on Vercel).
 */
function buildSafeEnv(cwd?: string): NodeJS.ProcessEnv {
  const tmpDir = "/tmp";
  const binPath = cwd ? `${cwd}/node_modules/.bin` : "";
  const currentPath = process.env.PATH || "/usr/local/bin:/usr/bin:/bin";
  return {
    ...process.env,
    HOME: tmpDir,                          // npm writes ~/.npm, ~/.config here
    NPM_CONFIG_CACHE: `${tmpDir}/.npm`,    // npm cache
    NPM_CONFIG_PREFIX: `${tmpDir}/.npm-global`, // global prefix
    NPM_CONFIG_LOGLEVEL: "error",          // less verbose
    CI: "true",
    PATH: binPath ? `${binPath}:${currentPath}` : currentPath,
  };
}

/**
 * Runs a command synchronously and returns the combined output + exit code.
 * Used for npm install + npm run build on Vercel serverless (no background processes).
 */
function runCommandSync(
  cmd: string,
  args: string[],
  cwd: string,
  timeoutMs: number
): Promise<{ code: number; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      cwd,
      shell: false,
      env: buildSafeEnv(cwd),
    });

    let output = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      output += `\n⏱️ Timeout after ${timeoutMs / 1000}s\n`;
      resolve({ code: 124, output });
    }, timeoutMs);

    child.stdout?.on("data", (data) => { output += data.toString(); });
    child.stderr?.on("data", (data) => { output += data.toString(); });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code: code ?? 1, output });
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ code: 1, output: output + `\n❌ ${err.message}\n` });
    });
  });
}

/**
 * POST /api/projects/[id]/install-build
 *
 * Synchronous install + build for Vercel serverless.
 * On Vercel, background processes (fire-and-forget) are killed when the HTTP
 * response is sent. So we must do everything in ONE request:
 *   1. Write files to /tmp/react-forge-workspaces/{id}/
 *   2. npm install --legacy-peer-deps (max 180s)
 *   3. npm run build (max 90s)
 *   4. Update project status in DB
 *
 * Returns: { success, installLog, buildLog, fileCount }
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  try {
    const { id } = await params;
    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Projet introuvable" },
        { status: 404 }
      );
    }

    // Mark as installing
    await db.project.update({
      where: { id },
      data: { installStatus: "installing", buildStatus: "pending" },
    });

    const files = parseFiles(project.filesJson);
    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Aucun fichier à installer" },
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

    // Merge with template files (config files)
    const templateFiles = buildTemplateFiles(config);
    const existingPaths = new Set(files.map((f) => f.path));
    const allFiles = [
      ...templateFiles.filter((f) => !existingPaths.has(f.path)),
      ...files,
    ];

    // 1. Write files to disk
    console.log(`[install-build] Writing ${allFiles.length} files to disk...`);
    await writeProjectFiles(id, allFiles);

    // Ensure /tmp/.npm exists (Vercel HOME redirect)
    await fs.mkdir("/tmp/.npm", { recursive: true }).catch(() => {});

    const WORKSPACES_DIR = path.join(os.tmpdir(), "react-forge-workspaces");
    const projectDir = path.join(WORKSPACES_DIR, id);

    // 2. npm install (max 180s)
    console.log("[install-build] Running npm install...");
    await db.project.update({
      where: { id },
      data: { installStatus: "installing" },
    });

    const installResult = await runCommandSync(
      "npm",
      ["install", "--no-fund", "--no-audit", "--legacy-peer-deps"],
      projectDir,
      180000
    );

    const installLog = installResult.output;
    const installOk = installResult.code === 0;

    console.log(`[install-build] npm install exit code: ${installResult.code} (${Date.now() - startTime}ms)`);

    await db.project.update({
      where: { id },
      data: {
        installStatus: installOk ? "installed" : "failed",
      },
    });

    if (!installOk) {
      return NextResponse.json({
        success: false,
        error: "npm install a échoué",
        installLog,
        installStatus: "failed",
      }, { status: 422 });
    }

    // 3. npm run build (max 90s)
    console.log("[install-build] Running npm run build...");
    await db.project.update({
      where: { id },
      data: { buildStatus: "building" },
    });

    const buildResult = await runCommandSync(
      "npm",
      ["run", "build"],
      projectDir,
      90000
    );

    const buildLog = buildResult.output;
    const buildOk = buildResult.code === 0;

    console.log(`[install-build] npm run build exit code: ${buildResult.code} (${Date.now() - startTime}ms total)`);

    // Check if dist/ exists
    let distExists = false;
    try {
      const stat = await fs.stat(getDistDir(id));
      distExists = stat.isDirectory();
    } catch {}

    await db.project.update({
      where: { id },
      data: {
        buildStatus: buildOk && distExists ? "built" : "failed",
      },
    });

    const totalMs = Date.now() - startTime;
    console.log(`[install-build] Done in ${totalMs}ms — install:${installOk ? "✓" : "✗"} build:${buildOk && distExists ? "✓" : "✗"}`);

    return NextResponse.json({
      success: buildOk && distExists,
      installStatus: installOk ? "installed" : "failed",
      buildStatus: buildOk && distExists ? "built" : "failed",
      installLog,
      buildLog,
      fileCount: allFiles.length,
      durationMs: totalMs,
      distExists,
    });
  } catch (error) {
    console.error("[install-build]", error);
    try {
      const { id } = await params;
      await db.project.update({
        where: { id },
        data: { installStatus: "failed", buildStatus: "failed" },
      });
    } catch {}
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Erreur install+build",
      },
      { status: 500 }
    );
  }
}
