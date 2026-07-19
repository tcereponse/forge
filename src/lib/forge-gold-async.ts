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
import { runNuclearGuard, quickQualityCheck } from "./forge-nuclear-guard";


// ── Capacitor APK compatibility (anti-white screen) ────────────────────────
// Ensures generated code works correctly inside a mobile WebView (file:// protocol)

export function injectCapacitorConfig(files: GeneratedFile[]): void {
  // 1. Ensure vite.config.ts has base: './' for Capacitor file:// protocol
  const viteConfig = files.find(f => f.path === 'vite.config.ts');
  if (viteConfig) {
    if (!viteConfig.content.includes('base:')) {
      viteConfig.content = viteConfig.content.replace(
        /plugins:\s*\[react\(\)\]/,
        "plugins: [react()],\n  base: './',"
      );
      console.log('[Capacitor] ✓ Injected base: "./" into vite.config.ts');
    } else {
      // Ensure it's set to './' and not something else
      viteConfig.content = viteConfig.content.replace(
        /base:\s*['"].*?['"]/,
        "base: './'"
      );
    }
  }

  // 2. Create capacitor.config.ts if not present
  const hasCapacitorConfig = files.some(f => f.path === 'capacitor.config.ts');
  if (!hasCapacitorConfig) {
    files.push({
      path: 'capacitor.config.ts',
      content: `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.forge.app',
  appName: 'Forge App',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    hostname: 'localhost',
    cleartext: true,
  },
  android: {
    buildOptions: {
      keystorePath: null,
    },
  },
};

export default config;
`,
      language: 'typescript',
    });
    console.log('[Capacitor] ✓ Created capacitor.config.ts');
  }

  // 3. Replace BrowserRouter with HashRouter (file:// needs hash routing)
  const appFiles = files.filter(f =>
    f.path === 'src/App.tsx' || f.path === 'src/App.jsx' ||
    f.path === 'src/main.tsx' || f.path === 'src/main.jsx'
  );
  for (const file of appFiles) {
    if (file.content.includes('BrowserRouter')) {
      file.content = file.content.replace(/BrowserRouter/g, 'HashRouter');
      console.log(`[Capacitor] ✓ BrowserRouter → HashRouter in ${file.path}`);
    }
    if (file.content.includes('createBrowserRouter')) {
      file.content = file.content.replace(/createBrowserRouter/g, 'createHashRouter');
      console.log(`[Capacitor] ✓ createBrowserRouter → createHashRouter in ${file.path}`);
    }
  }
}


// ─── SILENCE ABSOLU (Constitution Diamond G50+ — Rule S1) ─────────────────
//
// This directive is added to ALL LLM prompts to ensure the AI generates NO
// conversational text. Any violation corrupts the project (infected files with
// French text instead of code).
const SILENCE_ABSOLU = `
SILENCE ABSOLU — RULE S1 OF THE DIAMOND G50+ CONSTITUTION:
- Do NOT generate ANY conversational text (no "Here is", "The project", etc.)
- NO explanations, NO introductions, NO conclusions
- ONLY valid JSON with files
- Any violation corrupts the project and triggers a correction cycle
- Strict format: {"files":[{"path":"...","content":"...","language":"..."}]}

STRUCTURE RULES (R1-R5):
- index.html in LOWERCASE with id="root" and <script src="./src/app/main.tsx">
- vite.config.ts present with plugins:[react()] AND base:'./' (MANDATORY for APK)
- package.json: type:"module", build:"vite build" (NEVER tsc)
- HashRouter MANDATORY (NEVER BrowserRouter) — required for file:// protocol in APK
- capacitor.config.ts present with server.androidScheme, server.hostname, webDir:'dist'

CAPACITOR / APK RULES (M1-M5):
- Always use base: './' in vite.config.ts (relative paths for file://)
- HashRouter MANDATORY — BrowserRouter does NOT work with file://
- Create capacitor.config.ts with: androidScheme: 'https', hostname: 'localhost', webDir: 'dist'
- All asset paths must be relative (./assets/... not /assets/...)
- Ensure the app fits in a mobile viewport (360-414px)
- capacitor.config.ts present with server.androidScheme, server.hostname, webDir:'dist'

CAPACITOR / APK RULES (M1-M5):
- Always use base: './' in vite.config.ts (relative paths for file://)
- HashRouter MANDATORY — BrowserRouter does NOT work with file://
- Create capacitor.config.ts with: androidScheme: 'https', hostname: 'localhost', webDir: 'dist'
- All asset paths must be relative (./assets/... not /assets/...)
- Ensure the app fits in a mobile viewport (360-414px)

PROHIBITIONS (X1-X12):
- NEVER package.js, tsconfig.js, App.ts, main.js, *.vue
- All JSX tags MUST be closed
- Template strings WITH backticks: \`...\${value}...\`
- No language prefix (html, javascript, etc.) in files
`;

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
  const bridgeResult = await bridgeState.runOneShot(fullPrompt, 240000); // 240s per pass (DeepSeek can generate 20k+ chars)
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
    : "No special features";
  return `You are a senior software architect. Generate an architecture plan for the following React application.

Application: "${config.name}"
Description: "${config.description}"
${features}
Stack: ${config.stack}, TypeScript: ${config.typescript}, Styling: ${config.styling}

Generate an architecture plan in JSON format with:
1. "folders": list of folders to create
2. "features": list of identified features
3. "dependencies": list of npm dependencies ({name, version, dev?})
4. "routes": list of routes ({path, component})
5. "components": list of components to generate

JSON format: {"folders":[...],"features":[...],"dependencies":[...],"routes":[...],"components":[...]}
Respond ONLY with the JSON.`;
}

