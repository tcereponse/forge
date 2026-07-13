/**
 * ELITE FORGE — KIROV3 Vercel Edition v2
 * Fonctionne avec https://forge-kohl-kappa.vercel.app
 * Improved DeepSeek capture: waits for generation to finish, uses specific selectors
 */

const CONFIG = {
    SERVER_URL: "https://forge-kohl-kappa.vercel.app",
    POLLING_INTERVAL: 3000,
    CAPTURE_TIMEOUT: 120000,    // 2 min max to wait for response
    CAPTURE_CHECK_INTERVAL: 1500, // check every 1.5s if generation finished
    MIN_RESPONSE_LENGTH: 100,   // min chars to accept a response
    DEBUG_MODE: true
};

class KirovLogger {
    static info(...args) { console.log('[KIROV3]', ...args); }
    static error(...args) { console.error('[KIROV3]', ...args); }
    static warn(...args) { console.warn('[KIROV3]', ...args); }
}

// ─── DeepSeek DOM helpers ───────────────────────────────────────────────────

// Find the chat textarea (DeepSeek uses #chat-input or a textarea with specific attrs)
function findTextarea() {
    return document.querySelector('textarea#chat-input')
        || document.querySelector('textarea[placeholder*="Message"]')
        || document.querySelector('textarea[placeholder*="message"]')
        || document.querySelector('div[contenteditable="true"]')
        || document.querySelector('textarea');
}

// Find the send button — DeepSeek uses a div with role="button" or a specific send button
function findSendButton() {
    // DeepSeek send button strategies (most specific first)
    const candidates = [
        'div[role="button"][aria-disabled="false"]',
        'button[data-testid="send-button"]',
        'button[aria-label*="Send"]',
        'div[role="button"][class*="send"]',
        'div[role="button"]:last-child',
    ];
    for (const sel of candidates) {
        const el = document.querySelector(sel);
        if (el && !el.getAttribute('aria-disabled')) return el;
    }
    return null;
}

// Detect if DeepSeek is currently generating a response
// During generation, a "stop" button appears; when it disappears, response is done
function isGenerating() {
    // DeepSeek stop button: div with role="button" containing stop icon, or aria-label "Stop"
    const stopBtn = document.querySelector(
        'div[role="button"][aria-label*="Stop" i], ' +
        'div[role="button"][aria-label*="stop" i], ' +
        'button[aria-label*="Stop" i], ' +
        'div[class*="stop-generating"], ' +
        'div[class*="stop"]'
    );
    if (stopBtn) return true;

    // Fallback: check if the last assistant message has a cursor/loading indicator
    const lastMsg = getLastAssistantElement();
    if (lastMsg) {
        // DeepSeek shows a blinking cursor or "..." while generating
        const loading = lastMsg.querySelector('.loading, [class*="loading"], [class*="cursor"], [class*="typing"]');
        if (loading) return true;
    }
    return false;
}

// Find the LAST assistant message element using multiple DeepSeek-specific strategies
function getLastAssistantElement() {
    // Strategy 1: DeepSeek renders markdown in .ds-markdown inside assistant messages
    let markdowns = document.querySelectorAll('div.ds-markdown');
    if (markdowns.length > 0) {
        return markdowns[markdowns.length - 1];
    }

    // Strategy 2: elements with markdown-related classes, but exclude user input
    markdowns = document.querySelectorAll(
        '[class*="ds-markdown"], ' +
        'div[class*="markdown-body"], ' +
        'div[class*="message-content"]'
    );
    if (markdowns.length > 0) {
        return markdowns[markdowns.length - 1];
    }

    // Strategy 3: look for assistant role containers
    const assistants = document.querySelectorAll(
        '[data-role="assistant"], ' +
        'div[class*="assistant"], ' +
        'div[class*="bot-message"], ' +
        'div[class*="ai-message"]'
    );
    if (assistants.length > 0) {
        const last = assistants[assistants.length - 1];
        // Try to find markdown content inside
        const inner = last.querySelector('.ds-markdown, [class*="markdown"], [class*="content"]');
        return inner || last;
    }

    return null;
}

// Extract text content from an element, preserving code blocks structure
function extractContent(el) {
    if (!el) return '';
    // Use innerText to get rendered text (respects CSS), fallback to textContent
    let text = '';
    try {
        text = el.innerText || el.textContent || '';
    } catch {
        text = el.textContent || '';
    }
    return text.trim();
}

// ─── Polling ────────────────────────────────────────────────────────────────

let isProcessing = false; // Prevent concurrent prompt injection

