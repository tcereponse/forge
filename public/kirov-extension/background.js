// Background service worker — keeps alive and handles fetch requests
// from content.js (bypasses CSP on DeepSeek)

// Keep service worker alive
chrome.runtime.onStartup.addListener(() => {
    console.log('[KIROV3] Background started');
});

// Alarm to keep alive
chrome.alarms?.create('keepAlive', { periodInMinutes: 0.25 });
chrome.alarms?.onAlarm.addListener((alarm) => {
    if (alarm.name === 'keepAlive') {
        console.log('[KIROV3] Keep alive ping');
    }
});

// Handle FETCH requests from content.js (bypasses CSP)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH') {
        let { url, options } = request;
        
        // Rewrite relative URLs to bridge server
        if (typeof url === 'string') {
            if (url.startsWith('/api/')) {
                url = 'http://localhost:5005' + url;
            } else if (url.startsWith('api/')) {
                url = 'http://localhost:5005/' + url;
            }
        }
        
        fetch(url, options || {})
            .then(res => {
                return res.text().then(text => {
                    let data = null;
                    try { data = JSON.parse(text); } catch (e) {}
                    return { ok: res.ok, status: res.status, text: text, data: data };
                });
            })
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
            
        return true; // Keep message channel open for async response
    }
    
    // Health check
    if (request.type === 'HEALTH_CHECK') {
        const urls = ['http://localhost:5005', 'http://localhost:3000'];
        let found = false;
        for (const base of urls) {
            fetch(`${base}/api/bridge/health`, { signal: AbortSignal.timeout(3000) })
                .then(r => r.json())
                .then(data => {
                    if (!found) {
                        found = true;
                        sendResponse({ success: true, url: base, data });
                    }
                })
                .catch(() => {});
        }
        return true;
    }
});

console.log('[KIROV3] Background service worker loaded');