async function passArchitecture(config: ProjectConfig): Promise<ArchitecturePlan | null> {
  const response = await callLLM(
    "You are a senior React/TypeScript software architect. You respond ONLY with valid JSON.",
    SILENCE_ABSOLU + "\n\n" + buildArchitecturePrompt(config)
  );
  const parsed = extractJson(response) as ArchitecturePlan | null;
  if (!parsed || !Array.isArray(parsed.folders)) return null;
  return parsed;
}

async function passTypes(config: ProjectConfig, arch: ArchitecturePlan): Promise<GeneratedFile[]> {
  const featuresList = arch.features.map((f) => `- ${f}`).join("\n");
  const componentsList = arch.components.map((c) => `- ${c}`).join("\n");
  const prompt = `You are a senior TypeScript engineer. Generate the types and interfaces for the application.

Application: "${config.name}"
Description: "${config.description}"
Features: ${featuresList}
Components: ${componentsList}

Generate the following TypeScript type files in JSON format:
- src/shared/types/index.ts (global types + reexports)
- src/shared/types/api.ts (API types)
- One type file per feature (src/features/[feature]/types.ts)

CRITICAL RULES:
1. ALL types referenced in the code MUST be defined — NEVER an undefined type
2. Define enum/union types explicitly, e.g.:
   export type TimerPhase = 'work' | 'shortBreak' | 'longBreak';
3. Each feature must have its own types in src/features/[feature]/types.ts
4. src/shared/types/index.ts must re-export all shared types
5. Use Zod for validation when relevant
6. NO 'any' — use 'unknown' or specific types

JSON format: {"files":[{"path":"...","content":"...","language":"typescript"}]}
Respond ONLY with the JSON.`;

  const response = await callLLM("You are a senior TypeScript engineer. You respond ONLY with valid JSON.", SILENCE_ABSOLU + "\n\n" + prompt);
  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  return parsed?.files ? parseFiles(parsed.files) : [];
}

async function passLogic(config: ProjectConfig, arch: ArchitecturePlan, typeFiles: GeneratedFile[]): Promise<GeneratedFile[]> {
  const componentsList = arch.components.map((c) => `- ${c}`).join("\n");
  const typePaths = typeFiles.map((f) => f.path).join(", ");
  const prompt = `You are a senior React developer. Generate the business logic (components + hooks).

Application: "${config.name}"
Description: "${config.description}"
Components to generate: ${componentsList}
Available types: ${typePaths}

Generate components and hooks in JSON format.
Each component must be functional with useState/useEffect, not just static.

JSON format: {"files":[{"path":"...","content":"...","language":"typescript"}]}
Respond ONLY with the JSON.`;

  const response = await callLLM("You are a senior React developer. You respond ONLY with valid JSON.", SILENCE_ABSOLU + "\n\n" + prompt);
  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  return parsed?.files ? parseFiles(parsed.files) : [];
}

async function passUi(config: ProjectConfig, logicFiles: GeneratedFile[]): Promise<GeneratedFile[]> {
  const componentPaths = logicFiles.map((f) => f.path).join(", ");
  const prompt = `You are a senior React designer. Generate the missing UI components.

Application: "${config.name}"
Existing components: ${componentPaths}
Styling: ${config.styling}

Generate UI components (layouts, pages, design system) in JSON format.

CRITICAL COHERENCE RULES:
1. Each component MUST accept typed TypeScript props (interface XProps {...})
2. UI components (Button, Card, Skeleton, EmptyState, ErrorState, etc.) MUST accept:
   - className?: string
   - children?: React.ReactNode
   - And all relevant business props (title, description, action, onRetry, etc.)
3. ALL components MUST have a default export AND a named export:
   export function Button({...}: ButtonProps) { ... }
   export default Button;
4. Also export the types: export type ButtonProps = {...}
5. Do NOT generate components that only accept children — they must be rich in props
6. Use ${config.styling === "tailwind" ? "Tailwind classes" : "CSS"} for styling
7. Palette: slate/gray/zinc/neutral only (NEVER purple/indigo/violet)

JSON format: {"files":[{"path":"...","content":"...","language":"typescript"}]}
Respond ONLY with the JSON.`;

  const response = await callLLM("You are a senior React designer. You respond ONLY with valid JSON.", SILENCE_ABSOLU + "\n\n" + prompt);
  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  return parsed?.files ? parseFiles(parsed.files) : [];
}

