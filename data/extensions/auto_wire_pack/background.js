chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'POLL_BRIDGE') {
    fetch('http://127.0.0.1:5005/v1/bridge/poll')
      .then(r => r.json())
      .then(data => sendResponse({ ok: true, data }))
      .catch(e => sendResponse({ ok: false, error: e.message }));
    return true;
  }
  if (message.type === 'CLEAR_BRIDGE') {
    fetch('http://127.0.0.1:5005/v1/bridge/clear', { method: 'POST' })
      .then(() => sendResponse({ ok: true }))
      .catch(e => sendResponse({ ok: false }));
    return true;
  }
  if (message.type === 'SEND_CALLBACK') {
    fetch('http://127.0.0.1:5005/v1/bridge/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message.payload)
    }).then(() => sendResponse({ ok: true }))
      .catch(() => sendResponse({ ok: false }));
    return true;
  }
});
