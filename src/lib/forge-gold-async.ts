// forge-gold-async.ts — Async Gold pipeline (pass-by-pass for Vercel serverless).
//
// The Gold pipeline has 6 passes. On Vercel serverless (300s limit), running all
// 6 passes in one request times out when using the KIROV Bridge (DeepSeek).
//
// This module splits the pipeline into individual passes. Each pass runs in its
// own HTTP request. The frontend orchestrates the sequence:
//   1. POST /api/projects/[id]/gold/start → runs pass 1 (architecture)
//   2. POST /api/projects/[id]/gold/next  → runs next pass
//   3. Repeat until "done"
//
// Intermediate state (architecture plan + accumulated files) is stored in the
// project's `arsenalJson` field as JSON.

import type { ProjectConfig, GeneratedFile } from "./forge-config";
import {
  runAllValidationGates,
  buildCorrectivePrompt,
  type ValidationGateResult,
} from "./forge-validators";
import { unescapeJsonString } from "./forge-anticorruption";
import { detectFeatures, scaffoldFeatures } from "./forge-scaffolder";
import { buildDesignSystem } from "./forge-design-system";
import { buildDataLayer } from "./forge-data-layer";
import { inferLanguage } from "./forge-config";
import { glmChat } from "./glm-direct";
import { bridgeState } from "./bridge-state";
import { buildAllGoldTemplates } from "./forge-gold-templates";
import { postProcessProject } from "./forge-postprocess";

// ── Types ───────────────────────────────────────────────────────────────────

export interface GoldPassState {
  currentPass: number;        // next pass to run (1-6), 0 = not started, 7 = done
  phases: PhaseInfo[];
  arch: ArchitecturePlan | null;
  designFiles: GeneratedFile[];
  dataFiles: GeneratedFile[];
  featureFiles: GeneratedFile[];
  typeFiles: GeneratedFile[];
  logicFiles: GeneratedFile[];
  uiFiles: GeneratedFile[];
  testFiles: GeneratedFile[];
}

interface PhaseInfo {
  name: string;
  pass: number;
  status: "pending" | "running" | "done" | "failed" | "skipped";
  message?: string;
  filesGenerated?: number;
}

interface ArchitecturePlan {
  folders: string[];
  features: string[];
  dependencies: { name: string; version: string; dev?: boolean }[];
  routes: { path: string; component: string }[];
  components: string[];
}

interface RawFile {
  path: string;
  content?: string;
  language?: string;
}

// ── JSON extraction ─────────────────────────────────────────────────────────

function extractJson(text: string): unknown | null {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  try { return JSON.parse(cleaned); } catch {}
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch {}
  }
  return null;
}

function parseFiles(raw: unknown): GeneratedFile[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const files: GeneratedFile[] = [];
  for (const f of raw) {
    if (typeof f !== "object" || f === null || !("path" in f)) continue;
    const rf = f as RawFile;
    const path = String(rf.path).replace(/^\.?\//, "").trim();
    if (!path || seen.has(path)) continue;
    seen.add(path);
    files.push({
      path,
      content: String(rf.content ?? ""),
      language: rf.language || inferLanguage(path),
    });
  }
  return files;
}

// ── LLM call (GLM + Bridge fallback) ────────────────────────────────────────

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  // Strategy 1: GLM direct
  const result = await glmChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);
  if (result.content && result.content.length > 20) return result.content;

  // Strategy 2: KIROV Bridge (DeepSeek via extension)
  console.log(`[gold-async] GLM failed, falling back to bridge...`);
  const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;
  const bridgeResult = await bridgeState.runOneShot(fullPrompt, 90000); // 90s per pass
  if (bridgeResult.content && bridgeResult.content.length > 20) {
    console.log(`[gold-async] Bridge OK (${bridgeResult.content.length} chars)`);
    return bridgeResult.content;
  }
  return "";
}

// ── Pass implementations ────────────────────────────────────────────────────

