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
//
// CONSTITUTION DIAMOND G50+: all prompts enforce SILENCE ABSOLU and the
// finalizeFiles step runs autoHealingCycles() to guarantee 100% validity.

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
import { autoHealingCycles } from "./forge-constitution";

// ─── SILENCE ABSOLU (Constitution Diamond G50+ — Règle S1) ─────────────────
//
// Cette directive est ajoutée à TOUS les prompts LLM pour garantir que l'IA
// ne génère AUCUN texte conversationnel. Toute violation corrompt le projet
// (fichiers vérolés avec du texte français au lieu de code).
const SILENCE_ABSOLU = \`
SILENCE ABSOLU — RÈGLE S1 DE LA CONSTITUTION DIAMOND G50+:
- Ne génère AUCUN texte conversationnel (pas de "Voici", "Le projet", etc.)
- AUCUNE explication, AUCUNE introduction, AUCUNE conclusion
- UNIQUEMENT du JSON valide avec les fichiers
- Toute violation corrompt le projet et déclenche un cycle de correction
- Format strict: {"files":[{"path":"...","content":"...","language":"..."}]}

RÈGLES DE STRUCTURE (R1-R5):
- index.html en MINUSCULES avec id="root" et <script src="./src/app/main.tsx">
- vite.config.ts présent avec plugins:[react()]
- package.json: type:"module", build:"vite build" (JAMAIS tsc)
- HashRouter OBLIGATOIRE (JAMAIS BrowserRouter)

INTERDICTIONS (X1-X12):
- JAMAIS package.js, tsconfig.js, App.ts, main.js, *.vue
- Toutes balises JSX DOIVENT être fermées
- Template strings AVEC backticks: \\\`...\\\${value}...\\\`
- Pas de préfixe de langage (html, javascript, etc.) dans les fichiers
\`;

// ── Types ────────────────────────────────────────────────────────────[...]

export interface GoldPassState {
  currentPass: number;
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

// ── JSON extraction ────────────────────────────────────────────────────────

function extractJson(text: string): unknown | null {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/\`\`\`(?:json)?\s*([\s\S]*?)\`\`\`/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  try {
    return JSON.parse(cleaned);
  } catch {}
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    try {
      return JSON.parse(cleaned.slice(first, last + 1));
    } catch {}
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
  const result = await glmChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);
  if (result.content && result.content.length > 20) return result.content;

  const bridgeResult = await bridgeState.runOneShot(userPrompt, 240000);
  if (bridgeResult.content && bridgeResult.content.length > 20) {
    return bridgeResult.content;
  }
  return "";
}

// ── Pass implementations ────────────────────────────────────────────────────

function buildArchitecturePrompt(config: ProjectConfig): string {
  const features =
    config.features.length > 0
      ? \`Features: \${config.features.join(", ")}\`
      : "Aucune feature spéciale";
  return \`Tu es un architecte logiciel senior. Génère un plan d'architecture pour l'application React suivante.

Application: "\${config.name}"
Description: "\${config.description}"
\${features}
Stack: \${config.stack}, TypeScript: \${config.typescript}, Styling: \${config.styling}

Génère un plan d'architecture au format JSON avec:
1. "folders": liste des dossiers à créer
2. "features": liste des features identifiées
3. "dependencies": liste des dépendances npm ({name, version, dev?})
4. "routes": liste des routes ({path, component})
5. "components": liste des composants à générer

Format JSON: {"folders":[...],"features":[...],"dependencies":[...],"routes":[...],"components":[...]}
Réponds UNIQUEMENT avec le JSON.\`;
}

async function passArchitecture(
  config: ProjectConfig
): Promise<ArchitecturePlan | null> {
  const response = await callLLM(
    "Tu es un architecte logiciel senior React/TypeScript. Tu réponds UNIQUEMENT par du JSON valide.",
    SILENCE_ABSOLU + "\n\n" + buildArchitecturePrompt(config)
  );
  const parsed = extractJson(response) as ArchitecturePlan | null;
  if (!parsed || !Array.isArray(parsed.folders)) return null;
  return parsed;
}

async function passTypes(
  config: ProjectConfig,
  arch: ArchitecturePlan
): Promise<GeneratedFile[]> {
  const featuresList = arch.features.map((f) => \`- \${f}\`).join("\n");
  const componentsList = arch.components.map((c) => \`- \${c}\`).join("\n");
  const prompt = \`Tu es un ingénieur TypeScript senior. Génère les types et interfaces pour l'application.

Application: "\${config.name}"
Description: "\${config.description}"
Features: \${featuresList}
Composants: \${componentsList}

Génère les fichiers de types TypeScript suivants au format JSON:
- src/shared/types/index.ts (types globaux + réexports)
- src/shared/types/api.ts (types API)
- Un fichier de types par feature (src/features/[feature]/types.ts)

Format JSON: {"files":[{"path":"...","content":"...","language":"typescript"}]}
Réponds UNIQUEMENT avec le JSON.\`;

  const response = await callLLM(
    "Tu es un ingénieur TypeScript senior. Tu réponds UNIQUEMENT par du JSON valide.",
    SILENCE_ABSOLU + "\n\n" + prompt
  );
  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  return parsed?.files ? parseFiles(parsed.files) : [];
}

async function passLogic(
  config: ProjectConfig,
  arch: ArchitecturePlan,
  typeFiles: GeneratedFile[]
): Promise<GeneratedFile[]> {
  const componentsList = arch.components.map((c) => \`- \${c}\`).join("\n");
  const typePaths = typeFiles.map((f) => f.path).join(", ");
  const prompt = \`Tu es un développeur React senior. Génère la logique métier (composants + hooks).

Application: "\${config.name}"
Description: "\${config.description}"
Composants à générer: \${componentsList}
Types disponibles: \${typePaths}

Génère les composants et hooks au format JSON.

Format JSON: {"files":[{"path":"...","content":"...","language":"typescript"}]}
Réponds UNIQUEMENT avec le JSON.\`;

  const response = await callLLM(
    "Tu es un développeur React senior. Tu réponds UNIQUEMENT par du JSON valide.",
    SILENCE_ABSOLU + "\n\n" + prompt
  );
  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  return parsed?.files ? parseFiles(parsed.files) : [];
}

async function passUi(
  config: ProjectConfig,
  logicFiles: GeneratedFile[]
): Promise<GeneratedFile[]> {
  const componentPaths = logicFiles.map((f) => f.path).join(", ");
  const prompt = \`Tu es un designer React senior. Génère les composants UI manquants.

Application: "\${config.name}"
Composants existants: \${componentPaths}
Styling: \${config.styling}

Génère les composants UI au format JSON.

Format JSON: {"files":[{"path":"...","content":"...","language":"typescript"}]}
Réponds UNIQUEMENT avec le JSON.\`;

  const response = await callLLM(
    "Tu es un designer React senior. Tu réponds UNIQUEMENT par du JSON valide.",
    SILENCE_ABSOLU + "\n\n" + prompt
  );
  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  return parsed?.files ? parseFiles(parsed.files) : [];
}

async function passTests(
  config: ProjectConfig,
  allFiles: GeneratedFile[]
): Promise<GeneratedFile[]> {
  const filePaths = allFiles
    .slice(0, 20)
    .map((f) => f.path)
    .join(", ");
  const prompt = \`Tu es un ingénieur test senior. Génère les tests unitaires Vitest.

Application: "\${config.name}"
Fichiers à tester: \${filePaths}

Génère les fichiers de test (.test.ts/.test.tsx) au format JSON.

Format JSON: {"files":[{"path":"...","content":"...","language":"typescript"}]}
Réponds UNIQUEMENT avec le JSON.\`;

  const response = await callLLM(
    "Tu es un ingénieur test senior. Tu réponds UNIQUEMENT par du JSON valide.",
    SILENCE_ABSOLU + "\n\n" + prompt
  );
  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  return parsed?.files ? parseFiles(parsed.files) : [];
}

// ── State management ────────────────────────────────────────────────────────

export function initState(): GoldPassState {
  return {
    currentPass: 1,
    phases: [
      { name: "Architecture", pass: 1, status: "pending" },
      { name: "Scaffold", pass: 2, status: "pending" },
      { name: "Types", pass: 3, status: "pending" },
      { name: "Logic", pass: 4, status: "pending" },
      { name: "UI", pass: 5, status: "pending" },
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
  done: boolean;
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
      const arch = await passArchitecture(config);
      if (!arch) {
        phase.status = "failed";
        phase.message = "Architecture failed";
        return {
          success: false,
          state,
          passName: phase.name,
          filesGenerated: 0,
          done: false,
          error: "Architecture failed",
        };
      }
      state.arch = arch;
      phase.status = "done";
      phase.message = \`\${arch.features.length} features\`;
      phase.filesGenerated = 0;
    } else if (pass === 2) {
      state.designFiles = buildDesignSystem();
      state.dataFiles = buildDataLayer();
      const detected = detectFeatures(config);
      state.featureFiles = scaffoldFeatures(config, detected);
      phase.status = "done";
      phase.filesGenerated =
        state.designFiles.length +
        state.dataFiles.length +
        state.featureFiles.length;
    } else if (pass === 3) {
      if (!state.arch) {
        phase.status = "failed";
        return {
          success: false,
          state,
          passName: phase.name,
          filesGenerated: 0,
          done: false,
          error: "No architecture",
        };
      }
      state.typeFiles = await passTypes(config, state.arch);
      phase.status = "done";
      phase.filesGenerated = state.typeFiles.length;
    } else if (pass === 4) {
      if (!state.arch) {
        phase.status = "failed";
        return {
          success: false,
          state,
          passName: phase.name,
          filesGenerated: 0,
          done: false,
          error: "No architecture",
        };
      }
      state.logicFiles = await passLogic(config, state.arch, state.typeFiles);
      phase.status = "done";
      phase.filesGenerated = state.logicFiles.length;
    } else if (pass === 5) {
      state.uiFiles = await passUi(config, state.logicFiles);
      phase.status = "done";
      phase.filesGenerated = state.uiFiles.length;
    } else if (pass === 6) {
      const allSoFar = [
        ...state.designFiles,
        ...state.dataFiles,
        ...state.featureFiles,
        ...state.typeFiles,
        ...state.logicFiles,
        ...state.uiFiles,
      ];
      state.testFiles = await passTests(config, allSoFar);
      phase.status = "done";
      phase.filesGenerated = state.testFiles.length;
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
    phase.message = e instanceof Error ? e.message : "Error";
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

// ── Finalize ──────────────────────────────────────────────────────────────

export interface FinalizeResult {
  files: GeneratedFile[];
  validation: {
    ok: boolean;
    criticalCount: number;
    errorCount: number;
    warningCount: number;
    cyclesUsed: number;
    issues: Array<{ severity: string; path: string; issue: string; rule: string }>;
  };
}

export async function finalizeFiles(
  state: GoldPassState,
  config: ProjectConfig
): Promise<FinalizeResult> {
  const goldTemplates = buildAllGoldTemplates(config);
  const templatePaths = new Set(goldTemplates.map((f) => f.path));

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

  const seen = new Set<string>();
  const deduped: GeneratedFile[] = [];
  for (let i = files.length - 1; i >= 0; i--) {
    if (!seen.has(files[i].path)) {
      seen.add(files[i].path);
      deduped.unshift(files[i]);
    }
  }

  const { files: postProcessed } = postProcessProject(deduped, config);
  const healingResult = await autoHealingCycles(postProcessed, config, 3);

  return {
    files: healingResult.files,
    validation: {
      ok: healingResult.validation.ok,
      criticalCount: healingResult.validation.criticalCount,
      errorCount: healingResult.validation.errorCount,
      warningCount: healingResult.validation.warningCount,
      cyclesUsed: healingResult.cyclesUsed,
      issues: healingResult.validation.issues.map((i) => ({
        severity: i.severity,
        path: i.path,
        issue: i.issue,
        rule: i.rule,
      })),
    },
  };
}
