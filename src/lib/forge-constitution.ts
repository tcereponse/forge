// forge-constitution.ts — Gardien de la Constitution Diamond G50+ v4.0
//
// Implémente les règles immuables de la Constitution Souveraine de la Forge:
//   1. validateConstitution() — Checklist de validation post-génération
//   2. applyKnownFixes() — Corrections automatiques des erreurs connues
//   3. autoSuture() — Retry LLM avec erreurs ciblées (Phase 3)
//   4. autoHealingCycles() — Boucle jusqu'à validation OK (Système Auto-Healing)
//
// Toute mission de génération DOIT passer par ces gardiens avant livraison.

import type { GeneratedFile, ProjectConfig } from "./forge-config";
import { glmChat } from "./glm-direct";
import { bridgeState } from "./bridge-state";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ValidationIssue {
  severity: "critical" | "error" | "warning";
  path: string;
  issue: string;
  fix?: string; // auto-fix suggestion (if applicable)
  rule: string; // constitution rule ID (e.g., "R1", "X5")
}

export interface ValidationResult {
  ok: boolean;
  criticalCount: number;
  errorCount: number;
  warningCount: number;
  issues: ValidationIssue[];
  files: GeneratedFile[]; // potentially fixed files
}

// ─── Constitution Rules (IDs match the Constitution document) ──────────────
//
// R1-R5 : Structure inviolable
// X1-X12: Interdictions absolues
// O1-O8 : Obligations
// S1-S3 : Silence absolu

const FORBIDDEN_FILES = new Set([
  "package.js",
  "tsconfig.js",
  "tsconfig.node.js",
  "App.ts",
  "main.js",
]);

const FORBIDDEN_EXTENSIONS = [".vue"];

const FORBIDDEN_DEPS = [
  "expo-router",
  "react-native",
  "@expo",
  "@vitejs/plugin-vue",
  "vue",
];

// ─── 1. VALIDATION (Checklist de livraison) ────────────────────────────────

/**
 * Valide les fichiers générés contre la Constitution Diamond G50+.
 * Retourne tous les problèmes trouvés avec leur sévérité.
 */
