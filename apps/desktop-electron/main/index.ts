/**
 * React Forge — Electron Main Process
 * 
 * This is the entry point for the desktop application.
 * It starts the Next.js server and the GPU service as child processes,
 * then opens a BrowserWindow that loads the React Forge UI.
 */

import { app, BrowserWindow, ipcMain } from "electron";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";

// ── Configuration ────────────────────────────────────────────────
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;
const NEXT_PORT = 3000;
const GPU_PORT = 5006;

let nextProcess: ChildProcess | null = null;
let gpuProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

// ── GPU Service Launcher ─────────────────────────────────────────
function startGpuService() {
  const gpuScriptPath = path.join(
    app.getAppPath(),
    "services",
    "local-ai-gpu",
    "start.sh"
  );

  // On Windows, use start.bat
  const isWin = process.platform === "win32";
  const scriptPath = isWin
    ? path.join(app.getAppPath(), "services", "local-ai-gpu", "start.bat")
    : gpuScriptPath;

  if (!fs.existsSync(scriptPath)) {
    console.log("[GPU] Service script not found, skipping GPU service");
    return;
  }

  console.log("[GPU] Starting GPU service...");

  gpuProcess = spawn(isWin ? "cmd" : "bash", [isWin ? "/c" : "", scriptPath], {
    cwd: path.dirname(scriptPath),
    env: {
      ...process.env,
      GPU_SERVICE_PORT: String(GPU_PORT),
      GPU_MODE: "auto",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  gpuProcess.stdout?.on("data", (data) => {
    console.log(`[GPU] ${data.toString().trim()}`);
  });

  gpuProcess.stderr?.on("data", (data) => {
    console.error(`[GPU] ${data.toString().trim()}`);
  });

  gpuProcess.on("exit", (code) => {
    console.log(`[GPU] Service exited with code ${code}`);
    gpuProcess = null;
  });
}

// ── Next.js Server Launcher ──────────────────────────────────────
function startNextServer() {
  if (isDev) {
    // In dev mode, Next.js is already running
    console.log("[Next] Dev mode — Next.js already running on port", NEXT_PORT);
    return;
  }

  const nextPath = path.join(app.getAppPath());
  console.log("[Next] Starting Next.js server...");

  nextProcess = spawn(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["next", "start", "-p", String(NEXT_PORT)],
    {
      cwd: nextPath,
      env: { ...process.env, NODE_ENV: "production" },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  nextProcess.stdout?.on("data", (data) => {
    console.log(`[Next] ${data.toString().trim()}`);
  });

  nextProcess.stderr?.on("data", (data) => {
    console.error(`[Next] ${data.toString().trim()}`);
  });
}

// ── Create Window ────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    backgroundColor: "#020617",
    title: "React Forge",
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Load the app
  const url = isDev
    ? `http://localhost:${NEXT_PORT}`
    : `http://localhost:${NEXT_PORT}`;

  mainWindow.loadURL(url);

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ── IPC Handlers ─────────────────────────────────────────────────
ipcMain.handle("gpu:status", async () => {
  try {
    const res = await fetch(`http://localhost:${GPU_PORT}/v1/health`);
    const data = await res.json();
    return { success: true, ...data };
  } catch {
    return { success: false, available: false };
  }
});

ipcMain.handle("app:version", () => {
  return app.getVersion();
});

ipcMain.handle("app:path", () => {
  return app.getAppPath();
});

// ── App Lifecycle ────────────────────────────────────────────────
app.whenReady().then(() => {
  console.log("🚀 React Forge Desktop starting...");

  // Start GPU service first (non-blocking)
  startGpuService();

  // Start Next.js server (production only)
  startNextServer();

  // Wait a bit for servers to start, then create window
  setTimeout(createWindow, isDev ? 1000 : 5000);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // Kill child processes
  if (nextProcess) {
    nextProcess.kill();
    nextProcess = null;
  }
  if (gpuProcess) {
    gpuProcess.kill();
    gpuProcess = null;
  }

  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", () => {
  if (nextProcess) {
    nextProcess.kill();
  }
  if (gpuProcess) {
    gpuProcess.kill();
  }
});
