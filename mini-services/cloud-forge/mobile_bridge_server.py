#!/usr/bin/env python3
"""
💎 CLOUD FORGE — Mobile Bridge Server
=====================================
Serveur Python local pour Zero-Touch APK Deployment via GitHub Actions.

Deux endpoints:
  /v1/forge/cloud_build    → Push code sur GitHub + déclenche le workflow
  /v1/forge/cloud_download  → Poll statut + télécharge l'APK + extrait

Architecture:
  Cockpit (HTML) → mobile_bridge_server.py → GitHub API → GitHub Actions → APK

Utilisation:
  set GITHUB_TOKEN=ghp_xxxxxxxxxxxx
  python mobile_bridge_server.py
  → Ouvre http://localhost:5005 dans le navigateur
"""

import os
import sys
import json
import time
import base64
import zipfile
import urllib.request
import urllib.error
import http.server
import socketserver
from pathlib import Path

# ==========================================
# CONFIGURATION
# ==========================================
PORT = 5005
GITHUB_TOKEN = os.environ.get("GITHUB_TOKEN", "")  # Ou hardcode ici: ghp_xxx
GITHUB_OWNER = "tcereponse"
GITHUB_REPO = "apk-builder"
GITHUB_BRANCH = "main"
API_BASE = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}"

# Dossiers locaux
BASE_DIR = Path(__file__).parent
PROJECTS_DIR = BASE_DIR / "PROJECTS"
APK_LIBRARY = BASE_DIR / "apk_library"
WORKSPACE_DIR = BASE_DIR / "workspace"

for d in [PROJECTS_DIR, APK_LIBRARY, WORKSPACE_DIR]:
    d.mkdir(exist_ok=True)

# ==========================================
# GITHUB API CLIENT
# ==========================================
def github_api(path, method="GET", body=None, raw=False):
    """Appelle l'API GitHub REST."""
    url = f"{API_BASE}/{path}" if not path.startswith("http") else path
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json",
        "Content-Type": "application/json",
        "User-Agent": "CloudForge/1.0",
    }
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            if raw:
                return resp.read()
            content = resp.read().decode()
            return json.loads(content) if content else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        print(f"GitHub API error {e.code}: {err_body[:200]}")
        raise Exception(f"GitHub API {e.code}: {err_body[:200]}")
    except Exception as e:
        print(f"Network error: {e}")
        raise

# ==========================================
# AUTO-SUTURE (Pre-Push Fix)
# ==========================================
def auto_suture(project_dir):
    """Vérifie et crée les fichiers vitaux manquants avant le push GitHub."""
    fixes = []

    # vite.config.ts
    vite_config = project_dir / "vite.config.ts"
    if not vite_config.exists():
        vite_config.write_text("""import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    target: 'es2015',
    modulePreload: false,
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'assets/[name].js',
      },
    },
  },
})
""")
        fixes.append("vite.config.ts")

    # src/main.tsx
    main_tsx = project_dir / "src" / "main.tsx"
    if not main_tsx.exists():
        main_tsx.parent.mkdir(exist_ok=True)
        main_tsx.write_text("""import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
""")
        fixes.append("src/main.tsx")

    # src/index.css
    index_css = project_dir / "src" / "index.css"
    if not index_css.exists():
        index_css.parent.mkdir(exist_ok=True)
        index_css.write_text("""@tailwind base;
@tailwind components;
@tailwind utilities;
""")
        fixes.append("src/index.css")

    # index.html
    index_html = project_dir / "index.html"
    if not index_html.exists():
        index_html.write_text("""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Forge App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
""")
        fixes.append("index.html")

    # package.json
    pkg_json = project_dir / "package.json"
    if not pkg_json.exists():
        pkg_json.write_text(json.dumps({
            "name": "forge-app",
            "private": True,
            "version": "1.0.0",
            "type": "module",
            "scripts": {"dev": "vite", "build": "vite build", "preview": "vite preview"},
            "dependencies": {
                "react": "^18.3.1",
                "react-dom": "^18.3.1",
                "react-router-dom": "^6.26.0",
                "lucide-react": "^0.427.0"
            },
            "devDependencies": {
                "@vitejs/plugin-react": "^4.3.1",
                "typescript": "^5.5.4",
                "vite": "^5.4.0",
                "tailwindcss": "^3.4.10",
                "postcss": "^8.4.41",
                "autoprefixer": "^10.4.20"
            }
        }, indent=2))
        fixes.append("package.json")

    # tsconfig.json
    tsconfig = project_dir / "tsconfig.json"
    if not tsconfig.exists():
        tsconfig.write_text(json.dumps({
            "compilerOptions": {
                "target": "ES2020",
                "useDefineForClassFields": True,
                "lib": ["ES2020", "DOM", "DOM.Iterable"],
                "module": "ESNext",
                "skipLibCheck": True,
                "moduleResolution": "bundler",
                "allowImportingTsExtensions": True,
                "resolveJsonModule": True,
                "isolatedModules": True,
                "noEmit": True,
                "jsx": "react-jsx",
                "strict": False,
                "noUnusedLocals": False,
                "noUnusedParameters": False,
            },
            "include": ["src"]
        }, indent=2))
        fixes.append("tsconfig.json")

    # tailwind.config.js
    tailwind = project_dir / "tailwind.config.js"
    if not tailwind.exists() and not (project_dir / "tailwind.config.ts").exists():
        tailwind.write_text("""/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
""")
        fixes.append("tailwind.config.js")

    # postcss.config.js
    postcss = project_dir / "postcss.config.js"
    if not postcss.exists():
        postcss.write_text("""export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
""")
        fixes.append("postcss.config.js")

    return fixes