export function validateConstitution(files: GeneratedFile[]): ValidationResult {
  const issues: ValidationIssue[] = [];
  const fileMap = new Map(files.map((f) => [f.path, f]));

  // ── R1: index.html (minuscule) avec id="root" et src="./src/...main.tsx" ──
  const indexHtml = fileMap.get("index.html");
  if (!indexHtml) {
    // Check for Index.html (capital I)
    const capitalIndex = fileMap.get("Index.html");
    if (capitalIndex) {
      issues.push({
        severity: "critical",
        path: "Index.html",
        issue: "Fichier Index.html (avec I majuscule) — Vite exige index.html minuscule",
        fix: "rename:Index.html->index.html",
        rule: "R1",
      });
    } else {
      issues.push({
        severity: "critical",
        path: "index.html",
        issue: "index.html manquant — le build Vite échouera (écran blanc)",
        rule: "R1",
      });
    }
  } else {
    // Check id="root"
    if (!indexHtml.content.includes('id="root"') && !indexHtml.content.includes("id='root'")) {
      issues.push({
        severity: "critical",
        path: "index.html",
        issue: 'id="root" manquant dans index.html — React ne trouvera pas le point de montage',
        fix: 'inject:id="root"',
        rule: "R1",
      });
    }
    // Check script src
    if (!indexHtml.content.includes("main.tsx") && !indexHtml.content.includes("main.jsx")) {
      issues.push({
        severity: "critical",
        path: "index.html",
        issue: "Script main.tsx/main.jsx manquant dans index.html",
        rule: "R1",
      });
    }
  }

  // ── R2: vite.config.ts présent ──
  const viteConfig = fileMap.get("vite.config.ts") || fileMap.get("vite.config.js");
  if (!viteConfig) {
    issues.push({
      severity: "critical",
      path: "vite.config.ts",
      issue: "vite.config.ts manquant — vite build échouera (dossier dist vide = écran blanc)",
      rule: "R2",
    });
  }

  // ── R3: package.json avec type:"module" et build:"vite build" ──
  const packageJson = fileMap.get("package.json");
  if (!packageJson) {
    issues.push({
      severity: "critical",
      path: "package.json",
      issue: "package.json manquant",
      rule: "R3",
    });
  } else {
    try {
      const pkg = JSON.parse(packageJson.content);
      if (pkg.type !== "module") {
        issues.push({
          severity: "error",
          path: "package.json",
          issue: 'package.json doit avoir "type":"module"',
          fix: 'set:type=module',
          rule: "R3",
        });
      }
      if (pkg.scripts?.build && pkg.scripts.build !== "vite build" && !pkg.scripts.build.includes("vite build")) {
        issues.push({
          severity: "warning",
          path: "package.json",
          issue: `Script build non standard: "${pkg.scripts.build}" — devrait être "vite build"`,
          fix: 'set:build=vite build',
          rule: "R3",
        });
      }
      // Check forbidden deps
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      for (const dep of FORBIDDEN_DEPS) {
        for (const key of Object.keys(allDeps)) {
          if (key === dep || key.startsWith(dep + "/")) {
            issues.push({
              severity: "critical",
              path: "package.json",
              issue: `Dépendance interdite: ${key} (contamine le projet)`,
              fix: `remove-dep:${key}`,
              rule: "X5",
            });
          }
        }
      }
    } catch {
      issues.push({
        severity: "critical",
        path: "package.json",
        issue: "package.json invalide (JSON malformé)",
        rule: "R3",
      });
    }
  }

  // ── R4: App.tsx utilise HashRouter (pas BrowserRouter) ──
  const appFiles = files.filter(
    (f) => f.path === "src/App.tsx" || f.path === "src/App.jsx" || f.path === "src/app/App.tsx" || f.path === "src/app/App.jsx"
  );
  for (const app of appFiles) {
    if (app.content.includes("BrowserRouter")) {
      issues.push({
        severity: "critical",
        path: app.path,
        issue: "BrowserRouter INTERDIT — utiliser HashRouter (sinon URLs cassées dans APK Android)",
        fix: "replace:BrowserRouter->HashRouter",
        rule: "X8",
      });
    }
  }

  // ── X1-X4: Fichiers interdits ──
  for (const file of files) {
    const basename = file.path.split("/").pop() || file.path;
    if (FORBIDDEN_FILES.has(basename)) {
      issues.push({
        severity: "critical",
        path: file.path,
        issue: `Fichier interdit: ${basename} (erreur d'IA hallucinée)`,
        fix: `delete:${file.path}`,
        rule: "X1",
      });
    }
    // Check forbidden extensions (.vue)
    for (const ext of FORBIDDEN_EXTENSIONS) {
      if (file.path.endsWith(ext)) {
        issues.push({
          severity: "critical",
          path: file.path,
          issue: `Fichier .vue interdit (contamination Vue.js) — supprimer`,
          fix: `delete:${file.path}`,
          rule: "X4",
        });
      }
    }
  }

  // ── X6: Pas de préfixe de langage dans le code ──
  for (const file of files) {
    const content = file.content.trim();
    const firstLine = content.split("\n")[0];
    if (/^(html|javascript|typescript|tsx|jsx|css)\s*$/i.test(firstLine) || firstLine === "html<!DOCTYPE") {
      issues.push({
        severity: "error",
        path: file.path,
        issue: `Préfixe de langage interdit en première ligne: "${firstLine}"`,
        fix: `strip-prefix:${file.path}`,
        rule: "X6",
      });
    }
  }

  // ── X11: Balises JSX non fermées (détection heuristique) ──
  for (const file of files) {
    if (!file.path.endsWith(".tsx") && !file.path.endsWith(".jsx")) continue;
    const content = file.content;
    // Count opening and closing tags for common self-closing elements
    // Simple check: count <div> vs </div>
    const openTags = (content.match(/<div[\s>]/g) || []).length;
    const closeTags = (content.match(/<\/div>/g) || []).length;
    if (Math.abs(openTags - closeTags) > 0) {
      issues.push({
        severity: "error",
        path: file.path,
        issue: `Balises <div> déséquilibrées: ${openTags} ouvertes vs ${closeTags} fermées`,
        rule: "X11",
      });
    }
  }

  // ── X12: Template strings sans backticks ──
  for (const file of files) {
    if (!file.path.endsWith(".tsx") && !file.path.endsWith(".jsx") && !file.path.endsWith(".ts") && !file.path.endsWith(".js")) continue;
    // Detect ${...} outside backticks (common error: className={"inline-block ${class}"})
    const lines = file.content.split("\n");
    lines.forEach((line, idx) => {
      // Find ${...} that's NOT inside backticks
      const templateMatches = line.match(/\$\{[^}]+\}/g);
      if (templateMatches) {
        const backtickCount = (line.match(/`/g) || []).length;
        // If there are template expressions but odd number of backticks, likely an error
        if (backtickCount % 2 !== 0 || (backtickCount === 0 && templateMatches.length > 0)) {
          issues.push({
            severity: "warning",
            path: file.path,
            issue: `Ligne ${idx + 1}: template string \${...} sans backticks — utiliser \`...\``,
            rule: "X12",
          });
        }
      }
    });
  }

  // ── S1: Silence absolu — pas de texte conversationnel dans les fichiers ──
  for (const file of files) {
    if (file.path === "package.json" || file.path.endsWith(".md")) continue;
    // Detect conversational text at the start of .tsx/.ts files
    if (file.path.endsWith(".tsx") || file.path.endsWith(".ts")) {
      const first5Lines = file.content.split("\n").slice(0, 5).join(" ");
      if (/^(Voici|Here is|Le projet|The project|Je génère|I generate)/i.test(first5Lines.trim())) {
        issues.push({
          severity: "critical",
          path: file.path,
          issue: "Texte conversationnel détecté (violation Silence Absolu) — le fichier doit contenir uniquement du code",
          fix: `strip-conversational:${file.path}`,
          rule: "S1",
        });
      }
    }
  }

  // ── O2: tsconfig.json avec include ["src"] ──
  const tsconfig = fileMap.get("tsconfig.json");
  if (tsconfig) {
    try {
      const ts = JSON.parse(tsconfig.content);
      if (!ts.include || !ts.include.includes("src")) {
        issues.push({
          severity: "warning",
          path: "tsconfig.json",
          issue: 'tsconfig.json devrait avoir "include": ["src"]',
          fix: 'set:include=["src"]',
          rule: "O2",
        });
      }
    } catch {
      issues.push({
        severity: "error",
        path: "tsconfig.json",
        issue: "tsconfig.json invalide (JSON malformé)",
        rule: "O2",
      });
    }
  }

  // Count severities
  const criticalCount = issues.filter((i) => i.severity === "critical").length;
  const errorCount = issues.filter((i) => i.severity === "error").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;

  return {
    ok: criticalCount === 0 && errorCount === 0,
    criticalCount,
    errorCount,
    warningCount,
    issues,
    files,
  };
}

