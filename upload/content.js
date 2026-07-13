/**
 * ELITE FORGE — KIROV3 Vercel Edition
 * Fonctionne avec https://forge-kohl-kappa.vercel.app
 */

const CONFIG = {
    SERVER_URL: "https://forge-kohl-kappa.vercel.app",
    POLLING_INTERVAL: 2500,
    DEBUG_MODE: true,
    MAX_HEALING_CYCLES: 3
};

let currentHealingCycle = 0;

class KirovLogger {
    static info(...args) { console.log('[KIROV3]', ...args); }
    static error(...args) { console.error('[KIROV3]', ...args); }
    static warn(...args) { console.warn('[KIROV3]', ...args); }
}

// Polls the server for a prompt to inject
async function pollForPrompt() {
    try {
        const res = await fetch(`${CONFIG.SERVER_URL}/api/bridge/prompt`);
        const data = await res.json();

        if (data.status === 'idle' || !data.prompt) return;

        // SILENCE ABSOLU RENFORCÉ (Priorité 1.3)
        let finalPrompt = data.prompt;
        if (!finalPrompt.includes("SILENCE ABSOLU")) {
            finalPrompt += "\n\nSILENCE ABSOLU : Ne génère AUCUN texte conversationnel. Aucun 'Voici le code', aucune explication, aucune conclusion. UNIQUEMENT du JSON valide ou des blocs markdown avec les fichiers. Toute violation corrompt le projet.";
        }

        KirovLogger.info(`Phase ${data.phase_num}: Prompt received (${finalPrompt.length} chars)`);

        // Check if we already injected this prompt (hash check)
        const hash = await sha256(finalPrompt);
        const lastHash = localStorage.getItem('kirov_last_hash');
        if (hash === lastHash) return; // Already injected
        localStorage.setItem('kirov_last_hash', hash);

        currentHealingCycle = 0; // Reset healing cycle for new prompt
        
        // Inject the prompt into DeepSeek chat
        await injectPrompt(finalPrompt);
        KirovLogger.info('Prompt injected into DeepSeek');

        // Start capture loop
        captureResponse();

    } catch (e) {
        KirovLogger.error('Poll error:', e.message);
    }
}

async function injectPrompt(prompt) {
    const textarea = document.querySelector('textarea#chat-input, textarea[placeholder*="Message"], div[contenteditable="true"]');
    if (!textarea) {
        KirovLogger.error('Textarea not found');
        return;
    }

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    nativeInputValueSetter.call(textarea, prompt);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(r => setTimeout(r, 500));

    const sendButton = document.querySelector('button[data-testid="send-button"], button[aria-label*="Send"], div[role="button"]:last-child');
    if (sendButton) {
        sendButton.click();
        KirovLogger.info('Send button clicked');
    } else {
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        KirovLogger.info('Enter key pressed');
    }
}

// Extraction et Fix Automatique (Priorité 2.5)
function extractAndFixFiles(markdown) {
    const files = [];
    const regex = /(?:Fichier|File)\s*:\s*([^\n]+)\s*```[a-z]*\s*([\s\S]*?)```/gi;
    let match;
    let newMarkdown = markdown;

    while ((match = regex.exec(markdown)) !== null) {
        let path = match[1].trim();
        const content = match[2].trim();

        // Fix Automatique des Fichiers (apply_known_fixes)
        if (path === "Index.html") path = "index.html";
        if (path === "package.js") path = "package.json";
        if (path === "src/App.ts" && content.includes("<")) path = "src/App.tsx";
        if (path === "vite.config.js") path = "vite.config.ts";

        // Remplacer dans le markdown global pour le backend
        newMarkdown = newMarkdown.replace(match[1].trim(), path);

        files.push({ path, content });
    }
    return { files, fixedMarkdown: newMarkdown };
}

