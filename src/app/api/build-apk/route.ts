import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { spawn } from "child_process";
import { db } from "@/lib/db";
import { buildApk } from "@/lib/forge-apk-builder";
import { type ProjectConfig, type GeneratedFile, inferLanguage } from "@/lib/forge-config";
import { getDistDir } from "@/lib/workspace";

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

/**
 * Builds a standalone HTML that runs the React app in-browser using esm.sh + Babel.
 * This actually executes the project's React components — not just a static preview.
 */
function buildStandaloneHtml(name: string, description: string, files: GeneratedFile[]): string {
  const appFile = files.find((f) => /src\/App\.(tsx|jsx)$/.test(f.path))
  const mainComponent = files.find((f) => /src\/components\/.*\.(tsx|jsx)$/.test(f.path))
  const componentFiles = files.filter((f) =>
    /src\/.*\.(tsx|jsx)$/.test(f.path) &&
    f.path !== "src/App.tsx" &&
    f.path !== "src/App.jsx" &&
    f.path !== "src/main.tsx" &&
    f.path !== "src/main.jsx"
  )

  const sources: Record<string, string> = {}
  if (appFile) sources[appFile.path] = appFile.content
  if (mainComponent) sources[mainComponent.path] = mainComponent.content
  for (const f of componentFiles) {
    if (!sources[f.path]) sources[f.path] = f.content
  }

  const escapeJs = (s: string) => s.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$")
  const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

  const indexCss = files.find((f) => f.path === "src/index.css")
  const cssContent = indexCss ? indexCss.content.replace(/@tailwind\s+(base|components|utilities);?\s*/g, "") : ""

  const sourcesJson = JSON.stringify(Object.fromEntries(Object.entries(sources)))

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#0f172a">
<title>${name}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f1f5f9; }
#root { min-height: 100vh; }
#loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 12px; }
#loading .spinner { width: 40px; height: 40px; border: 3px solid rgba(6,182,212,0.2); border-top-color: #06b6d4; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
#error { display: none; padding: 20px; margin: 20px; border-radius: 12px; background: #1e293b; border: 1px solid #ef4444; color: #fca5a5; font-size: 13px; white-space: pre-wrap; word-break: break-word; }
${cssContent ? `<style>${escapeHtml(cssContent)}</style>` : ""}
</style>
</head>
<body>
<div id="root">
  <div id="loading">
    <div class="spinner"></div>
    <p style="color:#94a3b8;font-size:14px;">Chargement de ${name}...</p>
  </div>
</div>
<div id="error"></div>

<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.3.1",
    "react-dom": "https://esm.sh/react-dom@18.3.1",
    "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
    "react-router-dom": "https://esm.sh/react-router-dom@6.26.0"
  }
}
</script>

<script src="https://unpkg.com/@babel/standalone@7.25.6/babel.min.js"></script>

<script>
const SOURCES = ${sourcesJson};

function transformTsx(code) {
  try {
    return Babel.transform(code, {
      presets: [
        ['typescript', { allExtensions: true, isTSX: true }],
        ['react', { runtime: 'automatic' }]
      ],
      filename: 'file.tsx'
    }).code;
  } catch(e) {
    console.error('Transform error:', e);
    throw e;
  }
}

function rewriteImports(code, filePath) {
  return code
    .replace(/from\\s+['"]((?:\\.{1,2})\\/[^'"]+)['"]/g, "from __virtual__(\\\"$1\\\")")
    .replace(/import\\s+['"]((?:\\.{1,2})\\/[^'"]+)['"]/g, "import __virtual__(\\\"$1\\\")");
}

function resolvePath(importPath, fromFile) {
  const dir = fromFile.split('/').slice(0, -1).join('/');
  let resolved = importPath;
  if (importPath.startsWith('./')) {
    resolved = dir + '/' + importPath.slice(2);
  } else if (importPath.startsWith('../')) {
    const parts = dir.split('/');
    parts.pop();
    resolved = parts.join('/') + '/' + importPath.slice(3);
  }
  if (!resolved.match(/\\.(tsx|jsx|ts|js)$/)) {
    for (const ext of ['.tsx', '.jsx', '.ts', '.js']) {
      if (SOURCES[resolved + ext]) { resolved = resolved + ext; break; }
    }
  }
  return resolved.replace(/\\/+/g, '/').replace(/\\/$/, '');
}

const moduleCache = {};
function __virtual__(importPath) {
  const resolved = resolvePath(importPath, '');
  return loadModule(resolved);
}