// ─── 2. APPLY KNOWN FIXES (corrections automatiques) ───────────────────────

/**
 * Applique les corrections automatiques connues.
 * Ces fixes sont sûrs et ne nécessitent pas de LLM.
 */
export function applyKnownFixes(files: GeneratedFile[]): GeneratedFile[] {
  const fixed: GeneratedFile[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    let path = file.path;
    let content = file.content;
    const basename = path.split("/").pop() || path;

    // X1: Index.html → index.html
    if (basename === "Index.html") {
      path = path.replace(/Index\.html$/, "index.html");
    }

    // X1: package.js → package.json (if content looks like JSON package)
    if (basename === "package.js" && content.trim().startsWith("{")) {
      path = path.replace(/package\.js$/, "package.json");
    }

    // X2: tsconfig.js → tsconfig.json (if content looks like JSON)
    if (basename === "tsconfig.js" && content.trim().startsWith("{")) {
      path = path.replace(/tsconfig\.js$/, "tsconfig.json");
    }

    // X3: App.ts → App.tsx (if content contains JSX)
    if (basename === "App.ts" && /<[A-Z]|<div|<span|<button/i.test(content)) {
      path = path.replace(/App\.ts$/, "App.tsx");
    }
    if (basename === "main.ts" && /<[A-Z]|<div|<span|<button/i.test(content)) {
      path = path.replace(/main\.ts$/, "main.tsx");
    }

    // X4: Skip .vue files entirely
    if (path.endsWith(".vue")) {
      continue;
    }

    // X1: Skip package.js, tsconfig.js, tsconfig.node.js (phantom files)
    if (FORBIDDEN_FILES.has(basename)) {
      continue;
    }

    // X6: Strip language prefix from first line
    const firstLine = content.split("\n")[0];
    if (/^(html|javascript|typescript|tsx|jsx|css)\s*$/i.test(firstLine.trim())) {
      content = content.split("\n").slice(1).join("\n");
    }
    if (content.trimStart().startsWith("html<!DOCTYPE")) {
      content = content.replace(/^html\s*/, "");
    }

    // X8: BrowserRouter → HashRouter
    if (path.endsWith(".tsx") || path.endsWith(".jsx")) {
      content = content
        .replace(/BrowserRouter/g, "HashRouter")
        .replace(/browser-router/g, "hash-router");
    }

    // R3: Ensure package.json has type:"module" and build:"vite build"
    if (path === "package.json") {
      try {
        const pkg = JSON.parse(content);
        if (pkg.type !== "module") pkg.type = "module";
        if (!pkg.scripts) pkg.scripts = {};
        if (!pkg.scripts.build || pkg.scripts.build.includes("tsc")) {
          pkg.scripts.build = "vite build";
        }
        if (!pkg.scripts.dev) pkg.scripts.dev = "vite";
        if (!pkg.scripts.preview) pkg.scripts.preview = "vite preview";
        // Remove forbidden deps
        for (const depType of ["dependencies", "devDependencies"]) {
          if (pkg[depType]) {
            for (const key of Object.keys(pkg[depType])) {
              if (FORBIDDEN_DEPS.some((d) => key === d || key.startsWith(d + "/"))) {
                delete pkg[depType][key];
              }
            }
          }
        }
        // Remove husky prepare script (causes ".git can't be found")
        if (pkg.scripts.prepare) {
          delete pkg.scripts.prepare;
        }
        content = JSON.stringify(pkg, null, 2);
      } catch {
        // If package.json is invalid, keep as-is (will be flagged by validation)
      }
    }

    // Dedupe by path (later files win)
    if (!seen.has(path)) {
      seen.add(path);
      fixed.push({ ...file, path, content });
    }
  }

  return fixed;
}

