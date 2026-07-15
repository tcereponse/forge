/**
 * 💎 ELITE FORGE GLOBAL — KIROV3 Vercel Edition v15.0
 * Senior Engineering Rewrite (Grade Diamond G50)
 * Architecture Modulaire, Résiliente & Multi-Plateforme
 *
 * v15.0 — Vercel Sovereign Cloud + GitHub Actions APK Pusher
 *   ✅ SILENCE_ABSOLU (injection prompt DeepSeek)
 *   ✅ Smart Capture v2 (6 garde-fous + drop detection)
 *   ✅ Constitution G50+ validateConstitution
 *   ✅ pushToGitHub (Git tree/blobs API → GitHub Actions → APK)
 *   ✅ Vercel Sovereign Cloud (forge-kohl-kappa.vercel.app)
 *   ✅ Refresh protection (préserve le contexte DeepSeek)
 *   ✅ Tab reuse (ne pas ouvrir nouvel onglet)
 */

// ==========================================
// 1. CONFIGURATION & CONSTANTES
// ==========================================
const CONFIG = {
    SERVER_URL: "https://forge-kohl-kappa.vercel.app",
    MAX_PAYLOAD_SIZE: 500 * 1024,
    POLLING_BASE_INTERVAL: 2500,
    MAX_RETRIES: 5,
    VERSION: "G50-Vercel-v15",
    DEBUG_MODE: true,
    // Smart Capture v2
    CAPTURE_CHECK_INTERVAL: 3000,
    CAPTURE_TIMEOUT: 300000,
    MIN_RESPONSE_LENGTH: 500,
    STABLE_CHECKS_REQUIRED: 3,
    POST_GENERATION_COOLDOWN: 10000,
    MIN_FILES_REQUIRED: 2,
    CONTENT_DROP_THRESHOLD: 0.5,
    // GitHub Actions Pusher
    GITHUB_REPO: "tcereponse/apk-builder",
    GITHUB_BRANCH: "main"
};

// ==========================================
// 2. OBSERVABILITÉ (KirovLogger)
// ==========================================
class KirovLogger {
    static levels = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };
    static currentLevel = CONFIG.DEBUG_MODE ? 0 : 1;
    static metrics = { promptsInjected: 0, captures: 0, bridgeErrors: 0 };

    static _log(levelName, ...args) {
        if (this.levels[levelName] >= this.currentLevel) {
            const prefix = `[KIROV3] [${levelName}]`;
            if (levelName === 'ERROR') console.error(prefix, ...args);
            else if (levelName === 'WARN') console.warn(prefix, ...args);
            else console.log(prefix, ...args);
        }
    }
    static debug(...args) { this._log('DEBUG', ...args); }
    static info(...args) { this._log('INFO', ...args); }
    static warn(...args) { this._log('WARN', ...args); }
    static error(...args) { this._log('ERROR', ...args); }
    static success(...args) { console.log('%c[KIROV3] [INFO]', 'color: #10b981', ...args); }

    static trackMetric(name) {
        if (this.metrics[name] !== undefined) this.metrics[name]++;
    }
}

// ==========================================
// 3. SILENCE ABSOLU (Constitution G50+)
// ==========================================
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

// ==========================================
// 4. PLATFORM DETECTOR
// ==========================================
const PlatformDetector = {
    detect() {
        const host = window.location.hostname;
        const deepSeekTextarea = 'textarea#chat-input, textarea[placeholder*="Message" i], textarea[placeholder*="message" i], textarea[placeholder*="Ask" i], textarea.ds-textarea, textarea.ds-input__textarea, textarea.input-area-textarea, textarea[rows], textarea, div[contenteditable="true"][role="textbox"], div[contenteditable="true"], [contenteditable="true"]';
        const deepSeekSend = 'button[data-testid="send-button"], button[aria-label*="Send" i], button[aria-label*="Envoyer" i], div[role="button"][aria-label*="Send" i], div[role="button"][aria-label*="Envoyer" i], div[role="button"][aria-disabled="false"], div[role="button"]:not([aria-disabled="true"]), button[class*="send" i], div[class*="send-button" i], div[class*="send" i][role="button"], button';
        if (host.includes('deepseek')) return { name: 'deepseek', textareaSelector: deepSeekTextarea, sendButtonSelector: deepSeekSend };
        if (host.includes('chatgpt')) return { name: 'chatgpt', textareaSelector: 'div[contenteditable="true"]', sendButtonSelector: 'button[data-testid="send-button"], button[aria-label*="Send" i]' };
        if (host.includes('gemini')) return { name: 'gemini', textareaSelector: 'rich-textarea textarea, div[contenteditable="true"]', sendButtonSelector: 'button[aria-label*="Send" i], button[aria-label*="Envoyer" i]' };
        return { name: 'unknown', textareaSelector: deepSeekTextarea, sendButtonSelector: deepSeekSend };
    }
};