function buildArchitecturePrompt(config: ProjectConfig): string {
  const features = config.features.length > 0
    ? `Features: ${config.features.join(", ")}`
    : "Aucune feature spéciale";
  return `Tu es un architecte logiciel senior. Génère un plan d'architecture pour l'application React suivante.

Application: "${config.name}"
Description: "${config.description}"
${features}
Stack: ${config.stack}, TypeScript: ${config.typescript}, Styling: ${config.styling}

Génère un plan d'architecture au format JSON avec:
1. "folders": liste des dossiers à créer
2. "features": liste des features identifiées
3. "dependencies": liste des dépendances npm ({name, version, dev?})
4. "routes": liste des routes ({path, component})
5. "components": liste des composants à générer

Format JSON: {"folders":[...],"features":[...],"dependencies":[...],"routes":[...],"components":[...]}
Réponds UNIQUEMENT avec le JSON.`;
}

async function passArchitecture(config: ProjectConfig): Promise<ArchitecturePlan | null> {
  const response = await callLLM(
    "Tu es un architecte logiciel senior React/TypeScript. Tu réponds UNIQUEMENT par du JSON valide.",
    buildArchitecturePrompt(config)
  );
  const parsed = extractJson(response) as ArchitecturePlan | null;
  if (!parsed || !Array.isArray(parsed.folders)) return null;
  return parsed;
}

async function passTypes(config: ProjectConfig, arch: ArchitecturePlan): Promise<GeneratedFile[]> {
  const featuresList = arch.features.map((f) => `- ${f}`).join("\n");
  const componentsList = arch.components.map((c) => `- ${c}`).join("\n");
  const prompt = `Tu es un ingénieur TypeScript senior. Génère les types et interfaces pour l'application.

Application: "${config.name}"
Description: "${config.description}"
Features: ${featuresList}
Composants: ${componentsList}

Génère les fichiers de types TypeScript suivants au format JSON:
- src/shared/types/index.ts (types globaux + réexports)
- src/shared/types/api.ts (types API)
- Un fichier de types par feature (src/features/[feature]/types.ts)

RÈGLES CRITIQUES:
1. TOUS les types référencés dans le code DOIVENT être définis — JAMAIS de type non défini
2. Définis les types d'enum/union explicitement, ex:
   export type TimerPhase = 'work' | 'shortBreak' | 'longBreak';
3. Chaque feature doit avoir ses propres types dans src/features/[feature]/types.ts
4. src/shared/types/index.ts doit réexporter tous les types partagés
5. Utilise Zod pour la validation quand pertinent
6. PAS de 'any' — utilise 'unknown' ou des types spécifiques

Format JSON: {"files":[{"path":"...","content":"...","language":"typescript"}]}
Réponds UNIQUEMENT avec le JSON.`;

  const response = await callLLM("Tu es un ingénieur TypeScript senior. Tu réponds UNIQUEMENT par du JSON valide.", prompt);
  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  return parsed?.files ? parseFiles(parsed.files) : [];
}

async function passLogic(config: ProjectConfig, arch: ArchitecturePlan, typeFiles: GeneratedFile[]): Promise<GeneratedFile[]> {
  const componentsList = arch.components.map((c) => `- ${c}`).join("\n");
  const typePaths = typeFiles.map((f) => f.path).join(", ");
  const prompt = `Tu es un développeur React senior. Génère la logique métier (composants + hooks).

Application: "${config.name}"
Description: "${config.description}"
Composants à générer: ${componentsList}
Types disponibles: ${typePaths}

Génère les composants et hooks au format JSON.
Chaque composant doit être fonctionnel avec useState/useEffect, pas juste statique.

Format JSON: {"files":[{"path":"...","content":"...","language":"typescript"}]}
Réponds UNIQUEMENT avec le JSON.`;

  const response = await callLLM("Tu es un développeur React senior. Tu réponds UNIQUEMENT par du JSON valide.", prompt);
  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  return parsed?.files ? parseFiles(parsed.files) : [];
}

