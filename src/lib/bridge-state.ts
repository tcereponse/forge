// Bridge state — stored in PostgreSQL for Vercel serverless compatibility.
// Connects KIROV3 extension captures to Forge projects.
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

/**
 * Parse files from DeepSeek's response.
 * DeepSeek wraps JSON in markdown fences (```json ... ```) or adds text around it.
 * This function handles all cases:
 *   1. Direct JSON
 *   2. Markdown code fences
 *   3. Text before/after JSON
 *   4. Truncated JSON (extracts complete file objects via regex)
 */
function parseFiles(content: string): any[] {
  if (!content || content.length === 0) return [];

  let cleaned = content.trim();

  // Step 1: Strip markdown code fences (```json ... ``` or ``` ... ```)
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Step 2: Try direct parse
  try {
    const p = JSON.parse(cleaned);
    if (p.files && Array.isArray(p.files)) return p.files;
  } catch {
    /* continue */
  }

  // Step 3: Find the outermost { ... } containing "files"
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const slice = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      const p = JSON.parse(slice);
      if (p.files && Array.isArray(p.files)) return p.files;
    } catch {
      /* continue to regex repair */
    }
  }

  // Step 4: Regex repair — extract individual file objects
  // Pattern: { "path": "...", "content": "...", "language": "..." }
  const files: any[] = [];
  const fileRegex =
    /\{\s*"path"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"(?:\s*,\s*"language"\s*:\s*"((?:[^"\\]|\\.)*)")?\s*\}/g;
  let match: RegExpExecArray | null;
  while ((match = fileRegex.exec(cleaned)) !== null) {
    try {
      files.push({
        path: JSON.parse(`"${match[1]}"`),
        content: JSON.parse(`"${match[2]}"`),
        language: match[3] ? JSON.parse(`"${match[3]}"`) : undefined,
      });
    } catch {
      // If unescape fails, use raw values
      files.push({
        path: match[1].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\'),
        content: match[2].replace(/\\"/g, '"').replace(/\\n/g, '\n').replace(/\\\\/g, '\\'),
        language: match[3] || undefined,
      });
    }
  }
  return files;
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

/**
 * Apply captured data to a Forge project.
 * Phase 1 capture → updates project.prd
 * Phase 5 capture → updates project.filesJson, fileCount, status
 */
async function applyToProject(
  projectId: string,
  phase: number,
  prd: string,
  files: any[]
): Promise<void> {
  try {
    const project = await db.project.findUnique({ where: { id: projectId } });
    if (!project) return; // Project doesn't exist — skip silently

    if (phase === 2 && prd) {
      // PRD captured → update project PRD + arsenal
      await db.project.update({
        where: { id: projectId },
        data: {
          prd,
          status: "generating",
        },
      });
    } else if (phase === 5 && files.length > 0) {
      // Code captured → update project files + mark ready
      await db.project.update({
        where: { id: projectId },
        data: {
          filesJson: JSON.stringify(files),
          fileCount: files.length,
          status: "ready",
          installStatus: "pending",
          buildStatus: "pending",
        },
      });
    }
  } catch (e) {
    console.error("[bridge] applyToProject failed:", e);
  }
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
    let parsedFiles: any[] = [];

    if (row.phase === 1) {
      // Phase 1: PRD captured → advance to phase 2
      prd = content;
      phase = 2;
      status = "prompt";
      currentPrompt = buildPhase2Prompt(row.name, prd);
    } else if (row.phase === 2) {
      // Phase 2: Code captured → parse files, advance to phase 5 (done)
      parsedFiles = parseFiles(content);
      filesJson = JSON.stringify(parsedFiles);
      fileCount = parsedFiles.length;
      phase = 5;
      status = "done";
      currentPrompt = null;
    }

    await db.bridgeState.update({
      where: { id: row.id },
      data: { phase, status, currentPrompt, capturedContent: content, prd, filesJson },
    });

    // Apply to Forge project if linked
    if (row.projectId) {
      await applyToProject(row.projectId, phase, prd, parsedFiles);
    }

    return { phase, status, fileCount };
  },

  /**
   * Apply captured bridge data to a specific Forge project.
   * Used when the user wants to push bridge capture → project tabs.
   */
  applyToProject: async (projectId: string): Promise<{ success: boolean; fileCount: number; prdLength: number }> => {
    const m = await bridgeState.getMission();
    if (!m) return { success: false, fileCount: 0, prdLength: 0 };

    const files = m.files || [];
    await applyToProject(projectId, m.phase, m.prd, files);

    return {
      success: true,
      fileCount: files.length,
      prdLength: m.prd.length,
    };
  },

  reset: async (): Promise<void> => {
    await db.bridgeState.deleteMany({});
  },
};
