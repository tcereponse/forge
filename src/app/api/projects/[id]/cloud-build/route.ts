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
  build-apk:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      - uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'
      - uses: android-actions/setup-android@v3
      - name: List files
        run: find . -maxdepth 2 -not -path './.git/*' | head -30
      - name: Ensure package.json
        run: |
          test -f package.json || echo '{"name":"app","private":true,"version":"1.0.0","type":"module","scripts":{"dev":"vite","build":"vite build","preview":"vite preview"},"dependencies":{"react":"^18.3.1","react-dom":"^18.3.1"},"devDependencies":{"@vitejs/plugin-react":"^4.3.1","vite":"^5.4.0","tailwindcss":"^3.4.10","postcss":"^8.4.41","autoprefixer":"^10.4.20"}}' > package.json
      - name: Ensure index.html
        run: |
          test -f index.html || echo '<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>App</title></head><body><div id="root"></div><script type="module" src="./src/main.tsx"></script></body></html>' > index.html
      - name: Ensure src
        run: |
          mkdir -p src
          test -f src/App.tsx || echo 'import React from "react";export default function App(){return React.createElement("div",{style:{padding:20,fontFamily:"sans-serif"}},React.createElement("h1",null,"Hello Forge"),React.createElement("p",null,"App is working!"))}' > src/App.tsx
          test -f src/main.tsx || echo 'import React from "react";import ReactDOM from "react-dom/client";import App from "./App";ReactDOM.createRoot(document.getElementById("root")).render(React.createElement(App))' > src/main.tsx
          test -f src/index.css || echo '@tailwind base;@tailwind components;@tailwind utilities;' > src/index.css
      - name: Ensure configs
        run: |
          test -f tsconfig.json || echo '{"compilerOptions":{"target":"ES2020","lib":["ES2020","DOM"],"module":"ESNext","skipLibCheck":true,"moduleResolution":"bundler","noEmit":true,"jsx":"react-jsx","strict":false},"include":["src"]}' > tsconfig.json
          test -f tailwind.config.js || echo '/** @type {import("tailwindcss").Config} */' > tailwind.config.js
          test -f tailwind.config.js && echo 'export default{content:["./index.html","./src/**/*.{js,ts,jsx,tsx}"],theme:{extend:{}},plugins:[]}' >> tailwind.config.js || true
          test -f postcss.config.js || echo 'export default{plugins:{tailwindcss:{},autoprefixer:{}}}' > postcss.config.js
      - name: Force vite.config for Capacitor
        run: |
          cat > vite.config.ts << 'VITEEOF'
          import { defineConfig } from 'vite'
          import react from '@vitejs/plugin-react'
          export default defineConfig({
            plugins: [react()],
            base: './',
            build: {
              outDir: 'dist',
              target: 'es2015',
              modulePreload: false,
              rollupOptions: {
                output: {
                  format: 'iife',
                  inlineDynamicImports: true,
                  entryFileNames: 'assets/[name].js',
                  chunkFileNames: 'assets/[name].js',
                  assetFileNames: 'assets/[name].[ext]',
                },
              },
            },
          })
          VITEEOF
          echo "=== vite.config.ts ==="
          cat vite.config.ts
      - name: Install
        run: npm install --legacy-peer-deps
      - name: Build
        run: npx vite build
      - name: Verify dist
        run: |
          echo "=== dist/ ==="
          ls -la dist/ || echo "NO dist/ directory"
          echo "=== dist/index.html ==="
          cat dist/index.html || echo "NO dist/index.html"
          echo "=== dist/assets/ ==="
          ls -la dist/assets/ || echo "NO dist/assets/"
      - name: Fix absolute paths in dist
        run: |
          if [ -f dist/index.html ]; then
            sed -i 's|src="/|src="./|g' dist/index.html
            sed -i 's|href="/|href="./|g' dist/index.html
            echo "=== Fixed dist/index.html ==="
            cat dist/index.html
          fi
      - name: Capacitor
        run: |
          npm install @capacitor/core @capacitor/cli @capacitor/android
          npx cap init App com.forge.app --web-dir dist
          npx cap add android
          npx cap copy android
          npx cap sync android
      - name: Verify capacitor assets
        run: |
          echo "=== Android assets ==="
          ls -la android/app/src/main/assets/public/ || echo "NO assets/public/"
          echo "=== index.html in assets ==="
          cat android/app/src/main/assets/public/index.html || echo "NO index.html in assets"
      - name: APK
        run: cd android && ./gradlew assembleDebug
      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: app-debug-apk
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

      // ── 6. Create blobs for all files (with rate limit protection) ──
      const treeItems: any[] = [];
      for (let i = 0; i < allFiles.length; i++) {
        // Delay every 5 files to avoid GitHub secondary rate limit
        if (i > 0 && i % 5 === 0) {
          await new Promise(r => setTimeout(r, 500));
        }
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
