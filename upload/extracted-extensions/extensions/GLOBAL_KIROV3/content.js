/**
 * 💎 ELITE FORGE GLOBAL — KIROV3
 * Senior Engineering Rewrite (Grade Diamond G50)
 * Architecture Modulaire, Résiliente & Multi-Plateforme
 */

// ==========================================
// 1. CONFIGURATION & CONSTANTES
// ==========================================
const CONFIG = {
    SERVER_URL: "http://127.0.0.1:5005",
    MAX_PAYLOAD_SIZE: 500 * 1024, // 500KB limite pour éviter les crash réseau
    POLLING_BASE_INTERVAL: 2500,
    MAX_RETRIES: 5,
    VERSION: "G50-Senior",
    DEBUG_MODE: true
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
    
    static trackMetric(name) {
        if (this.metrics[name] !== undefined) this.metrics[name]++;
    }
}

// ==========================================
// 3. UTILITAIRES (Crypto, Validation)
// ==========================================
const Utils = {
    async sha256(text) {
        if (!text) return "";
        const msgBuffer = new TextEncoder().encode(text);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },
    validateBridgeResponse(data) {
        if (!data || typeof data !== 'object') return false;
        if (!('status' in data)) return false; // Validation de schéma minimaliste
        return true;
    }
};

// ==========================================
// 4. EVENT BUS (Pattern Observer)
// ==========================================
class EventBus {
    constructor() { this.listeners = {}; }
    on(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    }
    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => {
                try { cb(data); } catch(e) { KirovLogger.error(`EventBus Error on ${event}:`, e); }
            });
        }
    }
}
const bus = new EventBus();

// ==========================================
// 5. STATE MANAGER (Immutable & Persistant)
// ==========================================
class StateManager {
    constructor() {
        this._state = {
            isActivated: false,
            currentPhase: 0,
            projectId: "UNKNOWN",
            lastPromptHash: null,
            lastOutputHash: null,
            isOffline: false,
            queue: [] // File d'attente pour le mode hors-ligne
        };
    }
    
    get(key) { return this._state[key]; }
    
    set(key, value) {
        this._state[key] = value;
        // Persistance des données critiques via l'API Chrome locale
        if (['queue', 'projectId', 'currentPhase'].includes(key)) {
            try { chrome.storage.local.set({ [key]: value }); } catch(e){}
        }
    }

    async load() {
        try {
            const data = await chrome.storage.local.get(['queue', 'projectId', 'currentPhase']);
            if (data.queue) this._state.queue = data.queue;
            if (data.projectId) this._state.projectId = data.projectId;
            if (data.currentPhase) this._state.currentPhase = data.currentPhase;
        } catch (e) { KirovLogger.warn("Cannot load storage", e); }
    }
}
const state = new StateManager();

// ==========================================
// 6. BRIDGE CLIENT (Resilience Network)
// ==========================================
class BridgeClient {
    constructor() {
        this.consecutiveFailures = 0;
        this.circuitOpen = false;
        this.currentAbortController = null;
        this.pollingIntervalId = null;
        this.currentInterval = CONFIG.POLLING_BASE_INTERVAL;
    }

    startPolling() {
        if (this.pollingIntervalId) clearTimeout(this.pollingIntervalId);
        this._pollCycle();
    }

    async _pollCycle() {
        if (!this.circuitOpen) await this.poll();
        
        // Adaptive polling : ralentit si hors-ligne pour économiser CPU/Réseau
        this.currentInterval = state.get('isOffline') ? 10000 : CONFIG.POLLING_BASE_INTERVAL;
        this.pollingIntervalId = setTimeout(() => this._pollCycle(), this.currentInterval);
    }

    async poll() {
        // Annulation de la requête précédente si elle pend (Conflits Promises)
        if (this.currentAbortController) this.currentAbortController.abort();
        this.currentAbortController = new AbortController();

        try {
            const platformName = platform.config.host || 'fallback';
            const res = await fetch(`${CONFIG.SERVER_URL}/v1/bridge/poll?platform=${platformName}`, {
                signal: this.currentAbortController.signal
            });
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            
            if (!Utils.validateBridgeResponse(data)) throw new Error("Invalid schema");

            this._handleSuccess();
            bus.emit('BRIDGE_SYNC', data);
            
            if (data.phase_num === 4) this.pollLogs();

        } catch (e) {
            if (e.name !== 'AbortError') this._handleFailure(e);
        }
    }

