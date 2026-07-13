/**
 * ELITE FORGE — KIROV3 Vercel Edition v14.5
 * Fonctionne avec https://forge-kohl-kappa.vercel.app
 *
 * v14.5 — Smart Capture v2 (6 garde-fous + drop detection):
 *   ✅ SILENCE_ABSOLU (injection prompt DeepSeek)
 *   ✅ applyKnownFixes (corrections sûres côté client)
 *   ✅ validateConstitution (détection + feedback immédiat)
 *   ❌ autoSuture locale DÉSACTIVÉE (MAX_HEALING_CYCLES=0)
 *      → le serveur fait le healing (source unique, contexte complet)
 *   ✅ Envoi rapport de validation au serveur (/api/bridge/constitution-report)
 *   ✅ NOUVEAU: pushToGitHub — pousse le code généré sur GitHub
 *      → déclenche GitHub Actions pour build APK automatique
 *
 * Architecture Cloud-to-GitHub:
 *   DeepSeek → Extension (capture + validate + fix) → Vercel (dashboard)
 *                                                    → GitHub (apk-builder repo)
 *                                                       → GitHub Actions → APK
 *
 * SÉCURITÉ: Le token GitHub est stocké dans chrome.storage.local (PAS en clair).
 *           Configure-le via le popup de l'extension (icône → Options).
 */

const CONFIG = {
    SERVER_URL: "https://forge-kohl-kappa.vercel.app",
    POLLING_INTERVAL: 2000,
    CAPTURE_CHECK_INTERVAL: 3000,    // 3s entre checks
    CAPTURE_TIMEOUT: 300000,         // 5 min max
    MIN_RESPONSE_LENGTH: 500,        // 500 chars min
    STABLE_CHECKS_REQUIRED: 3,       // 3 checks stables = 9s
    POST_GENERATION_COOLDOWN: 10000, // 10s d'attente après fin génération (était 5s)
    MIN_FILES_REQUIRED: 2,           // Au moins 2 fichiers avant de capturer
    CONTENT_DROP_THRESHOLD: 0.5,     // Si contenu chute de >50% → reset (regénération)
    // Constitution G50+ — auto-suture DÉSACTIVÉE côté extension
    MAX_HEALING_CYCLES: 0,
    // GitHub Auto-Push
    GITHUB_PUSH_ENABLED: true,
    GITHUB_OWNER: "tcereponse",
    GITHUB_REPO: "apk-builder",
    GITHUB_BRANCH: "main",
    GITHUB_API: "https://api.github.com",
    DEBUG_MODE: true
};

// ═══════════════════════════════════════════════════════════════════════════
//  SILENCE ABSOLU (Constitution G50+ — Règle S1)
// ═══════════════════════════════════════════════════════════════════════════

const SILENCE_ABSOLU = `
SILENCE ABSOLU — RÈGLE S1 DE LA CONSTITUTION DIAMOND G50+:
- Ne génère AUCUN texte conversationnel (pas de "Voici", "Le projet", etc.)
- AUCUNE explication, AUCUNE introduction, AUCUNE conclusion
- UNIQUEMENT du JSON valide avec les fichiers
- Toute violation corrompt le projet et déclenche un cycle de correction
- Format strict: {"files":[{"path":"...","content":"...","language":"..."}]}

RÈGLES DE STRUCTURE (R1-R5):
- index.html en MINUSCULES avec id="root" et <script src="./src/app/main.tsx">
- vite.config.ts présent avec plugins:[react()]
- package.json: type:"module", build:"vite build" (JAMAIS tsc)
- HashRouter OBLIGATOIRE (JAMAIS BrowserRouter)

INTERDICTIONS (X1-X12):
- JAMAIS package.js, tsconfig.js, App.ts, main.js, *.vue
- Toutes balises JSX DOIVENT être fermées
- Template strings AVEC backticks
- Pas de préfixe de langage (html, javascript, etc.) dans les fichiers
`;

// ═══════════════════════════════════════════════════════════════════════════
//  Logger
// ═══════════════════════════════════════════════════════════════════════════

