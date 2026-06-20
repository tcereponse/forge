// 💎 ELITE FORGE - UNIVERSAL DIAMOND BRIDGE v12.0
// Compatible: Gemini, DeepSeek, ChatGPT, Perplexity, Claude
// Port: 5005

(function() {
    'use strict';
    if (window.pcForgeActive) return;
    window.pcForgeActive = true;

    const CONFIG = {
        BRIDGE_URL: "http://127.0.0.1:5005",
        POLL_INTERVAL: 2000,
        SELECTORS: {
            input: 'textarea, [contenteditable="true"], .ds-textarea, [role="textbox"], #chat-input, rich-textarea, textarea[placeholder*="Ask"], textarea[placeholder*="Search"]',
            sendButton: 'button[aria-label*="Send"], button[aria-label*="Envoyer"], .ds-input-send-button, .ds-input__send-btn, [class*="send-button"], [data-testid="send-button"], [aria-label*="Submit"]',
            chatMessages: '.ds-markdown, .markdown-body, .prose, .model-response-text, [class*="message-content"], [data-testid*="message"], message-content, [data-testid="answer"]',
            stopButton: 'button[aria-label*="Stop"], button[aria-label*="Arrêter"], .ds-icon--stop, .stop-button, [class*="stop"], .generating'
        }
    };

    let state = { lastCapturedContent: "", lastActivityTime: Date.now(), lastContentLength: 0 };

    function injectUI() {
        if (document.getElementById('pc-diamond-ui')) return;
        const div = document.createElement('div');
        div.id = 'pc-diamond-ui';
        div.style = "position:fixed; top:15px; right:15px; z-index:2147483647; background:rgba(10,15,30,0.95); backdrop-filter:blur(10px); border:2px solid #38bdf8; color:white; padding:12px; border-radius:12px; font-family:monospace; font-size:12px; box-shadow:0 10px 40px rgba(0,0,0,0.8); min-width:150px; text-align:center; pointer-events:auto;";
        div.innerHTML = `
            <div style="font-weight:900; color:#38bdf8; margin-bottom:5px; letter-spacing:1px; font-size:13px;">🛰️ ELITE v11.3</div>
            <div style="color:#FFD700; font-size:9px; margin-bottom:8px; font-weight:bold;">DIAMOND EDITION</div>
            <div id="pc-status" style="color:#00FF88; font-weight:bold; margin-bottom:5px; font-size:11px;">IDLE</div>
            <div style="font-size:8px; opacity:0.5;">MASTER BRIDGE: 5005</div>
        `;
        (document.body || document.documentElement).appendChild(div);
        console.log("💎 [PC DEBUG] Interface Injectée.");
    }

    async function poll() {
        try {
            const res = await fetch(`${CONFIG.BRIDGE_URL}/v1/bridge/poll`);
            if (!res.ok) throw new Error();
            const data = await res.json();
            
            const statusEl = document.getElementById('pc-status');
            if (statusEl) statusEl.innerText = (data.status || "IDLE").toUpperCase();

            if (data.status === "prompt" && data.prompt) {
                console.log("💎 [PC DEBUG] Prompt détecté, injection...");
                if (data.project_id) localStorage.setItem('forge_last_project_id', data.project_id);
                injectPrompt(data.prompt);
            }
            monitorGeneration();
        } catch (e) {
            const statusEl = document.getElementById('pc-status');
            if (statusEl) { statusEl.innerText = "OFFLINE"; statusEl.style.color = "red"; }
        }
    }

    function injectPrompt(text) {
        const input = document.querySelector(CONFIG.SELECTORS.input);
        if (input) {
            input.focus();
            try { document.execCommand('insertText', false, text); } catch(e) { input.value = text; }
            input.dispatchEvent(new Event('input', { bubbles: true }));
            
            setTimeout(() => {
                const btn = document.querySelector(CONFIG.SELECTORS.sendButton);
                if (btn && !btn.disabled) btn.click();
            }, 1200);
        }
    }

    function monitorGeneration() {
        const messages = document.querySelectorAll(CONFIG.SELECTORS.chatMessages);
        if (messages.length === 0) return;

        const lastMsg = messages[messages.length - 1];
        const content = lastMsg.innerText || lastMsg.textContent || "";

        if (content.length > state.lastContentLength) {
            state.lastContentLength = content.length;
            state.lastActivityTime = Date.now();
        }

        const isGenerating = !!document.querySelector(CONFIG.SELECTORS.stopButton);
        
        if (content !== state.lastCapturedContent) {
            if (content.includes("FILE:") || (content.length > state.lastCapturedContent.length + 100) || (!isGenerating && content.length > 200)) {
                if (!isGenerating || (Date.now() - state.lastActivityTime) > 3000) {
                    state.lastCapturedContent = content;
                    sendToBridge(content);
                }
            }
        }
    }

    async function sendToBridge(content) {
        try {
            await fetch(`${CONFIG.BRIDGE_URL}/v1/bridge/callback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    content: content,
                    project_id: localStorage.getItem('forge_last_project_id')
                })
            });
            const statusEl = document.getElementById('pc-status');
            if (statusEl) statusEl.innerText = "FORGING...";
        } catch (e) {}
    }

    setInterval(poll, CONFIG.POLL_INTERVAL);
    setInterval(injectUI, 2000);
})();
