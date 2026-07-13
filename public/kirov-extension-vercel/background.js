chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'FETCH') {
        fetch(request.url, request.options)
            .then(res => res.text().then(text => ({ ok: res.ok, status: res.status, text, data: (() => { try { return JSON.parse(text); } catch { return null; } })() })))
            .then(result => sendResponse({ success: true, result }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});
