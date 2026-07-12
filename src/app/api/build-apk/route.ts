import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { db } from "@/lib/db";
import { buildApk } from "@/lib/forge-apk-builder";
import { type ProjectConfig, type GeneratedFile, inferLanguage } from "@/lib/forge-config";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

interface RawFile { path: string; content?: string; language?: string }

function parseFiles(raw: unknown): GeneratedFile[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((f): f is RawFile => typeof f === "object" && f !== null && "path" in f)
    .map((f) => ({
      path: String(f.path).replace(/^\.?\//, ""),
      content: String(f.content ?? ""),
      language: f.language || inferLanguage(String(f.path)),
    }))
    .filter((f) => f.path.length > 0);
}

/** Run a command synchronously (await its completion) with a timeout. */
function runSync(cmd: string, args: string[], cwd: string, timeoutMs: number): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, shell: false, env: { ...process.env, CI: "true" } });
    let stdout = "";
    let stderr = "";
    let done = false;
    const timer = setTimeout(() => {
      if (!done) { done = true; try { child.kill("SIGKILL") } catch {} resolve({ code: 124, stdout, stderr: stderr + "\nTimeout" }) }
    }, timeoutMs);
    child.stdout?.on("data", (d) => (stdout += d));
    child.stderr?.on("data", (d) => (stderr += d));
    child.on("close", (code) => {
      if (!done) { done = true; clearTimeout(timer); resolve({ code: code ?? 1, stdout, stderr }) }
    });
    child.on("error", (err) => {
      if (!done) { done = true; clearTimeout(timer); resolve({ code: 1, stdout, stderr: stderr + "\n" + err.message }) }
    });
  });
}

/** Build a fallback static HTML preview (used when npm build fails or is too slow). */
function buildFallbackHtml(name: string, description: string, files: GeneratedFile[]): string {
  const fileList = files.map((f) => `<li><strong>${f.path}</strong> <span style="color:#64748b">(${f.content.length} chars)</span></li>`).join("");
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover"><title>${name}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:system-ui,-apple-system,sans-serif;background:#0f172a;color:#f1f5f9;padding:16px;padding-bottom:env(safe-area-inset-bottom)}.header{background:linear-gradient(135deg,#06b6d4,#14b8a6);padding:28px 20px;border-radius:16px;margin-bottom:16px}.header h1{color:#0f172a;font-size:26px;font-weight:800}.header p{color:#0f172a;opacity:.8;font-size:14px;margin-top:6px}.card{background:#1e293b;border:1px solid #334155;border-radius:14px;padding:20px;margin-bottom:12px}.card h2{color:#06b6d4;font-size:17px;margin:0 0 12px}.card p{color:#94a3b8;font-size:14px;line-height:1.6}.badge{background:rgba(6,182,212,.15);border:1px solid rgba(6,182,212,.3);color:#67e8f9;padding:4px 11px;border-radius:12px;font-size:11px;display:inline-block;margin:2px}.file-list{list-style:none}.file-list li{padding:8px 10px;background:#0f172a;border-radius:8px;margin-bottom:4px;font-family:monospace;font-size:12px;color:#cbd5e1}.info{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:12px}.info div{background:#0f172a;border-radius:8px;padding:10px}.info span{display:block;font-size:10px;color:#64748b;text-transform:uppercase}.info strong{font-size:15px;color:#06b6d4}</style></head><body><div class="header"><h1>${name}</h1><p>${description}</p></div><div class="card"><h2>Application React</h2><p>Cette application a ete generee par React Forge. Le code source est embarque dans l'APK.</p><div style="margin-top:10px"><span class="badge">React 18</span><span class="badge">Vite</span><span class="badge">TypeScript</span><span class="badge">Tailwind CSS</span><span class="badge">${files.length} fichiers</span></div><div class="info"><div><span>Fichiers</span><strong>${files.length}</strong></div><div><span>Stack</span><strong>Vite+React</strong></div></div></div><div class="card"><h2>Code source embarque</h2><ul class="file-list">${fileList}</ul></div></body></html>`;
}