# ==========================================
# WORKFLOW YAML GENERATION
# ==========================================
def generate_workflow(project_name):
    """Genere le fichier .github/workflows/build_apk.yml pour le projet."""
    safe_name = project_name.replace("-", "").replace(" ", "")
    return f"""name: Build APK — {project_name}

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
          node-version: 18

      - name: Setup Java
        uses: actions/setup-java@v3
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v2

      - name: Ensure project files
        run: |
          if [ ! -f package.json ]; then
            echo '{{"name":"forge-app","private":true,"version":"1.0.0","type":"module","scripts":{{"dev":"vite","build":"vite build","preview":"vite preview"}},"dependencies":{{"react":"^18.3.1","react-dom":"^18.3.1"}},"devDependencies":{{"@vitejs/plugin-react":"^4.3.1","typescript":"^5.5.4","vite":"^5.4.0","tailwindcss":"^3.4.10","postcss":"^8.4.41","autoprefixer":"^10.4.20"}}}}' > package.json
          fi
          if [ ! -f index.html ]; then
            echo '<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>App</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>' > index.html
          fi
          if [ ! -f src/main.tsx ]; then
            mkdir -p src
            echo 'import React from "react";import ReactDOM from "react-dom/client";import App from "./App";import "./index.css";ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>)' > src/main.tsx
          fi
          if [ ! -f vite.config.ts ]; then
            echo 'import {{defineConfig}} from "vite";import react from "@vitejs/plugin-react";export default defineConfig({{plugins:[react()],build:{{outDir:"dist",target:"es2015",modulePreload:false,rollupOptions:{{output:{{format:"iife",inlineDynamicImports:true,entryFileNames:"assets/[name].js"}}}}}}}})' > vite.config.ts
          fi
          if [ ! -f tsconfig.json ]; then
            echo '{{"compilerOptions":{{"target":"ES2020","lib":["ES2020","DOM","DOM.Iterable"],"module":"ESNext","skipLibCheck":true,"moduleResolution":"bundler","noEmit":true,"jsx":"react-jsx","strict":false}},"include":["src"]}}' > tsconfig.json
          fi
          if [ ! -f tailwind.config.js ]; then
            echo '/** @type {{import("tailwindcss").Config}} */\nexport default {{content:["./index.html","./src/**/*.{{js,ts,jsx,tsx}}"],theme:{{extend:{{}}}},plugins:[]}}' > tailwind.config.js
          fi
          if [ ! -f postcss.config.js ]; then
            echo 'export default {{plugins:{{tailwindcss:{{}},autoprefixer:{{}}}}}}' > postcss.config.js
          fi
          if [ ! -f src/index.css ]; then
            mkdir -p src
            echo '@tailwind base;@tailwind components;@tailwind utilities;' > src/index.css
          fi
          ls -la

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Build Vite
        run: npm run build

      - name: Setup Capacitor
        run: |
          npm install @capacitor/core @capacitor/cli @capacitor/android
          npx cap init {safe_name} com.forge.{safe_name.lower()} --web-dir dist
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
          name: {project_name}_APK
          path: android/app/build/outputs/apk/debug/*.apk
          retention-days: 30
"""

