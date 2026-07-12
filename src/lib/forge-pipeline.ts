// forge-pipeline.ts — Multi-pass generation pipeline with validation gates.
//
// Pipeline Gold Grade Industrial:
//   Pass 1: Architecture  → folder structure + dependency map + routing map
//   Gate 1: Validate architecture JSON
//   Pass 2: Types         → TypeScript interfaces + Zod schemas
//   Gate 2: Validate types compile + are imported correctly
//   Pass 3: Business logic → components + hooks + services
//   Gate 3: Validate imports resolve + exports match
//   Pass 4: UI           → design system + states (loading/error/empty)
//   Gate 4: Validate React architecture + JSX syntax
//   Pass 5: Tests        → unit tests + integration tests
//   Gate 5: Final validation (all gates)
//
// If a gate fails, retry the pass with a corrective prompt (max 2 retries).

import ZAI from "z-ai-web-dev-sdk";
import type {
  ProjectConfig,
  GeneratedFile,
} from "./forge-config";
import { inferLanguage } from "./forge-config";
import {
  runAllValidationGates,
  buildCorrectivePrompt,
  type ValidationGateResult,
} from "./forge-validators";
import { unescapeJsonString } from "./forge-anticorruption";

export interface PipelinePhase {
  name: string;
  pass: number;
  status: "pending" | "running" | "done" | "failed" | "skipped";
  message?: string;
  filesGenerated?: number;
  retries?: number;
}

export interface PipelineResult {
  success: boolean;
  files: GeneratedFile[];
  phases: PipelinePhase[];
  validation: {
    ok: boolean;
    totalErrors: number;
    totalWarnings: number;
    results: { gate: string; result: ValidationGateResult }[];
  };
  error?: string;
}

interface RawFile {
  path: string;
  content?: string;
  language?: string;
}

