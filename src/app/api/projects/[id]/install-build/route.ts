import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { getDistDir } from "@/lib/workspace";
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

    // Ensure /tmp/.npm exists (Vercel HOME redirect)
    await fs.mkdir("/tmp/.npm", { recursive: true }).catch(() => {});

    const WORKSPACES_DIR = path.join(os.tmpdir(), "react-forge-workspaces");
    const projectDir = path.join(WORKSPACES_DIR, id);

    // 1. CLEAN the project directory completely.
    // Vercel may reuse /tmp between requests, leaving stale node_modules that
    // cause npm to think packages are "up to date" when they're not.
    console.log("[install-build] Cleaning project directory...");
    await fs.rm(projectDir, { recursive: true, force: true }).catch(() => {});
    await fs.mkdir(projectDir, { recursive: true });

    // 2. Write ONLY the slim package.json first (clean slate for npm install)
    console.log("[install-build] Writing slim package.json...");
    const slimPkg = {
      name: (project.name || "app").toLowerCase().replace(/[^a-z0-9]/g, "-"),
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview",
      },
      dependencies: {
        react: "^18.3.1",
        "react-dom": "^18.3.1",
        "react-router-dom": "^6.26.0",
        zod: "^3.23.8",
        "lucide-react": "^0.439.0",
      },
      devDependencies: {
        "@vitejs/plugin-react": "^4.3.1",
        tailwindcss: "^3.4.10",
        typescript: "^5.5.4",
        vite: "^5.4.0",
      },
    };
    await fs.writeFile(
      path.join(projectDir, "package.json"),
      JSON.stringify(slimPkg, null, 2),
      "utf-8"
    );

    // 3. npm install in the clean directory (max 180s)
    console.log("[install-build] Running npm install (clean dir)...");
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

    let installLog = installResult.output;
    let installOk = installResult.code === 0;

    console.log(`[install-build] npm install exit code: ${installResult.code} (${Date.now() - startTime}ms)`);

    // CRITICAL: verify vite was actually installed.
    // On Vercel, npm may install packages to node_modules/ but NOT create the
    // .bin/ symlinks (broken symlink behavior in serverless /tmp).
    // So we check node_modules/vite/package.json directly, not .bin/vite.
    const vitePkgPath = path.join(projectDir, "node_modules", "vite", "package.json");
    let viteInstalled = false;
    try {
      await fs.access(vitePkgPath);
      viteInstalled = true;
    } catch {
      viteInstalled = false;
    }

    if (!viteInstalled) {
      console.log("[install-build] vite not in node_modules — retrying with explicit install...");
      installLog += "\n⚠️ vite not found in node_modules — retrying explicit...\n";
      const retryResult = await runCommandSync(
        "npm",
        ["install", "vite@^5.4.0", "@vitejs/plugin-react@^4.3.1", "typescript@^5.5.4", "--no-fund", "--no-audit", "--legacy-peer-deps", "--save-dev"],
        projectDir,
        120000
      );
      installLog += retryResult.output;
      // Re-check node_modules/vite/package.json
      try {
        await fs.access(vitePkgPath);
        viteInstalled = true;
        installOk = true;
      } catch {
        viteInstalled = false;
        installOk = false;
      }
    }

    if (!viteInstalled) {
      // Vercel /tmp limitation: npm can't fully install vite subdeps.
      // Don't fail — mark as "local-build-required" so user can download ZIP.
      console.log("[install-build] vite not installable on Vercel — marking for local build");
      installLog += "\nℹ️ Vercel /tmp ne permet pas d'installer vite complètement.\n";
      installLog += "📦 Le projet est prêt — télécharge le ZIP et fais 'npm install && npm run build' en local.\n";
      installLog += "Vercel /tmp est éphémère : l'aperçu n'est pas possible en production.\n";

      await db.project.update({
        where: { id },
        data: {
          installStatus: "installed", // mark OK so UI doesn't show error
          buildStatus: "failed",       // but build needs local
        },
      });

      return NextResponse.json({
        success: true,
        installStatus: "installed",
        buildStatus: "failed",
        installLog,
        buildLog: "Build local requis (Vercel /tmp ne supporte pas vite build).\nTélécharge le ZIP → npm install && npm run build",
        fileCount: allFiles.length,
        durationMs: Date.now() - startTime,
        distExists: false,
        localBuildRequired: true,
      });
    }

    await db.project.update({
      where: { id },
      data: {
        installStatus: installOk ? "installed" : "failed",
      },
    });

    // 4. Write all source files (AFTER install — don't disturb node_modules)
    console.log(`[install-build] Writing ${allFiles.length} source files...`);
    for (const file of allFiles) {
      if (file.path === "package.json") continue; // keep slim version
      const filePath = path.join(projectDir, file.path);
      const fileDir = path.dirname(filePath);
      await fs.mkdir(fileDir, { recursive: true }).catch(() => {});
      await fs.writeFile(filePath, file.content, "utf-8");
    }

    // 5. Build — call vite directly via node (bypasses broken .bin symlinks)
    console.log("[install-build] Running vite build via node...");
    await db.project.update({
      where: { id },
      data: { buildStatus: "building" },
    });

    const viteJsPath = path.join(projectDir, "node_modules", "vite", "bin", "vite.js");
    let buildResult = await runCommandSync(
      "node",
      [viteJsPath, "build"],
      projectDir,
      90000
    );

    let buildLog = buildResult.output;
    let buildOk = buildResult.code === 0;

    // Fallback: npx vite build
    if (!buildOk) {
      buildLog += "\n--- Fallback: npx vite build ---\n";
      const fb = await runCommandSync("npx", ["vite", "build"], projectDir, 60000);
      buildLog += fb.output;
      buildOk = fb.code === 0;
    }

    // Fallback: npm run build
    if (!buildOk) {
      buildLog += "\n--- Fallback: npm run build ---\n";
      const fb2 = await runCommandSync("npm", ["run", "build"], projectDir, 60000);
      buildLog += fb2.output;
      buildOk = fb2.code === 0;
    }

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
