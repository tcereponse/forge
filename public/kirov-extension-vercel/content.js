/**
 * ELITE FORGE — KIROV3 Vercel Edition
 * Fonctionne avec https://forge-kohl-kappa.vercel.app
 */

const CONFIG = {
    SERVER_URL: "https://forge-kohl-kappa.vercel.app",
    POLLING_INTERVAL: 2500,
    DEBUG_MODE: true
};

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

        KirovLogger.info(`Phase ${data.phase_num}: Prompt received (${data.prompt.length} chars)`);

        // Check if we already injected this prompt (hash check)
        const hash = await sha256(data.prompt);
        const lastHash = localStorage.getItem('kirov_last_hash');
        if (hash === lastHash) return; // Already injected
        localStorage.setItem('kirov_last_hash', hash);

        // Inject the prompt into DeepSeek chat
        await injectPrompt(data.prompt);
        KirovLogger.info('Prompt injected into DeepSeek');

        // Wait for response (15s minimum for DeepSeek to generate)
        setTimeout(() => captureResponse(), 15000);

    } catch (e) {
        KirovLogger.error('Poll error:', e.message);
    }
}

async function injectPrompt(prompt) {
    // Find the textarea in DeepSeek chat
    const textarea = document.querySelector('textarea#chat-input, textarea[placeholder*="Message"], div[contenteditable="true"]');
    if (!textarea) {
        KirovLogger.error('Textarea not found');
        return;
    }

    // Set the value
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
    nativeInputValueSetter.call(textarea, prompt);
    textarea.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait 500ms then find and click the send button
    await new Promise(r => setTimeout(r, 500));

    const sendButton = document.querySelector('button[data-testid="send-button"], button[aria-label*="Send"], div[role="button"]:last-child');
    if (sendButton) {
        sendButton.click();
        KirovLogger.info('Send button clicked');
    } else {
        // Try pressing Enter
        textarea.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, bubbles: true }));
        KirovLogger.info('Enter key pressed');
    }
}

async function captureResponse() {
    try {
        // Wait for the response to be complete
        await new Promise(r => setTimeout(r, 5000));

        // Find the last assistant message
        const messages = document.querySelectorAll('[class*="markdown"], [class*="message-content"], [class*="ds-markdown"]');
        if (messages.length === 0) {
            KirovLogger.warn('No messages found, retrying...');
            setTimeout(captureResponse, 5000);
            return;
        }

        const lastMessage = messages[messages.length - 1];
        const content = lastMessage.textContent || lastMessage.innerText;

        if (!content || content.length < 50) {
            KirovLogger.warn('Response too short, retrying...');
            setTimeout(captureResponse, 5000);
            return;
        }

        KirovLogger.info(`Captured response (${content.length} chars)`);

        // Send the captured response to the server
        const res = await fetch(`${CONFIG.SERVER_URL}/api/bridge/code`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content, response: content }),
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
KirovLogger.info('KIROV3 Vercel Edition loaded');
setInterval(pollForPrompt, CONFIG.POLLING_INTERVAL);
pollForPrompt();
