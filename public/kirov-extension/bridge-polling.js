// Appended Bridge Listener for Kirov3 Local Setup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'CHECK_BRIDGE') {
    fetch('http://localhost:3000/api/bridge/prompt')
      .then(res => res.json())
      .then(data => sendResponse(data))
      .catch(err => sendResponse({}));
    return true; // Keep channel open for async response
  }
  if (request.type === 'SUBMIT_CODE') {
    fetch('http://localhost:3000/api/bridge/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request.data)
    })
      .then(res => res.json())
      .then(data => sendResponse(data))
      .catch(err => sendResponse({ error: err.message }));
    return true; // Keep channel open for async response
  }
});