export async function POST(request: NextRequest) {
  const log: string[] = [];
  try {
    const body = await request.json().catch(() => ({}));
    const projectId = String(body.projectId || "");
    const backendUrl = String(body.backendUrl || "").trim();

    if (!projectId) {
      return NextResponse.json({ success: false, error: "projectId requis" }, { status: 400 });
    }

    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) {
      return NextResponse.json({ success: false, error: "Projet introuvable" }, { status: 404 });
    }

    const files = parseFiles(JSON.parse(project.filesJson || "[]"));
    if (files.length === 0) {
      return NextResponse.json({ success: false, error: "Le projet n'a pas encore de fichiers. Genere-le d'abord." }, { status: 422 });
    }

    log.push(`Projet "${project.name}" - ${files.length} fichiers`);

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

    // ── Try to build the project with Vite to get a real dist/ ──
    const tmpRoot = path.join(os.tmpdir(), "react-forge-apk-src", projectId);
    await fs.rm(tmpRoot, { recursive: true, force: true });
    await fs.mkdir(tmpRoot, { recursive: true });

    for (const f of files) {
      const fp = path.join(tmpRoot, f.path);
      await fs.mkdir(path.dirname(fp), { recursive: true });
      await fs.writeFile(fp, f.content, "utf-8");
    }
    log.push("Fichiers source ecrits");

    let distDir = path.join(tmpRoot, "dist");
    let builtReal = false;

    const hasPkg = files.some((f) => f.path === "package.json");
    if (hasPkg) {
      log.push("Installation des dependances (npm install)...");
      const install = await runSync("npm", ["install", "--no-fund", "--no-audit", "--prefer-offline"], tmpRoot, 120000);
      log.push(`npm install: code ${install.code}`);
      if (install.code === 0) {
        log.push("Build Vite (npm run build)...");
        const build = await runSync("npm", ["run", "build"], tmpRoot, 120000);
        log.push(`npm run build: code ${build.code}`);
        if (build.code === 0) {
          try {
            const stat = await fs.stat(distDir);
            if (stat.isDirectory()) builtReal = true;
          } catch { /* dist not found */ }
        } else if (build.stderr) {
          log.push(`build stderr: ${build.stderr.slice(0, 200)}`);
        }
      } else if (install.stderr) {
        log.push(`install stderr: ${install.stderr.slice(0, 200)}`);
      }
    }

    if (!builtReal) {
      log.push("Build Vite indisponible - utilisation d'un apercu HTML statique");
      distDir = path.join(tmpRoot, "dist-fallback");
      await fs.mkdir(distDir, { recursive: true });
      await fs.writeFile(path.join(distDir, "index.html"), buildFallbackHtml(project.name, project.description, files), "utf-8");
    }

    log.push("Compilation de l'APK...");
    const result = await buildApk(projectId, config, distDir, {
      backendUrl,
      includeForgeInterfaces: false,
    });

    if (!result.success || !result.apkPath) {
      return NextResponse.json({
        success: false,
        error: result.error || "Echec de la compilation APK",
        log: log.join("\n") + "\n" + result.log,
      }, { status: 500 });
    }

    const apkBuffer = await fs.readFile(result.apkPath);
    const apkName = `${project.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}.apk`;
    log.push(`APK genere: ${(apkBuffer.length / 1024).toFixed(0)} Ko`);

    return new NextResponse(apkBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.android.package-archive",
        "Content-Disposition": `attachment; filename="${apkName}"`,
        "X-Build-Log": encodeURIComponent(log.join("\n")).slice(0, 8000),
      },
    });
  } catch (error) {
    console.error("[/api/build-apk]", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Erreur",
      log: log.join("\n"),
    }, { status: 500 });
  }
}