    async sendCapture(payload) {
        const strPayload = JSON.stringify(payload);
        if (strPayload.length > CONFIG.MAX_PAYLOAD_SIZE) {
            KirovLogger.warn("Payload over 500KB, truncating or dropping.");
            return;
        }

        if (state.get('isOffline')) {
            KirovLogger.info("Offline: Queueing payload.");
            const q = state.get('queue');
            q.push(payload);
            state.set('queue', q);
            return;
        }

        try {
            const res = await fetch(`${CONFIG.SERVER_URL}/v1/bridge/callback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: strPayload
            });
            if (res.ok) {
                KirovLogger.trackMetric('captures');
                bus.emit('CAPTURE_SENT', payload);
            }
        } catch (e) {
            KirovLogger.error("Failed to send capture, queueing.", e);
            const q = state.get('queue');
            q.push(payload);
            state.set('queue', q);
            this._handleFailure(e);
        }
    }

    async flushQueue() {
        const q = state.get('queue');
        if (q.length === 0) return;
        KirovLogger.info(`Flushing queue: ${q.length} items`);
        
        const items = [...q];
        state.set('queue', []);
        for (const item of items) await this.sendCapture(item);
    }

    async pollLogs() {
        try {
            const res = await fetch(`${CONFIG.SERVER_URL}/v1/logs`);
            if (!res.ok) return;
            const data = await res.json();
            bus.emit('LOGS_SYNC', data.logs || []);
        } catch (e) { KirovLogger.warn("Log polling failed", e); }
    }

    _handleSuccess() {
        this.consecutiveFailures = 0;
        if (state.get('isOffline')) {
            KirovLogger.info("Bridge reconnected.");
            state.set('isOffline', false);
            bus.emit('BRIDGE_ONLINE');
            this.flushQueue();
        }
    }

    _handleFailure(err) {
        this.consecutiveFailures++;
        KirovLogger.trackMetric('bridgeErrors');
        KirovLogger.warn(`Bridge error (${this.consecutiveFailures}):`, err);

        // Circuit Breaker : Stop au bout de 5 échecs
        if (this.consecutiveFailures >= CONFIG.MAX_RETRIES && !state.get('isOffline')) {
            KirovLogger.error("Circuit breaker triggered! Bridge is OFFLINE.");
            state.set('isOffline', true);
            bus.emit('BRIDGE_OFFLINE');
        }
    }
}
const bridge = new BridgeClient();

// ==========================================
// 7. PLATFORM DETECTOR (Cross-Plateforme)
// ==========================================
const PLATFORMS = {
    DEEPSEEK: {
        host: "deepseek",
        textarea: ['textarea#chat-input', '.ds-textarea', 'textarea[placeholder*="message" i]'],
        sendBtn: ['.ds-input-send-button', '[aria-label*="send" i]', '[aria-label*="envoy" i]', '[data-testid="send-button"]', 'div[role="button"][aria-label*="send" i]', 'div[role="button"][aria-label*="envoy" i]', 'div[role="button"][title*="send" i]', 'div[role="button"][title*="envoy" i]'],
        messageContainer: '.ds-chat-list, .ds-message-list, main',
        messageBlock: '.ds-markdown, .prose, .ds-message-content'
    },
    CHATGPT: {
        host: "chatgpt",
        textarea: ['textarea#prompt-textarea'],
        sendBtn: ['button[data-testid="send-button"]', 'button[aria-label*="Send" i]', 'button[aria-label*="Envoy" i]'],
        messageContainer: 'main',
        messageBlock: '.markdown'
    },
    GEMINI: {
        host: "gemini",
        textarea: ['rich-textarea', '.textarea', 'div[contenteditable="true"]'],
        sendBtn: ['button[aria-label*="Send" i]', 'button[aria-label*="Envoy" i]', 'button[aria-label*="Envoi" i]', '.send-button', 'button.send-button'],
        messageContainer: 'chat-window, main',
        messageBlock: 'message-content, .model-response-text'
    },
    FALLBACK: {
        textarea: ['[role="textbox"]', '[contenteditable="true"]', 'textarea'],
        sendBtn: ['button[type="submit"]', 'button[aria-label*="send" i]', 'button[aria-label*="envoy" i]', 'button[aria-label*="envo" i]'],
        messageContainer: 'main, body',
        messageBlock: '.prose, .markdown-body, article'
    }
};

class PlatformDetector {
    constructor() {
        this.config = PLATFORMS.FALLBACK;
        this.detect();
    }
    
    detect() {
        const host = window.location.hostname;
        if (host.includes('deepseek.com')) this.config = PLATFORMS.DEEPSEEK;
        else if (host.includes('chatgpt.com')) this.config = PLATFORMS.CHATGPT;
        else if (host.includes('gemini.google.com')) this.config = PLATFORMS.GEMINI;
        KirovLogger.info(`Platform detected: ${this.config.host || 'Fallback'}`);
    }

    getElement(selectors, parent = document) {
        const arr = Array.isArray(selectors) ? selectors : [selectors];
        for (const sel of arr) {
            const el = parent.querySelector(sel);
            if (el) return el;
        }
        return null;
    }
    
    getElements(selectors, parent = document) {
        const arr = Array.isArray(selectors) ? selectors : [selectors];
        for (const sel of arr) {
            const els = parent.querySelectorAll(sel);
            if (els.length > 0) return Array.from(els);
        }
        return [];
    }
}
const platform = new PlatformDetector();

// ==========================================
// 8. PROMPT ENGINE (Injection Intelligente)
// ==========================================
class PromptEngine {
    constructor() { bus.on('BRIDGE_SYNC', this.handleSync.bind(this)); }

    async handleSync(data) {
        const phase = data.phase_num || 1;
        state.set('currentPhase', phase);
        if (data.project_id) state.set('projectId', data.project_id);

        if (!state.get('isActivated')) {
            state.set('isActivated', true);
            bus.emit('UI_TOAST', `Elite Forge : Phase ${phase} Active`);
        }

        if (data.status === "prompt" && data.prompt) {
            const promptHash = await Utils.sha256(data.prompt);
            // Déduplication avec SHA-256 pour éviter les boucles
            if (promptHash !== state.get('lastPromptHash')) {
                state.set('lastPromptHash', promptHash);
                KirovLogger.info(`New prompt detected (Phase ${phase})`);
                this.inject(data.prompt, phase, state.get('projectId'));
            }
        }
    }

    buildTemplate(rawPrompt, phase, projectId) {
        let text = rawPrompt;
        const pid = (projectId || "KIROV_PROJECT").toUpperCase();

        // ══════════════════════════════════════════════════════════
        // STRUCTURE DE RÉFÉRENCE ABSOLUE (modèle GAME2 / TETRISV3)
        // ══════════════════════════════════════════════════════════
        const REFERENCE_STRUCTURE = `
STRUCTURE CIBLE INVIOLABLE (modèle GAME2/TETRISV3 — seuls projets validés en production) :
  ├── index.html            ← RACINE (id="root", src="./src/app/main.tsx")
  ├── vite.config.ts        ← base:'./', plugins:[react()], alias @→src, @app→src/app, @features→src/features, @shared→src/shared
  ├── tsconfig.json         ← include:["src","vite-env.d.ts"], paths:{@/*,@app/*,@features/*,@shared/*}
  ├── package.json          ← "type":"module", build:"vite build" UNIQUEMENT (JAMAIS tsc &&)
  ├── postcss.config.js     ← export default { plugins: { tailwindcss:{}, autoprefixer:{} } }
  ├── tailwind.config.ts    ← content:["./index.html","./src/**/*.{ts,tsx}"]
  ├── .npmrc                ← legacy-peer-deps=true
  ├── launcher.bat          ← Lancement dev local rapide
  ├── FIX_AND_BUILD.bat     ← Force le nettoyage de cache + build dist/
  └── src/
       ├── index.css        ← @tailwind base/components/utilities
       ├── vite-env.d.ts    ← /// <reference types="vite/client" />
       └── app/
            ├── main.tsx    ← ReactDOM.createRoot(document.getElementById('root')!).render(<App/>)
            ├── App.tsx     ← Providers + <HashRouter> (OBLIGATOIRE pour APK Android)
            ├── router.tsx  ← Routes React Router DOM
            ├── contexts/   ← Contexts React (State global)
            └── layouts/    ← Layouts partagés
       └── features/        ← Un dossier par feature (ex: features/games/)
            └── [feature]/
                 ├── components/
                 ├── hooks/
                 ├── pages/
                 └── index.ts
       └── shared/          ← UI partagée (types, utils, lib, services, constants)
            ├── components/
            ├── hooks/
            ├── lib/
            ├── services/
            ├── types/
            ├── constants/
            └── utils/
`;

        if (phase === 1) {
            text = `[⚡ INGENIERIE SENIOR G50+ (Méthode Matt Pocock) — PHASE 1 : PRD & ARCHITECTURE]\n`;
            text += `Projet : ${pid}\nVision : "${rawPrompt}"\n\n`;
            text += `Tu es un Ingénieur Senior (Méthodologie Matt Pocock). Ta mission : concevoir un PRD technique parfait, axé sur les comportements et l'encapsulation (Deep Modules).\n\n`;
            text += `🧠 COMPÉTENCES REQUISES :\n`;
            text += `[SKILL: ZOOM-OUT] Interdiction de te focaliser sur un détail. Pense toujours à l'architecture globale AVANT de concevoir un module.\n`;
            text += `[SKILL: DIAGNOSE] Utilise la méthode scientifique (Hypothèse -> Vérification) pour justifier tes choix techniques.\n`;
            text += `[SKILL: CREATIVE GENIUS] Tu dois faire preuve d'une originalité et d'une créativité absolues pour répondre à la vision de l'utilisateur. L'architecture est stricte (modèle GAME2 pour la complexité et la stabilité), mais le concept, le design (UI/UX) et les fonctionnalités métiers doivent être 100% uniques, libres et sur-mesure pour CE projet spécifique.\n\n`;
            text += REFERENCE_STRUCTURE;
            text += `\n📋 FORMAT DU PRD (Document Unique et Exhaustif) :\n`;
            text += `## Problem Statement & Solution\nDécris le problème du point de vue utilisateur et la solution technique globale.\n\n`;
            text += `## User Stories\nUne liste NUMÉROTÉE EXHAUSTIVE (ex: "1. En tant que [acteur], je veux [feature], afin de [bénéfice]").\n\n`;
            text += `## Implementation Decisions (Deep Modules)\n`;
            text += `- Identifie explicitement les "Deep Modules" (modules encapsulant beaucoup de logique derrière une interface publique très simple).\n`;
            text += `- Architecture (React+Vite+TS), routeur (HashRouter impératif).\n`;
            text += `- Schémas Zod, APIs, états globaux.\n\n`;
            text += `## Testing Decisions\n- Décris les tests d'intégration qui valident le COMPORTEMENT via les interfaces publiques (ne JAMAIS tester les détails d'implémentation interne).\n\n`;
            text += `## Out of Scope\nCe qui ne sera PAS fait.\n\n`;
            text += `⚠️ RÈGLES ABSOLUES PHASE 1 :\n`;
            text += `❌ ZÉRO blabla. AUCUN texte d'introduction ("Voici le code", "Bien sûr").\n`;
            text += `❌ ZÉRO code source. Uniquement de la spécification technique (Markdown).\n`;
            text += `❌ ZÉRO Expo, ZÉRO React Native, ZÉRO Vue.js.\n`;
            text += `✅ Stack unique : React 18 + Vite 5 + TypeScript 5 + Tailwind 3.\n`;
            text += `✅ Router : UNIQUEMENT HashRouter (incompatible APK sinon).\n`;
            text += `✅ Point d'entrée : src/app/main.tsx (JAMAIS src/main.tsx à la racine).\n`;

        } else if (phase === 2) {
            text += `\n\n🛡️ PROTOCOLE SOUVERAIN DIAMOND G50+ — PROJET : ${pid} — PHASE 2 (GÉNÉRATION) 🛡️\n`;
            text += REFERENCE_STRUCTURE;
            text += `\n━━━ RÈGLES ABSOLUES DE GÉNÉRATION DE CODE & TDD (Méthode Matt Pocock) ━━━\n\n`;

            text += `🧪 PHILOSOPHIE TEST-DRIVEN DEVELOPMENT (OBLIGATOIRE) :\n`;
            text += `T1. VERTICAL SLICING (Tracer Bullets) : Implémente UN seul test pour UN comportement, puis le code minimal pour le faire passer, PUIS refactorise. (Red -> Green -> Refactor).\n`;
            text += `T2. HORIZONTAL SLICING INTERDIT : Ne JAMAIS écrire tous les tests d'abord, puis toute l'implémentation.\n`;
            text += `T3. DEEP MODULES : Le code doit être encapsulé derrière des interfaces publiques simples et immuables.\n`;
            text += `T4. TESTS DE COMPORTEMENT : Les tests vérifient l'interface publique. Ils doivent survivre aux refactorisations internes.\n\n`;

            text += `🧠 COMPÉTENCES D'INGÉNIERIE AVANCÉE :\n`;
            text += `[SKILL: CAVEMAN DEBUGGING] Obligation d'injecter des logs structurés (console.log ou Logger) dans les modules complexes pour tracer le flux de données de manière agressive.\n`;
            text += `[SKILL: GIT-GUARDRAILS (ATOMIC CHANGES)] Interdiction de coder 5 fonctionnalités en même temps. Tu ne modifies qu'une seule feature logique de manière atomique.\n`;
            text += `[SKILL: CREATIVE EXECUTION] L'architecture est verrouillée (comme GAME2), mais l'implémentation doit être audacieuse et unique. Sois libre et original sur le design (Tailwind), les animations, et l'expérience utilisateur ! Chaque projet doit avoir sa propre âme.\n\n`;

            text += `📁 STRUCTURE (INVIOLABLE) :\n`;
            text += `R1. Fichiers racine OBLIGATOIRES : index.html, vite.config.ts, tsconfig.json, package.json, postcss.config.js, tailwind.config.ts, .npmrc, launcher.bat, FIX_AND_BUILD.bat\n`;
            text += `R2. Point d'entrée script dans index.html : <script type="module" src="./src/app/main.tsx"></script>\n`;
            text += `R3. id="root" dans le <div> de index.html. JAMAIS id="app".\n`;
            text += `R4. Tous les composants dans src/features/[feature]/components/ ou src/shared/components/\n`;
            text += `R5. JAMAIS de sous-dossiers client/, frontend/, web/, app/ à la RACINE (seulement dans src/)\n\n`;

            text += `🚫 INTERDICTIONS ABSOLUES (ces erreurs détruisent la forge) :\n`;
            text += `X1. JAMAIS générer package.js — UNIQUEMENT package.json\n`;
            text += `X2. JAMAIS générer tsconfig.js ou tsconfig.node.js — UNIQUEMENT tsconfig.json\n`;
            text += `X3. JAMAIS générer App.ts — UNIQUEMENT App.tsx\n`;
            text += `X4. JAMAIS utiliser @vitejs/plugin-vue, .vue, ou Vue.js\n`;
            text += `X5. JAMAIS utiliser expo-router, react-native, @expo/\n`;
            text += `X6. JAMAIS préfixer le code avec 'html<!DOCTYPE', 'javascript', 'typescript', 'tsx'\n`;
            text += `X7. JAMAIS écrire du code sur une seule ligne\n`;
            text += `X8. JAMAIS utiliser BrowserRouter — UNIQUEMENT HashRouter (obligatoire pour Android APK)\n`;
            text += `X9. JAMAIS 'module.exports' dans postcss.config.js — Uniquement 'export default'\n`;
            text += `X10. JAMAIS écrire tous les tests d'un coup (Anti-Pattern: Horizontal Slicing).\n`;
            text += `X11. JAMAIS omettre la fermeture d'une balise JSX. TOUTES les balises JSX (HTML ou Composants) DOIVENT être correctement fermées ! (Exemple d'ERREUR : <FilterContext.Provider value={{}} {children} </FilterContext.Provider> -> CORRECTION : <FilterContext.Provider value={{}} > {children} </FilterContext.Provider>)\n`;
            text += `X12. JAMAIS omettre les backticks autour des chaînes interpolées (ex: console.warn(Error \${key}:) ou className={inline-block \${class}} est STRICTEMENT INTERDIT). Exemple : console.warn(\`Error reading key "\${key}":\`, error) ou className={\`inline-block \${className}\`}.\n\n`;

            text += `✅ OBLIGATIONS :\n`;
            text += `O1. CHAQUE fichier sur PLUSIEURS lignes (retours à la ligne obligatoires après chaque instruction)\n`;
            text += `O2. tsconfig.json DOIT avoir : "include": ["src", "vite-env.d.ts"] et "paths": {"@/*":["./src/*"],"@app/*":["./src/app/*"],"@features/*":["./src/features/*"],"@shared/*":["./src/shared/*"]}\n`;
            text += `O3. vite.config.ts DOIT avoir : resolve.alias @→src, @app→src/app, @features→src/features, @shared→src/shared\n`;
            text += `O4. Tous les imports React utilisent l'alias @ : import X from '@/shared/...' ou '@/features/...'\n`;
            text += `O5. package.json "type":"module", "build":"vite build", ZÉRO dépendance Expo/RN\n`;
            text += `O6. Zod pour CHAQUE type de données externe. Zero 'any' TypeScript.\n`;
            text += `O7. Mobile-first Tailwind. Palette : slate/gray/zinc/neutral uniquement (JAMAIS purple/indigo/violet).\n`;
            text += `O8. Lucide-react pour les icônes (jamais heroicons, react-icons).\n\n`;

            text += `📦 PACKAGE.JSON MODÈLE EXACT :\n`;
            text += `{\n  "name": "${pid.toLowerCase()}",\n  "private": true,\n  "version": "1.0.0",\n  "type": "module",\n`;
            text += `  "scripts": { "dev": "vite", "build": "vite build", "preview": "vite preview" },\n`;
            text += `  "dependencies": { "react": "^18.3.1", "react-dom": "^18.3.1", "react-router-dom": "^6.26.0", "lucide-react": "^0.378.0", "zod": "^3.23.8" },\n`;
            text += `  "devDependencies": { "vite": "^5.4.0", "@vitejs/plugin-react": "^4.3.1", "typescript": "^5.5.3", "@types/react": "^18.3.3", "@types/react-dom": "^18.3.0", "tailwindcss": "^3.4.1", "autoprefixer": "^10.4.19", "postcss": "^8.4.39" }\n}\n\n`;

            text += `📦 LAUNCHER.BAT MODÈLE EXACT :\n`;
            text += `@echo off\ntitle FORGE LAUNCHER - ${pid}\ncd /d "%~dp0"\necho [FORGE] Lancement de ${pid}...\nif exist package.json (\n    if not exist node_modules\\.bin (\n        echo [FORGE] Dependances absentes. Installation...\n        npm install --legacy-peer-deps\n    )\n)\necho [FORGE] Demarrage dev server...\nnpm run dev -- --host --port 5173\npause\n\n`;

            text += `📦 FIX_AND_BUILD.BAT MODÈLE EXACT :\n`;
            text += `@echo off\ncd /d "%~dp0"\necho === NETTOYAGE ===\ndel /f /q package.js tsconfig.js tsconfig.node.js app.js App.ts pnpm-lock.yaml 2>nul\nif exist src (\n    cd src\n    del /f /s /q *.vue >nul 2>&1\n    cd ..\n)\nif exist node_modules (\n    echo Suppression du dossier node_modules en cours - cela peut prendre 1 a 2 minutes...\n    rmdir /s /q node_modules\n)\nif exist package-lock.json del /f /q package-lock.json\necho === INSTALLATION ===\necho Installation des dependances...\ncall npm install --legacy-peer-deps\nif errorlevel 1 (\n    echo ERREUR INSTALLATION\n    pause\n    exit /b 1\n)\necho === BUILD ===\ncall npm run build\nif errorlevel 1 (\n    echo ERREUR BUILD\n    pause\n    exit /b 1\n)\npause\n\n`;

            text += `🔇 SILENCE ABSOLU : ZÉRO texte explicatif, ZÉRO introduction, ZÉRO conclusion. UNIQUEMENT des blocs code au format :\n`;
            text += `Fichier: chemin/relatif/depuis/racine.ext\n[contenu complet du fichier avec retours à la ligne]\n\n`;
            text += `❌ Toute violation (Blabla, Vue, package.js, code sur 1 ligne, BrowserRouter, Expo) bloquera définitivement la forge.`;
        } else if (phase === 3) {
            text += `\n\n🛡️ PROTOCOLE SOUVERAIN DIAMOND G50+ — PROJET : ${pid} — PHASE 3 (AUDIT & REFACTORING) 🛡️\n`;
            text += REFERENCE_STRUCTURE;
            text += `\n━━━ 🧠 [SKILL: GRILL-ME] MODE TECH LEAD ACTIF ━━━\n\n`;
            text += `Dans cette phase, tu n'es plus un simple développeur, tu es le TECH LEAD le plus exigeant au monde.\n`;
            text += `Ta mission n'est PAS d'écrire de nouvelles features, mais d'AUDITER le code généré en Phase 2.\n\n`;
            text += `🔍 OBJECTIFS D'AUDIT :\n`;
            text += `1. Analyse agressive des failles de sécurité, des fuites de mémoire (useEffect non nettoyés) et des goulets d'étranglement de performance.\n`;
            text += `2. Critique impitoyable de l'architecture : Y a-t-il trop de couplage ? Les composants sont-ils de vrais "Deep Modules" ?\n`;
            text += `3. Pose des questions pointues ("Pourquoi as-tu choisi ce state global au lieu d'un context local ?").\n`;
            text += `4. Propose des REFACTORISATIONS massives pour simplifier la base de code.\n\n`;
            text += `🔮 AUDIT SYNTAXE JSX (OBLIGATOIRE) :\n`;
            text += `S1. Vérifie que TOUTES les balises JSX sont fermées (chevron '>' après les attributs). Un '>' manquant = erreur esbuild fatale.\n`;
            text += `S2. Vérifie que les template strings en JSX utilisent des backticks : {\`\${val}\`} et non \${val} brut.\n`;
            text += `S3. Vérifie que les fichiers avec du JSX ont l'extension .tsx et les fichiers TypeScript pur .ts.\n`;
            text += `S4. Vérifie qu'aucun BrowserRouter n'a été utilisé (HashRouter UNIQUEMENT pour APK Android).\n\n`;
            text += `🔇 Format de réponse attendu : Zéro blabla, uniquement des blocs de code corrigés (Fichier: chemin/relatif.ext) et tes critiques cinglantes en commentaires dans le code.\n`;
        }
        return text;
    }

    async inject(rawPrompt, phase, projectId) {
        const text = this.buildTemplate(rawPrompt, phase, projectId);
        KirovLogger.trackMetric('promptsInjected');

        const tryInject = () => {
            const input = platform.getElement(platform.config.textarea);
            if (!input) return false;

            try {
                input.focus();
                if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT' || input.getAttribute('contenteditable') === 'true') {
                    // 1. Définition de la valeur native
                    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set || 
                                         Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set ||
                                         Object.getOwnPropertyDescriptor(window.HTMLElement.prototype, "innerText")?.set;
                    
                    if (nativeSetter && input.tagName !== 'DIV') {
                        nativeSetter.call(input, text);
                    } else {
                        if (input.tagName === 'DIV') {
                            input.innerText = text;
                            input.innerHTML = text;
                        } else {
                            input.value = text;
                        }
                    }

                    // 2. Déclenchement du tracker de valeur React (si présent)
                    try {
                        const tracker = input._valueTracker;
                        if (tracker) tracker.setValue(""); 
                    } catch(e){}
                } else {
                    input.innerText = text;
                    input.textContent = text;
                }
                
                // 3. Dispatch des événements système standardisés (Bubbles pour React/Vue)
                ['input', 'change', 'keyup'].forEach(name => {
                    input.dispatchEvent(new Event(name, { bubbles: true, cancelable: true }));
                });
                
                // 4. Simulation de saisie clavier pour réveiller les bindings
                ['keydown', 'keypress', 'keyup'].forEach(name => {
                    input.dispatchEvent(new KeyboardEvent(name, {
                        key: ' ', code: 'Space', keyCode: 32, which: 32, bubbles: true, cancelable: true
                    }));
                });

                this.retrySend(); // Smart retry logic
                return true;
            } catch (err) {
                KirovLogger.error("Injection failed", err);
                return false;
            }
        };

        // MutationObserver si le DOM est lent
        if (!tryInject()) {
            KirovLogger.info("Textarea not ready, starting DOM Observer...");
            const observer = new MutationObserver((mutations, obs) => {
                if (tryInject()) obs.disconnect();
            });
            observer.observe(document.body, { childList: true, subtree: true });
            setTimeout(() => observer.disconnect(), 10000);
        }
    }

    retrySend(attempts = 0) {
        if (attempts > 15) { // Stop après 4.5s
            KirovLogger.error("Failed to click send button automatically. Forcing Enter key.");
            const input = platform.getElement(platform.config.textarea);
            if (input) {
                // Simulation agressive de la touche Entrée (avec et sans Ctrl pour bypasser les nouveaux UI)
                ['Enter', 'NumpadEnter'].forEach(key => {
                    input.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, keyCode: 13, which: 13, bubbles: true, cancelable: true }));
                    input.dispatchEvent(new KeyboardEvent('keydown', { key, code: key, keyCode: 13, which: 13, ctrlKey: true, bubbles: true, cancelable: true }));
                    input.dispatchEvent(new KeyboardEvent('keypress', { key, code: key, keyCode: 13, which: 13, bubbles: true, cancelable: true }));
                    input.dispatchEvent(new KeyboardEvent('keyup', { key, code: key, keyCode: 13, which: 13, bubbles: true, cancelable: true }));
                });
                
                // Fallback ultime : chercher un bouton à droite de l'input et le cliquer
                const anyBtns = document.querySelectorAll('div[role="button"], button, .ds-button, .send-button');
                anyBtns.forEach(b => {
                    // On clique sur tout ce qui ressemble à un bouton d'envoi non désactivé
                    if (!b.disabled && b.getAttribute('aria-disabled') !== 'true' && (b.innerHTML.includes('svg') || b.className.includes('send'))) {
                        b.click();
                    }
                });
            }
            return;
        }

        const btn = platform.getElement(platform.config.sendBtn);
        if (btn) {
            const isDisabled = btn.disabled || btn.getAttribute('aria-disabled') === 'true' || btn.classList.contains('disabled');
            // Si on a attendu assez longtemps (attempt > 5), on force le clic même si ça a l'air disabled
            if (!isDisabled || attempts > 5) {
                btn.click();
                KirovLogger.info("Send button triggered.");
                return;
            }
        } else {
            // Nouvelle recherche de bouton d'envoi (Deepseek v2/v3 UI)
            const fallbackBtn = document.querySelector('div[role="button"] svg, span.ds-icon-button, .ds-input-send-button, [aria-label*="Send" i], [aria-label*="envo" i]');
            if (fallbackBtn) {
                const parentBtn = fallbackBtn.closest('div[role="button"], button') || fallbackBtn;
                const isDisabled = parentBtn.disabled || parentBtn.getAttribute('aria-disabled') === 'true';
                if (!isDisabled || attempts > 5) {
                    parentBtn.click();
                    KirovLogger.info("Send button (fallback) triggered.");
                    return;
                }
            }
        }
        setTimeout(() => this.retrySend(attempts + 1), 300);
    }
}
const promptEngine = new PromptEngine();