// ─── 3. AUTO-SUTURE (Phase 3 — retry LLM avec erreurs ciblées) ─────────────

/**
 * Appelle le LLM avec un prompt correctif contenant les erreurs exactes.
 * Le LLM régénère uniquement les fichiers en erreur.
 */
export async function autoSuture(
  files: GeneratedFile[],
  issues: ValidationIssue[],
  config: ProjectConfig,
  maxRetries = 2
): Promise<{ files: GeneratedFile[]; sutured: boolean; remainingIssues: ValidationIssue[] }> {
  let currentFiles = [...files];
  let currentIssues = issues;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Filter issues that can be fixed by LLM (critical + error, with a path)
    const fixableIssues = currentIssues.filter(
      (i) => (i.severity === "critical" || i.severity === "error") && i.path
    );

    if (fixableIssues.length === 0) {
      break;
    }

    console.log(`[autoSuture] Tentative ${attempt}/${maxRetries} — ${fixableIssues.length} erreurs à corriger`);

    // Build corrective prompt
    const errorList = fixableIssues
      .map((i, idx) => `${idx + 1}. [${i.rule}] ${i.path}: ${i.issue}`)
      .join("\n");

    // Get the current content of files with errors
    const filesWithError = currentFiles.filter((f) =>
      fixableIssues.some((i) => i.path === f.path)
    );

    const prompt = `Tu es un ingénieur React/TypeScript senior. Des erreurs ont été détectées dans le projet généré.

Application: "${config.name}"
Description: "${config.description}"

## ERREURS À CORRIGER:
${errorList}

## FICHIERS ACTUELS (avec erreurs):
${filesWithError.map((f) => `### ${f.path}\n\`\`\`\n${f.content.slice(0, 2000)}\n\`\`\``).join("\n\n")}

## RÈGLES DE LA CONSTITUTION DIAMOND G50+:
- index.html en MINUSCULES avec id="root" et <script src="./src/app/main.tsx">
- HashRouter OBLIGATOIRE (JAMAIS BrowserRouter)
- package.json: type:"module", build:"vite build" (sans tsc)
- Toutes balises JSX doivent être fermées
- Pas de texte conversationnel — UNIQUEMENT du code
- Pas de .vue, package.js, tsconfig.js, App.ts
- Template strings avec backticks: \`...\${value}...\`

## TA TÂCHE:
Régénère UNIQUEMENT les fichiers en erreur au format JSON.
Corrige chaque erreur listée ci-dessus.

Format JSON: {"files":[{"path":"...","content":"...","language":"typescript"}]}
SILENCE ABSOLU — UNIQUEMENT le JSON, aucun texte autour.`;

    const result = await callLLM("Tu es un correcteur de code React/TypeScript. Tu réponds UNIQUEMENT par du JSON valide.", prompt);

    if (result && result.length > 20) {
      // Parse the corrected files
      const newFiles = parseFilesFromLLM(result);
      if (newFiles.length > 0) {
        // Merge: replace files with corrected versions
        const fileMap = new Map(currentFiles.map((f) => [f.path, f]));
        for (const nf of newFiles) {
          fileMap.set(nf.path, nf);
        }
        currentFiles = Array.from(fileMap.values());

        // Apply known fixes again
        currentFiles = applyKnownFixes(currentFiles);
      }
    }

    // Re-validate
    const revalidation = validateConstitution(currentFiles);
    currentIssues = revalidation.issues;

    if (revalidation.ok) {
      console.log(`[autoSuture] ✅ Toutes les erreurs corrigées après ${attempt} tentative(s)`);
      return { files: currentFiles, sutured: true, remainingIssues: [] };
    }
  }

  return { files: currentFiles, sutured: false, remainingIssues: currentIssues };
}

