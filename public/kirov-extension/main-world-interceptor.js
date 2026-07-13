(function() {
    console.log('[KIROV3] Main World Interceptor loaded.');

    let hasLoggedOrphan = false;

    // Redirect local/relative API calls to the local bridge server
    const originalFetch = window.fetch;
    window.fetch = function(input, init) {
        let url = typeof input === 'string' ? input : (input && input.url);
        if (typeof url === 'string') {
            // Block requests for the known orphan/invalid project to prevent infinite console loops
            if (url.includes('cmqoud8ms0000u5osg0pekakv')) {
                if (!hasLoggedOrphan) {
                    console.warn('[KIROV-INTERCEPT] Instantly freezing request loop for invalid/orphan project:', url);
                    hasLoggedOrphan = true;
                }
                // Return a non-resolving promise to freeze the caller loop and stop log pollution
                return new Promise(() => {});
            }

            let targetUrl = url;
            if (url.startsWith('/api/projects') || url.startsWith('api/projects')) {
                targetUrl = 'http://localhost:5005' + (url.startsWith('/') ? '' : '/') + url;
            } else if (url.includes('/api/projects/')) {
                // Handle case where relative path is resolved by browser as deepseek domain URL
                const match = url.match(/\/api\/projects\/.*/);
                if (match) {
                    targetUrl = 'http://localhost:5005' + match[0];
                }
            }
            
            if (targetUrl !== url) {
                console.log('[KIROV-REDIRECT] Redirecting fetch from:', url, 'to:', targetUrl);
                if (typeof input === 'string') {
                    input = targetUrl;
                } else {
                    input = new Request(targetUrl, input);
                }
            }
        }
        return originalFetch(input, init);
    };

    const originalJson = Response.prototype.json;
    Response.prototype.json = async function() {
        // Clone response before it gets consumed, so we can read text if parsing fails
        const clone = this.clone();
        try {
            return await originalJson.apply(this);
        } catch (err) {
            if (err instanceof SyntaxError) {
                console.error('[KIROV-INTERCEPT] JSON parsing failed for URL:', this.url);
                try {
                    const text = await clone.text();
                    console.error('[KIROV-INTERCEPT] Response text content:', text.substring(0, 1000));
                } catch (e) {
                    console.error('[KIROV-INTERCEPT] Could not read response text:', e);
                }
            }
            throw err;
        }
    };
})();