// Validation post-génération (Priorité 1.2)
function validateConstitution(files) {
    const errors = [];
    
    const paths = files.map(f => f.path.toLowerCase());
    
    // Vérifications critiques
    if (!paths.includes('index.html')) errors.push("Il manque le fichier index.html à la racine.");
    if (!paths.includes('vite.config.ts')) errors.push("Il manque vite.config.ts.");
    if (!paths.includes('package.json')) errors.push("Il manque package.json.");
    
    for (const f of files) {
        // Interdictions
        if (f.path.endsWith('.vue')) errors.push(`Fichier interdit généré : ${f.path} (Vue.js est interdit).`);
        if (f.path === 'src/App.ts' && f.content.includes('<')) errors.push("App.ts ne doit pas contenir de JSX. Utilise App.tsx.");
        
        if (f.path === 'package.json') {
            if (!f.content.includes('"type": "module"')) errors.push("package.json doit contenir 'type': 'module'.");
            if (!f.content.includes('"build": "vite build"')) errors.push("package.json doit contenir le script 'build': 'vite build'.");
        }
        
        if (f.path === 'src/App.tsx' || f.path === 'src/main.tsx') {
            if (f.content.includes('BrowserRouter')) errors.push(`${f.path} utilise BrowserRouter. C'est INTERDIT pour l'APK. Utilise HashRouter.`);
        }
    }
    
    return {
        ok: errors.length === 0,
        errors
    };
}

async function captureResponse(previousContent = "", stableCount = 0) {
    try {
        await new Promise(r => setTimeout(r, 3000));

        const messages = document.querySelectorAll('[class*="markdown"], [class*="message-content"], [class*="ds-markdown"]');
        if (messages.length === 0) {
            KirovLogger.warn('No messages found, retrying...');
            captureResponse(previousContent, stableCount);
            return;
        }

        const lastMessage = messages[messages.length - 1];
        const content = lastMessage.textContent || lastMessage.innerText;

        const isGenerating = document.querySelector('button[aria-label*="Stop" i], .ds-spinner, .generating');
        
        if (isGenerating || content !== previousContent) {
            KirovLogger.info(`IA écrit... (${content.length} chars). Attente...`);
            captureResponse(content, isGenerating ? 0 : stableCount + 1);
            return;
        }

        if (stableCount < 2) {
             captureResponse(content, stableCount + 1);
             return;
        }

        if (!content || content.length < 50) {
            KirovLogger.warn('Response too short, retrying...');
            captureResponse(previousContent, 0);
            return;
        }

        KirovLogger.info(`Captured FULL response (${content.length} chars)`);

        // EXTRACTION ET VALIDATION
        const { files, fixedMarkdown } = extractAndFixFiles(content);
        
        if (files.length > 0) {
            const validation = validateConstitution(files);
            
            // AUTO-SUTURE (Priorité 1.1)
            if (!validation.ok && currentHealingCycle < CONFIG.MAX_HEALING_CYCLES) {
                currentHealingCycle++;
                KirovLogger.warn(`[Auto-Suture] Cycle ${currentHealingCycle} — ${validation.errors.length} erreurs détectées.`);
                
                const suturePrompt = `⚠️ ERREUR CRITIQUE DE FORGE. Tu as violé la constitution. Voici les erreurs exactes dans le code précédent :\n- ${validation.errors.join('\n- ')}\n\nCorrige immédiatement ces erreurs. SILENCE ABSOLU. Ne génère aucun texte d'introduction. Renvoie UNIQUEMENT les blocs de code corrigés.`;
                
                // On met à jour le hash pour éviter une boucle de poll
                const hash = await sha256(suturePrompt);
                localStorage.setItem('kirov_last_hash', hash);
                
                await injectPrompt(suturePrompt);
                captureResponse(); // Restart capture for the healing response
                return;
            }
        }

        // Send the captured (and potentially fixed) response to the server
        const res = await fetch(`${CONFIG.SERVER_URL}/api/bridge/code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: fixedMarkdown, response: fixedMarkdown }),
        });

        const data = await res.json();
        KirovLogger.info('Response sent to server:', data);

    } catch (e) {
        KirovLogger.error('Capture error:', e.message);
    }
}

async function sha256(text) {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Start polling
KirovLogger.info('KIROV3 Vercel Edition loaded (Avec Auto-Suture)');
setInterval(pollForPrompt, CONFIG.POLLING_INTERVAL);
pollForPrompt();
