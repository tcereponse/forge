// ═══════════════════════════════════════════════════════════════════════════
// STEALTH BRIDGE SERVER — Integrated into Next.js dev process
// Port 5005 — auto-started via next.config.ts
// Compatible with KIROV3 G50 Chrome extension
// ═══════════════════════════════════════════════════════════════════════════

import { createServer, type IncomingMessage, type ServerResponse } from "http";

const PORT = 5005;
let serverInstance: ReturnType<typeof createServer> | null = null;

// ── Mission State ──────────────────────────────────────────────────────────
interface MissionState {
  id: string;
  name: string;
  prompt: string;
  stack: string;
  phase: number;
  status: "idle" | "prompt" | "capturing" | "captured" | "done" | "error";
  currentPrompt: string | null;
  capturedContent: string;
  prd: string;
  files: { path: string; content: string; language: string }[];
  projectId: string | null;
  createdAt: number;
  updatedAt: number;
  debounceTimer: ReturnType<typeof setTimeout> | null;
}

let mission: MissionState | null = null;

// ── Lazy-loaded dependencies (loaded after Prisma is ready) ────────────────
let dbModule: any = null;
let workspaceModule: any = null;

async function loadDeps() {
  if (!dbModule) {
    try {
      dbModule = await import("./db");
    } catch (e) {
      console.log("[Bridge] Prisma non disponible:", e);
    }
  }
  if (!workspaceModule) {
    try {
      workspaceModule = await import("./workspace");
    } catch (e) {
      console.log("[Bridge] Workspace non disponible:", e);
    }
  }
}

// ── Prompt Builders ────────────────────────────────────────────────────────
function buildPhase1Prompt(name: string, vision: string): string {
  return `[⚡ PHASE 1 : PRD & ARCHITECTURE]
Projet : ${name.toUpperCase()}
Vision : "${vision}"

Tu es un Ingénieur Senior. Ta mission : concevoir un PRD technique parfait.

📋 FORMAT DU PRD :
## Problem Statement & Solution
## User Stories (liste numérotée exhaustive)
## Implementation Decisions (React+Vite+TS, HashRouter)
## Testing Decisions
## Out of Scope

⚠️ RÈGLES : ZÉRO code source. Uniquement Markdown. Stack : React 18 + Vite 5 + TypeScript 5 + Tailwind 3.`;
}

function buildPhase2Prompt(name: string, prd: string): string {
  return `[🛡️ PHASE 2 (GÉNÉRATION CODE) 🛡️]
Projet : ${name.toUpperCase()}

Voici le PRD :
---
${prd}
---

Génère TOUT le code source. Stack : React 18 + Vite + TypeScript + Tailwind + HashRouter.

📁 Fichiers obligatoires : index.html, vite.config.ts, package.json, tsconfig.json, tailwind.config.ts, postcss.config.js, src/main.tsx, src/App.tsx, src/index.css, src/components/MainComponent.tsx

FORMAT : {"files":[{"path":"...","content":"...","language":"..."}]}
Uniquement le JSON.`;
}

// ── Markdown Code Block Parser ─────────────────────────────────────────────
function parseCapturedFiles(content: string): { path: string; content: string; language: string }[] {
  // Try JSON first
  try {
    const parsed = JSON.parse(content);
    if (parsed.files && Array.isArray(parsed.files)) {
      return parsed.files.map((f: any) => ({
        path: String(f.path || ""),
        content: String(f.content || ""),
        language: f.language || "text",
      }));
    }
  } catch {}

  // Try extracting JSON from text
  const jsonMatch = content.match(/\{[\s\S]*"files"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.files) return parsed.files;
    } catch {}
  }

  // Try FILE: header parser
  const files: { path: string; content: string; language: string }[] = [];
  const fileRegex = /(?:FILE|FICHIER):\s*([^\n]+)\n```[\w]*\n([\s\S]*?)```/gi;
  let match;
  while ((match = fileRegex.exec(content)) !== null) {
    files.push({
      path: match[1].trim(),
      content: match[2].trim(),
      language: match[1].split(".").pop() || "text",
    });
  }

  return files;
}

