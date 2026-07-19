// forge-nuclear-guard.ts — Contrôleur de Qualité Autonome
//
// Pépite #2 migrée depuis nuclear_guard.py
// Vérifie la validité syntaxique de tous les fichiers générés.
// Si une erreur est détectée, appelle DeepSeek (via Bridge) pour corriger.
//
// Architecture:
//   - scanProject(): vérifie tous les fichiers (JSON, JS/TS, Markdown)
//   - repairFileViaBridge(): demande à DeepSeek de corriger un fichier
//   - runNuclearGuard(): scan + repair + re-scan
//
// Intégré dans forge-constitution.ts autoHealingCycles()

import type { GeneratedFile } from "./forge-config";
import { bridgeState } from "./bridge-state";
import { glmChat } from "./glm-direct";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface QualityIssue {
  file: string;
  error: string;
  severity: "critical" | "warning";
}

export interface QualityReport {
  ok: boolean;
  total: number;
  errors: QualityIssue[];
  grade: "GOLD" | "SILVER" | "RED";
  timestamp: number;
}

// ─── Syntax Checkers ───────────────────────────────────────────────────────

/**
 * Vérifie la validité JSON.
 * Migration de nuclear_guard.py check_json()
 */
function checkJson(content: string): { ok: boolean; error: string } {
  try {
    JSON.parse(content);
    return { ok: true, error: "" };
  } catch (e) {
    return { ok: false, error: `JSON invalide: ${e instanceof Error ? e.message : "inconnu"}` };
  }
}

/**
 * Vérification basique JS/TS : parenthèses et accolades équilibrées.
 * Migration de nuclear_guard.py check_javascript_basic()
 */
function checkJavascriptBasic(content: string): { ok: boolean; error: string } {
  // Count delimiters (respecting strings)
  let braces = 0, brackets = 0, parens = 0;
  let inString = false, stringChar = "";
  let escape = false;

  for (let i = 0; i < content.length; i++) {
    const c = content[i];

    if (escape) { escape = false; continue; }
    if (c === "\\") { escape = true; continue; }

    if (inString) {
      if (c === stringChar) inString = false;
      continue;
    }

    if (c === '"' || c === "'" || c === "`") {
      inString = true;
      stringChar = c;
      continue;
    }

    if (c === "{") braces++;
    else if (c === "}") braces--;
    else if (c === "[") brackets++;
    else if (c === "]") brackets--;
    else if (c === "(") parens++;
    else if (c === ")") parens--;
  }

  const totalImbalance = Math.abs(braces) + Math.abs(brackets) + Math.abs(parens);
  if (totalImbalance > 5) {
    return {
      ok: false,
      error: `Déséquilibre: {}=${braces}, []=${brackets}, ()=${parens}`,
    };
  }

  // Detect empty critical blocks
  if (content.length < 50 && /(function|=>|class)\s*\{?\s*\}/.test(content)) {
    return { ok: false, error: "Fichier semble vide ou mal généré" };
  }

  return { ok: true, error: "" };
}

/**
 * Vérifie qu'un fichier Markdown n'est pas vide ou tronqué.
 */
function checkMarkdown(content: string): { ok: boolean; error: string } {
  if (content.length < 30) {
    return { ok: false, error: "Fichier Markdown trop court (probablement tronqué)" };
  }
  return { ok: true, error: "" };
}

/**
 * Vérifie qu'un fichier CSS a des règles.
 */
function checkCss(content: string): { ok: boolean; error: string } {
  if (content.length < 10) {
    return { ok: false, error: "Fichier CSS trop court" };
  }
  // Check for unclosed braces
  const opens = (content.match(/\{/g) || []).length;
  const closes = (content.match(/\}/g) || []).length;
  if (Math.abs(opens - closes) > 0) {
    return { ok: false, error: `CSS déséquilibré: {=${opens}, }=${closes}` };
  }
  return { ok: true, error: "" };
}

// ─── Dispatcher ────────────────────────────────────────────────────────────

function checkFile(filepath: string, content: string): { ok: boolean; error: string } {
  const ext = filepath.split(".").pop()?.toLowerCase() || "";

  switch (ext) {
    case "json":
      return checkJson(content);
    case "js":
    case "ts":
    case "jsx":
    case "tsx":
      return checkJavascriptBasic(content);
    case "md":
      return checkMarkdown(content);
    case "css":
      return checkCss(content);
    default:
      return { ok: true, error: "" }; // Skip unknown types
  }
}

// ─── Project Scanner ───────────────────────────────────────────────────────

/**
 * Scanne tous les fichiers d'un projet et retourne le rapport de qualité.
 * Migration de nuclear_guard.py scan_project()
 */
export function scanProject(files: GeneratedFile[]): QualityReport {
  const errors: QualityIssue[] = [];
  let total = 0;

  for (const file of files) {
    const ext = file.path.split(".").pop()?.toLowerCase() || "";
    if (!["json", "js", "ts", "jsx", "tsx", "md", "css"].includes(ext)) continue;

    total++;
    const result = checkFile(file.path, file.content);
    if (!result.ok) {
      errors.push({
        file: file.path,
        error: result.error,
        severity: result.error.includes("invalide") || result.error.includes("vide") ? "critical" : "warning",
      });
      console.log(`[GUARD] ❌ ${file.path}: ${result.error}`);
    } else {
      console.log(`[GUARD] ✅ ${file.path}`);
    }
  }

  const ok = errors.filter(e => e.severity === "critical").length === 0;
  const criticalCount = errors.filter(e => e.severity === "critical").length;

  const grade = ok ? "GOLD" : criticalCount <= 2 ? "SILVER" : "RED";

  return {
    ok,
    total,
    errors,
    grade,
    timestamp: Date.now(),
  };
}

