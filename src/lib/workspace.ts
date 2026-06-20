// Workspace manager: writes generated files to disk, runs npm install/build,
// and tracks status in memory. Each project gets a folder under workspaces/{id}/.

import { promises as fs } from "fs";
import path from "path";
import { spawn, type ChildProcess } from "child_process";
import type { GeneratedFile } from "./forge-config";

const WORKSPACES_DIR = path.join(process.cwd(), "workspaces");

// In-memory status tracking (persists for the dev server's lifetime)
interface ProcessStatus {
  install: "pending" | "installing" | "installed" | "failed";
  build: "pending" | "building" | "built" | "failed";
  installLog: string;
  buildLog: string;
}

const statusMap = new Map<string, ProcessStatus>();
const runningProcesses = new Map<string, ChildProcess>();

function getStatus(projectId: string): ProcessStatus {
  let s = statusMap.get(projectId);
  if (!s) {
    s = {
      install: "pending",
      build: "pending",
      installLog: "",
      buildLog: "",
    };
    statusMap.set(projectId, s);
  }
  return s;
}

function setStatus(projectId: string, patch: Partial<ProcessStatus>) {
  const s = getStatus(projectId);
  Object.assign(s, patch);
  statusMap.set(projectId, s);
}

function getProjectDir(projectId: string): string {
  return path.join(WORKSPACES_DIR, projectId);
}

function getDistDir(projectId: string): string {
  return path.join(getProjectDir(projectId), "dist");
}

// ── Write generated files to disk ───────────────────────────────────────────
export async function writeProjectFiles(
  projectId: string,
  files: GeneratedFile[]
): Promise<void> {
  const dir = getProjectDir(projectId);
  // Clean existing directory
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });

  for (const file of files) {
    const filePath = path.join(dir, file.path);
    const fileDir = path.dirname(filePath);
    await fs.mkdir(fileDir, { recursive: true });
    await fs.writeFile(filePath, file.content, "utf-8");
  }
}

// ── Run npm install (async, fire-and-forget with status tracking) ──────────
export function runInstall(projectId: string): void {
  // If already installing or installed, skip
  const s = getStatus(projectId);
  if (s.install === "installing") return;

  setStatus(projectId, {
    install: "installing",
    installLog: "$ npm install\n",
  });

  const dir = getProjectDir(projectId);
  const child = spawn("npm", ["install", "--no-fund", "--no-audit"], {
    cwd: dir,
    shell: false,
    env: { ...process.env, CI: "true" },
  });

  runningProcesses.set(projectId + ":install", child);

  child.stdout?.on("data", (data) => {
    const chunk = data.toString();
    const s = getStatus(projectId);
    s.installLog += chunk;
    statusMap.set(projectId, s);
  });

  child.stderr?.on("data", (data) => {
    const chunk = data.toString();
    const s = getStatus(projectId);
    s.installLog += chunk;
    statusMap.set(projectId, s);
  });

  child.on("close", (code) => {
    runningProcesses.delete(projectId + ":install");
    const s = getStatus(projectId);
    if (code === 0) {
      s.install = "installed";
      s.installLog += "\n✅ Installation terminée avec succès.\n";
    } else {
      s.install = "failed";
      s.installLog += `\n❌ Échec de l'installation (code ${code}).\n`;
    }
    statusMap.set(projectId, s);
  });

  child.on("error", (err) => {
    runningProcesses.delete(projectId + ":install");
    setStatus(projectId, {
      install: "failed",
      installLog: `\n❌ Erreur: ${err.message}\n`,
    });
  });
}

