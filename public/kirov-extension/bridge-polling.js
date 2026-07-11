// Appended Bridge Listener for Kirov3 — auto-detects server URL
const BRIDGE_URLS = [
    'http://localhost:5005',
    'http://localhost:3000',
    'https://preview-chat-f2f839ba-f732-4613-9010-8f458d16225c.space-z.ai'
];

async function detectServer() {
    for (const url of BRIDGE_URLS) {
        try {
            const res = await fetch(`${url}/api/bridge/health`, { signal: AbortSignal.timeout(3000) });
            if (res.ok) return url;
        } catch {}
    }
    return null;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_BRIDGE') {
    detectServer().then(url => {
      if (!url) { sendResponse({}); return; }
      fetch(`${url}/api/bridge/prompt`)
        .then(res => res.json())
        .then(data => sendResponse(data))
        .catch(err => sendResponse({}));
    });
    return true;
  }
  if (request.type === 'SUBMIT_CODE') {
    detectServer().then(url => {
      if (!url) { sendResponse({ error: 'No server' }); return; }
      fetch(`${url}/api/bridge/code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request.data)
      })
        .then(res => res.json())
        .then(data => sendResponse(data))
        .catch(err => sendResponse({ error: err.message }));
    });
    return true;
  }
});