// ==========================================
// 9. OUTPUT SCANNER (Capture & Parse)
// ==========================================
class ValidationOrchestrator {
    static validateScaffold(content) {
        // Vérification des fichiers obligatoires À LA RACINE
        const requiredFiles = ['index.html', 'main.tsx', 'App.tsx', 'vite.config.ts', 'postcss.config.js', 'package.json', 'tsconfig.json'];
        const missing = [];
        requiredFiles.forEach(f => { if (!content.includes(f)) missing.push(f); });
        return missing;
    }
    static validateDesign(content) {
        const forbiddenColors = ['purple-', 'indigo-', 'violet-'];
        const violations = [];
        forbiddenColors.forEach(c => { if (content.includes(c)) violations.push(`Couleur bannie: ${c}`); });
        return violations;
    }
    static validateImports(content) {
        const violations = [];
        if (content.includes('.jsx')) violations.push('Extension .jsx détectée au lieu de .tsx (Règle 8).');
        // Détection structure sous-dossier parasite
        if (content.match(/client\/index\.html|frontend\/index\.html|web\/index\.html/)) {
            violations.push('⚠️ STRUCTURE INVALIDE : index.html dans un sous-dossier (client/frontend/web). Doit être à la racine ! (Règle 11)');
        }
        // Détection PostCSS CJS dans ESM
        if (content.includes('module.exports =') && content.includes('"type": "module"')) {
            violations.push('⚠️ POSTCSS ESM CONFLICT : module.exports détecté dans un projet ESM. Utilise export default (Règle 12).');
        }
        // Détection vite.config.ts sans import - affinée pour éviter les faux-positifs hors-code
        if (content.match(/^[^i\s\/\*].*\{.*defineConfig.*\}.*from.*['"]vite['"]/m)) {
            violations.push('⚠️ VITE CONFIG : Le mot "import" est manquant en début de ligne (Règle 13).');
        }
        // NOTE : Détection pnpm désactivée car pnpm est le gestionnaire de dépendances standard et approuvé de la Forge globale !
        return violations;
    }
}


class OutputScanner {
    constructor() {
        this.observer = null;
        this.startObserving();
    }

    startObserving() {
        const container = platform.getElement([platform.config.messageContainer, 'body']);
        if (!container) return setTimeout(() => this.startObserving(), 1000);

        KirovLogger.info("Starting Output Scanner Observer.");
        this.observer = new MutationObserver(() => {
            if (this.timeout) clearTimeout(this.timeout);
            // Debounce de 500ms pour ne pas saturer le CPU pendant que l'IA tape
            this.timeout = setTimeout(() => this.parseLatestMessage(), 500);
        });
        this.observer.observe(container, { childList: true, characterData: true, subtree: true });
    }

    isStreamingComplete(msgElement) {
        // Multi-critères pour définir si l'IA a fini de générer
        const hasSpinner = !!document.querySelector('.ds-spinner, .generating, button[aria-label*="Stop" i]');
        return !hasSpinner;
    }

    async parseLatestMessage() {
        const messages = platform.getElements(platform.config.messageBlock);
        if (messages.length === 0) return;
        
        const lastMsg = messages[messages.length - 1];
        if (!this.isStreamingComplete(lastMsg)) return;

        // Clone du message pour le nettoyer sans modifier le DOM visible
        const clone = lastMsg.cloneNode(true);
        // Supprimer les boutons de l'interface qui génèrent "Copier", "Télécharger"
        const uiElements = clone.querySelectorAll('button, svg, [role="button"], [class*="action"], [class*="copy"]');
        uiElements.forEach(el => el.remove());

        // FIX SOUVERAIN : Préserver les sauts de ligne car textContent les écrase sur les noeuds détachés
        clone.querySelectorAll('p, div, li').forEach(el => el.appendChild(document.createTextNode('\n')));
        clone.querySelectorAll('br').forEach(el => el.replaceWith('\n'));

        let content = clone.innerText || clone.textContent || "";
        // Filtrage Regex agressif pour les restes de l'UI DeepSeek (ignorer la casse, sur chaque ligne)
        content = content.replace(/^(text|copier|télécharger|copy|download|exécuter)$/gmi, '').trim();

        if (content.length < 50) return;

        const contentHash = await Utils.sha256(content);
        if (contentHash === state.get('lastOutputHash')) return; // Déduplication

        if (content.match(/Fichier\s*:/i) || content.includes("FILE:") || content.includes("\`\`\`") || content.includes("PRD")) {
            
            // VALIDATION G50+
            const phase = state.get('currentPhase');
            const validationResult = { isValid: true };
            
            // On désactive la validation du Scaffold pour P5 et P6 (Refactoring Chirurgical)
            if (phase >= 2 && phase < 5) {
                const missing = ValidationOrchestrator.validateScaffold(content);
                const designViolations = ValidationOrchestrator.validateDesign(content);
                const importViolations = ValidationOrchestrator.validateImports(content);
                
                if (missing.length > 0) {
                    KirovLogger.warn(`Scaffold incomplet: ${missing.join(', ')}`);
                    bus.emit('UI_TOAST', `⚠️ Scaffold incomplet: ${missing.length} fichiers absents`);
                    validationResult.isValid = false;
                }
                if (designViolations.length > 0) {
                    KirovLogger.warn(`Violation Design: ${designViolations.join(', ')}`);
                    bus.emit('UI_TOAST', `🎨 Violation Design: Couleur interdite détectée`);
                }
                if (importViolations.length > 0) {
                    KirovLogger.warn(`Violation Imports: ${importViolations.join(', ')}`);
                    bus.emit('UI_TOAST', `⚠️ Violation Import: Extension invalide (.jsx)`);
                }
            }

            state.set('lastOutputHash', contentHash);
            KirovLogger.info("New valid code block captured.");
            bridge.sendCapture({ 
                content: content,
                validation: validationResult
            });
        }
    }
}
const outputScanner = new OutputScanner();

// ==========================================
// 10. UI RENDERER (Overlays & Securité)
// ==========================================
class UIRenderer {
    constructor() {
        this.overlay = null;
        this.overlayContent = null;
        
        bus.on('UI_TOAST', msg => this.showToast(msg));
        bus.on('BRIDGE_OFFLINE', () => this.showToast('⚠️ Bridge Timeout/Offline', 'error'));
        bus.on('BRIDGE_ONLINE', () => this.showToast('✅ Bridge Reconnected', 'success'));
        bus.on('CAPTURE_SENT', () => this.showToast('📥 Capture Diamond Réussie', 'success'));
        bus.on('LOGS_SYNC', logs => this.updateLogsOverlay(logs));
    }

    showToast(msg, type = 'info') {
        const toast = document.createElement('div');
        let bg = 'rgba(0,0,0,0.8)';
        let color = '#00f2ff';
        if (type === 'error') { bg = '#ff0055'; color = 'white'; }
        if (type === 'success') { bg = '#00f2ff'; color = 'black'; }

        toast.style.cssText = `position:fixed;bottom:20px;left:20px;z-index:10000;background:${bg};border:1px solid ${color};color:${color};padding:10px 20px;border-radius:8px;font-family:sans-serif;font-size:12px;box-shadow:0 0 20px rgba(0,242,255,0.2);transition:opacity 0.3s;`;
        // Sécurité : textContent prévient les injections XSS
        toast.textContent = msg; 
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    createLogsOverlay() {
        if (this.overlay) return;
        
        this.overlay = document.createElement('div');
        this.overlay.style.cssText = `position:fixed;top:20px;right:20px;width:380px;height:450px;background:rgba(15,23,42,0.95);border:1px solid #334155;border-radius:12px;z-index:9999;display:flex;flex-direction:column;box-shadow:0 10px 30px rgba(0,0,0,0.5);font-family:'Courier New', monospace;font-size:11px;color:#cbd5e1;overflow:hidden;`;
        
        const header = document.createElement('div');
        header.style.cssText = `padding:10px;background:#1e293b;border-bottom:1px solid #334155;display:flex;justify-content:space-between;align-items:center;font-weight:bold;color:#38bdf8;`;
        header.textContent = `🚀 BUILD MONITOR (Phase 4)`;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '✕';
        closeBtn.style.cssText = `background:none;border:none;color:#94a3b8;cursor:pointer;`;
        closeBtn.onclick = () => { this.overlay.style.display = 'none'; };
        header.appendChild(closeBtn);

        this.overlayContent = document.createElement('div');
        this.overlayContent.style.cssText = `flex:1;padding:10px;overflow-y:auto;white-space:pre-wrap;word-wrap:break-word;`;

        this.overlay.appendChild(header);
        this.overlay.appendChild(this.overlayContent);
        document.body.appendChild(this.overlay);
    }

    updateLogsOverlay(logs) {
        if (!logs || logs.length === 0 || state.get('currentPhase') !== 4) return;
        
        if (!this.overlay) this.createLogsOverlay();
        this.overlay.style.display = 'flex';

        const currentLogCount = this.overlayContent.childElementCount;
        if (logs.length > currentLogCount) {
            const newLogs = logs.slice(currentLogCount);
            
            newLogs.forEach(logText => {
                const line = document.createElement('div');
                line.style.marginBottom = '4px';
                line.textContent = logText;
                
                if (logText.includes('❌') || logText.includes('ERR')) line.style.color = '#f87171';
                else if (logText.includes('✅') || logText.includes('SUCCESS')) line.style.color = '#4ade80';
                else if (logText.includes('⚠️') || logText.includes('WARN')) line.style.color = '#facc15';
                
                this.overlayContent.appendChild(line);
                
                // Legacy Toasts pour les évènements critiques
                if (logText.includes("MISSION RÉUSSIE")) this.showToast(`📦 MATÉRIALISÉ`, 'success');
                if (logText.includes("❌ Échec build")) this.showToast(`⚠️ ÉCHEC BUILD`, 'error');
            });
            
            // Auto-scroll vers le bas
            this.overlayContent.scrollTop = this.overlayContent.scrollHeight;
        }
    }
}
const ui = new UIRenderer();

// ==========================================
// 11. INITIALISATION
// ==========================================
async function init() {
    KirovLogger.info(`Starting Elite Forge Global v${CONFIG.VERSION}`);
    await state.load();
    bridge.startPolling();
}

init();
