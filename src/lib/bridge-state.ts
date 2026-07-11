// Shared bridge state — lives in the Next.js process, no separate server needed

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
  try { const p = JSON.parse(content); if (p.files) return p.files; } catch {}
  const m = content.match(/\{[\s\S]*"files"[\s\S]*\}/);
  if (m) { try { const p = JSON.parse(m[0]); if (p.files) return p.files; } catch {} }
  return [];
}

export const bridgeState = {
  getMission: () => mission,

  startMission: (name: string, prompt: string, projectId?: string) => {
    mission = {
      id: `mission_${Date.now()}`,
      name: name || "Untitled",
      prompt: prompt || "",
      stack: "react-vite",
      phase: 1,
      status: "prompt",
      currentPrompt: buildPhase1Prompt(name, prompt),
      capturedContent: "",
      prd: "",
      files: [],
      projectId: projectId || null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    return mission;
  },

  capture: (content: string) => {
    if (!mission) return null;
    mission.capturedContent = content;
    mission.status = "captured";
    mission.updatedAt = Date.now();

    if (mission.phase === 1) {
      mission.prd = content;
      mission.phase = 2;
      mission.status = "prompt";
      mission.currentPrompt = buildPhase2Prompt(mission.name, mission.prd);
      return { phase: 2, status: "prompt" };
    }
    if (mission.phase === 2) {
      mission.files = parseFiles(content);
      mission.phase = 5;
      mission.status = "done";
      mission.currentPrompt = null;
      return { phase: 5, status: "done", fileCount: mission.files.length };
    }
    return { phase: mission.phase, status: mission.status };
  },

  reset: () => { mission = null; },
};
