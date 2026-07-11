import { serve } from "bun";

const PORT = 5005;

interface Mission {
  id: string;
  name: string;
  prompt: string;
  stack: string;
  phase: number;
  status: string;
  currentPrompt: string | null;
  capturedContent: string;
  prd: string;
  files: any[];
  projectId: string | null;
  createdAt: number;
  updatedAt: number;
}

let mission: Mission | null = null;

function buildPhase1Prompt(name: string, vision: string): string {
  return `[PHASE 1 : PRD]\nProjet : ${name.toUpperCase()}\nVision : "${vision}"\n\nTu es un Ingenieur Senior. Genere un PRD technique.\n\n## Problem Statement & Solution\n## User Stories\n## Implementation Decisions (React+Vite+TS, HashRouter)\n## Testing Decisions\n## Out of Scope\n\nStack : React 18 + Vite 5 + TypeScript 5 + Tailwind 3.`;
}

function buildPhase2Prompt(name: string, prd: string): string {
  return `[PHASE 2 : CODE]\nProjet : ${name.toUpperCase()}\n\nPRD :\n---\n${prd}\n---\n\nGenere TOUT le code source en JSON.\nFichiers : index.html, vite.config.ts, package.json, tsconfig.json, tailwind.config.ts, postcss.config.js, src/main.tsx, src/App.tsx, src/index.css, src/components/MainComponent.tsx\n\nFormat : {"files":[{"path":"...","content":"...","language":"..."}]}`;
}

function parseFiles(content: string): any[] {
  try {
    const p = JSON.parse(content);
    if (p.files) return p.files;
  } catch {}
  const m = content.match(/\{[\s\S]*"files"[\s\S]*\}/);
  if (m) { try { const p = JSON.parse(m[0]); if (p.files) return p.files; } catch {} }
  return [];
}

const server = serve({
  port: PORT,
  async fetch(req) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const path = url.pathname;
    const method = req.method;

    const parseBody = () => new Promise<any>((resolve) => {
      let body = "";
      req.on("data", (c: any) => (body += c));
      req.on("end", () => { try { resolve(JSON.parse(body)); } catch { resolve({}); } });
    });

    const send = (code: number, data: any) => new Response(JSON.stringify(data), { status: code, headers: corsHeaders });

    // GET /api/bridge/prompt
    if (path === "/api/bridge/prompt" && method === "GET") {
      if (!mission || !mission.currentPrompt) return send(200, { status: "idle", prompt: null, phase: 0 });
      return send(200, { status: mission.status, prompt: mission.currentPrompt, phase: mission.phase, phase_num: mission.phase, projectId: mission.id });
    }

    // POST /api/bridge/code
    if (path === "/api/bridge/code" && method === "POST") {
      const body = await parseBody();
      if (!mission) return send(400, { success: false, error: "No active mission" });
      const content = body.content || body.response || "";
      mission.capturedContent = content;
      mission.status = "captured";
      mission.updatedAt = Date.now();
      console.log(`[Bridge] Capture: ${content.length} chars (Phase ${mission.phase})`);
      if (mission.phase === 1) {
        mission.prd = content;
        mission.phase = 2;
        mission.status = "prompt";
        mission.currentPrompt = buildPhase2Prompt(mission.name, mission.prd);
        console.log("[Bridge] Phase 1 -> Phase 2");
        return send(200, { success: true, phase: 2, status: "prompt" });
      }
      if (mission.phase === 2) {
        const files = parseFiles(content);
        mission.files = files;
        mission.phase = 5;
        mission.status = "done";
        mission.currentPrompt = null;
        console.log(`[Bridge] Phase 2 -> Done (${files.length} files)`);
        return send(200, { success: true, phase: 5, status: "done", fileCount: files.length });
      }
      return send(200, { success: true, phase: mission.phase });
    }

    // GET /v1/bridge/poll
    if (path === "/v1/bridge/poll" && method === "GET") {
      if (!mission) return send(200, { status: "idle", phase_num: 0, phase: 0 });
      return send(200, { status: mission.status, phase: mission.phase, phase_num: mission.phase, prompt: mission.currentPrompt, projectId: mission.id });
    }

    // POST /v1/mission/start
    if (path === "/v1/mission/start" && method === "POST") {
      const body = await parseBody();
      mission = {
        id: `mission_${Date.now()}`,
        name: body.name || "Untitled",
        prompt: body.prompt || body.vision || "",
        stack: body.stack || "react-vite",
        phase: 1,
        status: "prompt",
        currentPrompt: buildPhase1Prompt(body.name, body.prompt || body.vision || ""),
        capturedContent: "",
        prd: "",
        files: [],
        projectId: body.projectId || null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      console.log(`[Bridge] Mission: ${mission.name} (Phase 1)`);
      return send(200, { success: true, missionId: mission.id, phase: 1 });
    }

    // GET /v1/mission/status
    if (path === "/v1/mission/status" && method === "GET") {
      if (!mission) return send(200, { status: "idle", phase: 0 });
      return send(200, {
        status: mission.status, phase: mission.phase,
        phaseName: mission.phase === 1 ? "PRD Generation" : mission.phase === 2 ? "Code Generation" : mission.phase === 5 ? "Done" : "Unknown",
        prd: mission.prd, files: mission.files, fileCount: mission.files.length,
        capturedLength: mission.capturedContent.length, missionId: mission.id, name: mission.name, projectId: mission.projectId,
      });
    }

    // POST /v1/mission/reset
    if (path === "/v1/mission/reset" && method === "POST") {
      mission = null;
      return send(200, { success: true });
    }

    // POST /v1/bridge/callback
    if (path === "/v1/bridge/callback" && method === "POST") {
      const body = await parseBody();
      if (!mission) return send(400, { success: false, error: "No active mission" });
      const content = body.content || "";
      mission.capturedContent = content;
      mission.status = "captured";
      if (mission.phase === 1) {
        mission.prd = content;
        mission.phase = 2;
        mission.status = "prompt";
        mission.currentPrompt = buildPhase2Prompt(mission.name, mission.prd);
        return send(200, { success: true, phase: 2, status: "prompt" });
      }
      if (mission.phase === 2) {
        const files = parseFiles(content);
        mission.files = files;
        mission.phase = 5;
        mission.status = "done";
        mission.currentPrompt = null;
        return send(200, { success: true, phase: 5, status: "done", fileCount: files.length });
      }
      return send(200, { success: true });
    }

    // GET /v1/logs
    if (path === "/v1/logs" && method === "GET") return send(200, { logs: [] });

    // GET /health
    if (path === "/health" || path === "/") {
      return send(200, { service: "KIROV Bridge", status: "online", port: PORT, mission: mission ? { id: mission.id, phase: mission.phase, status: mission.status } : null });
    }

    return send(404, { error: "Not found" });
  },
});

console.log(`\n🚀 KIROV Bridge sur http://localhost:${PORT}`);
console.log(`   Poll: GET /api/bridge/prompt`);
console.log(`   Code: POST /api/bridge/code`);
console.log(`   Start: POST /v1/mission/start`);
console.log(`   Status: GET /v1/mission/status\n`);