async function passUi(config: ProjectConfig, logicFiles: GeneratedFile[]): Promise<GeneratedFile[]> {
  const componentPaths = logicFiles.map((f) => f.path).join(", ");
  const prompt = `Tu es un designer React senior. Génère les composants UI manquants.

Application: "${config.name}"
Composants existants: ${componentPaths}
Styling: ${config.styling}

Génère les composants UI (layouts, pages, design system) au format JSON.

RÈGLES CRITIQUES DE COHÉRENCE:
1. Chaque composant DOIT accepter des props TypeScript typées (interface XProps {...})
2. Les composants UI (Button, Card, Skeleton, EmptyState, ErrorState, etc.) DOIVENT accepter:
   - className?: string
   - children?: React.ReactNode
   - Et toutes les props métier pertinentes (title, description, action, onRetry, etc.)
3. TOUS les composants DOIVENT avoir un export default ET un export nommé:
   export function Button({...}: ButtonProps) { ... }
   export default Button;
4. Exporte aussi les types: export type ButtonProps = {...}
5. NE génère PAS de composants qui n'acceptent que children — ils doivent être riches en props
6. Utilise ${config.styling === "tailwind" ? "des classes Tailwind" : "du CSS"} pour le style
7. Palette: slate/gray/zinc/neutral uniquement (JAMAIS purple/indigo/violet)

Format JSON: {"files":[{"path":"...","content":"...","language":"typescript"}]}
Réponds UNIQUEMENT avec le JSON.`;

  const response = await callLLM("Tu es un designer React senior. Tu réponds UNIQUEMENT par du JSON valide.", prompt);
  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  return parsed?.files ? parseFiles(parsed.files) : [];
}

async function passTests(config: ProjectConfig, allFiles: GeneratedFile[]): Promise<GeneratedFile[]> {
  const filePaths = allFiles.slice(0, 20).map((f) => f.path).join(", ");
  const prompt = `Tu es un ingénieur test senior. Génère les tests unitaires Vitest.

Application: "${config.name}"
Fichiers à tester: ${filePaths}

Génère les fichiers de test (.test.ts/.test.tsx) au format JSON.
Tests de comportement (pas d'implémentation interne).

Format JSON: {"files":[{"path":"...","content":"...","language":"typescript"}]}
Réponds UNIQUEMENT avec le JSON.`;

  const response = await callLLM("Tu es un ingénieur test senior. Tu réponds UNIQUEMENT par du JSON valide.", prompt);
  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  return parsed?.files ? parseFiles(parsed.files) : [];
}

// ── State management ────────────────────────────────────────────────────────

export function initState(): GoldPassState {
  return {
    currentPass: 1,
    phases: [
      { name: "Architecture", pass: 1, status: "pending" },
      { name: "Scaffold (Design + Data + Features)", pass: 2, status: "pending" },
      { name: "Types", pass: 3, status: "pending" },
      { name: "Business Logic", pass: 4, status: "pending" },
      { name: "UI Components", pass: 5, status: "pending" },
      { name: "Tests", pass: 6, status: "pending" },
    ],
    arch: null,
    designFiles: [],
    dataFiles: [],
    featureFiles: [],
    typeFiles: [],
    logicFiles: [],
    uiFiles: [],
    testFiles: [],
  };
}

export function serializeState(state: GoldPassState): string {
  return JSON.stringify(state);
}

export function deserializeState(json: string): GoldPassState | null {
  try {
    const obj = JSON.parse(json);
    if (obj && typeof obj.currentPass === "number") return obj as GoldPassState;
  } catch {}
  return null;
}

// ── Run a single pass ───────────────────────────────────────────────────────

export interface PassResult {
  success: boolean;
  state: GoldPassState;
  passName: string;
  filesGenerated: number;
  done: boolean;       // true when all 6 passes complete
  error?: string;
}

