// ═══════════════════════════════════════════════════════════════════════════
// KIROV3 G50 — Content Script for DeepSeek Chat
// Updated: auto-detects server URL (localhost or preview proxy)
// ═══════════════════════════════════════════════════════════════════════════

(function() {
    'use strict';

    const CONFIG = {
        // Try multiple server URLs — first one that responds is used
        SERVER_URLS: [
            'http://localhost:5005',
            'http://localhost:3000',
            'https://preview-chat-f2f839ba-f732-4613-9010-8f458d16225c.space-z.ai'
        ],
        POLLING_BASE_INTERVAL: 3000,
        MAX_PAYLOAD_SIZE: 500000,
        get SERVER_URL() {
            return this._activeServer || this.SERVER_URLS[0];
        },
        _activeServer: null,
    };

    // Auto-detect which server URL works
    async function detectServer() {
        for (const url of CONFIG.SERVER_URLS) {
            try {
                const res = await fetch(`${url}/api/bridge/health`, { signal: AbortSignal.timeout(3000) });
                if (res.ok) {
                    CONFIG._activeServer = url;
                    console.log(`[KIROV3] Server detecte: ${url}`);
                    return url;
                }
            } catch (e) {
                // Try next
            }
        }
        console.log('[KIROV3] Aucun server detecte');
        return null;
    }

    // ── Utils ──────────────────────────────────────────────────────────────
    class KirovLogger {
        static info(msg) { console.log(`%c[KIROV3] [INFO] ${msg}`, 'color: #00D1FF'); }
        static warn(msg) { console.log(`%c[KIROV3] [WARN] ${msg}`, 'color: #FFA500'); }
        static error(msg) { console.log(`%c[KIROV3] [ERROR] ${msg}`, 'color: #FF4444'); }
        static debug(msg) { console.log(`%c[KIROV3] [DEBUG] ${msg}`, 'color: #666'); }
    }

    const Utils = {
        async sha256(text) {
            const buf = new TextEncoder().encode(text);
            const hash = await crypto.subtle.digest('SHA-256', buf);
            return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
        }
    };

    // ── State ──────────────────────────────────────────────────────────────
    const state = {
        _data: {},
        get(key) { return this._data[key]; },
        set(key, val) { this._data[key] = val; },
    };
    state.set('isOffline', false);
    state.set('queue', []);
    state.set('isActivated', false);
    state.set('currentPhase', 1);
    state.set('projectId', null);
    state.set('lastOutputHash', null);

    // ── Platform Detection ────────────────────────────────────────────────
    const platform = {
        name: 'deepseek',
        config: {
            textarea: ['textarea#chat-input', '.ds-textarea', 'textarea.ds-input__textarea', 'textarea', '[contenteditable="true"]'],
            sendBtn: ['.ds-input-send-button', 'div[class*="send-button"]', 'button[aria-label*="send" i]', 'button[aria-label*="envo" i]', 'button[aria-label*="envoyer" i]', '[data-testid="send-button"]'],
            messageBlock: ['.ds-markdown', '.markdown', '.message-content', '[class*="markdown"]', '[class*="message-body"]'],
            stopBtn: ['button[aria-label*="stop" i]', 'button[aria-label*="arrêt" i]', '.ds-stop-button', 'div[class*="stop-button"]'],
        },
        getElements(selector) {
            if (Array.isArray(selector)) {
                for (const s of selector) {
                    const els = document.querySelectorAll(s);
                    if (els.length > 0) return Array.from(els);
                }
                return [];
            }
            return Array.from(document.querySelectorAll(selector));
        }
    };

    // ── Bridge Client ──────────────────────────────────────────────────────
    class BridgeClient {
        constructor() {
            this.currentInterval = CONFIG.POLLING_BASE_INTERVAL;
            this.pollingIntervalId = null;
            this.currentAbortController = null;
        }

        startPolling() {
            if (this.pollingIntervalId) clearTimeout(this.pollingIntervalId);
            this._pollCycle();
        }

        async _pollCycle() {
            if (!state.get('isOffline')) await this.poll();
            this.currentInterval = state.get('isOffline') ? 10000 : CONFIG.POLLING_BASE_INTERVAL;
            this.pollingIntervalId = setTimeout(() => this._pollCycle(), this.currentInterval);
        }

        async poll() {
            if (this.currentAbortController) this.currentAbortController.abort();
            this.currentAbortController = new AbortController();

            try {
                // Detect server if not yet done
                if (!CONFIG._activeServer) {
                    await detectServer();
                }

                const url = `${CONFIG.SERVER_URL}/api/bridge/prompt`;
                KirovLogger.info(`[POLL] Fetching URL: ${url}`);
                const res = await fetch(url, { signal: this.currentAbortController.signal });

                KirovLogger.info(`[POLL] Status: ${res.status}, Content-Type: ${res.headers.get("content-type")}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);

                const data = await res.json();
                KirovLogger.info(`[POLL] Data: status=${data.status}, phase=${data.phase}, hasPrompt=${!!data.prompt}`);

                state.set('isOffline', false);
                state.set('currentPhase', data.phase || data.phase_num || 1);

                if (data.projectId) state.set('projectId', data.projectId);

                if (!state.get('isActivated')) {
                    state.set('isActivated', true);
                    KirovLogger.info(`Elite Forge : Phase ${data.phase} Active`);
                }

                if (data.status === "prompt" && data.prompt) {
                    // Reset deduplication hash if projectId changed
                    const savedProjectId = localStorage.getItem('kirov_last_project_id');
                    if (data.projectId && data.projectId !== savedProjectId) {
                        localStorage.removeItem('kirov_last_prompt_hash');
                        localStorage.setItem('kirov_last_project_id', data.projectId);
                        KirovLogger.info(`New project detected: ${data.projectId}`);
                    }

                    const promptHash = await Utils.sha256(data.prompt);
                    const savedHash = localStorage.getItem('kirov_last_prompt_hash');
                    if (promptHash !== savedHash) {
                        localStorage.setItem('kirov_last_prompt_hash', promptHash);
                        KirovLogger.info(`New prompt detected (Phase ${data.phase})`);
                        this.inject(data.prompt, data.phase, data.projectId);
                    } else {
                        KirovLogger.debug(`Prompt deja injecte (hash identique)`);
                    }
                }
            } catch (e) {
                if (e.name !== 'AbortError') {
                    state.set('isOffline', true);
                    KirovLogger.error(`Poll failed: ${e.message}`);
                    // Re-detect server on next cycle
                    CONFIG._activeServer = null;
                }
            }
        }

        async inject(rawPrompt, phase, projectId) {
            KirovLogger.info(`Injecting prompt (Phase ${phase}, ${rawPrompt.length} chars)...`);

            // Find textarea
            let input = null;
            for (const sel of platform.config.textarea) {
                input = document.querySelector(sel);
                if (input) break;
            }
            if (!input) {
                KirovLogger.warn('Input non trouve, retry dans 2s');
                setTimeout(() => this.inject(rawPrompt, phase, projectId), 2000);
                return;
            }

            input.focus();
            if (input.tagName === 'TEXTAREA' || input.tagName === 'INPUT') {
                const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
                if (nativeSetter) nativeSetter.call(input, rawPrompt);
                else input.value = rawPrompt;
            } else if (input.contentEditable === 'true') {
                input.innerText = rawPrompt;
                input.textContent = rawPrompt;
            }

            ['input', 'change', 'keyup'].forEach(name => {
                input.dispatchEvent(new Event(name, { bubbles: true }));
            });

            KirovLogger.info('Prompt injecte dans le textarea');

            // Click send button
            setTimeout(() => {
                let sendBtn = null;
                for (const sel of platform.config.sendBtn) {
                    sendBtn = document.querySelector(sel);
                    if (sendBtn) {
                        if (sendBtn.tagName !== 'BUTTON') {
                            const innerBtn = sendBtn.querySelector('button');
                            if (innerBtn) sendBtn = innerBtn;
                        }
                        if (sendBtn && !sendBtn.disabled && sendBtn.getAttribute('aria-disabled') !== 'true') break;
                        sendBtn = null;
                    }
                }

                if (sendBtn) {
                    KirovLogger.info('Clic sur le bouton Envoyer');
                    sendBtn.click();
                } else {
                    KirovLogger.info('Bouton Envoyer non trouve, simulation Entree');
                    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
                    input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
                    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true, cancelable: true }));
                }

                // Start monitoring after 10s (reduced from 45s)
                state.set('injectionTime', Date.now());
                setTimeout(() => outputScanner.start(), 10000);
            }, 500);
        }

        async sendCapture(payload) {
            if (!CONFIG._activeServer) await detectServer();
            if (!CONFIG._activeServer) return;

            try {
                const forgePayload = {
                    projectId: state.get('projectId'),
                    content: payload.content,
                    response: payload.content,
                };
                const res = await fetch(`${CONFIG.SERVER_URL}/api/bridge/code`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(forgePayload),
                });
                if (res.ok) {
                    KirovLogger.info(`Capture envoyee (${payload.content.length} chars)`);
                }
            } catch (e) {
                KirovLogger.error(`Capture failed: ${e.message}`);
            }
        }
    }
    const bridge = new BridgeClient();

    // ── Output Scanner ─────────────────────────────────────────────────────
    class OutputScanner {
        start() {
            KirovLogger.info('Starting Output Scanner...');
            this.scan();
        }

        scan() {
            const messages = platform.getElements(platform.config.messageBlock);
            if (messages.length === 0) { setTimeout(() => this.scan(), 3000); return; }

            const lastMsg = messages[messages.length - 1];

            // Check if still generating
            let isGenerating = false;
            for (const sel of platform.config.stopBtn) {
                const els = document.querySelectorAll(sel);
                if (Array.from(els).some(el => el.offsetParent !== null)) { isGenerating = true; break; }
            }

            if (isGenerating) { setTimeout(() => this.scan(), 3000); return; }

            // Capture content
            const clone = lastMsg.cloneNode(true);
            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            clone.style.visibility = 'hidden';
            document.body.appendChild(clone);
            let content = clone.innerText || "";
            document.body.removeChild(clone);

            content = content.replace(/^(text|copier|télécharger|copy|download|exécuter)$/gmi, '').trim();
            if (content.length < 50) { setTimeout(() => this.scan(), 3000); return; }

            const hasCodeBlocks = lastMsg.querySelectorAll('pre, code').length > 0;
            const hasFichier = /Fichier\s*:|FILE\s*:|File\s*:/i.test(content);
            const hasPRD = content.includes("PRD");
            const hasJson = content.trim().startsWith('{') || content.includes('"files"');

            if (hasCodeBlocks || hasFichier || hasPRD || hasJson) {
                KirovLogger.info(`Code block detected (len=${content.length})`);
                bridge.sendCapture({ content, validation: { isValid: true } });
            } else {
                setTimeout(() => this.scan(), 3000);
            }
        }
    }
    const outputScanner = new OutputScanner();

    // ── Init ───────────────────────────────────────────────────────────────
    async function init() {
        KirovLogger.info('Platform detected: deepseek');
        KirovLogger.info('Starting Elite Forge Global vG50-Senior');

        await detectServer();
        bridge.startPolling();
        outputScanner.start();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, 1000);
    }
})();
