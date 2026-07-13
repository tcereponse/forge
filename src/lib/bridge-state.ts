// Bridge state — stored in PostgreSQL for Vercel serverless compatibility.
import { db } from "./db";

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

function dbToMission(row: any): Mission {
  return {
    id: row.missionId,
    name: row.name,
    prompt: row.prompt,
    stack: row.stack,
    phase: row.phase,
    status: row.status,
    currentPrompt: row.currentPrompt,
    capturedContent: row.capturedContent,
    prd: row.prd,
    files: (() => { try { return JSON.parse(row.filesJson || "[]"); } catch { return []; } })(),
    projectId: row.projectId,
    createdAt: row.createdAt?.getTime?.() || Date.now(),
    updatedAt: row.updatedAt?.getTime?.() || Date.now(),
  };
}

export const bridgeState = {
  getMission: async (): Promise<Mission | null> => {
    const row = await db.bridgeState.findFirst({ orderBy: { updatedAt: "desc" } });
    if (!row) return null;
    return dbToMission(row);
  },

  startMission: async (name: string, prompt: string, projectId?: string): Promise<Mission> => {
    const missionId = `mission_${Date.now()}`;
    const currentPrompt = buildPhase1Prompt(name, prompt);
    
    // Delete old missions
    await db.bridgeState.deleteMany({});
    
    const row = await db.bridgeState.create({
      data: {
        missionId,
        name: name || "Untitled",
        prompt: prompt || "",
        stack: "react-vite",
        phase: 1,
        status: "prompt",
        currentPrompt,
        capturedContent: "",
        prd: "",
        filesJson: "[]",
        projectId: projectId || null,
      },
    });
    return dbToMission(row);
  },

  capture: async (content: string): Promise<{ phase: number; status: string; fileCount?: number } | null> => {
    const row = await db.bridgeState.findFirst({ orderBy: { updatedAt: "desc" } });
    if (!row) return null;

    let phase = row.phase;
    let status = "captured";
    let prd = row.prd;
    let currentPrompt: string | null = null;
    let filesJson = row.filesJson;
    let fileCount = 0;

    if (row.phase === 1) {
      prd = content;
      phase = 2;
      status = "prompt";
      currentPrompt = buildPhase2Prompt(row.name, prd);
    } else if (row.phase === 2) {
      const files = parseFiles(content);
      filesJson = JSON.stringify(files);
      fileCount = files.length;
      phase = 5;
      status = "done";
      currentPrompt = null;
    }

    await db.bridgeState.update({
      where: { id: row.id },
      data: { phase, status, currentPrompt, capturedContent: content, prd, filesJson },
    });

    return { phase, status, fileCount };
  },

  reset: async (): Promise<void> => {
    await db.bridgeState.deleteMany({});
  },
};