function loadModule(filePath) {
  if (moduleCache[filePath]) return moduleCache[filePath].exports;
  const source = SOURCES[filePath];
  if (!source) throw new Error('Module non trouve: ' + filePath);
  const module = { exports: {} };
  moduleCache[filePath] = module;
  let code = transformTsx(source);
  code = rewriteImports(code, filePath);
  const wrapper = new Function('React', 'ReactDOM', 'HashRouter', 'Routes', 'Route', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext', 'useReducer', 'Link', 'NavLink', 'useParams', 'useNavigate', 'useLocation', '__virtual__', 'module', 'exports', code);
  wrapper(
    window.React, window.ReactDOM,
    window.ReactRouterDOM?.HashRouter, window.ReactRouterDOM?.Routes, window.ReactRouterDOM?.Route,
    window.React?.useState, window.React?.useEffect, window.React?.useRef, window.React?.useMemo, window.React?.useCallback, window.React?.useContext, window.React?.useReducer,
    window.ReactRouterDOM?.Link, window.ReactRouterDOM?.NavLink, window.ReactRouterDOM?.useParams, window.ReactRouterDOM?.useNavigate, window.ReactRouterDOM?.useLocation,
    __virtual__, module, module.exports
  );
  return module.exports;
}

function showError(msg) {
  const el = document.getElementById('error');
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';
  if (el) { el.style.display = 'block'; el.textContent = msg; }
  console.error(msg);
}

async function init() {
  try {
    if (!window.Babel) {
      await new Promise((resolve, reject) => {
        const check = setInterval(() => {
          if (window.Babel) { clearInterval(check); resolve(); }
        }, 50);
        setTimeout(() => { clearInterval(check); reject('Babel non charge'); }, 10000);
      });
    }
    const appModule = loadModule('src/App.tsx');
    const App = appModule.default || appModule.App;
    if (!App) throw new Error('Composant App non trouve');
    const React = window.React;
    const ReactDOM = window.ReactDOM;
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
  } catch(e) {
    showError('Erreur: ' + (e.message || e));
  }
}

init();
</script>
</body>
</html>`
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

    // ── Strategy 1: Use existing workspace dist/ (already built by PreviewPanel) ──
    const workspaceDist = getDistDir(projectId);
    let distDir = workspaceDist;
    let builtReal = false;

    try {
      const stat = await fs.stat(workspaceDist);
      if (stat.isDirectory()) {
        const hasIndex = await fs.stat(path.join(workspaceDist, "index.html")).then(() => true).catch(() => false);
        if (hasIndex) {
          log.push("Utilisation du dist/ existant (deja build par l'onglet Apercu)");
          builtReal = true;
        }
      }
    } catch { /* workspace dist doesn't exist */ }

    // ── Strategy 2: Build from source if no existing dist/ ──
    if (!builtReal) {
      log.push("dist/ existant non trouve, build depuis source...");
      const tmpRoot = path.join(os.tmpdir(), "react-forge-apk-src", projectId);
      await fs.rm(tmpRoot, { recursive: true, force: true });
      await fs.mkdir(tmpRoot, { recursive: true });

      for (const f of files) {
        const fp = path.join(tmpRoot, f.path);
        await fs.mkdir(path.dirname(fp), { recursive: true });
        await fs.writeFile(fp, f.content, "utf-8");
      }
      log.push("Fichiers source ecrits");

      const hasPkg = files.some((f) => f.path === "package.json");
      if (hasPkg) {
        log.push("Installation des dependances (--legacy-peer-deps)...");
        const install = await runSync("npm", ["install", "--no-fund", "--no-audit", "--legacy-peer-deps"], tmpRoot, 120000);
        log.push(`npm install: code ${install.code}`);
        if (install.code === 0) {
          log.push("Build Vite (npm run build)...");
          const build = await runSync("npm", ["run", "build"], tmpRoot, 120000);
          log.push(`npm run build: code ${build.code}`);
          if (build.code === 0) {
            try {
              const stat = await fs.stat(path.join(tmpRoot, "dist"));
              if (stat.isDirectory()) {
                distDir = path.join(tmpRoot, "dist");
                builtReal = true;
              }
            } catch { /* dist not found */ }
          }
        }
      }
    }

    // ── Strategy 3: Standalone HTML (esm.sh + Babel) — runs the real React app ──
    if (!builtReal) {
      log.push("Build Vite indisponible - utilisation du mode standalone (esm.sh + Babel)");
      const standaloneDir = path.join(os.tmpdir(), "react-forge-apk-standalone", projectId);
      await fs.rm(standaloneDir, { recursive: true, force: true });
      await fs.mkdir(standaloneDir, { recursive: true });
      const html = buildStandaloneHtml(project.name, project.description, files);
      await fs.writeFile(path.join(standaloneDir, "index.html"), html, "utf-8");
      distDir = standaloneDir;
    }

    log.push("Compilation de l'APK...");
    const result = await buildApk(projectId, config, distDir, {
      backendUrl,
      includeForgeInterfaces: true,
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