// ==========================================
// 5. STATE
// ==========================================
let isProcessing = false;
let currentMissionId = null;
let missionInProgress = false;

// ==========================================
// 6. DEEPSEEK DOM HELPERS
// ==========================================
function findTextarea() {
    const platform = PlatformDetector.detect();
    return document.querySelector(platform.textareaSelector) || document.querySelector('textarea');
}

function findSendButton() {
    const platform = PlatformDetector.detect();
    const el = document.querySelector(platform.sendButtonSelector);
    if (el) return el;
    return document.querySelector('div[role="button"]:not([aria-disabled="true"])');
}

function isGenerating() {
    const stopBtn = document.querySelector('button[aria-label*="Stop" i], div[role="button"][aria-label*="Stop" i], div[aria-label*="Stop" i], .ds-stop-button, div[class*="stop-generating"]');
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

// ==========================================
// 7. CONSTITUTION G50+ — Parsing + Validation
// ==========================================
const FORBIDDEN_FILES = new Set(["package.js", "tsconfig.js", "tsconfig.node.js", "App.ts", "main.js"]);
const FORBIDDEN_DEPS = ["expo-router", "react-native", "@expo", "@vitejs/plugin-vue", "vue"];

function parseFiles(content) {
    if (!content || content.length === 0) return [];
    let cleaned = content.trim();
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) cleaned = fenceMatch[1].trim();
    try { const p = JSON.parse(cleaned); if (p.files && Array.isArray(p.files)) return p.files; } catch {}
    const first = cleaned.indexOf("{");
    const last = cleaned.lastIndexOf("}");
    if (first !== -1 && last !== -1 && last > first) {
        try { const p = JSON.parse(cleaned.slice(first, last + 1)); if (p.files && Array.isArray(p.files)) return p.files; } catch {}
    }
    const files = [];
    const re = /\{\s*"path"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"(?:\s*,\s*"language"\s*:\s*"((?:[^"\\]|\\.)*)")?\s*\}/g;
    let m;
    while ((m = re.exec(cleaned)) !== null) {
        try { files.push({ path: JSON.parse(`"${m[1]}"`), content: JSON.parse(`"${m[2]}"`), language: m[3] ? JSON.parse(`"${m[3]}"`) : undefined }); }
        catch { files.push({ path: m[1], content: m[2], language: m[3] || undefined }); }
    }
    return files;
}

function applyKnownFixes(files) {
    const fixed = [];
    const seen = new Set();
    const fixesApplied = [];
    for (const file of files) {
        let path = file.path;
        let content = file.content;
        const basename = path.split("/").pop() || path;
        if (basename === "Index.html") { fixesApplied.push("Index.html->index.html"); path = path.replace(/Index\.html$/, "index.html"); }
        if (basename === "package.js" && content.trim().startsWith("{")) { fixesApplied.push("package.js->package.json"); path = path.replace(/package\.js$/, "package.json"); }
        if (basename === "tsconfig.js" && content.trim().startsWith("{")) { fixesApplied.push("tsconfig.js->tsconfig.json"); path = path.replace(/tsconfig\.js$/, "tsconfig.json"); }
        if (basename === "App.ts" && /<[A-Z]|<div|<span|<button/i.test(content)) { fixesApplied.push("App.ts->App.tsx"); path = path.replace(/App\.ts$/, "App.tsx"); }
        if (path.endsWith(".vue")) { fixesApplied.push(`delete:${path}`); continue; }
        if (FORBIDDEN_FILES.has(basename)) { fixesApplied.push(`delete:${path}`); continue; }
        const firstLine = content.split("\n")[0];
        if (/^(html|javascript|typescript|tsx|jsx|css)\s*$/i.test(firstLine.trim())) { fixesApplied.push(`strip-prefix:${path}`); content = content.split("\n").slice(1).join("\n"); }
        if ((path.endsWith(".tsx") || path.endsWith(".jsx")) && content.includes("BrowserRouter")) { fixesApplied.push("BrowserRouter->HashRouter"); content = content.replace(/BrowserRouter/g, "HashRouter"); }
        if (path === "package.json") {
            try {
                const pkg = JSON.parse(content);
                if (pkg.type !== "module") { pkg.type = "module"; fixesApplied.push("set:type=module"); }
                if (!pkg.scripts) pkg.scripts = {};
                if (!pkg.scripts.build || pkg.scripts.build.includes("tsc")) { pkg.scripts.build = "vite build"; fixesApplied.push("set:build=vite build"); }
                if (pkg.scripts.prepare) { delete pkg.scripts.prepare; fixesApplied.push("remove:prepare"); }
                content = JSON.stringify(pkg, null, 2);
            } catch {}
        }
        if (!seen.has(path)) { seen.add(path); fixed.push({ ...file, path, content }); }
    }
    return { files: fixed, fixesApplied };
}

function validateConstitution(files) {
    const issues = [];
    const fileMap = new Map(files.map(f => [f.path, f]));
    const indexHtml = fileMap.get("index.html");
    if (indexHtml && !indexHtml.content.includes('id="root"') && !indexHtml.content.includes("id='root'")) {
        issues.push({ severity: "warning", path: "index.html", issue: 'id="root" manquant', rule: "R1" });
    }
    const pkg = fileMap.get("package.json");
    if (pkg) {
        try {
            const p = JSON.parse(pkg.content);
            if (p.type !== "module") issues.push({ severity: "warning", path: "package.json", issue: 'type:module manquant', rule: "R3" });
            const allDeps = { ...(p.dependencies || {}), ...(p.devDependencies || {}) };
            for (const dep of FORBIDDEN_DEPS) { for (const key of Object.keys(allDeps)) { if (key === dep || key.startsWith(dep + "/")) { issues.push({ severity: "critical", path: "package.json", issue: `Dépendance interdite: ${key}`, rule: "X5" }); } } }
        } catch { issues.push({ severity: "error", path: "package.json", issue: "JSON invalide", rule: "R3" }); }
    }
    const appFiles = files.filter(f => f.path.endsWith("App.tsx") || f.path.endsWith("App.jsx"));
    for (const app of appFiles) { if (app.content.includes("BrowserRouter")) { issues.push({ severity: "critical", path: app.path, issue: "BrowserRouter interdit — utiliser HashRouter", rule: "X8" }); } }
    for (const file of files) {
        const basename = file.path.split("/").pop() || file.path;
        if (FORBIDDEN_FILES.has(basename)) { issues.push({ severity: "critical", path: file.path, issue: `Fichier interdit: ${basename}`, rule: "X1" }); }
        if (file.path.endsWith(".vue")) { issues.push({ severity: "critical", path: file.path, issue: "Fichier .vue interdit", rule: "X4" }); }
    }
    for (const file of files) {
        if (file.path.endsWith(".tsx") || file.path.endsWith(".ts")) {
            const first5 = file.content.split("\n").slice(0, 5).join(" ");
            if (/^(Voici|Here is|Le projet|The project|Je génère|I generate)/i.test(first5.trim())) { issues.push({ severity: "critical", path: file.path, issue: "Texte conversationnel (Silence Absolu)", rule: "S1" }); }
        }
    }
    const criticalCount = issues.filter(i => i.severity === "critical").length;
    const errorCount = issues.filter(i => i.severity === "error").length;
    const warningCount = issues.filter(i => i.severity === "warning").length;
    return { ok: criticalCount === 0 && errorCount === 0, criticalCount, errorCount, warningCount, issues };
}

// ==========================================
// 8. SMART CAPTURE v2 (6 garde-fous)
// ==========================================
function isJsonBalanced(content) {
    if (!content || content.length === 0) return false;
    let json = content.trim();
    const fenceMatch = json.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) json = fenceMatch[1].trim();
    let braces = 0, brackets = 0, inString = false, escape = false;
    for (let i = 0; i < json.length; i++) {
        const c = json[i];
        if (escape) { escape = false; continue; }
        if (c === "\\") { escape = true; continue; }
        if (c === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (c === "{") braces++; else if (c === "}") braces--;
        else if (c === "[") brackets++; else if (c === "]") brackets--;
    }
    return braces === 0 && brackets === 0;
}

function countFilesInJson(content) {
    if (!content) return 0;
    const matches = content.match(/"path"\s*:/g);
    return matches ? matches.length : 0;
}

async function waitForFullResponse() {
    KirovLogger.info("Attente démarrage génération...");
    let started = false;
    for (let i = 0; i < 30; i++) { await sleep(500); if (isGenerating()) { started = true; break; } }
    if (started) KirovLogger.info("Génération démarrée (bouton Stop détecté)");
    else KirovLogger.warn("Génération non démarrée — capture quand même");

    const startTime = Date.now();
    let previousContent = "", previousLen = 0, maxLenSeen = 0, stableCount = 0, checkNum = 0, generationEndedAt = null, dropDetected = false;

    while (Date.now() - startTime < CONFIG.CAPTURE_TIMEOUT) {
        await sleep(CONFIG.CAPTURE_CHECK_INTERVAL);
        checkNum++;
        const generating = isGenerating();
        const lastEl = getLastAssistantElement();
        const currentContent = lastEl ? extractContent(lastEl) : "";
        const currentLen = currentContent.length;

        if (maxLenSeen > 1000 && currentLen < maxLenSeen * CONFIG.CONTENT_DROP_THRESHOLD) {
            KirovLogger.warn(`📉 Chute de contenu: ${currentLen} < ${maxLenSeen} — Reset stabilité.`);
            stableCount = 0; generationEndedAt = null; dropDetected = true; maxLenSeen = currentLen;
        }
        if (currentLen > maxLenSeen) maxLenSeen = currentLen;
        const contentChanged = currentContent !== previousContent;
        if (!contentChanged && currentLen > 0) stableCount++; else stableCount = 0;
        if (generating) generationEndedAt = null;
        else if (generationEndedAt === null && currentLen > 0) generationEndedAt = Date.now();
        previousContent = currentContent; previousLen = currentLen;

        const fileCount = countFilesInJson(currentContent);
        const jsonOk = isJsonBalanced(currentContent);
        KirovLogger.info(`Check #${checkNum}: gen=${generating} len=${currentLen} stable=${stableCount}/${CONFIG.STABLE_CHECKS_REQUIRED} files=${fileCount} jsonOk=${jsonOk} maxLen=${maxLenSeen}${dropDetected ? " [DROP]" : ""}`);

        if (generating) continue;
        if (generationEndedAt && (Date.now() - generationEndedAt) < CONFIG.POST_GENERATION_COOLDOWN) { KirovLogger.info(`Cooldown (${Math.floor((Date.now() - generationEndedAt) / 1000)}s/${CONFIG.POST_GENERATION_COOLDOWN / 1000}s)`); continue; }
        if (currentLen < CONFIG.MIN_RESPONSE_LENGTH) { KirovLogger.warn(`Trop court (${currentLen})`); continue; }
        if (fileCount < CONFIG.MIN_FILES_REQUIRED) { KirovLogger.warn(`Pas assez de fichiers (${fileCount})`); continue; }
        if (stableCount < CONFIG.STABLE_CHECKS_REQUIRED) continue;
        if (currentContent.includes("{") && !jsonOk) { KirovLogger.warn("JSON non équilibré"); continue; }

        KirovLogger.success(`Génération complète — stable ${stableCount} checks, ${currentLen} chars, ${fileCount} fichiers, JSON ${jsonOk ? "équilibré" : "N/A"}`);
        return currentContent;
    }
    if (previousLen >= CONFIG.MIN_RESPONSE_LENGTH) { KirovLogger.warn(`Timeout — capture partielle (${previousLen} chars)`); return previousContent; }
    KirovLogger.error("Timeout — aucune réponse capturée");
    return null;
}

// ==========================================
// 9. GITHUB ACTIONS PUSHER (Git tree/blobs API)
// ==========================================

async function pushToGitHub(files) {
    const BRANCH = CONFIG.GITHUB_BRANCH;

    const storage = await chrome.storage.local.get(['github_token']);
    const GITHUB_TOKEN = storage.github_token;

    if (!GITHUB_TOKEN) {
        KirovLogger.error("❌ ECHEC : Aucun token GitHub n'est configuré dans l'extension.");
        return false;
    }

    const api = async (path, method = "GET", body = null) => {
        const res = await fetch(`https://api.github.com/repos/${CONFIG.GITHUB_REPO}/${path}`, {
            method,
            headers: {
                "Authorization": `token ${GITHUB_TOKEN}`,
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            },
            body: body ? JSON.stringify(body) : null
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.message);
        }
        return res.json();
    };

    KirovLogger.info("Poussée du code vers GitHub Actions...");

    try {
        // 1. Get branch info
        let ref;
        try { ref = await api(`git/refs/heads/${BRANCH}`); }
        catch(e) { ref = await api(`git/refs/heads/master`); }
        const latestCommitSha = ref.object.sha;

        // 2. Get base tree
        const commit = await api(`git/commits/${latestCommitSha}`);
        const baseTreeSha = commit.tree.sha;

        // 3. Create blobs for all files
        const treeItems = [];
        for (const file of files) {
            const blob = await api("git/blobs", "POST", { content: file.content, encoding: "utf-8" });
            treeItems.push({ path: file.path, mode: "100644", type: "blob", sha: blob.sha });
        }

        // 4. Create GitHub Actions Workflow File
        const workflowContent = `name: Build APK
on: [push]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 22

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '21'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Ensure project files
        run: |
          if [ ! -f package.json ]; then
            echo '{"name":"forge-app","private":true,"version":"1.0.0","type":"module","scripts":{"dev":"vite","build":"vite build","preview":"vite preview"},"dependencies":{"react":"^18.3.1","react-dom":"^18.3.1","react-router-dom":"^6.26.0","lucide-react":"^0.427.0"},"devDependencies":{"@vitejs/plugin-react":"^4.3.1","typescript":"^5.5.4","vite":"^5.4.0","tailwindcss":"^3.4.10","postcss":"^8.4.41","autoprefixer":"^10.4.20"}}' > package.json
          fi
          if [ ! -f index.html ]; then
            echo '<!DOCTYPE html><html><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>Forge App</title></head><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>' > index.html
          fi
          if [ ! -f src/main.tsx ]; then
            mkdir -p src
            echo 'import React from "react";import ReactDOM from "react-dom/client";import App from "./App";import "./index.css";ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><App/></React.StrictMode>)' > src/main.tsx
          fi
          if [ ! -f vite.config.ts ]; then
            echo 'import {defineConfig} from "vite";import react from "@vitejs/plugin-react";export default defineConfig({plugins:[react()],build:{outDir:"dist",target:"es2015",modulePreload:false,rollupOptions:{output:{format:"iife",inlineDynamicImports:true,entryFileNames:"assets/[name].js"}}}})' > vite.config.ts
          fi
          if [ ! -f tsconfig.json ]; then
            echo '{"compilerOptions":{"target":"ES2020","useDefineForClassFields":true,"lib":["ES2020","DOM","DOM.Iterable"],"module":"ESNext","skipLibCheck":true,"moduleResolution":"bundler","allowImportingTsExtensions":true,"resolveJsonModule":true,"isolatedModules":true,"noEmit":true,"jsx":"react-jsx","strict":false,"noUnusedLocals":false,"noUnusedParameters":false},"include":["src"]}' > tsconfig.json
          fi
          if [ ! -f tailwind.config.js ]; then
            echo '/** @type {import("tailwindcss").Config} */\nexport default {content:["./index.html","./src/**/*.{js,ts,jsx,tsx}"],theme:{extend:{}},plugins:[]}' > tailwind.config.js
          fi
          if [ ! -f postcss.config.js ]; then
            echo 'export default {plugins:{tailwindcss:{},autoprefixer:{}}}' > postcss.config.js
          fi
          if [ ! -f src/index.css ]; then
            mkdir -p src
            echo '@tailwind base;@tailwind components;@tailwind utilities;' > src/index.css
          fi

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Build Vite
        run: npm run build

      - name: Setup Capacitor
        run: |
          npm install @capacitor/core @capacitor/cli @capacitor/android
          npx cap init KirovApp com.kirov.app --web-dir dist
          npx cap add android
          npx cap sync android

      - name: Build APK
        run: |
          cd android
          ./gradlew assembleDebug

      - name: Upload APK
        uses: actions/upload-artifact@v4
        with:
          name: app-debug.apk
          path: android/app/build/outputs/apk/debug/*.apk
          retention-days: 30
`;
        const workflowBlob = await api("git/blobs", "POST", { content: workflowContent, encoding: "utf-8" });
        treeItems.push({ path: ".github/workflows/build-apk.yml", mode: "100644", type: "blob", sha: workflowBlob.sha });

        // 5. Create new tree & commit
        const newTree = await api("git/trees", "POST", { base_tree: baseTreeSha, tree: treeItems });
        const newCommit = await api("git/commits", "POST", {
            message: "🚀 Auto-Suture Build: Nouvel APK demandé par KIROV3",
            tree: newTree.sha,
            parents: [latestCommitSha]
        });

        // 6. Update reference
        await api(`git/refs/heads/${BRANCH}`, "PATCH", { sha: newCommit.sha });

        KirovLogger.success("✅ Code poussé ! GitHub Actions compile l'APK.");
        KirovLogger.success(`🔗 https://github.com/${CONFIG.GITHUB_REPO}/actions`);
        return true;

    } catch (e) {
        KirovLogger.error("Échec push GitHub:", e.message);
        return false;
    }
}

// ==========================================
// 10. BRIDGE CLIENT (Vercel Sovereign Cloud)
// ==========================================

async function pollForPrompt() {
    if (isProcessing) return;
    try {
        const res = await fetch(`${CONFIG.SERVER_URL}/api/bridge/prompt`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.status === 'idle' || !data.prompt) return;

        const hash = await sha256(data.prompt);
        const lastHash = localStorage.getItem('kirov_last_hash');
        if (hash === lastHash) return;

        isProcessing = true;
        currentMissionId = data.projectId || `mission_${Date.now()}`;
        localStorage.setItem('kirov_last_hash', hash);

        KirovLogger.info(`Phase ${data.phase_num}: Nouveau prompt (${data.prompt.length} chars) — injection`);

        const promptWithSilence = SILENCE_ABSOLU + "\n\n---\n\n" + data.prompt;
        const injected = await injectPrompt(promptWithSilence);
        if (!injected) { KirovLogger.error("Injection échouée"); isProcessing = false; return; }

        KirovLogger.info("Prompt injecté (avec SILENCE_ABSOLU). Attente génération...");

        const captured = await waitForFullResponse();
        if (captured && captured.length >= CONFIG.MIN_RESPONSE_LENGTH) {
            KirovLogger.info(`Réponse capturée (${captured.length} chars) — validation Constitution G50+`);
            const parsedFiles = parseFiles(captured);
            if (parsedFiles.length === 0) { KirovLogger.warn("Aucun fichier parsé — envoi brut"); await sendCapture(captured); isProcessing = false; return; }

            const { files: fixedFiles, fixesApplied } = applyKnownFixes(parsedFiles);
            if (fixesApplied.length > 0) { KirovLogger.info(`applyKnownFixes: ${fixesApplied.length} corrections`); }

            const validation = validateConstitution(fixedFiles);
            console.log(`%c[KIROV3-G50+] Validation: ${validation.ok ? "✅ OK" : "❌ " + validation.criticalCount + " critical"}`, `color: ${validation.ok ? "#10b981" : "#ef4444"}; font-weight: bold`);

            // Send constitution report to server (hybrid coordination)
            try {
                await fetch(`${CONFIG.SERVER_URL}/api/bridge/constitution-report`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ ok: validation.ok, criticalCount: validation.criticalCount, errorCount: validation.errorCount, warningCount: validation.warningCount, fixesApplied, issues: validation.issues, missionId: currentMissionId, timestamp: Date.now() }),
                });
            } catch {}

            // Send code to server
            const fixedContent = JSON.stringify({ files: fixedFiles });
            const result = await sendCapture(fixedContent);
            if (result && result.phase === 5) KirovLogger.success("🎉 MISSION COMPLETE!");
            else if (result && result.mode === "oneshot") KirovLogger.success("✅ Passe Gold capturée");

            // Push to GitHub if code is complete
            const hasAppTsx = fixedFiles.some(f => f.path === "src/App.tsx" || f.path === "src/App.jsx");
            const hasMainComponent = fixedFiles.some(f => f.path.includes("MainComponent"));
            const isCompleteCode = hasAppTsx && (hasMainComponent || fixedFiles.length >= 3) && fixedFiles.length >= 2;
            if (isCompleteCode) {
                KirovLogger.info(`🚀 Push GitHub de ${fixedFiles.length} fichiers...`);
                await pushToGitHub(fixedFiles);
            } else if (fixedFiles.length > 0) {
                KirovLogger.info(`⏸️ Push GitHub skip: code incomplet (${fixedFiles.length} fichiers)`);
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

async function injectPrompt(prompt) {
    const input = findTextarea();
    if (!input) { KirovLogger.error("Input introuvable"); return false; }
    input.focus();
    input.click();
    await sleep(100);

    if (input.tagName === "TEXTAREA" || input.tagName === "INPUT") {
        const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set
            || Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
        if (nativeSetter) nativeSetter.call(input, prompt);
        else input.value = prompt;
    } else if (input.contentEditable === "true" || input.isContentEditable) {
        input.innerHTML = "";
        input.textContent = prompt;
        input.innerText = prompt;
    } else {
        input.textContent = prompt;
    }

    const events = [
        new Event("focus", { bubbles: true }),
        new Event("input", { bubbles: true }),
        new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt }),
        new Event("change", { bubbles: true }),
        new Event("keyup", { bubbles: true }),
    ];
    for (const ev of events) {
        input.dispatchEvent(ev);
        await sleep(50);
    }

    await sleep(400);
    const sendBtn = findSendButton();
    if (sendBtn) {
        sendBtn.focus();
        sendBtn.click();
        KirovLogger.info("Bouton Send clique");
        return true;
    }

    const enterEvents = [
        new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }),
        new KeyboardEvent("keypress", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }),
        new KeyboardEvent("keyup", { key: "Enter", code: "Enter", keyCode: 13, which: 13, bubbles: true, cancelable: true }),
    ];
    for (const ev of enterEvents) input.dispatchEvent(ev);
    return true;
}

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
    } catch (e) { KirovLogger.error("Envoi capture:", e.message); return null; }
}

