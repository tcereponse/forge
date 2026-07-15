/**
 * ═══════════════════════════════════════════════════════════════
 * FORGE NUCLEAR GUARD — Grade Gold
 * Migration from nuclear_guard.py (Elite Forge Mobile v1.0)
 *
 * Autonomous quality controller that validates syntax across
 * multiple file types, grades projects (GOLD/SILVER/RED),
 * and auto-repairs errors via DeepSeek/GLM API.
 *
 * Pépite #2: Contrôleur de Qualité Autonome
 * Pépite #3: Auto-Réparation via API (AST simplifiée)
 * ═══════════════════════════════════════════════════════════════
 */

import type { ProjectConfig, GeneratedFile } from "./forge-config";
import { bridgeState } from "./bridge-state";
import { glmChat } from "./glm-direct";

// ─── Types ───────────────────────────────────────────────────

export type Grade = "GOLD" | "SILVER" | "RED";

export interface FileError {
  file: string;
  error: string;
  line?: number;
  column?: number;
  code?: string; // error code for reparability
}

export interface QualityReport {
  ok: boolean;
  total: number;
  errors: FileError[];
  grade: Grade;
  timestamp: number;
  summary: string;
}

export interface ScanOptions {
  /** File extensions to check (default: all supported extensions) */
  extensions?: string[];
  /** File patterns to exclude */
  excludePatterns?: string[];
  /** Auto-repair threshold: max errors to auto-repair before failing */
  maxAutoRepair?: number;
}

export interface RepairResult {
  success: boolean;
  file: string;
  originalError: string;
  repairedContent?: string;
  error?: string;
}

export interface NuclearGuardResult {
  initialReport: QualityReport;
  repairedCount: number;
  finalReport: QualityReport;
  improvements: string[];
  duration: number;
}

// ─── Configuration ───────────────────────────────────────────

const DEFAULT_EXCLUDE_PATTERNS = [
  "node_modules",
  ".git",
  "dist",
  "build",
  ".next",
  "coverage",
  "*.log",
  "*.lock",
  "package-lock.json",
  "yarn.lock",
  "pnpm-lock.yaml",
];

// ─── Syntax Checkers ─────────────────────────────────────────

/**
 * Check TypeScript/JavaScript syntax by looking for:
 * - Unbalanced brackets/parens
 * - Empty critical blocks
 * - Common pattern errors
 */