async function pollForPrompt() {
    if (isProcessing) return; // Don't poll while injecting/capturing

    try {
        const res = await fetch(`${CONFIG.SERVER_URL}/api/bridge/prompt`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.status === 'idle' || !data.prompt) return;

        // Hash check — prevent re-injection of the same prompt
        const hash = await sha256(data.prompt);
        const lastHash = localStorage.getItem('kirov_last_hash');
        if (hash === lastHash) return; // Already processed this prompt

        // New prompt! Process it
        isProcessing = true;
        localStorage.setItem('kirov_last_hash', hash);

        KirovLogger.info(`Phase ${data.phase_num}: New prompt (${data.prompt.length} chars) — injecting`);

        await injectPrompt(data.prompt);
        KirovLogger.info('Prompt injected, waiting for DeepSeek response...');

        // Wait for generation to start, then finish
        const captured = await waitForResponseAndCapture();

        if (captured) {
            KirovLogger.info(`Capture complete (${captured.length} chars) — sending to server`);
            await sendCapture(captured);
        } else {
            KirovLogger.error('Capture failed — no response detected');
        }

        isProcessing = false;
    } catch (e) {
        KirovLogger.error('Poll error:', e.message);
        isProcessing = false;
    }
}

// ─── Inject prompt into DeepSeek ────────────────────────────────────────────

async function injectPrompt(prompt) {
    const textarea = findTextarea();
    if (!textarea) {
        KirovLogger.error('Textarea not found — are you on chat.deepseek.com?');
        return false;
    }

    // Focus the textarea
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

    await sleep(400);

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

// ─── Wait for response & capture ────────────────────────────────────────────

async function waitForResponseAndCapture() {
    // Step 1: wait for generation to START (stop button appears)
    KirovLogger.info('Waiting for generation to start...');
    let started = false;
    for (let i = 0; i < 20; i++) { // 20 * 500ms = 10s max to start
        await sleep(500);
        if (isGenerating()) { started = true; break; }
    }
    if (!started) {
        KirovLogger.warn('Generation did not start — maybe prompt failed. Trying capture anyway');
    } else {
        KirovLogger.info('Generation started, waiting for it to finish...');
    }

    // Step 2: wait for generation to FINISH (stop button disappears)
    const startTime = Date.now();
    let stableCount = 0;
    let lastContent = '';
    let lastContentLength = 0;

    while (Date.now() - startTime < CONFIG.CAPTURE_TIMEOUT) {
        await sleep(CONFIG.CAPTURE_CHECK_INTERVAL);

        const stillGenerating = isGenerating();
        const lastEl = getLastAssistantElement();
        const currentContent = lastEl ? extractContent(lastEl) : '';
        const currentLen = currentContent.length;

        // Track content stability — if content hasn't changed for 3 checks and not generating, done
        if (currentLen === lastContentLength && currentContent === lastContent) {
            stableCount++;
        } else {
            stableCount = 0;
        }
        lastContent = currentContent;
        lastContentLength = currentLen;

        KirovLogger.info(
            `Check: generating=${stillGenerating} len=${currentLen} stable=${stableCount}`
        );

        // Response is complete when:
        // - Not generating AND content is stable (3 consecutive identical checks)
        // - OR content is substantial and not generating
        if (!stillGenerating && stableCount >= 2 && currentLen >= CONFIG.MIN_RESPONSE_LENGTH) {
            KirovLogger.info(`Response complete (${currentLen} chars)`);
            return currentContent;
        }

        // Early exit if very long response and stable for 4 checks
        if (stableCount >= 4 && currentLen >= CONFIG.MIN_RESPONSE_LENGTH) {
            KirovLogger.info(`Response stable (${currentLen} chars) — capturing`);
            return currentContent;
        }
    }

    // Timeout — return whatever we have if it's long enough
    if (lastContentLength >= CONFIG.MIN_RESPONSE_LENGTH) {
        KirovLogger.warn(`Timeout — capturing partial response (${lastContentLength} chars)`);
        return lastContent;
    }

    return null;
}

// ─── Send captured response to server ───────────────────────────────────────

async function sendCapture(content) {
    try {
        const res = await fetch(`${CONFIG.SERVER_URL}/api/bridge/code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, response: content }),
        });
        const data = await res.json();
        KirovLogger.info('Server response:', JSON.stringify(data));

        if (data.success && data.phase === 5) {
            KirovLogger.info('🎉 MISSION COMPLETE — code captured on Vercel!');
            KirovLogger.info(`📦 Download: ${CONFIG.SERVER_URL}/api/bridge/download`);
        } else if (data.success && data.phase === 2) {
            KirovLogger.info('✅ PRD captured — Phase 2 (code gen) starting...');
        }
        return data;
    } catch (e) {
        KirovLogger.error('Send capture error:', e.message);
        return null;
    }
}

// ─── Utils ──────────────────────────────────────────────────────────────────

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function sha256(text) {
    const msgBuffer = new TextEncoder().encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

// ─── Start ──────────────────────────────────────────────────────────────────

KirovLogger.info('KIROV3 Vercel Edition v2 loaded — improved capture');
KirovLogger.info(`Server: ${CONFIG.SERVER_URL}`);
KirovLogger.info('Waiting for prompts from bridge...');

setInterval(pollForPrompt, CONFIG.POLLING_INTERVAL);
pollForPrompt();