// ── HTTP Handler ───────────────────────────────────────────────────────────
async function handleRequest(req: IncomingMessage, res: ServerResponse) {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  if (req.method === "OPTIONS") {
    res.writeHead(204, corsHeaders);
    res.end();
    return;
  }

  const url = new URL(req.url || "", `http://localhost:${PORT}`);
  const path = url.pathname;
  const method = req.method || "GET";

  const parseBody = (): Promise<any> =>
    new Promise((resolve) => {
      let body = "";
      req.on("data", (chunk: any) => (body += chunk));
      req.on("end", () => {
        try { resolve(JSON.parse(body)); } catch { resolve({}); }
      });
    });

  const sendJson = (code: number, data: any) => {
    res.writeHead(code, corsHeaders);
    res.end(JSON.stringify(data));
  };

  // ── GET /api/bridge/prompt — Extension G50 polls here ───────────────────
  if (path === "/api/bridge/prompt" && method === "GET") {
    if (!mission || !mission.currentPrompt) {
      sendJson(200, { status: "idle", prompt: null, phase: 0 });
      return;
    }
    sendJson(200, {
      status: mission.status,
      prompt: mission.currentPrompt,
      phase: mission.phase,
      phase_num: mission.phase,
      projectId: mission.id,
    });
    return;
  }

  // ── POST /api/bridge/code — Extension G50 sends captured code ───────────
  if (path === "/api/bridge/code" && method === "POST") {
    const body = await parseBody();
    if (!mission) {
      sendJson(400, { success: false, error: "No active mission" });
      return;
    }

    const content = body.content || "";
    mission.capturedContent = content;
    mission.status = "captured";
    mission.updatedAt = Date.now();

    console.log(`[Bridge] Capture reçue: ${content.length} chars (Phase ${mission.phase})`);

    // Phase 1 → save PRD, transition to Phase 2
    if (mission.phase === 1) {
      mission.prd = content;
      mission.phase = 2;
      mission.status = "prompt";
      mission.currentPrompt = buildPhase2Prompt(mission.name, mission.prd);
      console.log("[Bridge] Phase 1 (PRD) capturé → transition Phase 2 (Code)");
      sendJson(200, { success: true, phase: 2, status: "prompt" });
      return;
    }

    // Phase 2 → parse files, save to DB + disk, auto-install/build
    if (mission.phase === 2) {
      const files = parseCapturedFiles(content);
      mission.files = files;
      mission.phase = 5;
      mission.status = "done";
      mission.currentPrompt = null;

      console.log(`[Bridge] Phase 2 (Code) capturé → ${files.length} fichiers parsés`);

      // Save to Prisma + disk if we have a project ID
      if (mission.projectId) {
        await loadDeps();
        try {
          if (dbModule?.db) {
            await dbModule.db.project.update({
              where: { id: mission.projectId },
              data: {
                filesJson: JSON.stringify(files),
                fileCount: files.length,
                prd: mission.prd,
                status: "ready",
                buildStatus: "pending",
                installStatus: "pending",
                updatedAt: new Date(),
              },
            });
            console.log(`[Bridge] Projet ${mission.projectId} mis à jour en DB`);
          }

          if (workspaceModule?.writeProjectFiles) {
            await workspaceModule.writeProjectFiles(mission.projectId, files);
            console.log(`[Bridge] Fichiers écrits sur disque`);

            // Debounce: wait 12s after last capture before install+build
            if (mission.debounceTimer) clearTimeout(mission.debounceTimer);
            mission.debounceTimer = setTimeout(async () => {
              console.log("[Bridge] Déclenchement auto-install...");
              if (workspaceModule?.runInstall) workspaceModule.runInstall(mission.projectId);
              setTimeout(() => {
                console.log("[Bridge] Déclenchement auto-build...");
                if (workspaceModule?.runBuild) workspaceModule.runBuild(mission.projectId);
              }, 30000);
            }, 12000);
          }
        } catch (e) {
          console.error("[Bridge] Erreur sauvegarde:", e);
        }
      }

      sendJson(200, { success: true, phase: 5, status: "done", fileCount: files.length });
      return;
    }

    sendJson(200, { success: true, phase: mission.phase });
    return;
  }

  // ── GET /v1/bridge/poll — Popup polls status ────────────────────────────
  if (path === "/v1/bridge/poll" && method === "GET") {
    if (!mission) {
      sendJson(200, { status: "idle", phase_num: 0, phase: 0 });
      return;
    }
    sendJson(200, {
      status: mission.status,
      phase: mission.phase,
      phase_num: mission.phase,
      prompt: mission.currentPrompt,
      projectId: mission.id,
    });
    return;
  }

  // ── POST /v1/mission/start — Start a mission ────────────────────────────
  if (path === "/v1/mission/start" && method === "POST") {
    const body = await parseBody();
    if (mission?.debounceTimer) clearTimeout(mission.debounceTimer);
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
      debounceTimer: null,
    };
    console.log(`[Bridge] Mission démarrée: ${mission.name} (Phase 1)`);
    sendJson(200, { success: true, missionId: mission.id, phase: 1 });
    return;
  }

  // ── GET /v1/mission/status ──────────────────────────────────────────────
  if (path === "/v1/mission/status" && method === "GET") {
    if (!mission) {
      sendJson(200, { status: "idle", phase: 0 });
      return;
    }
    sendJson(200, {
      status: mission.status,
      phase: mission.phase,
      phaseName: mission.phase === 1 ? "PRD Generation" : mission.phase === 2 ? "Code Generation" : mission.phase === 5 ? "Done" : "Unknown",
      prd: mission.prd,
      files: mission.files,
      fileCount: mission.files.length,
      capturedLength: mission.capturedContent.length,
      missionId: mission.id,
      name: mission.name,
      projectId: mission.projectId,
    });
    return;
  }

  // ── POST /v1/mission/reset ──────────────────────────────────────────────
  if (path === "/v1/mission/reset" && method === "POST") {
    if (mission?.debounceTimer) clearTimeout(mission.debounceTimer);
    mission = null;
    sendJson(200, { success: true });
    return;
  }

  // ── GET /v1/logs ─────────────────────────────────────────────────────────
  if (path === "/v1/logs" && method === "GET") {
    sendJson(200, { logs: [] });
    return;
  }

  // ── GET /health ──────────────────────────────────────────────────────────
  if (path === "/health" || path === "/") {
    sendJson(200, {
      service: "KIROV Bridge G50",
      status: "online",
      port: PORT,
      mission: mission ? { id: mission.id, phase: mission.phase, status: mission.status } : null,
    });
    return;
  }

  // ── POST /v1/bridge/callback — Legacy compat ────────────────────────────
  if (path === "/v1/bridge/callback" && method === "POST") {
    const body = await parseBody();
    if (!mission) {
      sendJson(400, { success: false, error: "No active mission" });
      return;
    }
    const content = body.content || "";
    mission.capturedContent = content;
    mission.status = "captured";

    if (mission.phase === 1) {
      mission.prd = content;
      mission.phase = 2;
      mission.status = "prompt";
      mission.currentPrompt = buildPhase2Prompt(mission.name, mission.prd);
      sendJson(200, { success: true, phase: 2, status: "prompt" });
      return;
    }
    if (mission.phase === 2) {
      const files = parseCapturedFiles(content);
      mission.files = files;
      mission.phase = 5;
      mission.status = "done";
      mission.currentPrompt = null;
      sendJson(200, { success: true, phase: 5, status: "done", fileCount: files.length });
      return;
    }
    sendJson(200, { success: true });
    return;
  }

  sendJson(404, { error: "Not found" });
}