function checkTypeScript(
  content: string,
  filepath: string
): FileError[] {
  const errors: FileError[] = [];
  const lines = content.split("\n");

  // 1. Check bracket/paren balance
  const opens = (content.match(/[{[(]/g) || []).length;
  const closes = (content.match(/[}\])]/g) || []).length;

  if (Math.abs(opens - closes) > 5) {
    errors.push({
      file: filepath,
      error: `Unbalanced delimiters: ${opens} opening vs ${closes} closing`,
      code: "UNBALANCED_BRACKETS",
    });
  }

  // 2. Check for empty function/class bodies (potential truncation)
  const emptyBlockRegex = /(function\s+\w+\s*|=>\s*|class\s+\w+\s*)\{[\s\n]*\}/g;
  if (emptyBlockRegex.test(content) && content.length < 150) {
    errors.push({
      file: filepath,
      error: "File appears empty or malformed (contains empty critical blocks)",
      code: "EMPTY_BLOCK",
    });
  }

  // 3. Check for truncated template strings
  const templateStarts = (content.match(/`/g) || []).length;
  if (templateStarts % 2 !== 0) {
    errors.push({
      file: filepath,
      error: "Unterminated template string (odd number of backticks)",
      code: "UNTERMINATED_TEMPLATE",
    });
  }

  // 4. Check for missing semicolons in non-JSX context (common error)
  // Only flag if it looks like a clear missing semicolon before a line starting with (
  for (let i = 0; i < lines.length - 1; i++) {
    const line = lines[i].trim();
    const nextLine = lines[i + 1].trim();
    if (
      line.length > 0 &&
      !line.endsWith(";") &&
      !line.endsWith("{") &&
      !line.endsWith("}") &&
      !line.endsWith(",") &&
      !line.endsWith(":") &&
      !line.endsWith("(") &&
      !line.endsWith("[") &&
      !line.endsWith("/*") &&
      !line.startsWith("//") &&
      !line.startsWith("/*") &&
      nextLine.startsWith("(") &&
      !line.includes("function") &&
      !line.includes("=>") &&
      !line.includes("if") &&
      !line.includes("else") &&
      !line.includes("return") &&
      !line.includes("import") &&
      !line.includes("export") &&
      !line.includes("const") &&
      !line.includes("let") &&
      !line.includes("var")
    ) {
      errors.push({
        file: filepath,
        error: `Possible missing semicolon at line ${i + 1}: "${line.slice(0, 50)}..."`,
        line: i + 1,
        code: "MISSING_SEMICOLON",
      });
    }
  }

  // 5. Check for common JSX errors (unclosed tags)
  const selfClosingTags = content.match(/<[A-Z]\w+[^>]*\/>/g) || [];
  const openingTags = content.match(/<[A-Z]\w+[^>]*>/g) || [];
  const closingTags = content.match(/<\/[A-Z]\w+>/g) || [];

  // Estimate: each non-self-closing component tag should have a matching close
  if (openingTags.length > closingTags.length + selfClosingTags.length + 3) {
    errors.push({
      file: filepath,
      error: `Possible unclosed JSX tags: ${openingTags.length} opening vs ${closingTags.length} closing (+ ${selfClosingTags.length} self-closing)`,
      code: "UNCLOSED_JSX",
    });
  }

  return errors;
}

/**
 * Check Python syntax by looking for:
 * - Indentation consistency
 * - Common Python errors
 */
function checkPython(
  content: string,
  filepath: string
): FileError[] {
  const errors: FileError[] = [];
  const lines = content.split("\n");

  // Check indentation consistency (mixing tabs and spaces)
  let hasTabs = false;
  let hasSpaces = false;
  for (const line of lines) {
    if (line.startsWith("\t")) hasTabs = true;
    if (line.startsWith(" ")) hasSpaces = true;
  }
  if (hasTabs && hasSpaces) {
    errors.push({
      file: filepath,
      error: "Mixed tabs and spaces in indentation",
      code: "MIXED_INDENT",
    });
  }

  // Check for common errors: missing colons after def/if/for/while/class
  const controlKeywords = ["def ", "if ", "elif ", "else", "for ", "while ", "class ", "try:", "except", "finally:", "with "];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trimEnd();
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Check if a line starts with a control keyword but doesn't end with :
    const startsWithKeyword = controlKeywords.some((kw) => trimmed.startsWith(kw));
    if (startsWithKeyword && !trimmed.endsWith(":") && !trimmed.endsWith(":")) {
      // Only flag if the line is not a comment and not empty
      const stripped = trimmed.replace(/".*?"/g, "").replace(/'.*?'/g, "");
      const relevantKeywords = ["def ", "if ", "elif ", "else", "for ", "while ", "class "];
      if (relevantKeywords.some((kw) => stripped.startsWith(kw))) {
        errors.push({
          file: filepath,
          error: `Missing colon at line ${i + 1}: "${trimmed.slice(0, 50)}"`,
          line: i + 1,
          code: "MISSING_COLON",
        });
      }
    }
  }

  // Check for unterminated multi-line strings
  const tripleQuotes = (content.match(/"""/g) || []).length;
  if (tripleQuotes % 2 !== 0) {
    errors.push({
      file: filepath,
      error: "Unterminated triple-quoted string",
      code: "UNTERMINATED_STRING",
    });
  }

  return errors;
}

/**
 * Check JSON file validity.
 */
function checkJson(
  content: string,
  filepath: string
): FileError[] {
  const errors: FileError[] = [];

  try {
    JSON.parse(content);
  } catch (e: any) {
    // Try to extract line number from error message
    const lineMatch = e.message?.match(/position\s+(\d+)/);
    let line: number | undefined;
    if (lineMatch) {
      const pos = parseInt(lineMatch[1], 10);
      line = content.substring(0, pos).split("\n").length;
    }

    errors.push({
      file: filepath,
      error: `Invalid JSON: ${e.message || "Parse error"}`,
      line,
      code: "INVALID_JSON",
    });
  }

  return errors;
}

/**
 * Check Markdown file validity (not empty/truncated).
 */
function checkMarkdown(
  content: string,
  filepath: string
): FileError[] {
  const errors: FileError[] = [];

  if (content.length < 30) {
    errors.push({
      file: filepath,
      error: "File too short (likely truncated or empty)",
      code: "TRUNCATED_FILE",
    });
  }

  // Check for unbalanced HTML tags
  const opens = (content.match(/<(b|i|u|strong|em|code|pre|div|span|p|h[1-6]|ul|ol|li|table|tr|td|th)[^>]*>/gi) || []).length;
  const closes = (content.match(/<\/(b|i|u|strong|em|code|pre|div|span|p|h[1-6]|ul|ol|li|table|tr|td|th)>/gi) || []).length;

  if (opens > closes + 3) {
    errors.push({
      file: filepath,
      error: `Possible unclosed HTML tags: ${opens} opening vs ${closes} closing`,
      code: "UNCLOSED_HTML",
    });
  }

  return errors;
}

// ─── Checker Dispatch ────────────────────────────────────────

interface CheckerFn {
  (content: string, filepath: string): FileError[];
}

const CHECKERS: Record<string, CheckerFn> = {
  ".ts": checkTypeScript,
  ".tsx": checkTypeScript,
  ".js": checkTypeScript,
  ".jsx": checkTypeScript,
  ".mjs": checkTypeScript,
  ".cjs": checkTypeScript,
  ".py": checkPython,
  ".json": checkJson,
  ".md": checkMarkdown,
};

/**
 * Determine a file's grade based on check results.
 */
function determineGrade(errors: FileError[], total: number): Grade {
  if (errors.length === 0) return "GOLD";
  if (errors.length <= 2) return "SILVER";
  return "RED";
}

/**
 * Build a human-readable summary for the quality report.
 */
function buildSummary(grade: Grade, total: number, errors: FileError[]): string {
  const errorCount = errors.length;
  const pct = total > 0 ? Math.round(((total - errorCount) / total) * 100) : 100;

  let summary = `[NUCLEAR GUARD] Grade: ${grade} | ${total} files scanned, ${errorCount} error(s) (${pct}% pass rate)`;

  if (grade === "GOLD") {
    summary += " | All files pass validation.";
  } else if (grade === "SILVER") {
    summary += ` | ${errorCount} minor error(s) found — auto-repairable.`;
  } else {
    summary += ` | ${errorCount} error(s) found — manual review recommended.`;
  }

  return summary;
}

// ─── Core Functions ──────────────────────────────────────────

/**
 * Scan a collection of generated files for syntax/quality errors.
 * Supports TypeScript, JavaScript, Python, JSON, and Markdown.
 *
 * @param files - Array of GeneratedFile objects to scan
 * @param options - Optional scanning configuration
 * @returns QualityReport with detailed error information
 */
export function scanProject(
  files: GeneratedFile[],
  options?: ScanOptions
): QualityReport {
  const errors: FileError[] = [];
  const scanned: GeneratedFile[] = [];

  const exts = options?.extensions || Object.keys(CHECKERS);
  const excludePatterns = options?.excludePatterns || DEFAULT_EXCLUDE_PATTERNS;

  for (const file of files) {
    // Skip excluded patterns
    const shouldExclude = excludePatterns.some((pattern) => {
      if (pattern.startsWith("*.")) {
        return file.path.endsWith(pattern.slice(1));
      }
      return file.path.includes(pattern);
    });
    if (shouldExclude) continue;

    const ext = "." + file.path.split(".").pop()?.toLowerCase();
    const checker = CHECKERS[ext];
    if (!checker || !exts.includes(ext)) continue;

    scanned.push(file);

    try {
      const fileErrors = checker(file.content, file.path);
      errors.push(...fileErrors);
    } catch (e) {
      errors.push({
        file: file.path,
        error: `Checker crashed: ${e instanceof Error ? e.message : "Unknown error"}`,
        code: "CHECKER_CRASH",
      });
    }
  }

  const grade = determineGrade(errors, scanned.length);

  const report: QualityReport = {
    ok: errors.length === 0,
    total: scanned.length,
    errors,
    grade,
    timestamp: Date.now(),
    summary: buildSummary(grade, scanned.length, errors),
  };

  return report;
}

/**
 * Build a corrective prompt for the LLM to fix a specific file error.
 * The LLM receives the erroneous code and must return the corrected version.
 *
 * @param file - The file that needs repair
 * @param error - The error description
 * @returns A prompt string for the LLM
 */
export function buildCorrectivePrompt(
  file: GeneratedFile,
  error: FileError
): string {
  return `You are an expert code debugger. Fix the syntax error in this file.

File: ${file.path}
Error detected: ${error.error}
${error.line ? `Approximate line: ${error.line}` : ""}
Error code: ${error.code || "N/A"}

Current code:
\`\`\`${file.language}
${file.content.slice(0, 3000)}
\`\`\`

MISSION: Fix ONLY the syntax error. Return the complete fixed file in JSON format:
{"content": "the complete corrected code here"}

CRITICAL RULES:
1. Do NOT add new features or modify the logic — only fix the syntax error
2. Preserve all existing code structure and comments
3. Return ONLY valid JSON — no explanations, no conversation
4. Ensure the fixed code maintains the same indentation style`;
}

/**
 * Repair a single file via the LLM (DeepSeek via Bridge or GLM).
 * Sends the erroneous code to DeepSeek/GLM and applies the corrected version.
 *
 * @param file - The generated file to repair
 * @param error - The error description
 * @param config - Project configuration (for context)
 * @returns RepairResult indicating success/failure
 */
export async function repairFileViaApi(
  file: GeneratedFile,
  error: FileError,
  config: ProjectConfig
): Promise<RepairResult> {
  const prompt = buildCorrectivePrompt(file, error);

  try {
    // Strategy 1: Try GLM first
    const glmResult = await glmChat([
      {
        role: "assistant",
        content: "You are an expert code debugger. You respond ONLY with valid JSON.",
      },
      { role: "user", content: prompt },
    ]);

    if (glmResult.content && glmResult.content.length > 20) {
      const fixed = extractFixedContent(glmResult.content);
      if (fixed && fixed.length > 10) {
        console.log(`[NUCLEAR GUARD] 🔧 File repaired via GLM: ${file.path}`);
        return {
          success: true,
          file: file.path,
          originalError: error.error,
          repairedContent: fixed,
        };
      }
    }

    // Strategy 2: Fallback to KIROV Bridge (DeepSeek)
    console.log(`[NUCLEAR GUARD] GLM repair failed for ${file.path}, trying DeepSeek bridge...`);
    const bridgeResult = await bridgeState.runOneShot(prompt, 120000);

    if (bridgeResult.content && bridgeResult.content.length > 20) {
      const fixed = extractFixedContent(bridgeResult.content);
      if (fixed && fixed.length > 10) {
        console.log(`[NUCLEAR GUARD] 🔧 File repaired via DeepSeek Bridge: ${file.path}`);
        return {
          success: true,
          file: file.path,
          originalError: error.error,
          repairedContent: fixed,
        };
      }
    }

    return {
      success: false,
      file: file.path,
      originalError: error.error,
      error: "LLM returned empty or invalid content",
    };
  } catch (e) {
    return {
      success: false,
      file: file.path,
      originalError: error.error,
      error: e instanceof Error ? e.message : "Unknown repair error",
    };
  }
}

/**
 * Extract fixed content from the LLM's JSON response.
 * Handles markdown fences, direct JSON, and truncated responses.
 */
function extractFixedContent(response: string): string | null {
  let cleaned = response.trim();

  // Strip markdown code fences
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch) {
    cleaned = fenceMatch[1].trim();
  }

  // Try direct JSON parse with "content" field
  try {
    const parsed = JSON.parse(cleaned);
    if (parsed.content && typeof parsed.content === "string") {
      return parsed.content;
    }
    if (parsed.fixed_content && typeof parsed.fixed_content === "string") {
      return parsed.fixed_content;
    }
    if (parsed.code && typeof parsed.code === "string") {
      return parsed.code;
    }
  } catch {
    // Continue to next strategy
  }

  // Try to find JSON start/end
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    try {
      const slice = cleaned.slice(firstBrace, lastBrace + 1);
      const parsed = JSON.parse(slice);
      if (parsed.content && typeof parsed.content === "string") {
        return parsed.content;
      }
    } catch {
      // Fallback: return the cleaned response itself if it looks like code
    }
  }

  // Last resort: if the response looks like code (not conversational), return it
  if (
    response.length > 50 &&
    !response.startsWith("I'm sorry") &&
    !response.startsWith("Sorry") &&
    !response.startsWith("Here's") &&
    !response.toLowerCase().includes("here is the corrected")
  ) {
    return response;
  }

  return null;
}

