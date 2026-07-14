import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildTemplateFiles } from "@/lib/forge-templates";
import type { GeneratedFile, ProjectConfig } from "@/lib/forge-config";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * POST /api/projects/[id]/cloud-build
 *
 * Cloud Forge — Push code to GitHub via Git Database API + trigger workflow.
 * Server-side implementation (no local Python server needed).
 *
 * Body: { github_token: "ghp_xxx" }
 *
 * Flow:
 *   1. Auto-Suture (create missing files: vite.config, main.tsx, etc.)
 *   2. Read project files from DB
 *   3. Generate .github/workflows/build_apk.yml
 *   4. Create blobs (base64) via GitHub API
 *   5. Create tree linking blobs to paths
 *   6. Create commit + update ref
 *   7. Trigger workflow dispatch
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const githubToken = body.github_token;

    if (!githubToken) {
      return NextResponse.json(
        { success: false, error: "Token GitHub manquant" },
        { status: 400 }
      );
    }

    const project = await db.project.findUnique({ where: { id } });
    if (!project) {
      return NextResponse.json(
        { success: false, error: "Projet introuvable" },
        { status: 404 }
      );
    }

    const GITHUB_OWNER = body.owner || "tcereponse";
    const GITHUB_REPO = body.repo || "apk-builder";
    const GITHUB_BRANCH = body.branch || "main";
    const API_BASE = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`;

    // ── GitHub API helper ──
    const githubApi = async (path: string, method = "GET", bodyData?: any, raw = false) => {
      const url = path.startsWith("http") ? path : `${API_BASE}/${path}`;
      const headers: Record<string, string> = {
        "Authorization": `token ${githubToken}`,
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "CloudForge-Vercel/1.0",
      };
      const res = await fetch(url, {
        method,
        headers,
        body: bodyData ? JSON.stringify(bodyData) : undefined,
      });
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`GitHub API ${res.status}: ${errText.slice(0, 200)}`);
      }
      if (raw) return res;
      const text = await res.text();
      return text ? JSON.parse(text) : {};
    };

    console.log(`[cloud-build] Project: ${project.name}`);

    // ── 1. Read project files from DB ──
    let files: GeneratedFile[] = [];
    try {
      const parsed = JSON.parse(project.filesJson || "[]");
      if (Array.isArray(parsed)) {
        files = parsed.map((f: any) => ({
          path: String(f.path || ""),
          content: String(f.content ?? ""),
          language: f.language || "text",
        }));
      }
    } catch {}

    // ── 2. Merge with templates (Auto-Suture server-side) ──
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
    const templateFiles = buildTemplateFiles(config);
    const existingPaths = new Set(files.map((f) => f.path));
    const allFiles = [
      ...templateFiles.filter((f) => !existingPaths.has(f.path)),
      ...files,
    ];

    console.log(`[cloud-build] ${allFiles.length} fichiers à pousser`);

    // ── 3. Generate workflow YAML ──
    const safeName = project.name.replace(/[^a-zA-Z0-9]/g, "");
    const workflowContent = `name: Build APK

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
      - name: Setup Android SDK
        uses: android-actions/setup-android@v3
      - name: Ensure project files
        run: |
          if [ ! -f package.json ]; then
            echo '{"name":"forge-app","private":true,"version":"1.0.0","type":"module","scripts":{"dev":"vite","build":"vite build","preview":"vite preview"},"dependencies":{"react":"^18.3.1","react-dom":"^18.3.1","react-router-dom":"^6.26.0","lucide-react":"^0.427.0"},"devDependencies":{"@vitejs/plugin-react":"^4.3.1","typescript":"^5.5.4","vite":"^5.4.0","tailwindcss":"^3.4.10","postcss":"^8.4.41","autoprefixer":"^10.4.20"}}' > package.json
          fi
          if [ ! -f index.html ]; then
            echo '<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>App</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>' > index.html
          fi
          mkdir -p src
          if [ ! -f src/main.tsx ]; then
            echo 'import React from "react";import ReactDOM from "react-dom/client";import App from "./App";import "./index.css";ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>)' > src/main.tsx
          fi
          if [ ! -f vite.config.ts ]; then
            echo 'import {defineConfig} from "vite";import react from "@vitejs/plugin-react";export default defineConfig({plugins:[react()],build:{outDir:"dist",target:"es2015",modulePreload:false,rollupOptions:{output:{format:"iife",inlineDynamicImports:true,entryFileNames:"assets/[name].js"}}}})' > vite.config.ts
          fi
          if [ ! -f tsconfig.json ]; then
            echo '{"compilerOptions":{"target":"ES2020","lib":["ES2020","DOM","DOM.Iterable"],"module":"ESNext","skipLibCheck":true,"moduleResolution":"bundler","noEmit":true,"jsx":"react-jsx","strict":false},"include":["src"]}' > tsconfig.json
          fi
          if [ ! -f tailwind.config.js ]; then
            echo '/** @type {import("tailwindcss").Config} */' > tailwind.config.js
            echo 'export default {content:["./index.html","./src/**/*.{js,ts,jsx,tsx}"],theme:{extend:{}},plugins:[]}' >> tailwind.config.js
          fi
          if [ ! -f postcss.config.js ]; then
            echo 'export default {plugins:{tailwindcss:{},autoprefixer:{}}}' > postcss.config.js
          fi
          if [ ! -f src/index.css ]; then
            echo '@tailwind base;@tailwind components;@tailwind utilities;' > src/index.css
          fi
          ls -la
      - name: Install dependencies
        run: npm install --legacy-peer-deps
      - name: Build Vite
        run: npx vite build
      - name: Setup Capacitor
        run: |
          npm install @capacitor/core @capacitor/cli @capacitor/android
          npx cap init ${safeName} com.forge.${safeName.toLowerCase()} --web-dir dist
          npx cap add android
          npx cap sync android
      - name: Build APK
        run: |
          cd android
          ./gradlew assembleDebug
          ls -la app/build/outputs/apk/debug/
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: ${project.name}_APK
          path: android/app/build/outputs/apk/debug/*.apk
          retention-days: 30
`;

    allFiles.push({ path: ".github/workflows/build_apk.yml", content: workflowContent, language: "yaml" });

    try {
      // ── 4. Get branch ref ──
      let ref;
      try {
        ref = await githubApi(`git/refs/heads/${GITHUB_BRANCH}`);
      } catch {
        ref = await githubApi("git/refs/heads/master");
      }
      const latestCommitSha = ref.object.sha;
      console.log(`[cloud-build] Latest commit: ${latestCommitSha.slice(0, 7)}`);

      // ── 5. Get base tree ──
      const commit = await githubApi(`git/commits/${latestCommitSha}`);
      const baseTreeSha = commit.tree.sha;

      // ── 6. Create blobs for all files ──
      const treeItems: any[] = [];
      for (let i = 0; i < allFiles.length; i++) {
        const file = allFiles[i];
        const blob = await githubApi("git/blobs", "POST", {
          content: file.content,
          encoding: "utf-8",
        });
        treeItems.push({
          path: file.path,
          mode: "100644",
          type: "blob",
          sha: blob.sha,
        });
        if ((i + 1) % 5 === 0) {
          console.log(`[cloud-build] Blobs: ${i + 1}/${allFiles.length}`);
        }
      }
      console.log(`[cloud-build] ${treeItems.length} blobs créés`);

      // ── 7. Create new tree ──
      const newTree = await githubApi("git/trees", "POST", {
        base_tree: baseTreeSha,
        tree: treeItems,
      });

      // ── 8. Create commit ──
      const newCommit = await githubApi("git/commits", "POST", {
        message: `🚀 Cloud Forge: ${project.name} — Build APK`,
        tree: newTree.sha,
        parents: [latestCommitSha],
      });

      // ── 9. Update reference ──
      await githubApi(`git/refs/heads/${GITHUB_BRANCH}`, "PATCH", {
        sha: newCommit.sha,
      });

      console.log(`[cloud-build] Push réussi! Commit: ${newCommit.sha.slice(0, 7)}`);

      // ── 10. Trigger workflow dispatch ──
      try {
        await githubApi("actions/workflows/build_apk.yml/dispatches", "POST", {
          ref: GITHUB_BRANCH,
        });
        console.log("[cloud-build] Workflow dispatch envoyé");
      } catch {
        console.log("[cloud-build] Workflow déclenché par le push");
      }

      return NextResponse.json({
        success: true,
        commit_sha: newCommit.sha.slice(0, 7),
        files_pushed: allFiles.length,
        message: "Code poussé! GitHub Actions compile l'APK...",
        actions_url: `https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/actions`,
      });
    } catch (e) {
      console.error("[cloud-build] GitHub error:", e);
      return NextResponse.json(
        { success: false, error: e instanceof Error ? e.message : "Erreur GitHub" },
        { status: 422 }
      );
    }
  } catch (error) {
    console.error("[cloud-build]", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Erreur" },
      { status: 500 }
    );
  }
}
