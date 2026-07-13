import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { type ProjectConfig } from "@/lib/forge-config";
import { deserializeState, runNextPass, finalizeFiles, serializeState } from "@/lib/forge-gold-async";
import { writeProjectFiles } from "@/lib/workspace";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";

export const runtime = "nodejs";
export const maxDuration = 300; // finalization pass needs time for install+build

/**
 * Builds a safe environment for npm on Vercel serverless.
 * Also prepends ./node_modules/.bin to PATH so "npm run build" finds tsc + vite.
 */
function buildSafeEnv(cwd?: string): NodeJS.ProcessEnv {
  const tmpDir = "/tmp";
  const binPath = cwd ? `${cwd}/node_modules/.bin` : "";
  const currentPath = process.env.PATH || "/usr/local/bin:/usr/bin:/bin";
  return {
    ...process.env,
    HOME: tmpDir,
    NPM_CONFIG_CACHE: `${tmpDir}/.npm`,
    NPM_CONFIG_PREFIX: `${tmpDir}/.npm-global`,
    NPM_CONFIG_LOGLEVEL: "error",
    CI: "true",
    PATH: binPath ? `${binPath}:${currentPath}` : currentPath,
  };
}

/**
 * Runs a command synchronously — used for npm install + build on Vercel serverless.
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
    child.on("close", (code) => { clearTimeout(timer); resolve({ code: code ?? 1, output }); });
    child.on("error", (err) => { clearTimeout(timer); resolve({ code: 1, output: output + `\n❌ ${err.message}\n` }); });
  });
}

/**
 * POST /api/projects/[id]/gold/next
 * Runs the next pending pass of the Gold pipeline.
 * When all 6 passes are done, finalizes (merge + templates + save).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json({ success: false, error: "Projet introuvable" }, { status: 404 });
    }

    // Load state from arsenalJson
    const state = deserializeState(project.arsenalJson || "");
    if (!state) {
      return NextResponse.json(
        { success: false, error: "Pipeline non initialisé. Appelle /gold/start d'abord." },
        { status: 400 }
      );
    }

    if (state.currentPass > 6) {
      // Already done
      return NextResponse.json({
        success: true,
        pass: 7,
        passName: "Done",
        filesGenerated: 0,
        done: true,
        currentPass: 7,
        phases: state.phases,
        finalized: true,
        fileCount: project.fileCount,
      });
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

    // Run next pass
    const result = await runNextPass(config, state);
    const newState = result.state;

    // Save updated state
    await db.project.update({
      where: { id },
      data: { arsenalJson: serializeState(newState) },
    });

    // If all passes done, finalize
    if (result.done) {
      const finalFiles = finalizeFiles(newState, config);
      const prd = newState.arch
        ? `# Architecture Plan\n\nFeatures: ${newState.arch.features.join(", ")}\nComponents: ${newState.arch.components.join(", ")}\nFolders: ${newState.arch.folders.join(", ")}`
        : "";

      await db.project.update({
        where: { id },
        data: {
          status: "ready",
          prd,
          filesJson: JSON.stringify(finalFiles),
          fileCount: finalFiles.length,
          installStatus: "installing",
          buildStatus: "pending",
        },
      });

      // Write to disk + SYNCHRONOUS install + build (Vercel serverless can't do background)
      let installLog = "";
      let buildLog = "";
      let installOk = false;
      let buildOk = false;
      let distExists = false;

      try {
        console.log("[gold/next] Finalizing: writing files to disk...");
        await writeProjectFiles(id, finalFiles);

        // Ensure /tmp/.npm exists (Vercel HOME redirect)
        await fs.mkdir("/tmp/.npm", { recursive: true }).catch(() => {});

        const WORKSPACES_DIR = path.join(os.tmpdir(), "react-forge-workspaces");
        const projectDir = path.join(WORKSPACES_DIR, id);

        // npm install (max 150s)
        console.log("[gold/next] Running npm install (synchronous)...");
        const installResult = await runCommandSync(
          "npm",
          ["install", "--no-fund", "--no-audit", "--legacy-peer-deps"],
          projectDir,
          150000
        );
        installLog = installResult.output;
        installOk = installResult.code === 0;
        console.log(`[gold/next] npm install: code=${installResult.code}`);

        await db.project.update({
          where: { id },
          data: { installStatus: installOk ? "installed" : "failed" },
        });

        // npm run build (max 80s) — with fallback to npx vite build
        if (installOk) {
          console.log("[gold/next] Running npm run build (synchronous)...");
          await db.project.update({
            where: { id },
            data: { buildStatus: "building" },
          });

          let buildResult = await runCommandSync(
            "npm",
            ["run", "build"],
            projectDir,
            80000
          );
          buildLog = buildResult.output;
          buildOk = buildResult.code === 0;

          // Fallback: if npm run build failed due to "command not found", try npx vite build
          if (!buildOk && buildLog.includes("command not found")) {
            console.log("[gold/next] npm run build failed (command not found), trying npx vite build...");
            buildLog += "\n--- Fallback: npx vite build ---\n";
            const fallbackResult = await runCommandSync(
              "npx",
              ["vite", "build"],
              projectDir,
              60000
            );
            buildLog += fallbackResult.output;
            buildOk = fallbackResult.code === 0;
          }

          // Check dist/
          try {
            const distStat = await fs.stat(path.join(projectDir, "dist"));
            distExists = distStat.isDirectory();
          } catch {}

          await db.project.update({
            where: { id },
            data: { buildStatus: buildOk && distExists ? "built" : "failed" },
          });
          console.log(`[gold/next] build: code=${buildOk ? 0 : 1}, dist=${distExists}`);
        }
      } catch (e) {
        console.error("[gold/next] Finalization failed:", e);
        installLog += `\n❌ Finalization error: ${e instanceof Error ? e.message : "unknown"}\n`;
      }

      return NextResponse.json({
        success: true,
        pass: 7,
        passName: "Done",
        filesGenerated: finalFiles.length,
        done: true,
        finalized: true,
        fileCount: finalFiles.length,
        currentPass: 7,
        phases: newState.phases,
        installStatus: installOk ? "installed" : "failed",
        buildStatus: buildOk && distExists ? "built" : "failed",
        installLog,
        buildLog,
        distExists,
      });
    }

    return NextResponse.json({
      success: result.success,
      pass: state.currentPass,
      passName: result.passName,
      filesGenerated: result.filesGenerated,
      done: result.done,
      error: result.error,
      currentPass: newState.currentPass,
      phases: newState.phases,
    });
  } catch (error) {
    console.error("[gold/next]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