// ─── Auto-Repair via Bridge ────────────────────────────────────────────────

/**
 * Demande à DeepSeek (via Bridge) de réparer un fichier défectueux.
 * Migration de nuclear_guard.py repair_file_via_api()
 */
export async function repairFileViaBridge(
  file: GeneratedFile,
  errorMsg: string
): Promise<GeneratedFile | null> {
  const basename = file.path.split("/").pop() || file.path;

  const systemPrompt = "Tu es un expert en débogage de code React/TypeScript. Tu réponds UNIQUEMENT par du JSON valide.";

  const repairPrompt = `Voici un fichier qui contient une erreur syntaxique.
Fichier: ${basename}
Erreur détectée: ${errorMsg}

Code actuel:
\`\`\`
${file.content.slice(0, 2000)}
\`\`\`

MISSION: Corrige UNIQUEMENT l'erreur syntaxique. Retourne le fichier complet corrigé en JSON:
{"files":[{"path":"${file.path}","content":"le code corrigé complet ici","language":"${file.language}"}]}`;

  try {
    // Strategy 1: GLM direct
    let result = await glmChat([
      { role: "assistant", content: systemPrompt },
      { role: "user", content: repairPrompt },
    ]);

    // Strategy 2: Bridge fallback
    if (!result.content || result.content.length < 20) {
      console.log(`[GUARD] GLM failed, trying bridge...`);
      const bridgeResult = await bridgeState.runOneShot(
        `${systemPrompt}\n\n---\n\n${repairPrompt}`,
        60000
      );
      if (bridgeResult.content && bridgeResult.content.length > 20) {
        result = { content: bridgeResult.content };
      }
    }

    if (!result.content || result.content.length < 20) {
      console.log(`[GUARD] Repair failed for ${basename}`);
      return null;
    }

    // Parse the response
    let cleaned = result.content.trim();
    const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenceMatch) cleaned = fenceMatch[1].trim();

    try {
      const parsed = JSON.parse(cleaned);
      if (parsed.files && Array.isArray(parsed.files) && parsed.files.length > 0) {
        const repaired = parsed.files[0];
        console.log(`[GUARD] 🔧 Fichier réparé: ${basename}`);
        return {
          path: file.path,
          content: String(repaired.content || ""),
          language: file.language,
        };
      }
    } catch {
      // Try regex extraction
      const contentMatch = cleaned.match(/"content"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      if (contentMatch) {
        try {
          const repairedContent = JSON.parse(`"${contentMatch[1]}"`);
          console.log(`[GUARD] 🔧 Fichier réparé (regex): ${basename}`);
          return {
            path: file.path,
            content: repairedContent,
            language: file.language,
          };
        } catch {
          // Give up
        }
      }
    }

    console.log(`[GUARD] Could not parse repair response for ${basename}`);
    return null;
  } catch (e) {
    console.error(`[GUARD] Repair error for ${basename}:`, e);
    return null;
  }
}

// ─── Main Entry Point ──────────────────────────────────────────────────────

/**
 * Point d'entrée principal du Nuclear Guard.
 * Scanne, rapporte et répare automatiquement si possible.
 * Migration de nuclear_guard.py run_nuclear_guard()
 */
export async function runNuclearGuard(
  files: GeneratedFile[],
  autoRepair = true,
  maxRepairAttempts = 2
): Promise<{ files: GeneratedFile[]; report: QualityReport }> {
  console.log(`\n[NUCLEAR GUARD] 🔍 Scan de ${files.length} fichiers...`);

  let currentFiles = [...files];
  let report = scanProject(currentFiles);

  console.log(`[NUCLEAR GUARD] Résultat: ${report.grade} — ${report.total} fichiers, ${report.errors.length} erreur(s).`);

  if (!report.ok && autoRepair) {
    const criticalErrors = report.errors.filter(e => e.severity === "critical");

    for (let attempt = 1; attempt <= maxRepairAttempts; attempt++) {
      if (criticalErrors.length === 0) break;

      console.log(`[NUCLEAR GUARD] 🔧 Tentative ${attempt}/${maxRepairAttempts}: réparation de ${criticalErrors.length} fichier(s)...`);

      let repaired = 0;
      for (const err of criticalErrors) {
        const fileIdx = currentFiles.findIndex(f => f.path === err.file);
        if (fileIdx === -1) continue;

        const repairedFile = await repairFileViaBridge(currentFiles[fileIdx], err.error);
        if (repairedFile) {
          currentFiles[fileIdx] = repairedFile;
          repaired++;
        }
      }

      if (repaired > 0) {
        console.log(`[NUCLEAR GUARD] ✅ ${repaired} fichier(s) réparé(s). Re-scan...`);
        report = scanProject(currentFiles);
        console.log(`[NUCLEAR GUARD] Grade final: ${report.grade}`);
      } else {
        console.log(`[NUCLEAR GUARD] ❌ Aucune réparation possible`);
        break;
      }
    }
  }

  return { files: currentFiles, report };
}