// ── Run npm run build (async) ──────────────────────────────────────────────
export function runBuild(projectId: string): void {
  const s = getStatus(projectId);
  if (s.build === "building") return;
  // Can't build if not installed
  if (s.install !== "installed") {
    setStatus(projectId, {
      build: "failed",
      buildLog: "❌ Les dépendances doivent être installées d'abord.\n",
    });
    return;
  }

  setStatus(projectId, {
    build: "building",
    buildLog: "$ npm run build\n",
  });

  const dir = getProjectDir(projectId);
  const child = spawn("npm", ["run", "build"], {
    cwd: dir,
    shell: false,
    env: { ...process.env, CI: "true" },
  });

  runningProcesses.set(projectId + ":build", child);

  child.stdout?.on("data", (data) => {
    const chunk = data.toString();
    const s = getStatus(projectId);
    s.buildLog += chunk;
    statusMap.set(projectId, s);
  });

  child.stderr?.on("data", (data) => {
    const chunk = data.toString();
    const s = getStatus(projectId);
    s.buildLog += chunk;
    statusMap.set(projectId, s);
  });

  child.on("close", (code) => {
    runningProcesses.delete(projectId + ":build");
    const s = getStatus(projectId);
    if (code === 0) {
      s.build = "built";
      s.buildLog += "\n✅ Build terminé. L'aperçu est prêt.\n";
    } else {
      s.build = "failed";
      s.buildLog += `\n❌ Échec du build (code ${code}).\n`;
    }
    statusMap.set(projectId, s);
  });

  child.on("error", (err) => {
    runningProcesses.delete(projectId + ":build");
    setStatus(projectId, {
      build: "failed",
      buildLog: `\n❌ Erreur: ${err.message}\n`,
    });
  });
}

// ── Get current status (for polling) ────────────────────────────────────────
export function getProcessStatus(projectId: string): ProcessStatus {
  return getStatus(projectId);
}

// ── Preview file serving ────────────────────────────────────────────────────
export async function getPreviewFile(
  projectId: string,
  relativePath: string
): Promise<{ content: Buffer; mime: string } | null> {
  const distDir = getDistDir(projectId);
  // Prevent path traversal
  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, "");
  const filePath = path.join(distDir, safePath);

  // Ensure the resolved path is within distDir
  if (!filePath.startsWith(distDir)) return null;

  try {
    const content = await fs.readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const mime = getMimeType(ext);
    return { content, mime };
  } catch {
    return null;
  }
}

// If no specific file requested, serve index.html (SPA fallback)
// Rewrites relative asset paths (./assets/...) to absolute paths (/api/preview/{id}/assets/...)
// so they resolve correctly regardless of trailing slash.
export async function getPreviewIndex(
  projectId: string
): Promise<{ content: Buffer; mime: string } | null> {
  const raw = await getPreviewFile(projectId, "index.html");
  if (!raw) return null;

  // Rewrite relative asset URLs to absolute paths including the project ID.
  // Vite with base:'./' produces: src="./assets/index-xxx.js"
  // We transform to: src="/api/preview/{id}/assets/index-xxx.js"
  const basePath = `/api/preview/${projectId}/`;
  let html = raw.content.toString("utf-8");
  html = html.replace(
    /((?:src|href)\s*=\s*["'])\.\/(assets\/[^"']+)/g,
    `$1${basePath}$2`
  );
  return { content: Buffer.from(html, "utf-8"), mime: raw.mime };
}

function getMimeType(ext: string): string {
  switch (ext) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".mjs":
      return "application/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".json":
      return "application/json; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".ico":
      return "image/x-icon";
    case ".woff":
      return "font/woff";
    case ".woff2":
      return "font/woff2";
    case ".ttf":
      return "font/ttf";
    case ".map":
      return "application/json; charset=utf-8";
    case ".txt":
      return "text/plain; charset=utf-8";
    default:
      return "application/octet-stream";
  }
}

// ── Delete workspace (when project is deleted) ─────────────────────────────
export async function deleteWorkspace(projectId: string): Promise<void> {
  // Kill any running processes
  const installProc = runningProcesses.get(projectId + ":install");
  const buildProc = runningProcesses.get(projectId + ":build");
  installProc?.kill();
  buildProc?.kill();
  runningProcesses.delete(projectId + ":install");
  runningProcesses.delete(projectId + ":build");
  statusMap.delete(projectId);

  const dir = getProjectDir(projectId);
  await fs.rm(dir, { recursive: true, force: true });
}
