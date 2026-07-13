/**
 * ELITE FORGE — KIROV3 Vercel Edition v3
 * Fonctionne avec https://forge-kohl-kappa.vercel.app
 *
 * v3 fix: capture intelligente qui attend que DeepSeek ait TOTALEMENT fini
 * de générer avant de capturer. Détecte:
 *   - Le bouton "Stop generating" (signature de génération en cours)
 *   - La stabilisation du texte (même contenu 2 checks de suite = fini)
 *   - Empêche l'injection Phase 2 pendant que Phase 1 est encore en cours
 */

const CONFIG = {
    SERVER_URL: "https://forge-kohl-kappa.vercel.app",
    POLLING_INTERVAL: 3000,        // poll server every 3s
    CAPTURE_CHECK_INTERVAL: 3000,  // check generation status every 3s
    CAPTURE_TIMEOUT: 180000,       // 3 min max to wait for response
    MIN_RESPONSE_LENGTH: 200,      // min chars to accept a PRD/code response
    STABLE_CHECKS_REQUIRED: 2,     // need 2 consecutive stable checks (6s) = done
    DEBUG_MODE: true
};

class KirovLogger {
    static info(...args) { console.log('[KIROV3]', ...args); }
    static error(...args) { console.error('[KIROV3]', ...args); }
    static warn(...args) { console.warn('[KIROV3]', ...args); }
}

// ═══════════════════════════════════════════════════════════════════════════
//  STATE — prevents concurrent prompt injection / capture
// ═══════════════════════════════════════════════════════════════════════════

let isProcessing = false;  // true while injecting + capturing (blocks polling)

// ═══════════════════════════════════════════════════════════════════════════
//  DeepSeek DOM helpers
// ═══════════════════════════════════════════════════════════════════════════

// Find the chat textarea (DeepSeek uses #chat-input)
function findTextarea() {
    return document.querySelector('textarea#chat-input')
        || document.querySelector('textarea[placeholder*="Message" i]')
        || document.querySelector('textarea[placeholder*="message" i]')
        || document.querySelector('div[contenteditable="true"]')
        || document.querySelector('textarea');
}

// Find the send button — DeepSeek uses a div with role="button"
function findSendButton() {
    const candidates = [
        'div[role="button"][aria-disabled="false"]',
        'div[role="button"]:not([aria-disabled="true"])',
        'button[data-testid="send-button"]',
        'button[aria-label*="Send" i]',
        'div[role="button"][class*="send"]',
    ];
    for (const sel of candidates) {
        const el = document.querySelector(sel);
        if (el) return el;
    }
    return null;
}

/**
 * Detect if DeepSeek is currently generating a response.
 * Signs of generation:
 *   - "Stop generating" button visible (aria-label contains "Stop")
 *   - .ds-spinner or .generating indicators
 *   - Loading/cursor elements in the last message
 */
function isGenerating() {
    // Strategy 1: Stop button (most reliable — DeepSeek shows it during generation)
    const stopBtn = document.querySelector(
        'button[aria-label*="Stop" i], ' +
        'div[role="button"][aria-label*="Stop" i], ' +
        'div[aria-label*="Stop" i], ' +
        'button[aria-label*="stop" i], ' +
        '.ds-stop-button, ' +
        'div[class*="stop-generating"], ' +
        'div[class*="stop"]'
    );
    if (stopBtn) return true;

    // Strategy 2: spinner / loading indicators
    const spinner = document.querySelector('.ds-spinner, .generating, [class*="loading-dots"]');
    if (spinner) return true;

    // Strategy 3: cursor/typing indicator in the last assistant message
    const lastMsg = getLastAssistantElement();
    if (lastMsg) {
        const typing = lastMsg.querySelector(
            '[class*="cursor"], [class*="typing"], [class*="blink"], ' +
            '.loading-dots, [class*="loading"]'
        );
        if (typing) return true;
    }

    return false;
}

/**
 * Find the LAST assistant message element using multiple DeepSeek strategies.
 * Returns the element containing the AI's markdown response.
 */