// ─── 4. AUTO-HEALING CYCLES (boucle jusqu'à validation OK) ─────────────────

/**
 * Boucle principale d'auto-guérison:
 *   0. Vérifie le rapport de l'extension v14.1 (si déjà validé, skip)
 *   1. applyKnownFixes (corrections sûres)
 *   2. validateConstitution (checklist)
 *   3. Si erreurs → autoSuture (retry LLM)
 *   4. Répéter jusqu'à OK ou maxCycles
 *
 * COORDINATION AVEC L'EXTENSION V14.1:
 * Si l'extension a déjà validé le code (ok=true, criticalCount=0), le serveur
 * skip le healing et utilise les fichiers tels quels. Évite le double-emploi.
 */
export async function autoHealingCycles(
  files: GeneratedFile[],
  config: ProjectConfig,
  maxCycles = 3
): Promise<{ files: GeneratedFile[]; validation: ValidationResult; cyclesUsed: number; skipped?: boolean }> {
  // ── Étape 0: Vérifier le rapport de l'extension v14.1 ──
  let extensionReport: { ok: boolean; criticalCount: number; fixesApplied: string[] } | null = null;
  try {
    // Dynamic import to avoid circular dependency
    const { getExtensionReport } = await import("@/app/api/bridge/constitution-report/route");
    extensionReport = getExtensionReport();
  } catch {
    // Module not available (e.g., in tests) — continue without extension report
  }

  if (extensionReport) {
    console.log(`[autoHealing] Rapport extension v14.1 reçu: ok=${extensionReport.ok}, critical=${extensionReport.criticalCount}, fixes=${extensionReport.fixesApplied.length}`);
    if (extensionReport.ok && extensionReport.criticalCount === 0) {
      // Extension already validated — apply fixes (in case extension didn't catch everything)
      // but skip the LLM healing cycles
      const fixedFiles = applyKnownFixes(files);
      const validation = validateConstitution(fixedFiles);
      if (validation.ok) {
        console.log("[autoHealing] ✅ Extension v14.1 a déjà validé — skip healing serveur");
        return { files: fixedFiles, validation, cyclesUsed: 0, skipped: true };
      }
      console.log("[autoHealing] Extension a validé mais serveur trouve encore des erreurs — healing quand même");
    }
  }

  // ── Étape 1: applyKnownFixes (corrections sûres) ──
  let currentFiles = applyKnownFixes(files);
  let validation = validateConstitution(currentFiles);
  let cyclesUsed = 0;

  console.log(`[autoHealing] Initial validation: ${validation.criticalCount} critical, ${validation.errorCount} errors, ${validation.warningCount} warnings`);

  if (validation.ok) {
    console.log("[autoHealing] ✅ Validation OK — aucun cycle nécessaire");
    return { files: currentFiles, validation, cyclesUsed: 0 };
  }

  // ── Étapes 2-4: cycles de healing (autoSuture LLM) ──
  for (let cycle = 1; cycle <= maxCycles; cycle++) {
    cyclesUsed = cycle;
    console.log(`[autoHealing] Cycle ${cycle}/${maxCycles} — autoSuture en cours...`);

    const sutureResult = await autoSuture(currentFiles, validation.issues, config, 1);

    currentFiles = sutureResult.files;
    validation = validateConstitution(currentFiles);

    console.log(`[autoHealing] Cycle ${cycle} — ${validation.criticalCount} critical, ${validation.errorCount} errors restants`);

    if (validation.ok) {
      console.log(`[autoHealing] ✅ Validation OK après ${cycle} cycle(s)`);
      break;
    }
  }

  if (!validation.ok) {
    console.log(`[autoHealing] ⚠️ ${validation.criticalCount} erreurs critiques restent après ${maxCycles} cycles`);
    console.log(`[autoHealing] Erreurs finales: ${validation.issues.filter((i) => i.severity === "critical").map((i) => `[${i.rule}] ${i.path}: ${i.issue}`).join("; ")}`);
  }

  return { files: currentFiles, validation, cyclesUsed };
}

