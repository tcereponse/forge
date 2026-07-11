(function() {
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    let url = typeof input === 'string' ? input : (input && input.url);
    if (typeof url === 'string') {
      let targetUrl = url;
      if (url.startsWith('/api/')) {
        targetUrl = 'http://localhost:5005' + url;
      } else if (url.startsWith('api/')) {
        targetUrl = 'http://localhost:5005/' + url;
      } else if (url.startsWith('chrome-extension://') && url.includes('/api/')) {
        targetUrl = url.replace(/chrome-extension:\/\/[^\/]+/, 'http://localhost:5005');
      } else if (url.startsWith('chrome://extensions/api/')) {
        targetUrl = url.replace('chrome://extensions/', 'http://localhost:5005/');
      }
      
      if (targetUrl !== url) {
        if (typeof input === 'string') {
          input = targetUrl;
        } else {
          input = new Request(targetUrl, input);
        }
      }
    }
    return originalFetch(input, init);
  };
  const OriginalEventSource = window.EventSource;
  window.EventSource = function(url, configuration) {
    if (typeof url === 'string') {
      if (url.startsWith('/api/')) {
        url = 'http://localhost:5005' + url;
      } else if (url.startsWith('api/')) {
        url = 'http://localhost:5005/' + url;
      } else if (url.startsWith('chrome-extension://') && url.includes('/api/')) {
        url = url.replace(/chrome-extension:\/\/[^\/]+/, 'http://localhost:5005');
      } else if (url.startsWith('chrome://extensions/api/')) {
        url = url.replace('chrome://extensions/', 'http://localhost:5005/');
      }
    }
    return new OriginalEventSource(url, configuration);
  };
  window.EventSource.prototype = OriginalEventSource.prototype;
})();