// ── Start the bridge server ────────────────────────────────────────────────
export function startBridgeServer() {
  if (serverInstance) {
    console.log("[Bridge] Serveur déjà en cours sur le port", PORT);
    return;
  }

  serverInstance = createServer(async (req, res) => {
    try {
      await handleRequest(req, res);
    } catch (e) {
      console.error("[Bridge] Erreur:", e);
      try {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Internal error" }));
      } catch {}
    }
  });

  serverInstance.listen(PORT, () => {
    console.log(`\n🚀 KIROV Bridge G50 démarré sur http://localhost:${PORT}`);
    console.log(`   Extension poll:    GET  /api/bridge/prompt`);
    console.log(`   Code capture:      POST /api/bridge/code`);
    console.log(`   Popup status:      GET  /v1/bridge/poll`);
    console.log(`   Start mission:     POST /v1/mission/start`);
    console.log(`   Mission status:    GET  /v1/mission/status\n`);
  });

  serverInstance.on("error", (e: NodeJS.ErrnoException) => {
    if (e.code === "EADDRINUSE") {
      console.log(`[Bridge] Port ${PORT} déjà utilisé — serveur existant utilisé`);
      serverInstance = null;
    } else {
      console.error("[Bridge] Erreur serveur:", e);
    }
  });
}
