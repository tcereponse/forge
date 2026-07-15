const SERVER_URL = "http://127.0.0.1:5005";
let lastPrompt   = null;
let isActivated = false;
let state = { lastCapturedContent: "", lastActivityTime: Date.now() };

async function poll() {
    try {
        const res = await fetch(`${SERVER_URL}/v1/bridge/poll`);
        if (!res.ok) return;
        const data = await res.json();
        
        const serverPhase = data.phase || 1;
        
        if (serverPhase !== 2) {
            if (isActivated) {
                console.log("💤 Phase 2 : Mise en veille (Phase " + serverPhase + " détectée)");
                isActivated = false;
            }
            return;
        }

        if (!isActivated) {
            console.log("🏗️ Phase 2 : ACTIVATION (Forge de Code)");
            isActivated = true;
        }
        
        if (data.status === "prompt" && data.prompt && data.prompt !== lastPrompt) {
            lastPrompt = data.prompt;
            console.log("🏗️ Injection Phase 2 (Code)...");
            injectPrompt(data.prompt);
        }

        monitorGeneration();
    } catch (e) {}
}

function injectPrompt(text) {
    if (!text) return;
    const selectors = ['textarea#chat-input', '.ds-textarea', 'textarea', '[role="textbox"]', '[contenteditable="true"]'];
    let input = null;
    for (const s of selectors) {
        input = document.querySelector(s);
        if (input) break;
    }
    if (!input) return setTimeout(() => injectPrompt(text), 1000);
    try {
        input.focus();
        
        // React Native Setter Bypass
        if (input.tagName === 'TEXTAREA') {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value").set;
            if (nativeSetter) nativeSetter.call(input, text);
            else input.value = text;
        } else {
            input.innerText = text;
            input.textContent = text;
        }
        
        const events = ['input', 'change', 'keyup'];
        events.forEach(name => {
            input.dispatchEvent(new Event(name, { bubbles: true }));
        });

        setTimeout(() => {
            // Find Send Button specifically for DeepSeek
            const sendSelectors = [
                '.ds-input-send-button',
                'div[class*="send-button"]',
                'button[aria-label*="send" i]',
                'button[aria-label*="envo" i]',
                '[data-testid="send-button"]'
            ];
            let sendBtn = null;
            for (const s of sendSelectors) {
                sendBtn = document.querySelector(s);
                if (sendBtn && sendBtn.tagName !== 'BUTTON') {
                    const innerBtn = sendBtn.querySelector('button');
                    if (innerBtn) sendBtn = innerBtn;
                }
                if (sendBtn && !sendBtn.disabled) break;
            }

            if (!sendBtn) {
                let parent = input.parentElement;
                while (parent && parent.tagName !== 'BODY') {
                    const btns = parent.querySelectorAll('div[role="button"], button');
                    for (let b of btns) {
                        if (b !== input && !b.disabled && b.querySelector('svg')) {
                            sendBtn = b;
                        }
                    }
                    if (sendBtn) break;
                    parent = parent.parentElement;
                }
            }

            if (sendBtn && !sendBtn.disabled) {
                console.log("🚀 [P2] Bouton Send trouvé et cliqué !", sendBtn);
                sendBtn.click();
            } else {
                console.warn("⚠️ [P2] Bouton introuvable, fallback Enter agressif...");
                input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, composed: true }));
                input.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, composed: true }));
                input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, composed: true }));
            }
        }, 1200);
    } catch (err) { console.error("❌ Erreur injection P2:", err); }
}

function monitorGeneration() {
    try {
        const msgSelectors = '.ds-markdown, .prose, .markdown-body, .ds-message-content, .message-content';
        const messages = document.querySelectorAll(msgSelectors);
        if (messages.length === 0) return;

        const lastMsg = messages[messages.length - 1];
        const content = lastMsg.innerText || lastMsg.textContent || "";
        const isGenerating = !!document.querySelector('.ds-spinner, .generating, button[aria-label*="Stop" i]');

        if (!isGenerating && content.length > 200 && content !== state.lastCapturedContent) {
            // En Phase 2, on cherche spécifiquement du code (nouveau format DeepSeek inclus)
            if (content.includes("Fichier :") || content.includes("FILE:") || content.includes("```") || content.includes("Copier") || content.includes("Télécharger") || /^\d+\.\s+[\w\.\-\/]+/m.test(content)) {
                state.lastCapturedContent = content;
                sendToBridge(content);
                console.log("📥 Capture P2 envoyée (" + content.length + " chars)");
            }
        }
    } catch (e) {}
}

async function sendToBridge(content) {
    try {
        await fetch(`${SERVER_URL}/v1/bridge/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content })
        });
    } catch (e) {}
}

setInterval(poll, 2500);
