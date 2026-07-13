// Simple proxy: port 5005 → port 3000 (Next.js)
// This allows the KIROV3 extension (hardcoded to localhost:5005) to work
// without reloading. All requests are forwarded to Next.js /api/bridge/*

import { serve } from "bun";

const PORT = 5005;
const TARGET = "http://localhost:3000";

const server = serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const targetUrl = `${TARGET}${url.pathname}${url.search}`;
    
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      const response = await fetch(targetUrl, {
        method: req.method,
        headers: { "Content-Type": "application/json" },
        body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
      });
      
      const text = await response.text();
      return new Response(text, {
        status: response.status,
        headers: corsHeaders,
      });
    } catch (e) {
      console.log(`[Proxy] Error forwarding to ${targetUrl}:`, e);
      return new Response(JSON.stringify({ 
        service: "KIROV Bridge Proxy", 
        status: "online", 
        port: PORT,
        target: TARGET,
        error: e instanceof Error ? e.message : "Unknown",
        note: "Next.js may be starting up. Retry in a few seconds."
      }), { status: 200, headers: corsHeaders });
    }
  },
});

console.log(`\n🔄 KIROV Bridge Proxy sur http://localhost:${PORT} → ${TARGET}`);
console.log(`   L extension KIROV3 (localhost:5005) est redirigee vers Next.js (localhost:3000)\n`);
