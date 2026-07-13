/**
 * ELITE FORGE — KIROV3 Vercel Edition v14.2
 * Fonctionne avec https://forge-kohl-kappa.vercel.app
 *
 * v14.2 — Constitution G50+ + GitHub Auto-Push (Cloud-to-GitHub):
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
    CAPTURE_CHECK_INTERVAL: 2000,
    CAPTURE_TIMEOUT: 180000,
    MIN_RESPONSE_LENGTH: 100,
    STABLE_CHECKS_REQUIRED: 2,
    // Constitution G50+ — auto-suture DÉSACTIVÉE côté extension
    MAX_HEALING_CYCLES: 0,
    // GitHub Auto-Push — pousse le code généré vers GitHub pour build APK
    GITHUB_PUSH_ENABLED: true,       // activé par défaut
    GITHUB_OWNER: "tcereponse",      // propriétaire du dépôt
    GITHUB_REPO: "apk-builder",      // dépôt cible pour les projets générés
    GITHUB_BRANCH: "main",           // branche cible
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

    // R1: index.html
    const indexHtml = fileMap.get("index.html");
    if (!indexHtml) {
        if (fileMap.get("Index.html")) {
            issues.push({ severity: "critical", path: "Index.html", issue: "Index.html (majuscule) — devrait être index.html", rule: "R1" });
        } else {
            issues.push({ severity: "critical", path: "index.html", issue: "index.html manquant", rule: "R1" });
        }
    } else {
        if (!indexHtml.content.includes('id="root"') && !indexHtml.content.includes("id='root'")) {
            issues.push({ severity: "critical", path: "index.html", issue: 'id="root" manquant', rule: "R1" });
        }
    }

    // R2: vite.config.ts
    if (!fileMap.get("vite.config.ts") && !fileMap.get("vite.config.js")) {
        issues.push({ severity: "critical", path: "vite.config.ts", issue: "vite.config.ts manquant", rule: "R2" });
    }

    // R3: package.json
    const pkg = fileMap.get("package.json");
    if (!pkg) {
        issues.push({ severity: "critical", path: "package.json", issue: "package.json manquant", rule: "R3" });
    } else {
        try {
            const p = JSON.parse(pkg.content);
            if (p.type !== "module") issues.push({ severity: "error", path: "package.json", issue: 'type:module manquant', rule: "R3" });
            if (p.scripts?.build && !p.scripts.build.includes("vite build")) {
                issues.push({ severity: "warning", path: "package.json", issue: 'build devrait être "vite build"', rule: "R3" });
            }
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
            issues.push({ severity: "critical", path: "package.json", issue: "JSON invalide", rule: "R3" });
        }
    }

    // R4: HashRouter
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
          cache: 'npm'

      - name: Setup Java
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Install dependencies
        run: npm install --legacy-peer-deps

      - name: Build Vite
        run: npm run build

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

            // 7. NOUVEAU v14.2: Push GitHub pour build APK automatique
            //    Seulement si c'est le code final (phase 5 = code generation done)
            //    ou si on a capturé des fichiers JSON complets en one-shot
            const isFinalCode = (result && (result.phase === 5 || (result.mode === "oneshot" && fixedFiles.length > 3)));
            if (isFinalCode && fixedFiles.length > 0) {
                KirovLogger.info(`🚀 Push GitHub de ${fixedFiles.length} fichiers pour build APK...`);
                const ghResult = await pushToGitHub(fixedFiles, currentMissionId || "forge-project");
                if (ghResult.success) {
                    KirovLogger.success(`📱 APK en cours de build sur GitHub Actions...`);
                    KirovLogger.success(`🔗 https://github.com/${CONFIG.GITHUB_OWNER}/${CONFIG.GITHUB_REPO}/actions`);
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

async function waitForFullResponse() {
    KirovLogger.info("Attente démarrage génération...");
    let started = false;
    for (let i = 0; i < 30; i++) {
        await sleep(500);
        if (isGenerating()) { started = true; break; }
    }
    if (started) KirovLogger.info("Génération démarrée (bouton Stop détecté)");
    else KirovLogger.warn("Génération non démarrée — capture quand même");

    const startTime = Date.now();
    let previousContent = "";
    let stableCount = 0;
    let checkNum = 0;

    while (Date.now() - startTime < CONFIG.CAPTURE_TIMEOUT) {
        await sleep(CONFIG.CAPTURE_CHECK_INTERVAL);
        checkNum++;
        const generating = isGenerating();
        const lastEl = getLastAssistantElement();
        const currentContent = lastEl ? extractContent(lastEl) : "";
        const contentChanged = currentContent !== previousContent;
        if (!contentChanged && currentContent.length > 0) stableCount++;
        else stableCount = 0;
        previousContent = currentContent;

        KirovLogger.info(`Check #${checkNum}: generating=${generating} len=${currentContent.length} stable=${stableCount}/${CONFIG.STABLE_CHECKS_REQUIRED}`);

        if (!generating && stableCount >= CONFIG.STABLE_CHECKS_REQUIRED && currentContent.length >= CONFIG.MIN_RESPONSE_LENGTH) {
            KirovLogger.success(`Génération complète — stable ${stableCount} checks, ${currentContent.length} chars`);
            return currentContent;
        }
    }
    if (previousContent.length >= CONFIG.MIN_RESPONSE_LENGTH) {
        KirovLogger.warn(`Timeout — capture partielle (${previousContent.length} chars)`);
        return previousContent;
    }
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

KirovLogger.info("KIROV3 Vercel Edition v14.3 loaded — Constitution G50+ + GitHub + Refresh Protection");
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
