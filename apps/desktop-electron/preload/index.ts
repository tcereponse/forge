/**
 * React Forge — Electron Preload Script
 * 
 * Exposes a safe API to the renderer process (React UI).
 */

import { contextBridge, ipcRenderer } from "electron";

const api = {
  // GPU status
  getGpuStatus: () => ipcRenderer.invoke("gpu:status"),

  // App info
  getVersion: () => ipcRenderer.invoke("app:version"),
  getAppPath: () => ipcRenderer.invoke("app:path"),

  // Platform
  platform: process.platform,
  isElectron: true,
};

contextBridge.exposeInMainWorld("forgeDesktop", api);
