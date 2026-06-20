/**
 * Senior Engineering (Grade Diamond G50)
 * Bypasses CSP & Mixed Content Blocks by running fetches in Extension context.
 */

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH') {
        const { url, options } = request;
        
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