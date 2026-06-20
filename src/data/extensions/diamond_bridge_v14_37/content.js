// 💎 ELITE FORGE — DIAMOND BRIDGE v14.37 (FORGE EDITION)
(function() {
    console.log("🚀 Diamond Bridge v14.37 : Synchronisation Forge OK");

    function clearCookieBanners() {
        const sel = ["button[id*='cookie']", "button[class*='cookie']", "#reject-all", ".accept-all", ".close-modal"];
        sel.forEach(s => {
            try {
                const b = document.querySelector(s);
                if (b && b.innerText && b.innerText.toLowerCase().includes('accept')) b.click();
            } catch(e) {}
        });
    }

    async function injectMission() {
        try {
            if (typeof AndroidBridge === 'undefined') return false;
            const prompt = AndroidBridge.getMissionPrompt();
            if (!prompt || prompt.length < 10) return false;

            const selectors = ["#chat-input", "textarea", "[contenteditable='true']"];
            for (let s of selectors) {
                const input = document.querySelector(s);
                if (input) {
                    const current = (input.tagName === "DIV") ? input.innerText : input.value;
                    if (current && current.length > 50) return true;

                    input.focus();
                    try {
                        document.execCommand('insertText', false, prompt);
                    } catch(e) {
                        if (input.tagName === "DIV") input.innerText = prompt;
                        else input.value = prompt;
                    }

                    input.dispatchEvent(new Event('input', { bubbles: true }));
                    
                    setTimeout(() => {
                        const sendBtn = document.querySelector("#send-message-button, button[aria-label*='Send'], .ds-send-button, [data-testid='send-button']");
                        if (sendBtn) {
                            sendBtn.disabled = false;
                            sendBtn.removeAttribute('disabled');
                            sendBtn.click();
                            AndroidBridge.showToast("🚀 Mission Lancée (Sync v14.37) !");
                        }
                    }, 1500);
                    return true;
                }
            }
        } catch(e) { return false; }
    }

    let lastContentLength = 0;
    let lastSentLength = 0;
    let stableTicks = 0;

    function getCleanText(element) {
        if (!element) return "";
        // Cloner pour ne pas perturber l'affichage réel
        const clone = element.cloneNode(true);
        
        // Supprimer les éléments parasites connus
        const garbage = clone.querySelectorAll('button, .copy-button, .ds-icon, .ds-button, .toolbar, [class*="copy"], [class*="download"]');
        garbage.forEach(el => el.remove());
        
        return clone.innerText || clone.textContent || "";
    }

    async function extractAndForge() {
        const msgSelectors = '.ds-markdown, .markdown-body, .prose, .model-response-text, message-content';
        const msgs = document.querySelectorAll(msgSelectors);
        if (msgs.length === 0) return;

        const lastMsg = msgs[msgs.length - 1];
        const content = getCleanText(lastMsg);
        
        if (content.length > 0 && content.length === lastContentLength) {
            stableTicks++;
        } else {
            stableTicks = 0;
            lastContentLength = content.length;
        }

        if (stableTicks === 2) {
            if (content.length <= lastSentLength) return;

            const cleanContent = content.trim();
            const isUnfinished = cleanContent.endsWith("(") || cleanContent.endsWith("{") || 
                               cleanContent.endsWith(",") || cleanContent.endsWith("=>") ||
                               (cleanContent.split("```").length % 2 === 0);

            if (isUnfinished) {
                AndroidBridge.showToast("⚠️ IA Coupée. Relance automatique...");
                const input = document.querySelector("#chat-input, textarea, [contenteditable='true']");
                if (input) {
                    input.focus();
                    document.execCommand('insertText', false, "continue ton code");
                    setTimeout(() => {
                        const btn = document.querySelector("#send-message-button, button[aria-label*='Send'], .ds-send-button");
                        if (btn) btn.click();
                    }, 1000);
                }
                stableTicks = 0;
            } else if (content.includes("FILE:") || content.includes("```")) {
                AndroidBridge.showToast("💎 Forge Unique v14.37 active...");
                lastSentLength = content.length;
                if (typeof AndroidBridge !== 'undefined' && AndroidBridge.sendCapture) {
                    AndroidBridge.sendCapture(content);
                }
                stableTicks = 0;
            }
        }
    }

    setInterval(injectMission, 5000);
    setInterval(extractAndForge, 8000);
    setInterval(clearCookieBanners, 10000);
})();