/**
 * Run the full Nuclear Guard pipeline: scan, report, repair, re-scan.
 *
 * @param generatedFiles - Array of GeneratedFile objects to validate
 * @param config - Project configuration
 * @param options - Optional scanning/repair configuration
 * @returns NuclearGuardResult with initial/final reports and repair details
 */
export async function runNuclearGuard(
  generatedFiles: GeneratedFile[],
  config: ProjectConfig,
  options?: ScanOptions
): Promise<NuclearGuardResult> {
  const improvements: string[] = [];
  const startTime = Date.now();

  console.log(`\n[NUCLEAR GUARD] 🔍 Scanning ${generatedFiles.length} generated files...`);

  // Phase 1: Initial scan
  const initialReport = scanProject(generatedFiles, options);
  console.log(initialReport.summary);

  if (initialReport.ok) {
    // No errors — return immediately with GOLD grade
    return {
      initialReport,
      repairedCount: 0,
      finalReport: initialReport,
      improvements: ["All files pass validation — GOLD grade achieved immediately."],
      duration: Date.now() - startTime,
    };
  }

  // Phase 2: Auto-repair (if configured)
  const maxRepair = options?.maxAutoRepair ?? 5;
  const repairCandidates = initialReport.errors.slice(0, maxRepair);
  let repairedCount = 0;
  const repairedFiles: GeneratedFile[] = [];

  if (repairCandidates.length > 0) {
    console.log(`[NUCLEAR GUARD] 🔧 Attempting auto-repair of ${repairCandidates.length} file(s)...`);

    for (const err of repairCandidates) {
      const file = generatedFiles.find((f) => f.path === err.file);
      if (!file) continue;

      const result = await repairFileViaApi(file, err, config);

      if (result.success && result.repairedContent) {
        repairedFiles.push({
          ...file,
          content: result.repairedContent,
        });
        repairedCount++;
        improvements.push(`✅ Repaired: ${err.file} — ${err.error}`);
      } else {
        improvements.push(`❌ Failed to repair: ${err.file} — ${err.error}`);
      }
    }
  }

  // Phase 3: Re-scan with repaired files
  const finalFiles = generatedFiles.map((file) => {
    const repaired = repairedFiles.find((rf) => rf.path === file.path);
    return repaired || file;
  });

  const finalReport = scanProject(finalFiles, options);
  console.log(finalReport.summary);

  if (repairedCount > 0) {
    improvements.push(`🔧 Auto-repair: ${repairedCount}/${repairCandidates.length} files fixed.`);
  }

  if (finalReport.ok) {
    improvements.push(`🎉 All issues resolved after repair. Final grade: ${finalReport.grade}`);
  } else {
    improvements.push(`⚠️ ${finalReport.errors.length} error(s) remain after repair. Final grade: ${finalReport.grade}`);
  }

  return {
    initialReport,
    repairedCount,
    finalReport,
    improvements,
    duration: Date.now() - startTime,
  };
}

/**
 * Quick quality check — runs a lightweight scan without full Nuclear Guard pipeline.
 * Useful for real-time validation in the UI.
 *
 * @param files - Files to check
 * @returns Quick quality assessment
 */
export function quickQualityCheck(
  files: GeneratedFile[]
): {
  grade: Grade;
  totalErrors: number;
  errorFiles: string[];
  passRate: number;
} {
  const report = scanProject(files);
  const errorFiles = [...new Set(report.errors.map((e) => e.file))];
  const passRate = report.total > 0
    ? Math.round(((report.total - report.errors.length) / report.total) * 100)
    : 100;

  return {
    grade: report.grade,
    totalErrors: report.errors.length,
    errorFiles,
    passRate,
  };
}

/**
 * Validate that a single file is syntactically valid.
 * Returns null if valid, or the first error found.
 *
 * @param file - The file to validate
 * @returns The first FileError found, or null if valid
 */
export function validateFile(file: GeneratedFile): FileError | null {
  const report = scanProject([file]);
  return report.errors.length > 0 ? report.errors[0] : null;
}