// ─── Utils ─────────────────────────────────────────────────────────────────

async function callLLM(systemPrompt: string, userPrompt: string): Promise<string> {
  // Strategy 1: GLM direct
  const result = await glmChat([
    { role: "assistant", content: systemPrompt },
    { role: "user", content: userPrompt },
  ]);
  if (result.content && result.content.length > 20) return result.content;

  // Strategy 2: KIROV Bridge (DeepSeek via extension)
  console.log("[autoSuture] GLM failed, falling back to bridge...");
  const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;
  const bridgeResult = await bridgeState.runOneShot(fullPrompt, 90000);
  if (bridgeResult.content && bridgeResult.content.length > 20) {
    return bridgeResult.content;
  }
  return "";
}

function parseFilesFromLLM(text: string): GeneratedFile[] {
  let cleaned = text.trim();
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) cleaned = fenceMatch[1].trim();
  try {
    const p = JSON.parse(cleaned);
    if (p.files && Array.isArray(p.files)) {
      return p.files.map((f: any) => ({
        path: String(f.path || ""),
        content: String(f.content || ""),
        language: f.language || "typescript",
      }));
    }
  } catch {}
  // Regex repair
  const files: GeneratedFile[] = [];
  const fileRegex = /\{\s*"path"\s*:\s*"((?:[^"\\]|\\.)*)"\s*,\s*"content"\s*:\s*"((?:[^"\\]|\\.)*)"(?:\s*,\s*"language"\s*:\s*"((?:[^"\\]|\\.)*)")?\s*\}/g;
  let match: RegExpExecArray | null;
  while ((match = fileRegex.exec(cleaned)) !== null) {
    try {
      files.push({
        path: JSON.parse(`"${match[1]}"`),
        content: JSON.parse(`"${match[2]}"`),
        language: match[3] ? JSON.parse(`"${match[3]}"`) : "typescript",
      });
    } catch {
      files.push({
        path: match[1].replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\"),
        content: match[2].replace(/\\"/g, '"').replace(/\\n/g, "\n").replace(/\\\\/g, "\\"),
        language: match[3] || "typescript",
      });
    }
  }
  return files;
}