function getLastAssistantElement() {
    // Strategy 1: DeepSeek renders markdown in .ds-markdown inside assistant messages
    let els = document.querySelectorAll('div.ds-markdown');
    if (els.length > 0) return els[els.length - 1];

    // Strategy 2: markdown-related classes (exclude user input area)
    els = document.querySelectorAll(
        '[class*="ds-markdown"], ' +
        'div[class*="markdown-body"], ' +
        'div[class*="message-content"]:not([class*="user"]):not([class*="input"])'
    );
    if (els.length > 0) return els[els.length - 1];

    // Strategy 3: assistant role containers
    const assistants = document.querySelectorAll(
        '[data-role="assistant"], ' +
        'div[class*="assistant-message"], ' +
        'div[class*="bot-message"], ' +
        'div[class*="ai-message"], ' +
        'div[class*="ds-message--assistant"]'
    );
    if (assistants.length > 0) {
        const last = assistants[assistants.length - 1];
        const inner = last.querySelector('.ds-markdown, [class*="markdown"], [class*="content"]');
        return inner || last;
    }

    return null;
}

// Extract text content from an element
function extractContent(el) {
    if (!el) return '';
    try {
        return (el.innerText || el.textContent || '').trim();
    } catch {
        return (el.textContent || '').trim();
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Polling — fetch next prompt from bridge server
// ═══════════════════════════════════════════════════════════════════════════

async function pollForPrompt() {
    // CRITICAL: don't poll if we're still injecting/capturing a previous prompt
    if (isProcessing) return;

    try {
        const res = await fetch(`${CONFIG.SERVER_URL}/api/bridge/prompt`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'idle' || !data.prompt) return;

        // Hash check — prevent re-injection of the same prompt
        const hash = await sha256(data.prompt);
        const lastHash = localStorage.getItem('kirov_last_hash');
        if (hash === lastHash) return; // Already processed

        // New prompt! Lock processing and handle it
        isProcessing = true;
        localStorage.setItem('kirov_last_hash', hash);

        KirovLogger.info(`Phase ${data.phase_num}: New prompt (${data.prompt.length} chars) — injecting`);

        const injected = await injectPrompt(data.prompt);
        if (!injected) {
            KirovLogger.error('Injection failed — releasing lock');
            isProcessing = false;
            return;
        }

        KirovLogger.info('Prompt injected. Waiting for DeepSeek to finish generating...');

        // Wait for generation to complete (smart capture)
        const captured = await waitForFullResponse();

        if (captured && captured.length >= CONFIG.MIN_RESPONSE_LENGTH) {
            KirovLogger.info(`✅ Full response captured (${captured.length} chars) — sending to server`);
            const result = await sendCapture(captured);
            if (result && result.phase === 5) {
                KirovLogger.info('🎉 MISSION COMPLETE — code captured on Vercel!');
                KirovLogger.info(`📦 Download: ${CONFIG.SERVER_URL}/api/bridge/download`);
            } else if (result && result.phase === 2) {
                KirovLogger.info('✅ PRD captured — Phase 2 (code gen) will start on next poll');
            }
        } else {
            KirovLogger.error(`Capture failed or too short (${captured ? captured.length : 0} chars)`);
        }

        // Release the lock — next poll can pick up Phase 2 prompt (if any)
        isProcessing = false;
    } catch (e) {
        KirovLogger.error('Poll error:', e.message);
        isProcessing = false;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Inject prompt into DeepSeek chat
// ═══════════════════════════════════════════════════════════════════════════

async function injectPrompt(prompt) {
    const textarea = findTextarea();
    if (!textarea) {
        KirovLogger.error('Textarea not found — are you on chat.deepseek.com?');
        return false;
    }

    // Focus + clear any existing content
    textarea.focus();
    await sleep(100);

    // Set value using React-compatible setter
    if (textarea.tagName === 'TEXTAREA') {
        const setter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype, 'value'
        ).set;
        setter.call(textarea, prompt);
    } else {
        // contenteditable div
        textarea.textContent = prompt;
    }

    // Fire input event so React detects the change
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('change', { bubbles: true }));

    await sleep(500);

    // Find and click send button
    const sendBtn = findSendButton();
    if (sendBtn) {
        sendBtn.click();
        KirovLogger.info('Send button clicked');
        return true;
    }

    // Fallback: simulate Enter key
    KirovLogger.warn('Send button not found, trying Enter key');
    textarea.dispatchEvent(new KeyboardEvent('keydown', {
        key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
    }));
    textarea.dispatchEvent(new KeyboardEvent('keypress', {
        key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
    }));
    textarea.dispatchEvent(new KeyboardEvent('keyup', {
        key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true
    }));
    return true;
}

// ═══════════════════════════════════════════════════════════════════════════
//  CRITICAL v3 FIX: Wait for FULL response before capturing
//  - Waits for generation to START (stop button appears)
//  - Then waits for generation to FINISH (stop button disappears + content stable)
//  - Requires STABLE_CHECKS_REQUIRED consecutive identical content checks
// ═══════════════════════════════════════════════════════════════════════════

async function waitForFullResponse() {
    // Step 1: wait for generation to START (max 15s)
    KirovLogger.info('Waiting for generation to start...');
    let started = false;
    for (let i = 0; i < 30; i++) { // 30 * 500ms = 15s
        await sleep(500);
        if (isGenerating()) {
            started = true;
            break;
        }
    }
    if (started) {
        KirovLogger.info('Generation started (Stop button detected)');
    } else {
        KirovLogger.warn('Generation did not start — maybe send failed. Trying capture anyway');
    }

    // Step 2: wait for generation to FINISH
    // A response is "complete" when:
    //   - NOT generating (no Stop button)
    //   - Content is STABLE (same text 2 consecutive checks = 6s)
    const startTime = Date.now();
    let previousContent = '';
    let stableCount = 0;
    let checkNum = 0;

    while (Date.now() - startTime < CONFIG.CAPTURE_TIMEOUT) {
        await sleep(CONFIG.CAPTURE_CHECK_INTERVAL);
        checkNum++;

        const generating = isGenerating();
        const lastEl = getLastAssistantElement();
        const currentContent = lastEl ? extractContent(lastEl) : '';

        // Track stability — content must be IDENTICAL across checks
        const contentChanged = currentContent !== previousContent;
        if (!contentChanged && currentContent.length > 0) {
            stableCount++;
        } else {
            stableCount = 0;
        }
        previousContent = currentContent;

        KirovLogger.info(
            `Check #${checkNum}: generating=${generating} len=${currentContent.length} ` +
            `changed=${contentChanged} stable=${stableCount}/${CONFIG.STABLE_CHECKS_REQUIRED}`
        );

        // Response is COMPLETE when:
        //   - Not generating
        //   - Content stable for STABLE_CHECKS_REQUIRED checks (6s)
        //   - Long enough
        if (!generating && stableCount >= CONFIG.STABLE_CHECKS_REQUIRED && currentContent.length >= CONFIG.MIN_RESPONSE_LENGTH) {
            KirovLogger.info(`✅ Generation complete — stable for ${stableCount} checks, ${currentContent.length} chars`);
            return currentContent;
        }

        // Safety: if not generating and content is substantial and stable 3x, capture
        if (!generating && stableCount >= 3 && currentContent.length >= 100) {
            KirovLogger.info(`✅ Generation complete (stable 3x) — ${currentContent.length} chars`);
            return currentContent;
        }
    }

    // Timeout — return whatever we have if it's long enough
    if (previousContent.length >= CONFIG.MIN_RESPONSE_LENGTH) {
        KirovLogger.warn(`⏱️ Timeout — capturing partial response (${previousContent.length} chars)`);
        return previousContent;
    }

    return null;
}

// ═══════════════════════════════════════════════════════════════════════════
//  Send captured response to bridge server
// ═══════════════════════════════════════════════════════════════════════════

async function sendCapture(content) {
    try {
        const res = await fetch(`${CONFIG.SERVER_URL}/api/bridge/code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, response: content }),
        });
        const data = await res.json();
        KirovLogger.info('Server response:', JSON.stringify(data));
        return data;
    } catch (e) {
        KirovLogger.error('Send capture error:', e.message);
        return null;
    }
}

// ═══════════════════════════════════════════════════════════════════════════
//  Utils
// ═══════════════════════════════════════════════════════════════════════════

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function sha256(text) {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

// ═══════════════════════════════════════════════════════════════════════════
//  Start
// ═══════════════════════════════════════════════════════════════════════════

KirovLogger.info('KIROV3 Vercel Edition v3 loaded — smart capture');
KirovLogger.info(`Server: ${CONFIG.SERVER_URL}`);
KirovLogger.info(`Config: poll=${CONFIG.POLLING_INTERVAL}ms, check=${CONFIG.CAPTURE_CHECK_INTERVAL}ms, ` +
    `minLen=${CONFIG.MIN_RESPONSE_LENGTH}, stableChecks=${CONFIG.STABLE_CHECKS_REQUIRED}`);

setInterval(pollForPrompt, CONFIG.POLLING_INTERVAL);
pollForPrompt();