# ==========================================
# CLOUD BUILD (Push + Trigger)
# ==========================================
def cloud_build(project_name, project_dir):
    """Pousse le code sur GitHub via l'API Git Database et declenche le workflow."""
    if not GITHUB_TOKEN:
        return {"success": False, "error": "GITHUB_TOKEN non configure"}

    print(f"Cloud Build: {project_name}")

    # 1. Auto-Suture
    fixes = auto_suture(project_dir)
    if fixes:
        print(f"  Auto-Suture: {len(fixes)} fichiers crees: {', '.join(fixes)}")

    # 2. Lire tous les fichiers du projet
    files_to_push = []
    for root, dirs, filenames in os.walk(project_dir):
        dirs[:] = [d for d in dirs if d not in ["node_modules", "dist", ".git", ".next", "__pycache__"]]
        for filename in filenames:
            filepath = Path(root) / filename
            relpath = filepath.relative_to(project_dir)
            try:
                content = filepath.read_text(encoding="utf-8")
                files_to_push.append({"path": str(relpath).replace("\\", "/"), "content": content})
            except:
                print(f"  Skip (binary): {relpath}")

    print(f"  {len(files_to_push)} fichiers a pousser")

    # 3. Ajouter le workflow YAML
    workflow_content = generate_workflow(project_name)
    files_to_push.append({"path": ".github/workflows/build_apk.yml", "content": workflow_content})

    try:
        # 4. Get branch ref
        try:
            ref = github_api(f"git/refs/heads/{GITHUB_BRANCH}")
        except:
            ref = github_api("git/refs/heads/master")
        latest_commit_sha = ref["object"]["sha"]
        print(f"  Latest commit: {latest_commit_sha[:7]}")

        # 5. Get base tree
        commit = github_api(f"git/commits/{latest_commit_sha}")
        base_tree_sha = commit["tree"]["sha"]

        # 6. Create blobs for all files
        tree_items = []
        for i, file in enumerate(files_to_push):
            blob = github_api("git/blobs", "POST", {"content": file["content"], "encoding": "utf-8"})
            tree_items.append({"path": file["path"], "mode": "100644", "type": "blob", "sha": blob["sha"]})
            if (i + 1) % 5 == 0:
                print(f"  Blobs crees: {i + 1}/{len(files_to_push)}")

        print(f"  {len(tree_items)} blobs crees")

        # 7. Create new tree
        new_tree = github_api("git/trees", "POST", {"base_tree": base_tree_sha, "tree": tree_items})

        # 8. Create commit
        new_commit = github_api("git/commits", "POST", {
            "message": f"Cloud Forge: {project_name} — Build APK demande",
            "tree": new_tree["sha"],
            "parents": [latest_commit_sha]
        })

        # 9. Update reference
        github_api(f"git/refs/heads/{GITHUB_BRANCH}", "PATCH", {"sha": new_commit["sha"]})

        print(f"  Push GitHub reussi! Commit: {new_commit['sha'][:7]}")

        # 10. Trigger workflow dispatch
        try:
            github_api("actions/workflows/build_apk.yml/dispatches", "POST", {"ref": GITHUB_BRANCH})
            print(f"  Workflow dispatch envoye")
        except:
            print(f"  Workflow declenche par le push")

        return {
            "success": True,
            "commit_sha": new_commit["sha"][:7],
            "files_pushed": len(files_to_push),
            "auto_suture_fixes": fixes,
            "message": f"Code pousse! GitHub Actions compile l'APK..."
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

# ==========================================
# CLOUD DOWNLOAD (Poll + Download + Extract)
# ==========================================
def cloud_download(project_name):
    """Verifie le statut du workflow, telecharge l'artefact et extrait l'APK."""
    if not GITHUB_TOKEN:
        return {"success": False, "error": "GITHUB_TOKEN non configure"}

    print(f"Cloud Download: {project_name}")

    try:
        # 1. Get latest workflow runs
        runs = github_api("actions/runs?per_page=5")
        workflow_runs = runs.get("workflow_runs", [])

        if not workflow_runs:
            return {"success": False, "status": "no_runs", "message": "Aucun run trouve"}

        # 2. Find the most recent run
        latest_run = workflow_runs[0]
        run_id = latest_run["id"]
        status = latest_run["status"]
        conclusion = latest_run.get("conclusion")
        html_url = latest_run["html_url"]

        print(f"  Run #{latest_run['run_number']}: status={status} conclusion={conclusion}")

        # 3. Si encore en cours
        if status in ["queued", "in_progress"]:
            return {
                "success": False,
                "status": "building",
                "run_id": run_id,
                "message": f"Compilation en cours... (statut: {status})",
                "html_url": html_url
            }

        # 4. Si echec
        if conclusion == "failure":
            return {
                "success": False,
                "status": "failed",
                "run_id": run_id,
                "message": "Le build a echoue sur GitHub Actions",
                "html_url": html_url
            }

        # 5. Si succes -> telecharger l'artefact
        if status == "completed" and conclusion == "success":
            print(f"  Build reussi! Recherche de l'artefact...")

            artifacts = github_api(f"actions/runs/{run_id}/artifacts")
            artifact_list = artifacts.get("artifacts", [])

            if not artifact_list:
                return {
                    "success": False,
                    "status": "no_artifact",
                    "message": "Build reussi mais aucun artefact trouve",
                    "html_url": html_url
                }

            artifact = artifact_list[0]
            artifact_name = artifact["name"]
            download_url = artifact["archive_download_url"]
            artifact_size = artifact["size_in_bytes"]

            print(f"  Artefact trouve: {artifact_name} ({artifact_size / 1024 / 1024:.1f} MB)")

            # Download the artifact ZIP
            zip_data = github_api(download_url, raw=True)

            # Save and extract
            zip_path = WORKSPACE_DIR / f"{project_name}_artifact.zip"
            zip_path.write_bytes(zip_data)

            # Extract APK from ZIP
            apk_path = None
            with zipfile.ZipFile(zip_path, 'r') as zf:
                for name in zf.namelist():
                    if name.endswith(".apk"):
                        zf.extract(name, APK_LIBRARY)
                        old_path = APK_LIBRARY / name
                        new_path = APK_LIBRARY / f"{project_name}_Final.apk"
                        if old_path.exists():
                            old_path.rename(new_path)
                        apk_path = str(new_path)
                        print(f"  APK extrait: {apk_path}")
                        break

            if apk_path:
                return {
                    "success": True,
                    "status": "success",
                    "run_id": run_id,
                    "artifact_name": artifact_name,
                    "apk_path": apk_path,
                    "apk_size": f"{Path(apk_path).stat().st_size / 1024 / 1024:.1f} MB",
                    "message": f"APK telecharge: {project_name}_Final.apk",
                    "html_url": html_url
                }
            else:
                return {
                    "success": False,
                    "status": "no_apk_in_artifact",
                    "message": "Artefact telecharge mais aucun APK trouve",
                    "html_url": html_url
                }

        return {
            "success": False,
            "status": "unknown",
            "message": f"Statut inconnu: {status}/{conclusion}",
            "html_url": html_url
        }

    except Exception as e:
        return {"success": False, "error": str(e)}

# ==========================================
# HTTP SERVER
# ==========================================
class CloudForgeHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        pass

    def _send_json(self, data, code=200):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def _send_file(self, filepath, content_type):
        self.send_response(200)
        self.send_header("Content-Type", content_type)
        self.end_headers()
        with open(filepath, "rb") as f:
            self.wfile.write(f.read())

    def do_GET(self):
        if self.path == "/" or self.path == "/index.html":
            cockpit = BASE_DIR / "cockpit.html"
            if cockpit.exists():
                self._send_file(cockpit, "text/html")
            else:
                self._send_json({"error": "cockpit.html not found"}, 404)
            return

        if self.path.startswith("/v1/forge/cloud_download"):
            project_name = self.path.split("?project=")[-1] if "?project=" in self.path else "App"
            result = cloud_download(project_name)
            self._send_json(result)
            return

        if self.path == "/v1/health":
            self._send_json({"status": "online", "version": "15.0"})
            return

        self._send_json({"error": "Not found"}, 404)

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode() if content_length > 0 else "{}"

        try:
            data = json.loads(body)
        except:
            data = {}

        if self.path == "/v1/forge/cloud_build":
            project_name = data.get("project_name", "ForgeApp")
            project_dir_str = data.get("project_dir", str(PROJECTS_DIR / project_name))
            project_dir = Path(project_dir_str)

            if not project_dir.exists():
                self._send_json({"success": False, "error": f"Project dir not found: {project_dir}"})
                return

            result = cloud_build(project_name, project_dir)
            self._send_json(result)
            return

        self._send_json({"error": "Not found"}, 404)

def main():
    if not GITHUB_TOKEN:
        print("ATTENTION: GITHUB_TOKEN non configure!")
        print("   set GITHUB_TOKEN=ghp_xxxxxxxxxxxx")
        print()

    print("=" * 60)
    print("CLOUD FORGE — Mobile Bridge Server v15.0")
    print("Zero-Touch APK Deployment via GitHub Actions")
    print(f"Serveur local: http://localhost:{PORT}")
    print(f"Depot GitHub: {GITHUB_OWNER}/{GITHUB_REPO}")
    print(f"Projets: {PROJECTS_DIR}")
    print(f"APK Library: {APK_LIBRARY}")
    if GITHUB_TOKEN:
        print(f"Token GitHub: Configuré")
    else:
        print(f"Token GitHub: Manquant")
    print("=" * 60)
    print()
    print("Ouvre http://localhost:5005 dans ton navigateur")
    print()

    with socketserver.TCPServer(("", PORT), CloudForgeHandler) as httpd:
        httpd.serve_forever()

if __name__ == "__main__":
    main()
