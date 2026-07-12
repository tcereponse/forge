// Workspace manager: writes generated files to disk, runs npm install/build,
// and tracks status in memory. Each project gets a folder under workspaces/{id}/.
//
// IMPORTANT: Workspaces are stored OUTSIDE the project directory (in /tmp)
// to avoid breaking the platform's file browser (ls-tree) which tries to
// index every file in the project folder. node_modules with 4000+ files
// would cause 503 timeouts in the platform's file listing service.

import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { spawn, type ChildProcess } from "child_process";
import type { GeneratedFile } from "./forge-config";

// Use /tmp/react-forge-workspaces (or OS temp dir) — outside the project
// so the platform file browser won't try to index 10k+ node_modules files.
const WORKSPACES_DIR = path.join(os.tmpdir(), "react-forge-workspaces");

// In-memory status tracking (persists for the dev server's lifetime)
interface ProcessStatus {
  install: "pending" | "installing" | "installed" | "failed";
  build: "pending" | "building" | "built" | "failed";
  installLog: string;
  buildLog: string;
}

const statusMap = new Map<string, ProcessStatus>();
const runningProcesses = new Map<string, ChildProcess>();
const statusCache = new Map<string, { status: ProcessStatus; ts: number }>();
const STATUS_CACHE_TTL = 2000; // 2s — short for responsive UI

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

export function getDistDir(projectId: string): string {
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

  // Invalidate the status cache so the next /status request sees "installing"
  statusCache.delete(projectId);

  const dir = getProjectDir(projectId);
  const child = spawn("npm", ["install", "--no-fund", "--no-audit", "--legacy-peer-deps"], {
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
export async function runBuild(projectId: string): Promise<void> {
  const s = getStatus(projectId);
  if (s.build === "building") return;

  // Check disk reality: if node_modules exists, treat as installed
  // (handles server restart where in-memory status was lost)
  let installOk = s.install === "installed";
  if (!installOk) {
    const hasNm = await nodeModulesExists(projectId);
    if (hasNm) {
      installOk = true;
      setStatus(projectId, { install: "installed" });
    }
  }

  // Can't build if not installed
  if (!installOk) {
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

  // Invalidate the status cache so the next /status request sees "building"
  statusCache.delete(projectId);

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

// Get reconciled status — checks disk reality (node_modules, dist) and
// corrects in-memory status if the server restarted.
// statusCache + STATUS_CACHE_TTL are declared at the top of the module.

export async function getReconciledStatus(
  projectId: string
): Promise<ProcessStatus> {
  // Check cache first
  const cached = statusCache.get(projectId);
  if (cached && Date.now() - cached.ts < STATUS_CACHE_TTL) {
    return cached.status;
  }

  const status = { ...getStatus(projectId) };
  const wsExists = await workspaceExists(projectId);

  if (wsExists) {
    const hasNm = await nodeModulesExists(projectId);
    if (hasNm && status.install === "pending") {
      status.install = "installed";
    }
    if (status.install === "installed" && status.build === "pending") {
      try {
        const distStat = await fs.stat(getDistDir(projectId));
        if (distStat.isDirectory()) {
          status.build = "built";
        }
      } catch {
        // dist doesn't exist, keep pending
      }
    }
  }

  // Cache the result
  statusCache.set(projectId, { status, ts: Date.now() });
  return status;
}

// Re-export for invalidation from other modules
export function invalidateStatusCache(projectId: string): void {
  statusCache.delete(projectId);
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

// ── Full ZIP from disk (includes node_modules + dist) ───────────────────────

// Directories/files to skip when zipping the workspace (to keep ZIP lean
// and avoid memory issues with heavy binary/optional packages)
const SKIP_ENTRIES = new Set([
  ".cache",
  ".vite",
  "dist-stats.json",
  ".bin", // node_modules/.bin — symlinks that break zipping
  ".package-lock.json",
]);

// File extensions to skip (heavy native binaries not needed for the ZIP)
const SKIP_EXTENSIONS = new Set([
  ".node", // native addons (platform-specific)
  ".wasm",
  ".pdb",
  ".dll",
  ".so",
  ".dylib",
  ".exe",
]);

// Max individual file size to include (5 MB — skip huge source maps, etc.)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Check if the workspace directory exists on disk
export async function workspaceExists(projectId: string): Promise<boolean> {
  try {
    const stat = await fs.stat(getProjectDir(projectId));
    return stat.isDirectory();
  } catch {
    return false;
  }
}

// Check if node_modules exists in the workspace
export async function nodeModulesExists(projectId: string): Promise<boolean> {
  try {
    const stat = await fs.stat(path.join(getProjectDir(projectId), "node_modules"));
    return stat.isDirectory();
  } catch {
    return false;
  }
}

// Read a directory recursively and return all file paths (relative to root)
// Skips blacklisted entries, heavy binaries, and symlinks.
async function readDirRecursive(
  rootDir: string,
  currentDir: string,
  files: { relPath: string; absPath: string; size: number }[]
): Promise<void> {
  let entries;
  try {
    entries = await fs.readdir(currentDir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    // Skip blacklisted entries
    if (SKIP_ENTRIES.has(entry.name)) continue;

    const absPath = path.join(currentDir, entry.name);
    const relPath = path.relative(rootDir, absPath);

    if (entry.isDirectory()) {
      await readDirRecursive(rootDir, absPath, files);
    } else if (entry.isFile()) {
      // Skip heavy binary extensions
      const ext = path.extname(entry.name).toLowerCase();
      if (SKIP_EXTENSIONS.has(ext)) continue;

      try {
        const stat = await fs.stat(absPath);
        // Skip files larger than MAX_FILE_SIZE
        if (stat.size > MAX_FILE_SIZE) continue;
        files.push({ relPath, absPath, size: stat.size });
      } catch {
        // Skip unreadable files
      }
    }
    // Skip symlinks to avoid infinite loops and broken zips
  }
}

// Create a full ZIP from the workspace directory on disk.
// Includes source files, node_modules, dist, config — everything (minus heavy binaries).
export async function createFullZipFromDisk(
  projectId: string
): Promise<Buffer | null> {
  const dir = getProjectDir(projectId);
  const exists = await workspaceExists(projectId);
  if (!exists) return null;

  // Dynamically import JSZip to keep the module lighter when not used
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  const files: { relPath: string; absPath: string; size: number }[] = [];
  await readDirRecursive(dir, dir, files);

  // Add all files to the zip, using streamFiles to reduce memory pressure
  for (const file of files) {
    try {
      const content = await fs.readFile(file.absPath);
      zip.file(file.relPath, content);
    } catch {
      // Skip unreadable files (permissions, broken symlinks, etc.)
    }
  }

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 1 }, // fast compression for large node_modules
    streamFiles: true, // stream files to reduce peak memory
  });

  return Buffer.from(buffer);
}

// Get the count of files in node_modules (for UI info)
export async function getNodeModulesFileCount(
  projectId: string
): Promise<number> {
  const nmPath = path.join(getProjectDir(projectId), "node_modules");
  try {
    let count = 0;
    async function countDir(dir: string): Promise<void> {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.name.startsWith(".npm") || entry.name === ".package-lock.json") continue;
        const abs = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          await countDir(abs);
        } else if (entry.isFile()) {
          count++;
        }
      }
    }
    await countDir(nmPath);
    return count;
  } catch {
    return 0;
  }
}
