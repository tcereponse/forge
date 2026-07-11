/**
 * Senior Engineering (Grade Diamond G50)
 * Bypasses CSP & Mixed Content Blocks by running fetches in Extension context.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH') {
        let { url, options } = request;
        
        if (typeof url === 'string') {
            if (url.startsWith('/api/')) {
                url = 'http://localhost:3000' + url;
            } else if (url.startsWith('api/')) {
                url = 'http://localhost:3000/' + url;
            } else if (url.startsWith('chrome-extension://') && url.includes('/api/')) {
                url = url.replace(/chrome-extension:\/\/[^\/]+/, 'http://localhost:3000');
            } else if (url.startsWith('chrome://extensions/api/')) {
                url = url.replace('chrome://extensions/', 'http://localhost:3000/');
            }
        }
        
        fetch(url, options)
            .then(res => {
                return res.text().then(text => {
                    let data = null;
                    try { data = JSON.parse(text); } catch (e) {}
                    return { ok: res.ok, status: res.status, text: text, data: data };
                });
            })
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
            
        return true; // Keep message channel open for asynchronous response
    }
});