// ── JSON extraction (handles markdown fences + truncated JSON) ─────────────
function extractJson(text: string): unknown | null {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    /* continue */
  }
  const first = cleaned.indexOf("{");
  const last = cleaned.lastIndexOf("}");
  if (first !== -1 && last !== -1 && last > first) {
    try {
      return JSON.parse(cleaned.slice(first, last + 1));
    } catch {
      /* continue */
    }
  }
  // Truncated JSON repair: extract complete file objects
  const filesStart = cleaned.indexOf('"files"');
  if (filesStart !== -1) {
    const arrayStart = cleaned.indexOf("[", filesStart);
    if (arrayStart !== -1) {
      const files: RawFile[] = [];
      const fileRegex =
        /\{\s*"path"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"(?:\s*,\s*"language"\s*:\s*"((?:[^"\\]|\\.)*)")?\s*\}/g;
      let match: RegExpExecArray | null;
      while ((match = fileRegex.exec(cleaned)) !== null) {
        files.push({
          path: unescapeJsonString(match[1]),
          content: unescapeJsonString(match[2]),
          language: match[3] ? unescapeJsonString(match[3]) : undefined,
        });
      }
      if (files.length > 0) {
        return { files };
      }
    }
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

async function callLLM(
  systemPrompt: string,
  userPrompt: string,
  signal?: AbortSignal
): Promise<string> {
  const zai = await ZAI.create();
  const completion = await zai.chat.completions.create({
    messages: [
      { role: "assistant", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    thinking: { type: "disabled" },
  });
  return completion.choices[0]?.message?.content ?? "";
}

// ── Pass 1: Architecture ───────────────────────────────────────────────────
interface ArchitecturePlan {
  folders: string[];
  features: string[];
  dependencies: { name: string; version: string; dev?: boolean }[];
  routes: { path: string; component: string }[];
  components: string[];
}

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
1. "folders": liste des dossiers à créer (ex: "src/features/auth", "src/shared/ui")
2. "features": liste des features identifiées (ex: "auth", "tasks", "dashboard")
3. "dependencies": liste des dépendances npm nécessaires ({name, version, dev?})
4. "routes": liste des routes ({path, component})
5. "components": liste des composants à générer (ex: "TaskList", "TaskForm", "Header")

RÈGLES:
- Architecture feature-based (dossiers par feature, pas flat)
- Inclus react-router-dom si routing
- Inclus zustand si state management
- Inclus @tanstack/react-query pour la couche données
- Inclus zod pour la validation
- Inclus lucide-react pour les icônes
- Maximum 8 composants (MVP)

Format JSON: {"folders":[...],"features":[...],"dependencies":[...],"routes":[...],"components":[...]}
Réponds UNIQUEMENT avec le JSON.`;
}

async function passArchitecture(
  config: ProjectConfig,
  phase: PipelinePhase
): Promise<ArchitecturePlan | null> {
  phase.status = "running";
  phase.message = "Génération du plan d'architecture...";

  const systemPrompt =
    "Tu es un architecte logiciel senior React/TypeScript. Tu réponds UNIQUEMENT par du JSON valide.";
  const userPrompt = buildArchitecturePrompt(config);

  const response = await callLLM(systemPrompt, userPrompt);
  const parsed = extractJson(response) as ArchitecturePlan | null;

  if (!parsed || !Array.isArray(parsed.folders)) {
    phase.status = "failed";
    phase.message = "Échec: plan d'architecture invalide";
    return null;
  }

  phase.status = "done";
  phase.message = `${parsed.features.length} features, ${parsed.components.length} composants, ${parsed.dependencies.length} dépendances`;
  phase.filesGenerated = 0;
  return parsed;
}

// ── Pass 2: Types ──────────────────────────────────────────────────────────
function buildTypesPrompt(
  config: ProjectConfig,
  arch: ArchitecturePlan
): string {
  const featuresList = arch.features.map((f) => `- ${f}`).join("\n");

  return `Tu es un ingénieur TypeScript senior. Génère les types et schémas pour l'application suivante.

Application: "${config.name}"
Description: "${config.description}"
Features:
${featuresList}

Génère les fichiers de types au format JSON:
1. "src/shared/types/index.ts" — types globaux (User, ApiError, etc.)
2. Une feature par dossier: "src/features/{feature}/types.ts" — types spécifiques + schémas Zod

Pour chaque feature, inclus:
- Les interfaces TypeScript (entités, props de composants)
- Les schémas Zod pour la validation runtime
- Les types d'input/output pour les opérations CRUD

RÈGLES:
- TypeScript strict: pas de 'any', utilise 'unknown' si nécessaire
- Toutes les entités ont un 'id: string'
- Props de composants suffixées par 'Props' (ex: TaskListProps)
- Schémas Zod suffixés par 'Schema' (ex: taskSchema)
- Incls ${"import { z } from 'zod'"} dans les fichiers avec schémas

Format JSON: {"files":[{"path":"...","content":"...","language":"typescript"}]}
Réponds UNIQUEMENT avec le JSON.`;
}

async function passTypes(
  config: ProjectConfig,
  arch: ArchitecturePlan,
  phase: PipelinePhase
): Promise<GeneratedFile[]> {
  phase.status = "running";
  phase.message = "Génération des types TypeScript + Zod...";

  const response = await callLLM(
    "Tu es un ingénieur TypeScript senior. Tu réponds UNIQUEMENT par du JSON valide.",
    buildTypesPrompt(config, arch)
  );

  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  if (!parsed?.files) {
    phase.status = "failed";
    phase.message = "Échec: types invalides";
    return [];
  }

  const files = parseFiles(parsed.files);
  phase.status = "done";
  phase.message = `${files.length} fichiers de types générés`;
  phase.filesGenerated = files.length;
  return files;
}

// ── Pass 3: Business logic (components + hooks + services) ─────────────────
function buildLogicPrompt(
  config: ProjectConfig,
  arch: ArchitecturePlan,
  typeFiles: GeneratedFile[]
): string {
  const componentsList = arch.components.map((c) => `- ${c}`).join("\n");
  const typesSummary = typeFiles
    .map((f) => `// ${f.path}\n${f.content.slice(0, 200)}...`)
    .join("\n\n");

  return `Tu es un ingénieur React senior. Génère les composants et hooks pour l'application suivante.

Application: "${config.name}"
Description: "${config.description}"
Composants à générer:
${componentsList}

Types disponibles (réutilise-les):
${typesSummary}

Génère les fichiers business logic au format JSON:
1. "src/App.tsx" — composant racine avec HashRouter (si routing), providers (QueryClientProvider)
2. "src/features/{feature}/components/{Component}.tsx" — composants par feature
3. "src/features/{feature}/hooks/use-{feature}.ts" — hooks avec TanStack Query
4. "src/features/{feature}/api/{feature}-repository.ts" — repository pattern (ApiClient)

RÈGLES:
- TypeScript strict, composants fonctionnels avec export default
- Hooks: utilise @tanstack/react-query (useQuery, useMutation)
- Repository: pattern avec méthodes list/get/create/update/delete
- États complets: loading (Skeleton), error (ErrorState), empty (EmptyState)
- ${config.styling === "tailwind" ? "Classes Tailwind pour le style" : "CSS modules"}
- Imports relatifs sans extension
- NE génère PAS package.json, index.html, vite.config — fournis automatiquement

Format JSON: {"files":[{"path":"...","content":"...","language":"tsx"}]}
Réponds UNIQUEMENT avec le JSON.`;
}

async function passLogic(
  config: ProjectConfig,
  arch: ArchitecturePlan,
  typeFiles: GeneratedFile[],
  phase: PipelinePhase
): Promise<GeneratedFile[]> {
  phase.status = "running";
  phase.message = "Génération des composants + hooks + services...";

  const response = await callLLM(
    "Tu es un ingénieur React senior. Tu réponds UNIQUEMENT par du JSON valide.",
    buildLogicPrompt(config, arch, typeFiles)
  );

  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  if (!parsed?.files) {
    phase.status = "failed";
    phase.message = "Échec: composants invalides";
    return [];
  }

  const files = parseFiles(parsed.files);
  phase.status = "done";
  phase.message = `${files.length} fichiers business logic générés`;
  phase.filesGenerated = files.length;
  return files;
}

// ── Pass 4: UI (design system + states) ────────────────────────────────────
function buildUiPrompt(
  config: ProjectConfig,
  logicFiles: GeneratedFile[]
): string {
  const componentsSummary = logicFiles
    .filter((f) => f.path.endsWith(".tsx"))
    .map((f) => `- ${f.path}`)
    .join("\n");

  return `Tu es un designer React senior. Génère les composants UI partagés et états pour l'application suivante.

Application: "${config.name}"
Composants business déjà générés:
${componentsSummary}

Génère les composants UI partagés au format JSON:
1. "src/shared/ui/button.tsx" — bouton avec variants (primary, secondary, outline, ghost, destructive)
2. "src/shared/ui/input.tsx" — input avec label + error
3. "src/shared/ui/card.tsx" — Card, CardHeader, CardTitle, CardContent, CardFooter
4. "src/shared/ui/badge.tsx" — badge avec variants
5. "src/shared/ui/skeleton.tsx" — skeleton loading
6. "src/shared/ui/empty-state.tsx" — état vide avec CTA
7. "src/shared/ui/error-state.tsx" — état d'erreur avec retry
8. "src/shared/ui/async-boundary.tsx" — boundary réutilisable (loading/error/empty/success)
9. "src/shared/lib/utils.ts" — fonction cn() pour merge classes

RÈGLES:
- Composants accessibles (aria-label, role)
- Variants via prop 'variant' (type union)
- Tailwind classes pour le style
- Export default + exports nommés
- TypeScript strict

Format JSON: {"files":[{"path":"...","content":"...","language":"tsx"}]}
Réponds UNIQUEMENT avec le JSON.`;
}

async function passUi(
  config: ProjectConfig,
  logicFiles: GeneratedFile[],
  phase: PipelinePhase
): Promise<GeneratedFile[]> {
  phase.status = "running";
  phase.message = "Génération du design system + états...";

  const response = await callLLM(
    "Tu es un designer React senior. Tu réponds UNIQUEMENT par du JSON valide.",
    buildUiPrompt(config, logicFiles)
  );

  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  if (!parsed?.files) {
    phase.status = "failed";
    phase.message = "Échec: UI invalide";
    return [];
  }

  const files = parseFiles(parsed.files);
  phase.status = "done";
  phase.message = `${files.length} composants UI générés`;
  phase.filesGenerated = files.length;
  return files;
}

// ── Pass 5: Tests ──────────────────────────────────────────────────────────
function buildTestsPrompt(
  config: ProjectConfig,
  allFiles: GeneratedFile[]
): string {
  const componentPaths = allFiles
    .filter((f) => f.path.endsWith(".tsx") && !f.path.includes("ui/"))
    .map((f) => f.path)
    .slice(0, 5); // Max 5 tests

  return `Tu es un ingénieur test senior. Génère des tests Vitest + React Testing Library pour les composants suivants.

Application: "${config.name}"
Composants à tester:
${componentPaths.map((p) => `- ${p}`).join("\n")}

Génère les fichiers de test au format JSON:
1. Pour chaque composant: "${"src/features/.../{Component}.test.tsx"}"
2. "src/test/setup.ts" — setup React Testing Library + jest-dom

RÈGLES:
- Vitest + @testing-library/react + jest-dom
- Teste le comportement, pas l'implémentation
- Inclus: render, interactions (fireEvent/userEvent), assertions
- Mock les hooks de données (useQuery) si nécessaire
- Minimum 3 tests par composant (render + interaction + edge case)
- TypeScript strict

Format JSON: {"files":[{"path":"...","content":"...","language":"tsx"}]}
Réponds UNIQUEMENT avec le JSON.`;
}

async function passTests(
  config: ProjectConfig,
  allFiles: GeneratedFile[],
  phase: PipelinePhase
): Promise<GeneratedFile[]> {
  phase.status = "running";
  phase.message = "Génération des tests Vitest...";

  const response = await callLLM(
    "Tu es un ingénieur test senior. Tu réponds UNIQUEMENT par du JSON valide.",
    buildTestsPrompt(config, allFiles)
  );

  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  if (!parsed?.files) {
    phase.status = "skipped";
    phase.message = "Tests ignorés (génération échouée, non bloquant)";
    return [];
  }

  const files = parseFiles(parsed.files);
  phase.status = "done";
  phase.message = `${files.length} fichiers de test générés`;
  phase.filesGenerated = files.length;
  return files;
}

// ── Retry a pass with corrective prompt ────────────────────────────────────
async function retryPass(
  passName: string,
  config: ProjectConfig,
  currentFiles: GeneratedFile[],
  errors: { file: string; message: string; category?: string }[],
  phase: PipelinePhase
): Promise<GeneratedFile[]> {
  phase.retries = (phase.retries || 0) + 1;
  phase.message = `Retry ${phase.retries}: correction des erreurs...`;

  const errorList = errors
    .map((e) => `- ${e.file}: ${e.message}`)
    .join("\n");

  const prompt = `Le code généré pour "${config.name}" contient des erreurs. Corrige-les.

ERREURS:
${errorList}

Fichiers actuels (à corriger):
${currentFiles.map((f) => `// ${f.path}\n${f.content}`).join("\n\n---\n\n")}

Corrige les erreurs et régénère les fichiers concernés.
Format JSON: {"files":[{"path":"...","content":"...","language":"..."}]}
Réponds UNIQUEMENT avec le JSON.`;

  const response = await callLLM(
    "Tu es un ingénieur React senior. Tu corriges le code. Tu réponds UNIQUEMENT par du JSON valide.",
    prompt
  );

  const parsed = extractJson(response) as { files?: RawFile[] } | null;
  if (!parsed?.files) return currentFiles;

  const correctedFiles = parseFiles(parsed.files);

  // Merge: corrected files override original
  const merged = [...currentFiles];
  for (const cf of correctedFiles) {
    const idx = merged.findIndex((f) => f.path === cf.path);
    if (idx >= 0) {
      merged[idx] = cf;
    } else {
      merged.push(cf);
    }
  }
  return merged;
}

// ── Main pipeline orchestrator ─────────────────────────────────────────────
export async function runPipeline(
  config: ProjectConfig,
  onProgress?: (phases: PipelinePhase[]) => void
): Promise<PipelineResult> {
  const phases: PipelinePhase[] = [
    { name: "Architecture", pass: 1, status: "pending" },
    { name: "Types", pass: 2, status: "pending" },
    { name: "Business Logic", pass: 3, status: "pending" },
    { name: "UI Design System", pass: 4, status: "pending" },
    { name: "Tests", pass: 5, status: "pending" },
  ];

  const updatePhase = (idx: number, patch: Partial<PipelinePhase>) => {
    phases[idx] = { ...phases[idx], ...patch };
    onProgress?.(phases);
  };

  try {
    // ── Pass 1: Architecture ──
    updatePhase(0, { status: "running" });
    const arch = await passArchitecture(config, phases[0]);
    onProgress?.(phases);
    if (!arch) {
      return {
        success: false,
        files: [],
        phases,
        validation: { ok: false, totalErrors: 1, totalWarnings: 0, results: [] },
        error: "Échec de la passe Architecture",
      };
    }

    // ── Pass 2: Types ──
    updatePhase(1, { status: "running" });
    let typeFiles = await passTypes(config, arch, phases[1]);
    onProgress?.(phases);

    // Gate 2: Validate types (retry once if failed)
    for (let retry = 0; retry < 1; retry++) {
      const validation = runAllValidationGates(typeFiles);
      if (validation.ok || validation.totalErrors === 0) break;
      const errors = validation.results
        .filter((r) => !r.result.ok)
        .flatMap((r) => r.result.errors);
      typeFiles = await retryPass("Types", config, typeFiles, errors, phases[1]);
      onProgress?.(phases);
    }

    // ── Pass 3: Business Logic ──
    updatePhase(2, { status: "running" });
    let logicFiles = await passLogic(config, arch, typeFiles, phases[2]);
    onProgress?.(phases);

    // Gate 3: Validate logic (retry once)
    for (let retry = 0; retry < 1; retry++) {
      const validation = runAllValidationGates(logicFiles);
      if (validation.ok || validation.totalErrors === 0) break;
      const errors = validation.results
        .filter((r) => !r.result.ok)
        .flatMap((r) => r.result.errors);
      logicFiles = await retryPass("Logic", config, logicFiles, errors, phases[2]);
      onProgress?.(phases);
    }

    // ── Pass 4: UI ──
    updatePhase(3, { status: "running" });
    let uiFiles = await passUi(config, logicFiles, phases[3]);
    onProgress?.(phases);

    // Gate 4: Validate UI (retry once)
    for (let retry = 0; retry < 1; retry++) {
      const validation = runAllValidationGates(uiFiles);
      if (validation.ok || validation.totalErrors === 0) break;
      const errors = validation.results
        .filter((r) => !r.result.ok)
        .flatMap((r) => r.result.errors);
      uiFiles = await retryPass("UI", config, uiFiles, errors, phases[3]);
      onProgress?.(phases);
    }

    // ── Pass 5: Tests ──
    updatePhase(4, { status: "running" });
    const allFilesSoFar = [...typeFiles, ...logicFiles, ...uiFiles];
    const testFiles = await passTests(config, allFilesSoFar, phases[4]);
    onProgress?.(phases);

    // ── Merge all files ──
    const allFiles = [...typeFiles, ...logicFiles, ...uiFiles, ...testFiles];

    // Dedupe (later files win on path conflicts)
    const deduped: GeneratedFile[] = [];
    const seen = new Set<string>();
    for (let i = allFiles.length - 1; i >= 0; i--) {
      if (!seen.has(allFiles[i].path)) {
        seen.add(allFiles[i].path);
        deduped.unshift(allFiles[i]);
      }
    }

    // ── Final validation ──
    const finalValidation = runAllValidationGates(deduped);

    return {
      success: true,
      files: deduped,
      phases,
      validation: {
        ok: finalValidation.ok,
        totalErrors: finalValidation.totalErrors,
        totalWarnings: finalValidation.totalWarnings,
        results: finalValidation.results,
      },
    };
  } catch (error) {
    return {
      success: false,
      files: [],
      phases,
      validation: { ok: false, totalErrors: 1, totalWarnings: 0, results: [] },
      error: error instanceof Error ? error.message : "Erreur pipeline inconnue",
    };
  }
}
