const SERVER_URL = "http://127.0.0.1:5005";
let lastPrompt   = null;
let state = { lastCapturedContent: "", lastActivityTime: Date.now() };
let isActivated = false;

async function poll() {
    try {
        const res = await fetch(`${SERVER_URL}/v1/bridge/poll`);
        if (!res.ok) return;
        const data = await res.json();
        
        const serverPhase = data.phase || 1;
        
        if (serverPhase !== 1) {
            if (isActivated) {
                console.log("💤 Phase 1 : Mise en veille (Phase " + serverPhase + " détectée)");
                isActivated = false;
            }
            return;
        }

        if (!isActivated) {
            console.log("⚡ Phase 1 : ACTIVATION (Souveraineté P1)");
            isActivated = true;
        }
        
        if (data.status === "prompt" && data.prompt && data.prompt !== lastPrompt) {
            lastPrompt = data.prompt;
            console.log("🎯 Nouveau prompt (P1) détecté...");
            injectPrompt(data.prompt);
        }
        
        monitorGeneration();
    } catch (e) {
        // console.error("Poll Error:", e);
    }
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
            const sendSelectors = [
                '.ds-input-send-button',
                'div[class*="send-button"]',
                'button[aria-label*="send" i]',
                'button[aria-label*="envo" i]',
                '[data-testid="send-button"]'
            ];
            let sendBtn = null;
            for (const s of sendSelectors) {
                const el = document.querySelector(s);
                if (el && el.getAttribute('aria-disabled') !== 'true' && !el.disabled) {
                    sendBtn = el;
                    if (sendBtn.tagName !== 'BUTTON') {
                        const innerBtn = sendBtn.querySelector('button');
                        if (innerBtn && !innerBtn.disabled && innerBtn.getAttribute('aria-disabled') !== 'true') sendBtn = innerBtn;
                    }
                    break;
                }
            }

            if (!sendBtn) {
                let parent = input.parentElement;
                while (parent && parent.tagName !== 'BODY') {
                    const btns = parent.querySelectorAll('div[role="button"], button');
                    for (let b of btns) {
                        if (b !== input && !b.disabled && b.getAttribute('aria-disabled') !== 'true' && b.querySelector('svg')) {
                            sendBtn = b;
                        }
                    }
                    if (sendBtn) break;
                    parent = parent.parentElement;
                }
            }

            if (sendBtn && !sendBtn.disabled && sendBtn.getAttribute('aria-disabled') !== 'true') {
                console.log("🚀 [P1] Bouton Send trouvé et cliqué !", sendBtn);
                sendBtn.click();
            } else {
                console.warn("⚠️ [P1] Bouton désactivé ou introuvable, fallback Enter...");
                const ke = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, composed: true });
                input.dispatchEvent(ke);
            }
        }, 2000);

    } catch (err) {
        console.error("❌ Erreur injection P1:", err);
    }
}

function monitorGeneration() {
    try {
        const msgSelectors = '.ds-markdown, .prose, .markdown-body, .ds-message-content, .message-content';
        const messages = document.querySelectorAll(msgSelectors);
        if (messages.length === 0) return;

        const lastMsg = messages[messages.length - 1];
        const content = lastMsg.innerText || lastMsg.textContent || "";
        
        // Détection de fin de génération
        const isGenerating = !!document.querySelector('.ds-spinner, .generating, button[aria-label*="Stop" i]');

        if (!isGenerating && content.length > 100 && content !== state.lastCapturedContent) {
            // Nouveau format DeepSeek : Détection via mots clés ou structure numérotée
            if (content.includes("FILE:") || content.includes("```") || content.includes("Copier") || content.includes("Télécharger") || /^\d+\.\s+[\w\.\-\/]+/m.test(content)) {
                state.lastCapturedContent = content;
                sendToBridge(content, !isGenerating);
                console.log("📥 Capture P1 envoyée (" + content.length + " chars, Final: " + !isGenerating + ")");
            }
        }
    } catch (e) {}
}

async function sendToBridge(content, isFinal = false) {
    try {
        await fetch(`${SERVER_URL}/v1/bridge/callback`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: content, is_final: isFinal })
        });
    } catch (e) {}
}

setInterval(poll, 2500);