class KirovLogger {
    static info(...args) { console.log('[KIROV3]', ...args); }
    static error(...args) { console.error('[KIROV3]', ...args); }
    static warn(...args) { console.warn('[KIROV3]', ...args); }
    static success(...args) { console.log('%c[KIROV3]', 'color: #10b981', ...args); }
    constit(...args) { console.log('%c[KIROV3-G50+]', 'color: #f59e0b', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════════════════

let isProcessing = false;
let currentMissionId = null;

// ═══════════════════════════════════════════════════════════════════════════
//  DeepSeek DOM helpers
// ═══════════════════════════════════════════════════════════════════════════

function findTextarea() {
    return document.querySelector('textarea#chat-input')
        || document.querySelector('textarea[placeholder*="Message" i]')
        || document.querySelector('div[contenteditable="true"]')
        || document.querySelector('textarea');
}

function findSendButton() {
    const candidates = [
        'div[role="button"][aria-disabled="false"]',
        'div[role="button"]:not([aria-disabled="true"])',
        'button[data-testid="send-button"]',
        'button[aria-label*="Send" i]',
    ];
    for (const sel of candidates) {
        const el = document.querySelector(sel);
        if (el) return el;
    }
    return null;
}

function isGenerating() {
    const stopBtn = document.querySelector(
        'button[aria-label*="Stop" i], div[role="button"][aria-label*="Stop" i], ' +
        'div[aria-label*="Stop" i], .ds-stop-button, div[class*="stop-generating"]'
    );
    if (stopBtn) return true;
    const spinner = document.querySelector('.ds-spinner, .generating, [class*="loading-dots"]');
    if (spinner) return true;
    return false;
}

function getLastAssistantElement() {
    let els = document.querySelectorAll('div.ds-markdown');
    if (els.length > 0) return els[els.length - 1];
    els = document.querySelectorAll('[class*="ds-markdown"], div[class*="markdown-body"]');
    if (els.length > 0) return els[els.length - 1];
    return null;
}

function extractContent(el) {
    if (!el) return '';
    try { return (el.innerText || el.textContent || '').trim(); }
    catch { return (el.textContent || '').trim(); }
}

// ═══════════════════════════════════════════════════════════════════════════
//  CONSTITUTION G50+ — Parsing + applyKnownFixes + validateConstitution
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Parse files from DeepSeek's JSON response.
 * Handles markdown fences, text around JSON, truncated JSON.
 */
function parseFiles(content) {
    if (!content || content.length === 0) return [];
    let cleaned = content.trim();
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) cleaned = fenceMatch[1].trim();
    try {
        const p = JSON.parse(cleaned);
        if (p.files && Array.isArray(p.files)) return p.files;
    } catch {}
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
        try {
            const p = JSON.parse(cleaned.slice(first, last + 1));
            if (p.files && Array.isArray(p.files)) return p.files;
        } catch {}
    }
    // Regex repair
    const files = [];
    const re = /\{\s*"path"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"(?:\s*,\s*"language"\s*:\s*"((?:[^"\\]|\\.)*)")?\s*\}/g;
    let m;
    while ((m = re.exec(cleaned)) !== null) {
        try {
            files.push({
                path: JSON.parse(`"${m[1]}"`),
                content: JSON.parse(`"${m[2]}"`),
                language: m[3] ? JSON.parse(`"${m[3]}"`) : undefined,
            });
        } catch {
            files.push({ path: m[1], content: m[2], language: m[3] || undefined });
        }
    }
    return files;
}

const FORBIDDEN_FILES = new Set(["package.js", "tsconfig.js", "tsconfig.node.js", "App.ts", "main.js"]);
const FORBIDDEN_DEPS = ["expo-router", "react-native", "@expo", "@vitejs/plugin-vue", "vue"];

/**
 * applyKnownFixes — corrections sûres côté extension (avant envoi serveur).
 * Évite que le serveur reçoive des fichiers mal nommés.
 */
function applyKnownFixes(files) {
    const fixed = [];
    const seen = new Set();
    const fixesApplied = [];

    for (const file of files) {
        let path = file.path;
        let content = file.content;
        const basename = path.split("/").pop() || path;

        // Index.html → index.html
        if (basename === "Index.html") {
            fixesApplied.push("Index.html->index.html");
            path = path.replace(/Index\.html$/, "index.html");
        }
        // package.js → package.json
        if (basename === "package.js" && content.trim().startsWith("{")) {
            fixesApplied.push("package.js->package.json");
            path = path.replace(/package\.js$/, "package.json");
        }
        // tsconfig.js → tsconfig.json
        if (basename === "tsconfig.js" && content.trim().startsWith("{")) {
            fixesApplied.push("tsconfig.js->tsconfig.json");
            path = path.replace(/tsconfig\.js$/, "tsconfig.json");
        }
        // App.ts → App.tsx
        if (basename === "App.ts" && /<[A-Z]|<div|<span|<button/i.test(content)) {
            fixesApplied.push("App.ts->App.tsx");
            path = path.replace(/App\.ts$/, "App.tsx");
        }
        // Skip .vue
        if (path.endsWith(".vue")) {
            fixesApplied.push(`delete:${path}`);
            continue;
        }
        // Skip phantom files
        if (FORBIDDEN_FILES.has(basename)) {
            fixesApplied.push(`delete:${path}`);
            continue;
        }
        // Strip language prefix
        const firstLine = content.split("\n")[0];
        if (/^(html|javascript|typescript|tsx|jsx|css)\s*$/i.test(firstLine.trim())) {
            fixesApplied.push(`strip-prefix:${path}`);
            content = content.split("\n").slice(1).join("\n");
        }
        // BrowserRouter → HashRouter
        if ((path.endsWith(".tsx") || path.endsWith(".jsx")) && content.includes("BrowserRouter")) {
            fixesApplied.push("BrowserRouter->HashRouter");
            content = content.replace(/BrowserRouter/g, "HashRouter");
        }
        // package.json fixes
        if (path === "package.json") {
            try {
                const pkg = JSON.parse(content);
                if (pkg.type !== "module") { pkg.type = "module"; fixesApplied.push("set:type=module"); }
                if (!pkg.scripts) pkg.scripts = {};
                if (!pkg.scripts.build || pkg.scripts.build.includes("tsc")) {
                    pkg.scripts.build = "vite build"; fixesApplied.push("set:build=vite build");
                }
                if (pkg.scripts.prepare) { delete pkg.scripts.prepare; fixesApplied.push("remove:prepare"); }
                for (const depType of ["dependencies", "devDependencies"]) {
                    if (pkg[depType]) {
                        for (const key of Object.keys(pkg[depType])) {
                            if (FORBIDDEN_DEPS.some(d => key === d || key.startsWith(d + "/"))) {
                                delete pkg[depType][key];
                                fixesApplied.push(`remove-dep:${key}`);
                            }
                        }
                    }
                }
                content = JSON.stringify(pkg, null, 2);
            } catch {}
        }

        if (!seen.has(path)) {
            seen.add(path);
            fixed.push({ ...file, path, content });
        }
    }

    return { files: fixed, fixesApplied };
}

/**
 * validateConstitution — checklist de validation côté extension.
 * Retourne les issues trouvées + le statut OK.
 */
function validateConstitution(files) {
    const issues = [];
    const fileMap = new Map(files.map(f => [f.path, f]));

    // NOTE: Les fichiers templates (index.html, vite.config.ts, package.json) sont
    // gérés par le SERVEUR (forge-templates.ts). DeepSeek génère seulement:
    // src/App.tsx, src/components/MainComponent.tsx, src/index.css
    // On ne marque PAS comme critique l'absence de templates côté extension.
    // Le serveur fera le merge + validation complète.

    // R1: index.html — WARNING seulement (template géré par serveur)
    const indexHtml = fileMap.get("index.html");
    if (indexHtml) {
        if (!indexHtml.content.includes('id="root"') && !indexHtml.content.includes("id='root'")) {
            issues.push({ severity: "warning", path: "index.html", issue: 'id="root" manquant', rule: "R1" });
        }
    }

    // R3: package.json — WARNING seulement si présent mais invalide
    const pkg = fileMap.get("package.json");
    if (pkg) {
        try {
            const p = JSON.parse(pkg.content);
            if (p.type !== "module") issues.push({ severity: "warning", path: "package.json", issue: 'type:module manquant', rule: "R3" });
            // Forbidden deps
            const allDeps = { ...(p.dependencies || {}), ...(p.devDependencies || {}) };
            for (const dep of FORBIDDEN_DEPS) {
                for (const key of Object.keys(allDeps)) {
                    if (key === dep || key.startsWith(dep + "/")) {
                        issues.push({ severity: "critical", path: "package.json", issue: `Dépendance interdite: ${key}`, rule: "X5" });
                    }
                }
            }
        } catch {
            issues.push({ severity: "error", path: "package.json", issue: "JSON invalide", rule: "R3" });
        }
    }

    // R4: HashRouter — CRITICAL (DeepSeek génère App.tsx)
    const appFiles = files.filter(f => f.path.endsWith("App.tsx") || f.path.endsWith("App.jsx"));
    for (const app of appFiles) {
        if (app.content.includes("BrowserRouter")) {
            issues.push({ severity: "critical", path: app.path, issue: "BrowserRouter interdit — utiliser HashRouter", rule: "X8" });
        }
    }

    // X1-X4: forbidden files
    for (const file of files) {
        const basename = file.path.split("/").pop() || file.path;
        if (FORBIDDEN_FILES.has(basename)) {
            issues.push({ severity: "critical", path: file.path, issue: `Fichier interdit: ${basename}`, rule: "X1" });
        }
        if (file.path.endsWith(".vue")) {
            issues.push({ severity: "critical", path: file.path, issue: "Fichier .vue interdit", rule: "X4" });
        }
    }

    // S1: texte conversationnel
    for (const file of files) {
        if (file.path.endsWith(".tsx") || file.path.endsWith(".ts")) {
            const first5 = file.content.split("\n").slice(0, 5).join(" ");
            if (/^(Voici|Here is|Le projet|The project|Je génère|I generate)/i.test(first5.trim())) {
                issues.push({ severity: "critical", path: file.path, issue: "Texte conversationnel (Silence Absolu)", rule: "S1" });
            }
        }
    }

    const criticalCount = issues.filter(i => i.severity === "critical").length;
    const errorCount = issues.filter(i => i.severity === "error").length;
    const warningCount = issues.filter(i => i.severity === "warning").length;

    return {
        ok: criticalCount === 0 && errorCount === 0,
        criticalCount,
        errorCount,
        warningCount,
        issues,
    };
}

// ═══════════════════════════════════════════════════════════════════════════
//  Envoi rapport de validation au serveur (coordination hybride)
// ═══════════════════════════════════════════════════════════════════════════

async function sendConstitutionReport(report) {
    try {
        const res = await fetch(`${CONFIG.SERVER_URL}/api/bridge/constitution-report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                ...report,
                missionId: currentMissionId,
                timestamp: Date.now(),
            }),
        });
        const data = await res.json();
        KirovLogger.info(`Rapport Constitution envoyé au serveur: ok=${report.ok}, fixes=${report.fixesApplied.length}`);
        return data;
    } catch (e) {
        KirovLogger.warn(`Envoi rapport échoué (non bloquant): ${e.message}`);
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  GITHUB AUTO-PUSH — Cloud-to-GitHub pour build APK automatique
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Récupère le token GitHub depuis chrome.storage.local.
 * Le token est configuré via le popup de l'extension (icône → Options).
 * Sécurité: le token n'est JAMAIS dans le code source public.
 */
async function getGitHubToken() {
    return new Promise((resolve) => {
        chrome.storage.local.get(["github_token"], (result) => {
            resolve(result.github_token || "");
        });
    });
}

/**
 * Contenu du workflow GitHub Actions qui build l'APK avec Capacitor.
 * Ce fichier est poussé dans .github/workflows/build-apk.yml du dépôt.
 */
const GITHUB_ACTIONS_WORKFLOW = `name: Build APK Android

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-apk:
    runs-on: ubuntu-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Ensure project files
        run: |
          # Create package.json if missing
          if [ ! -f package.json ]; then
            echo 'Creating package.json (missing from push)...'
            cat > package.json << 'PKGJSON'
          {
            "name": "forge-app",
            "private": true,
            "version": "1.0.0",
            "type": "module",
            "scripts": {
              "dev": "vite",
              "build": "vite build",
              "preview": "vite preview"
            },
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
          }
          PKGJSON
          fi

          # Create index.html if missing
          if [ ! -f index.html ]; then
            echo 'Creating index.html...'
            cat > index.html << 'HTML'
          <!DOCTYPE html>
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
          HTML
          fi

          # Create src/main.tsx if missing
          if [ ! -f src/main.tsx ]; then
            mkdir -p src
            echo 'Creating src/main.tsx...'
            cat > src/main.tsx << 'MAINTSX'
          import React from 'react'
          import ReactDOM from 'react-dom/client'
          import App from './App'
          import './index.css'

          ReactDOM.createRoot(document.getElementById('root')!).render(
            <React.StrictMode>
              <App />
            </React.StrictMode>
          )
          MAINTSX
          fi

          # Create src/index.css if missing
          if [ ! -f src/index.css ]; then
            mkdir -p src
            echo 'Creating src/index.css...'
            cat > src/index.css << 'CSS'
          @tailwind base;
          @tailwind components;
          @tailwind utilities;
          CSS
          fi

          # Create vite.config.ts if missing
          if [ ! -f vite.config.ts ]; then
            echo 'Creating vite.config.ts...'
            cat > vite.config.ts << 'VITECONFIG'
          import { defineConfig } from 'vite'
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
          VITECONFIG
          fi

          # Create tsconfig.json if missing
          if [ ! -f tsconfig.json ]; then
            echo 'Creating tsconfig.json...'
            cat > tsconfig.json << 'TSCONFIG'
          {
            "compilerOptions": {
              "target": "ES2020",
              "useDefineForClassFields": true,
              "lib": ["ES2020", "DOM", "DOM.Iterable"],
              "module": "ESNext",
              "skipLibCheck": true,
              "moduleResolution": "bundler",
              "allowImportingTsExtensions": true,
              "resolveJsonModule": true,
              "isolatedModules": true,
              "noEmit": true,
              "jsx": "react-jsx",
              "strict": false,
              "noUnusedLocals": false,
              "noUnusedParameters": false,
              "noFallthroughCasesInSwitch": true
            },
            "include": ["src"]
          }
          TSCONFIG
          fi

          # Create tailwind.config.js if missing
          if [ ! -f tailwind.config.js ] && [ ! -f tailwind.config.ts ]; then
            echo 'Creating tailwind.config.js...'
            cat > tailwind.config.js << 'TAILWIND'
          /** @type {import('tailwindcss').Config} */
          export default {
            content: [
              "./index.html",
              "./src/**/*.{js,ts,jsx,tsx}",
            ],
            theme: {
              extend: {},
            },
            plugins: [],
          }
          TAILWIND
          fi

          # Create postcss.config.js if missing
          if [ ! -f postcss.config.js ]; then
            echo 'Creating postcss.config.js...'
            cat > postcss.config.js << 'POSTCSS'
          export default {
            plugins: {
              tailwindcss: {},
              autoprefixer: {},
            },
          }
          POSTCSS
          fi

          echo "=== Project files ==="
          ls -la
          echo "=== src/ ==="
          ls -la src/ 2>/dev/null || echo "No src/ directory"

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Build Vite
        run: npm run build

      - name: Verify dist
        run: |
          ls -la dist/
          ls -la dist/assets/ 2>/dev/null || echo "No assets/"

      - name: Setup Capacitor
        run: |
          npx cap init forge-app com.forge.app --web-dir=dist || true
          npx cap add android || true
          npx cap copy android
          npx cap sync android

      - name: Build APK
        run: |
          cd android
          ./gradlew assembleDebug
          ls -la app/build/outputs/apk/debug/

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: app-debug.apk
          path: android/app/build/outputs/apk/debug/*.apk
          retention-days: 30
`;

/**
 * Pousse les fichiers du projet généré sur GitHub.
 * Utilise l'API GitHub Contents pour créer/mettre à jour chaque fichier.
 * Ajoute aussi le workflow .github/workflows/build-apk.yml.
 *
 * @param {Array} files - [{ path, content, language }]
 * @param {string} projectName - nom du projet (pour le commit message)
 * @returns {Promise<{ success: boolean, pushedCount: number, error?: string }>}
 */
async function pushToGitHub(files, projectName) {
    if (!CONFIG.GITHUB_PUSH_ENABLED) {
        KirovLogger.info("GitHub push désactivé (GITHUB_PUSH_ENABLED=false)");
        return { success: false, pushedCount: 0, error: "disabled" };
    }

    const token = await getGitHubToken();
    if (!token) {
        KirovLogger.warn("Token GitHub manquant — configure-le dans le popup de l'extension");
        return { success: false, pushedCount: 0, error: "no_token" };
    }

    const owner = CONFIG.GITHUB_OWNER;
    const repo = CONFIG.GITHUB_REPO;
    const branch = CONFIG.GITHUB_BRANCH;
    const apiBase = `${CONFIG.GITHUB_API}/repos/${owner}/${repo}/contents`;

    KirovLogger.info(`📡 Push GitHub: ${files.length} fichiers vers ${owner}/${repo}...`);

    let pushedCount = 0;
    let failedCount = 0;

    // Ajouter le workflow GitHub Actions en premier
    const allFilesToPush = [
        { path: ".github/workflows/build-apk.yml", content: GITHUB_ACTIONS_WORKFLOW },
        ...files,
    ];

    for (const file of allFilesToPush) {
        try {
            // Encoder le contenu en base64
            const content64 = btoa(unescape(encodeURIComponent(file.content)));

            // Vérifier si le fichier existe déjà (pour récupérer le SHA)
            let sha = null;
            try {
                const checkRes = await fetch(`${apiBase}/${file.path}?ref=${branch}`, {
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Accept": "application/vnd.github.v3+json",
                    },
                });
                if (checkRes.ok) {
                    const checkData = await checkRes.json();
                    sha = checkData.sha;
                }
            } catch {
                // Fichier n'existe pas — c'est OK, on le crée
            }

            // Créer ou mettre à jour le fichier
            const pushRes = await fetch(`${apiBase}/${file.path}`, {
                method: "PUT",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "application/vnd.github.v3+json",
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    message: `feat: ${projectName} — ${file.path}${sha ? " (update)" : " (create)"}`,
                    content: content64,
                    branch: branch,
                    ...(sha ? { sha } : {}),
                }),
            });

            if (pushRes.ok || pushRes.status === 201) {
                pushedCount++;
                if (pushedCount % 10 === 0) {
                    KirovLogger.info(`  → ${pushedCount}/${allFilesToPush.length} fichiers poussés...`);
                }
            } else {
                const errData = await pushRes.json().catch(() => ({}));
                // 422 = déjà à jour, c'est OK
                if (pushRes.status === 422 && errData.message?.includes("nothing")) {
                    pushedCount++; // fichier identique, compte comme OK
                } else {
                    failedCount++;
                    if (failedCount <= 3) {
                        KirovLogger.warn(`  ✗ ${file.path}: HTTP ${pushRes.status} ${errData.message || ""}`);
                    }
                }
            }

            // Petit délai pour éviter le rate limit GitHub (5000 req/h)
            await new Promise(r => setTimeout(r, 100));

        } catch (e) {
            failedCount++;
            if (failedCount <= 3) {
                KirovLogger.warn(`  ✗ ${file.path}: ${e.message}`);
            }
        }
    }

    KirovLogger.info(`📡 Push GitHub terminé: ${pushedCount} OK, ${failedCount} échecs`);

    if (pushedCount > 0) {
        KirovLogger.success(`🎉 Code poussé sur GitHub: https://github.com/${owner}/${repo}`);
        KirovLogger.success(`📦 GitHub Actions va build l'APK: https://github.com/${owner}/${repo}/actions`);
    }

    return { success: pushedCount > 0, pushedCount, failedCount };
}

// ═══════════════════════════════════════════════════════════════════════════
//  Polling
// ═══════════════════════════════════════════════════════════════════════════

async function pollForPrompt() {
    if (isProcessing) return;

    try {
        const res = await fetch(`${CONFIG.SERVER_URL}/api/bridge/prompt`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === "idle" || !data.prompt) return;

        const hash = await sha256(data.prompt);
        const lastHash = localStorage.getItem("kirov_last_hash");
        if (hash === lastHash) return;

        isProcessing = true;
        currentMissionId = data.projectId || `mission_${Date.now()}`;
        localStorage.setItem("kirov_last_hash", hash);

        KirovLogger.info(`Phase ${data.phase_num}: Nouveau prompt (${data.prompt.length} chars) — injection`);

        // ── SILENCE ABSOLU: injecter SILENCE_ABSOLU avant le prompt DeepSeek ──
        const promptWithSilence = SILENCE_ABSOLU + "\n\n---\n\n" + data.prompt;
        const injected = await injectPrompt(promptWithSilence);
        if (!injected) {
            KirovLogger.error("Injection échouée — libération du lock");
            isProcessing = false;
            return;
        }

        KirovLogger.info("Prompt injecté (avec SILENCE_ABSOLU). Attente génération DeepSeek...");

        const captured = await waitForFullResponse();

        if (captured && captured.length >= CONFIG.MIN_RESPONSE_LENGTH) {
            KirovLogger.info(`Réponse capturée (${captured.length} chars) — validation Constitution G50+`);

            // ── CONSTITUTION G50+ côté extension ──
            // 1. Parse files
            const parsedFiles = parseFiles(captured);
            if (parsedFiles.length === 0) {
                KirovLogger.warn("Aucun fichier parsé — envoi brut au serveur");
                await sendCapture(captured);
                isProcessing = false;
                return;
            }

            // 2. applyKnownFixes
            const { files: fixedFiles, fixesApplied } = applyKnownFixes(parsedFiles);
            if (fixesApplied.length > 0) {
                KirovLogger.info(`applyKnownFixes: ${fixesApplied.length} corrections appliquées`);
                fixesApplied.forEach(f => console.log(`  ↳ ${f}`));
            }

            // 3. validateConstitution
            const validation = validateConstitution(fixedFiles);
            console.log(`%c[KIROV3-G50+] Validation: ${validation.ok ? "✅ OK" : "❌ " + validation.criticalCount + " critical, " + validation.errorCount + " errors"}`, `color: ${validation.ok ? "#10b981" : "#ef4444"}; font-weight: bold`);
            if (validation.issues.length > 0) {
                validation.issues.forEach(i => console.log(`  [${i.rule}] ${i.path}: ${i.issue}`));
            }

            // 4. Envoi rapport au serveur (pour coordination hybride)
            await sendConstitutionReport({
                ok: validation.ok,
                criticalCount: validation.criticalCount,
                errorCount: validation.errorCount,
                warningCount: validation.warningCount,
                fixesApplied,
                issues: validation.issues,
            });

            // 5. MAX_HEALING_CYCLES = 0 → pas d'auto-suture locale
            //    Le serveur fera le healing si nécessaire
            if (CONFIG.MAX_HEALING_CYCLES === 0) {
                KirovLogger.info("MAX_HEALING_CYCLES=0 — le serveur fera le healing");
            }

            // 6. Envoi du code corrigé au serveur
            //    On envoie le JSON re-sérialisé avec les fixes appliquées
            const fixedContent = JSON.stringify({ files: fixedFiles });
            const result = await sendCapture(fixedContent);
            if (result && result.phase === 5) {
                KirovLogger.success("🎉 MISSION COMPLETE — code capturé + validé!");
                KirovLogger.success(`📦 Download: ${CONFIG.SERVER_URL}/api/bridge/download`);
            } else if (result && result.phase === 2) {
                KirovLogger.success("✅ PRD capturé — Phase 2 démarre");
            } else if (result && result.mode === "oneshot") {
                KirovLogger.success("✅ Passe Gold capturée + validée");
            }

            // 7. Push GitHub SEULEMENT si DeepSeek a généré les fichiers core (App + MainComponent + CSS)
            //    Les templates (package.json, vite.config, etc.) seront ajoutés par le serveur ou le workflow
            const hasAppTsx = fixedFiles.some(f => f.path === "src/App.tsx" || f.path === "src/App.jsx" || f.path === "src/app/App.tsx");
            const hasMainComponent = fixedFiles.some(f => f.path.includes("MainComponent"));
            const hasIndexCss = fixedFiles.some(f => f.path === "src/index.css" || f.path === "src/index.css");
            const isCompleteCode = hasAppTsx && (hasMainComponent || fixedFiles.length >= 3) && fixedFiles.length >= 2;

            if (isCompleteCode) {
                KirovLogger.info(`🚀 Push GitHub de ${fixedFiles.length} fichiers (code DeepSeek complet) pour build APK...`);
                const ghResult = await pushToGitHub(fixedFiles, currentMissionId || "forge-project");
                if (ghResult.success) {
                    KirovLogger.success(`📱 APK en cours de build sur GitHub Actions...`);
                    KirovLogger.success(`🔗 https://github.com/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/actions`);
                }
            } else {
                // Log pourquoi on ne pousse pas
                if (fixedFiles.length > 0) {
                    KirovLogger.info(`⏸️ Push GitHub skip: code incomplet (${fixedFiles.length} fichiers, App=${hasAppTsx}, Main=${hasMainComponent})`);
                }
            }
        } else {
            KirovLogger.error(`Capture échec (${captured ? captured.length : 0} chars)`);
        }

        isProcessing = false;
    } catch (e) {
        KirovLogger.error("Poll error:", e.message);
        isProcessing = false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Inject prompt
// ═══════════════════════════════════════════════════════════════════════════

async function injectPrompt(prompt) {
    const textarea = findTextarea();
    if (!textarea) {
        KirovLogger.error("Textarea introuvable — es-tu sur chat.deepseek.com?");
        return false;
    }
    textarea.focus();
    await sleep(100);

    if (textarea.tagName === "TEXTAREA") {
        const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
        setter.call(textarea, prompt);
    } else {
        textarea.textContent = prompt;
    }
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
    textarea.dispatchEvent(new Event("change", { bubbles: true }));
    await sleep(500);

    const sendBtn = findSendButton();
    if (sendBtn) {
        sendBtn.click();
        KirovLogger.info("Bouton Send cliqué");
        return true;
    }
    KirovLogger.warn("Bouton Send introuvable — tentative Enter");
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true }));
    return true;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Wait for full response (smart capture)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Vérifie si le contenu JSON est équilibré (accolades/parenthèses).
 * Évite de capturer un JSON tronqué au milieu de la génération.
 */
function isJsonBalanced(content) {
    if (!content || content.length === 0) return false;
    // Trouver le bloc JSON (entre ```json ... ``` ou { ... })
    let json = content.trim();
    const fenceMatch = json.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) json = fenceMatch[1].trim();
    // Compter accolades
    let braces = 0;
    let brackets = 0;
    let inString = false;
    let escape = false;
    for (let i = 0; i < json.length; i++) {
        const c = json[i];
        if (escape) { escape = false; continue; }
        if (c === "\\") { escape = true; continue; }
        if (c === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (c === "{") braces++;
        else if (c === "}") braces--;
        else if (c === "[") brackets++;
        else if (c === "]") brackets--;
    }
    return braces === 0 && brackets === 0;
}

/**
 * Compte le nombre de fichiers dans le JSON capturé.
 * Permet de vérifier que DeepSeek a généré assez de fichiers.
 */
function countFilesInJson(content) {
    if (!content) return 0;
    // Compter les occurrences de "path": — approximation du nombre de fichiers
    const matches = content.match(/"path"\s*:/g);
    return matches ? matches.length : 0;
}

async function waitForFullResponse() {
    KirovLogger.info("Attente démarrage génération...");

    // ── Phase 1: Attendre que la génération DÉMARRE ──
    let started = false;
    for (let i = 0; i < 30; i++) {
        await sleep(500);
        if (isGenerating()) { started = true; break; }
    }
    if (started) {
        KirovLogger.info("Génération démarrée (bouton Stop détecté)");
    } else {
        KirovLogger.warn("Génération non démarrée — capture quand même");
    }

    // ── Phase 2: Surveiller la génération jusqu'à fin + stabilité ──
    const startTime = Date.now();
    let previousContent = "";
    let previousLen = 0;
    let maxLenSeen = 0;              // ← NOUVEAU: track la longueur max vue
    let stableCount = 0;
    let checkNum = 0;
    let generationEndedAt = null;
    let dropDetected = false;         // ← NOUVEAU: flag chute de contenu

    while (Date.now() - startTime < CONFIG.CAPTURE_TIMEOUT) {
        await sleep(CONFIG.CAPTURE_CHECK_INTERVAL);
        checkNum++;

        const generating = isGenerating();
        const lastEl = getLastAssistantElement();
        const currentContent = lastEl ? extractContent(lastEl) : "";
        const currentLen = currentContent.length;

        // ── GARDE-FOU 0: Détection de chute de contenu (regénération) ──
        // Si le contenu chute de >50% par rapport au max vu → DeepSeek a démarré une nouvelle réponse
        if (maxLenSeen > 1000 && currentLen < maxLenSeen * CONFIG.CONTENT_DROP_THRESHOLD) {
            KirovLogger.warn(
                `📉 Chute de contenu détectée: ${currentLen} < ${maxLenSeen} (max) — ` +
                `DeepSeek a probablement démarré une nouvelle réponse. Reset stabilité.`
            );
            stableCount = 0;
            generationEndedAt = null;
            dropDetected = true;
            maxLenSeen = currentLen; // Nouveau baseline
        }

        // Tracker le max de longueur vue
        if (currentLen > maxLenSeen) {
            maxLenSeen = currentLen;
        }

        // Tracker la stabilité du contenu
        const contentChanged = currentContent !== previousContent;
        if (!contentChanged && currentLen > 0) {
            stableCount++;
        } else {
            stableCount = 0;
        }

        // Détecter la fin de génération (bouton Stop disparaît)
        if (generating) {
            generationEndedAt = null;
        } else if (generationEndedAt === null && currentLen > 0) {
            generationEndedAt = Date.now();
        }

        previousContent = currentContent;
        previousLen = currentLen;

        // Log détaillé
        const fileCount = countFilesInJson(currentContent);
        const jsonOk = isJsonBalanced(currentContent);
        KirovLogger.info(
            `Check #${checkNum}: gen=${generating} len=${currentLen} stable=${stableCount}/${CONFIG.STABLE_CHECKS_REQUIRED} ` +
            `files=${fileCount} jsonOk=${jsonOk} maxLen=${maxLenSeen}${dropDetected ? " [DROP]" : ""}`
        );

        // ── Garde-fou 1: Pas de capture si encore en génération ──
        if (generating) continue;

        // ── Garde-fou 2: Cooldown post-génération (10s) ──
        if (generationEndedAt && (Date.now() - generationEndedAt) < CONFIG.POST_GENERATION_COOLDOWN) {
            KirovLogger.info(`Cooldown post-génération (${Math.floor((Date.now() - generationEndedAt) / 1000)}s/${CONFIG.POST_GENERATION_COOLDOWN / 1000}s)`);
            continue;
        }

        // ── Garde-fou 3: Longueur minimale ──
        if (currentLen < CONFIG.MIN_RESPONSE_LENGTH) {
            KirovLogger.warn(`Réponse trop courte (${currentLen} < ${CONFIG.MIN_RESPONSE_LENGTH}) — attente...`);
            continue;
        }

        // ── Garde-fou 4: Nombre minimum de fichiers ──
        if (fileCount < CONFIG.MIN_FILES_REQUIRED) {
            KirovLogger.warn(`Pas assez de fichiers (${fileCount} < ${CONFIG.MIN_FILES_REQUIRED}) — DeepSeek n'a pas fini`);
            continue;
        }

        // ── Garde-fou 5: Stabilité (3 checks identiques = 9s) ──
        if (stableCount < CONFIG.STABLE_CHECKS_REQUIRED) {
            continue;
        }

        // ── Garde-fou 6: JSON équilibré ──
        if (currentContent.includes("{") && !jsonOk) {
            KirovLogger.warn("JSON non équilibré — DeepSeek n'a pas fini d'écrire le JSON");
            continue;
        }

        // ── TOUS LES GARDE-FOUS PASSÉS → Capture ! ──
        KirovLogger.success(
            `Génération complète — stable ${stableCount} checks, ${currentLen} chars, ${fileCount} fichiers, JSON ${jsonOk ? "équilibré" : "N/A"}`
        );
        return currentContent;
    }

    // ── Timeout ──
    if (previousLen >= CONFIG.MIN_RESPONSE_LENGTH) {
        const fileCount = countFilesInJson(previousContent);
        KirovLogger.warn(`Timeout — capture partielle (${previousLen} chars, ${fileCount} fichiers)`);
        return previousContent;
    }

    KirovLogger.error("Timeout — aucune réponse capturée");
    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Send capture to server
// ═══════════════════════════════════════════════════════════════════════════

async function sendCapture(content) {
    try {
        const res = await fetch(`${CONFIG.SERVER_URL}/api/bridge/code`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content, response: content }),
        });
        const data = await res.json();
        KirovLogger.info("Serveur:", JSON.stringify(data));
        return data;
    } catch (e) {
        KirovLogger.error("Envoi capture échec:", e.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Utils
// ═══════════════════════════════════════════════════════════════════════════

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function sha256(text) {
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ═══════════════════════════════════════════════════════════════════════════
//  PROTECTION CONTRE LE REFRESH — garde la session DeepSeek alive
// ═══════════════════════════════════════════════════════════════════════════

let missionInProgress = false;

function updateMissionStatus() {
    fetch(`${CONFIG.SERVER_URL}/api/bridge/prompt`)
        .then(r => r.json())
        .then(data => {
            const wasInProgress = missionInProgress;
            missionInProgress = data.status !== "idle" && !!data.prompt;
            if (missionInProgress && !wasInProgress) {
                KirovLogger.info("🔒 Mission en cours — refresh bloqué pour préserver le contexte DeepSeek");
            }
        })
        .catch(() => {});
}

window.addEventListener("beforeunload", (e) => {
    if (missionInProgress) {
        e.preventDefault();
        e.returnValue = "Une mission KIROV3 est en cours. Fermer cette page perdra le contexte DeepSeek. Continuer?";
        return e.returnValue;
    }
});

// ═══════════════════════════════════════════════════════════════════════════
//  Start
// ═══════════════════════════════════════════════════════════════════════════

KirovLogger.info("KIROV3 Vercel Edition v14.5 loaded — Smart Capture v2 (6 garde-fous + drop detection)");
KirovLogger.info(`Serveur: ${CONFIG.SERVER_URL}`);
KirovLogger.info(`Config: poll=${CONFIG.POLLING_INTERVAL}ms, MAX_HEALING_CYCLES=${CONFIG.MAX_HEALING_CYCLES} (serveur fait le healing)`);
console.log("%c🏛️ Constitution Diamond G50+ côté extension:", "color: #f59e0b; font-weight: bold");
console.log("  ✅ SILENCE_ABSOLU (injection prompt)");
console.log("  ✅ applyKnownFixes (corrections sûres)");
console.log("  ✅ validateConstitution (détection + rapport)");
console.log("  ❌ autoSuture locale DÉSACTIVÉE (le serveur le fait)");
console.log("  🔒 Protection refresh activée (préserve le contexte DeepSeek)");

setInterval(pollForPrompt, CONFIG.POLLING_INTERVAL);
setInterval(updateMissionStatus, 5000);
pollForPrompt();
updateMissionStatus();