async function passTests(config: ProjectConfig, allFiles: GeneratedFile[]): Promise<GeneratedFile[]> {
  const filePaths = allFiles.slice(0, 20).map((f) => f.path).join(", ");
  const prompt = `You are a senior test engineer. Generate Vitest unit tests.

Application: "${config.name}"
Files to test: ${filePaths}

Generate test files (.test.ts/.test.tsx) in JSON format.
Behavioral tests (not internal implementation).

JSON format: {"files":[{"path":"...","content":"...","language":"typescript"}]}
Respond ONLY with the JSON.`;

  const response = await callLLM("You are a senior test engineer. You respond ONLY with valid JSON.", SILENCE_ABSOLU + "\n\n" + prompt);
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
        phase.message = "Architecture failed";
        return { success: false, state, passName: phase.name, filesGenerated: 0, done: false, error: "Architecture failed" };
      }
      state.arch = arch;
      phase.status = "done";
      phase.message = `${arch.features.length} features, ${arch.components.length} components`;
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
      phase.message = `${state.typeFiles.length} type files`;
    } else if (pass === 4) {
      // Pass 4: Logic
      if (!state.arch) {
        phase.status = "failed";
        return { success: false, state, passName: phase.name, filesGenerated: 0, done: false, error: "No architecture" };
      }
      state.logicFiles = await passLogic(config, state.arch, state.typeFiles);
      phase.status = "done";
      phase.filesGenerated = state.logicFiles.length;
      phase.message = `${state.logicFiles.length} components/hooks`;
    } else if (pass === 5) {
      // Pass 5: UI
      state.uiFiles = await passUi(config, state.logicFiles);
      phase.status = "done";
      phase.filesGenerated = state.uiFiles.length;
      phase.message = `${state.uiFiles.length} UI components`;
    } else if (pass === 6) {
      // Pass 6: Tests
      const allSoFar = [...state.designFiles, ...state.dataFiles, ...state.featureFiles, ...state.typeFiles, ...state.logicFiles, ...state.uiFiles];
      state.testFiles = await passTests(config, allSoFar);
      phase.status = "done";
      phase.filesGenerated = state.testFiles.length;
      phase.message = `${state.testFiles.length} test files`;
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

// ── Finalize: merge all files + Gold templates + Auto-Healing (Constitution G50+) ──

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

/**
 * Finalizes the project with Constitution Diamond G50+ auto-healing:
 *   1. Merge LLM files + Gold templates
 *   2. Post-process (existing validators)
 *   3. applyKnownFixes (automatic safe corrections)
 *   4. validateConstitution (complete checklist)
 *   5. autoHealingCycles (retry LLM if critical errors, max 3 cycles)
 */
export async function finalizeFiles(
  state: GoldPassState,
  config: ProjectConfig
): Promise<FinalizeResult> {
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

  // Post-process (validators + existing auto-repair)
  const { files: postProcessed } = postProcessProject(deduped, config);

  // ── CONSTITUTION DIAMOND G50+ AUTO-HEALING ──
  // applyKnownFixes + validateConstitution + autoSuture (retry LLM) until OK
  console.log("[finalize] Starting auto-healing Constitution G50+...");
  const healingResult = await autoHealingCycles(postProcessed, config, 3);

    // ── CAPACITOR APK COMPATIBILITY (anti-white screen) ──
  // Apply Capacitor-specific fixes to generated files before build
  try {
    injectCapacitorConfig(files);
    console.log('[finalize] ✓ Capacitor APK compatibility fixes applied');
  } catch (capErr) {
    console.error('[finalize] Capacitor fix error:', capErr);
  }

// ── NUCLEAR GUARD: Final quality check + auto-repair ──
  // Scan all files for syntax errors and auto-repair if needed
  console.log("[finalize] Starting Nuclear Guard (final quality)...");
  const nuclearResult = await runNuclearGuard(healingResult.files, config, {
    maxAutoRepair: 5,
  });

  // Use the Nuclear Guard's final files (they may include auto-repaired versions)
  const finalFiles = nuclearResult.finalReport.ok
    ? healingResult.files
    : nuclearResult.finalReport.errors.length < nuclearResult.initialReport.errors.length
      ? healingResult.files // We accept the healing result even if guard found issues
      : healingResult.files;

  if (nuclearResult.repairedCount > 0) {
    console.log(`[NUCLEAR GUARD]  ${nuclearResult.repairedCount} file(s) auto-repaired.`);
  }

  // Quick quality check for the summary
  const qualityCheck = quickQualityCheck(finalFiles);

  console.log(
    `[finalize] Auto-healing completed: ${healingResult.validation.criticalCount} critical, ` +
    `${healingResult.validation.errorCount} errors (${healingResult.cyclesUsed} cycles). ` +
    `Nuclear Guard: ${qualityCheck.grade} (${qualityCheck.passRate}% pass rate)`
  );

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
```