// ==========================================
// 11. REFRESH PROTECTION
// ==========================================
function updateMissionStatus() {
    fetch(`${CONFIG.SERVER_URL}/api/bridge/prompt`)
        .then(r => r.json())
        .then(data => {
            const wasInProgress = missionInProgress;
            missionInProgress = data.status !== "idle" && !!data.prompt;
            if (missionInProgress && !wasInProgress) KirovLogger.info("🔒 Mission en cours — refresh bloqué");
        })
        .catch(() => {});
}

window.addEventListener("beforeunload", (e) => {
    if (missionInProgress) {
        e.preventDefault();
        e.returnValue = "Une mission KIROV3 est en cours. Fermer cette page perdra le contexte DeepSeek.";
        return e.returnValue;
    }
});

// ==========================================
// 12. UTILS
// ==========================================
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function sha256(text) {
    const buf = new TextEncoder().encode(text);
    const hash = await crypto.subtle.digest("SHA-256", buf);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// ==========================================
// 13. START
// ==========================================
KirovLogger.info("KIROV3 GLOBAL Vercel Edition v15.0 loaded — Sovereign Cloud + GitHub Actions APK Pusher");
KirovLogger.info(`Serveur: ${CONFIG.SERVER_URL}`);
KirovLogger.info(`GitHub: ${CONFIG.GITHUB_REPO}`);
console.log("%c💎 ELITE FORGE GLOBAL — KIROV3 Vercel v15.0", "color: #06b6d4; font-weight: bold; font-size: 14px");
console.log("  ✅ SILENCE_ABSOLU (injection prompt)");
console.log("  ✅ Smart Capture v2 (6 garde-fous + drop detection)");
console.log("  ✅ Constitution G50+ validateConstitution");
console.log("  ✅ pushToGitHub (Git tree/blobs → GitHub Actions → APK)");
console.log("  ✅ Vercel Sovereign Cloud");
console.log("  ✅ Refresh protection");

setInterval(pollForPrompt, CONFIG.POLLING_BASE_INTERVAL);
setInterval(updateMissionStatus, 5000);
pollForPrompt();
updateMissionStatus();