export async function runNextPass(
  config: ProjectConfig,
  state: GoldPassState
): Promise<PassResult> {
  const pass = state.currentPass;

  if (pass > 6) {
    return { success: true, state, passName: "Done", filesGenerated: 0, done: true };
  }

  const phaseIdx = pass - 1;
  const phase = state.phases[phaseIdx];
  phase.status = "running";

  try {
    if (pass === 1) {
      // Pass 1: Architecture
      const arch = await passArchitecture(config);
      if (!arch) {
        phase.status = "failed";
        phase.message = "Échec architecture";
        return { success: false, state, passName: phase.name, filesGenerated: 0, done: false, error: "Architecture failed" };
      }
      state.arch = arch;
      phase.status = "done";
      phase.message = `${arch.features.length} features, ${arch.components.length} composants`;
      phase.filesGenerated = 0;
    } else if (pass === 2) {
      // Pass 2: Scaffold (deterministic, no LLM)
      state.designFiles = buildDesignSystem();
      state.dataFiles = buildDataLayer();
      const detected = detectFeatures(config);
      state.featureFiles = scaffoldFeatures(config, detected);
      phase.status = "done";
      phase.filesGenerated = state.designFiles.length + state.dataFiles.length + state.featureFiles.length;
      phase.message = `${state.designFiles.length} UI + ${state.dataFiles.length} data + ${state.featureFiles.length} features`;
    } else if (pass === 3) {
      // Pass 3: Types
      if (!state.arch) {
        phase.status = "failed";
        return { success: false, state, passName: phase.name, filesGenerated: 0, done: false, error: "No architecture" };
      }
      state.typeFiles = await passTypes(config, state.arch);
      phase.status = "done";
      phase.filesGenerated = state.typeFiles.length;
      phase.message = `${state.typeFiles.length} fichiers types`;
    } else if (pass === 4) {
      // Pass 4: Logic
      if (!state.arch) {
        phase.status = "failed";
        return { success: false, state, passName: phase.name, filesGenerated: 0, done: false, error: "No architecture" };
      }
      state.logicFiles = await passLogic(config, state.arch, state.typeFiles);
      phase.status = "done";
      phase.filesGenerated = state.logicFiles.length;
      phase.message = `${state.logicFiles.length} composants/hooks`;
    } else if (pass === 5) {
      // Pass 5: UI
      state.uiFiles = await passUi(config, state.logicFiles);
      phase.status = "done";
      phase.filesGenerated = state.uiFiles.length;
      phase.message = `${state.uiFiles.length} composants UI`;
    } else if (pass === 6) {
      // Pass 6: Tests
      const allSoFar = [...state.designFiles, ...state.dataFiles, ...state.featureFiles, ...state.typeFiles, ...state.logicFiles, ...state.uiFiles];
      state.testFiles = await passTests(config, allSoFar);
      phase.status = "done";
      phase.filesGenerated = state.testFiles.length;
      phase.message = `${state.testFiles.length} fichiers tests`;
    }

    state.currentPass = pass + 1;
    const done = state.currentPass > 6;
    return {
      success: true,
      state,
      passName: phase.name,
      filesGenerated: phase.filesGenerated || 0,
      done,
    };
  } catch (e) {
    phase.status = "failed";
    phase.message = e instanceof Error ? e.message : "Erreur";
    return {
      success: false,
      state,
      passName: phase.name,
      filesGenerated: 0,
      done: false,
      error: phase.message,
    };
  }
}

// ── Finalize: merge all files + Gold templates ─────────────────────────────

export function finalizeFiles(state: GoldPassState, config: ProjectConfig): GeneratedFile[] {
  // Start with Gold templates (Docker, CI/CD, ESLint, Vitest, docs)
  const goldTemplates = buildAllGoldTemplates(config);
  const templatePaths = new Set(goldTemplates.map((f) => f.path));

  // Add LLM-generated files (LLM wins on src/ paths, templates win on config)
  let files = [...goldTemplates];
  const llmFiles = [
    ...state.designFiles,
    ...state.dataFiles,
    ...state.featureFiles,
    ...state.typeFiles,
    ...state.logicFiles,
    ...state.uiFiles,
    ...state.testFiles,
  ];
  for (const f of llmFiles) {
    if (!templatePaths.has(f.path)) files.push(f);
  }

  // Dedupe (later files win)
  const seen = new Set<string>();
  const deduped: GeneratedFile[] = [];
  for (let i = files.length - 1; i >= 0; i--) {
    if (!seen.has(files[i].path)) {
      seen.add(files[i].path);
      deduped.unshift(files[i]);
    }
  }

  // Post-process (validators + auto-repair)
  const { files: finalFiles } = postProcessProject(deduped, config);
  return finalFiles;
}
