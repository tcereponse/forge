// forge-validators.ts — Validation gates for the multi-pass generation pipeline.
// Each gate checks a specific aspect of the generated code and returns a report.
// If a gate fails, the pipeline can retry with a corrective prompt.

import type { GeneratedFile } from "./forge-config";
import { inferLanguage } from "./forge-config";

export interface ValidationGateResult {
  ok: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  autoFixes: string[];
}

export interface ValidationError {
  file: string;
  line?: number;
  message: string;
  category: "syntax" | "import" | "export" | "typescript" | "architecture";
}

export interface ValidationWarning {
  file: string;
  message: string;
}

// ── Gate 1: Syntax validation (balanced braces, JSX tags, etc.) ────────────
export function validateSyntax(files: GeneratedFile[]): ValidationGateResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const autoFixes: string[] = [];

  for (const file of files) {
    if (!file.path.match(/\.(tsx?|jsx?)$/)) continue;
    const content = file.content;

    // Check balanced braces
    const openBraces = (content.match(/\{/g) || []).length;
    const closeBraces = (content.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.push({
        file: file.path,
        message: `Accolades déséquilibrées: ${openBraces} '{' vs ${closeBraces} '}'`,
        category: "syntax",
      });
    }

    // Check balanced parens
    const openParens = (content.match(/\(/g) || []).length;
    const closeParens = (content.match(/\)/g) || []).length;
    if (openParens !== closeParens) {
      errors.push({
        file: file.path,
        message: `Parenthèses déséquilibrées: ${openParens} '(' vs ${closeParens} ')'`,
        category: "syntax",
      });
    }

    // Check balanced brackets
    const openBrackets = (content.match(/\[/g) || []).length;
    const closeBrackets = (content.match(/\]/g) || []).length;
    if (openBrackets !== closeBrackets) {
      errors.push({
        file: file.path,
        message: `Crochets déséquilibrés: ${openBrackets} '[' vs ${closeBrackets} ']'`,
        category: "syntax",
      });
    }

    // Check for unclosed template literals
    const backticks = (content.match(/`/g) || []).length;
    if (backticks % 2 !== 0) {
      errors.push({
        file: file.path,
        message: "Template literal non fermé (backtick manquant)",
        category: "syntax",
      });
    }

    // Check for unclosed strings (simple heuristic)
    const singleQuotes = (content.match(/'/g) || []).length;
    const doubleQuotes = (content.match(/"/g) || []).length;
    // Note: this is a rough heuristic; false positives possible in comments

    // Check for unclosed JSX tags (very basic)
    const jsxOpenTags = content.match(/<[A-Z][a-zA-Z0-9]*[\s>]/g) || [];
    const jsxCloseTags = content.match(/<\/[A-Z][a-zA-Z0-9]*>/g) || [];
    const selfClosingTags = content.match(/<[A-Z][a-zA-Z0-9]*[^>]*\/>/g) || [];
    const expectedClose = jsxOpenTags.length - selfClosingTags.length;
    if (expectedClose !== jsxCloseTags.length && file.path.endsWith(".tsx")) {
      // Only warn — JSX fragments and conditionals can cause false positives
      if (Math.abs(expectedClose - jsxCloseTags.length) > 2) {
        warnings.push({
          file: file.path,
          message: `Possible déséquilibre JSX: ${expectedClose} ouvertures vs ${jsxCloseTags.length} fermetures`,
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    autoFixes,
  };
}

// ── Gate 2: Import resolution (all relative imports resolve to a file) ─────
export function validateImports(files: GeneratedFile[]): ValidationGateResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const autoFixes: string[] = [];

  const filePaths = new Set(files.map((f) => f.path));

  for (const file of files) {
    if (!file.path.match(/\.(tsx?|jsx?)$/)) continue;

    // Find all import statements
    const importRegex = /import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = importRegex.exec(file.content)) !== null) {
      const importPath = match[1];

      // Skip bare imports (node_modules)
      if (!importPath.startsWith(".") && !importPath.startsWith("/")) continue;

      // Resolve the import path relative to the current file
      const resolved = resolveImportPath(importPath, file.path, filePaths);
      if (!resolved) {
        errors.push({
          file: file.path,
          message: `Import non résolu: '${importPath}'`,
          category: "import",
        });
      }
    }

    // Check for dynamic imports
    const dynamicImportRegex = /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
    while ((match = dynamicImportRegex.exec(file.content)) !== null) {
      const importPath = match[1];
      if (!importPath.startsWith(".") && !importPath.startsWith("/")) continue;
      const resolved = resolveImportPath(importPath, file.path, filePaths);
      if (!resolved) {
        warnings.push({
          file: file.path,
          message: `Import dynamique non résolu: '${importPath}'`,
        });
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    autoFixes,
  };
}

function resolveImportPath(
  importPath: string,
  fromFile: string,
  availablePaths: Set<string>
): boolean {
  // Normalize: remove leading ./
  let normalized = importPath.replace(/^\.\//, "");

  // Get the directory of the importing file
  const fromDir = fromFile.includes("/")
    ? fromFile.substring(0, fromFile.lastIndexOf("/"))
    : "";

  // Resolve relative path
  let resolved: string;
  if (normalized.startsWith("../")) {
    const parts = fromDir.split("/");
    const upCount = (normalized.match(/\.\.\//g) || []).length;
    normalized = normalized.replace(/^(\.\.\/)+/, "");
    for (let i = 0; i < upCount; i++) parts.pop();
    resolved = [...parts, normalized].filter(Boolean).join("/");
  } else if (normalized.startsWith("./")) {
    resolved = fromDir
      ? `${fromDir}/${normalized.replace(/^\.\//, "")}`
      : normalized.replace(/^\.\//, "");
  } else {
    resolved = normalized;
  }

  // Try exact path
  if (availablePaths.has(resolved)) return true;

  // Try with extensions
  const extensions = [".tsx", ".ts", ".jsx", ".js", ".json", ".css"];
  for (const ext of extensions) {
    if (availablePaths.has(resolved + ext)) return true;
  }

  // Try index files
  for (const ext of extensions) {
    if (availablePaths.has(`${resolved}/index${ext}`)) return true;
  }

  return false;
}

// ── Gate 3: Export validation (default export in App.tsx, components exported) ─
export function validateExports(files: GeneratedFile[]): ValidationGateResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const autoFixes: string[] = [];

  const appFile = files.find((f) => /src\/App\.(tsx|jsx)$/.test(f.path));
  if (appFile) {
    if (!/export\s+default\s+/m.test(appFile.content)) {
      errors.push({
        file: appFile.path,
        message: "App.tsx doit avoir un export default",
        category: "export",
      });
    }
  }

  // Check that MainComponent has a default export
  const mainComponent = files.find((f) =>
    /src\/components\/.*\.(tsx|jsx)$/.test(f.path)
  );
  if (mainComponent) {
    if (!/export\s+default\s+/m.test(mainComponent.content)) {
      errors.push({
        file: mainComponent.path,
        message: "Le composant principal doit avoir un export default",
        category: "export",
      });
    }
  }

  // Check that all imported local files have matching exports
  const filePaths = new Set(files.map((f) => f.path));
  for (const file of files) {
    if (!file.path.match(/\.(tsx?|jsx?)$/)) continue;

    // Find named imports: import { Foo, Bar } from './path'
    const namedImportRegex =
      /import\s+\{([^}]+)\}\s+from\s+['"](\.[^'"]+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = namedImportRegex.exec(file.content)) !== null) {
      const names = match[1].split(",").map((n) => n.trim().split(/\s+as\s+/)[0].trim());
      const importPath = match[2];

      // Find the target file
      const targetFile = findFileByImportPath(importPath, file.path, files);
      if (!targetFile) continue; // Already caught by import validation

      // Check that each named import is exported
      for (const name of names) {
        if (name === "type") continue; // Skip type-only imports
        const exportRegex = new RegExp(
          `export\\s+(?:const|let|var|function|class|interface|type|enum)\\s+${name}\\b|export\\s*\\{[^}]*\\b${name}\\b[^}]*\\}`
        );
        if (!exportRegex.test(targetFile.content)) {
          // Check for re-export
          const reExportRegex = new RegExp(
            `export\\s+\\{[^}]*\\b${name}\\b[^}]*\\}\\s+from`
          );
          if (!reExportRegex.test(targetFile.content)) {
            warnings.push({
              file: file.path,
              message: `'${name}' importé depuis '${importPath}' mais non exporté par le fichier cible`,
            });
          }
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    autoFixes,
  };
}

function findFileByImportPath(
  importPath: string,
  fromFile: string,
  files: GeneratedFile[]
): GeneratedFile | null {
  let normalized = importPath.replace(/^\.\//, "");
  const fromDir = fromFile.includes("/")
    ? fromFile.substring(0, fromFile.lastIndexOf("/"))
    : "";

  let resolved: string;
  if (normalized.startsWith("../")) {
    const parts = fromDir.split("/");
    const upCount = (normalized.match(/\.\.\//g) || []).length;
    normalized = normalized.replace(/^(\.\.\/)+/, "");
    for (let i = 0; i < upCount; i++) parts.pop();
    resolved = [...parts, normalized].filter(Boolean).join("/");
  } else {
    resolved = fromDir
      ? `${fromDir}/${normalized.replace(/^\.\//, "")}`
      : normalized.replace(/^\.\//, "");
  }

  const extensions = ["", ".tsx", ".ts", ".jsx", ".js", ".json", ".css"];
  for (const ext of extensions) {
    const file = files.find((f) => f.path === resolved + ext);
    if (file) return file;
  }
  for (const ext of extensions) {
    const file = files.find((f) => f.path === `${resolved}/index${ext}`);
    if (file) return file;
  }
  return null;
}

// ── Gate 4: React architecture (no hooks before providers, etc.) ──────────
export function validateArchitecture(files: GeneratedFile[]): ValidationGateResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const autoFixes: string[] = [];

  for (const file of files) {
    if (!file.path.match(/\.(tsx?|jsx?)$/)) continue;
    const content = file.content;

    // Check for hooks called outside components (basic heuristic)
    const hookRegex = /\b(use[A-Z]\w*)\s*\(/g;
    const componentRegex =
      /(function|const)\s+([A-Z]\w*)\s*(\([^)]*\)|=)\s*[:=(]/g;

    // Check for useState/useEffect at module level (outside any function)
    const lines = content.split("\n");
    let insideComponent = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      // Track function nesting (rough)
      if (/^\s*(export\s+)?(function|const)\s+[A-Z]\w*/.test(line)) {
        insideComponent++;
      }
      if (line.includes("}") && insideComponent > 0) {
        // This is rough; only decrement if it looks like end of function
      }

      // Check for hook calls at module level
      if (insideComponent === 0 && /\buse[A-Z]\w*\s*\(/.test(line)) {
        // Could be a custom hook definition, not an error
        if (!/^\s*(export\s+)?(function|const)\s+use[A-Z]/.test(line)) {
          warnings.push({
            file: file.path,
            message: `Ligne ${i + 1}: Hook utilisé en dehors d'un composant ?`,
          });
        }
      }
    }

    // Check for conditional hooks (hooks inside if/else)
    const conditionalHookRegex =
      /(if\s*\([^)]*\)\s*\{[^}]*\buse[A-Z]\w*\s*\()/g;
    if (conditionalHookRegex.test(content)) {
      errors.push({
        file: file.path,
        message: "Hook conditionnel détecté — les hooks ne doivent pas être dans un if",
        category: "architecture",
      });
    }

    // Check for async component (React components can't be async)
    const asyncComponentRegex =
      /export\s+default\s+async\s+function\s+[A-Z]\w*|export\s+const\s+[A-Z]\w*\s*=\s*async\s*\(/;
    if (asyncComponentRegex.test(content)) {
      errors.push({
        file: file.path,
        message: "Composant React async — les composants ne peuvent pas être async",
        category: "architecture",
      });
    }

    // Check for direct DOM manipulation in render
    if (/document\.getElementById|document\.querySelector/.test(content) &&
        !content.includes("useEffect") &&
        file.path.endsWith("tsx")) {
      warnings.push({
        file: file.path,
        message: "Manipulation DOM directe détectée — utiliser useRef à la place",
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    autoFixes,
  };
}

// ── Gate 5: TypeScript type safety ─────────────────────────────────────────
export function validateTypeSafety(files: GeneratedFile[]): ValidationGateResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const autoFixes: string[] = [];

  for (const file of files) {
    if (!file.path.match(/\.tsx?$/)) continue;
    const content = file.content;

    // Check for 'any' type usage
    const anyMatches = content.match(/:\s*any\b/g);
    if (anyMatches && anyMatches.length > 3) {
      warnings.push({
        file: file.path,
        message: `${anyMatches.length} utilisations de 'any' — envisager un typage plus strict`,
      });
    }

    // Check for missing prop types on components
    const componentRegex = /(function|const)\s+([A-Z]\w*)\s*\(\s*(\w+)?\s*\)/g;
    let match: RegExpExecArray | null;
    while ((match = componentRegex.exec(content)) !== null) {
      const propsParam = match[3];
      if (propsParam && !content.includes(`interface ${match[2]}Props`) &&
          !content.includes(`type ${match[2]}Props`) &&
          !content.includes(`${propsParam}:`) &&
          !content.match(new RegExp(`\\b${propsParam}\\s*:\\s*\\{`))) {
        // Component has props but no type annotation — check if it's a simple prop
        // This is a warning, not an error
        warnings.push({
          file: file.path,
          message: `Composant '${match[2]}' — props non typées`,
        });
      }
    }

    // Check for @ts-ignore
    const tsIgnoreCount = (content.match(/@ts-ignore|@ts-nocheck/g) || []).length;
    if (tsIgnoreCount > 0) {
      warnings.push({
        file: file.path,
        message: `${tsIgnoreCount} @ts-ignore/@ts-nocheck — corriger le typage`,
      });
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    autoFixes,
  };
}

// ── Run all gates ──────────────────────────────────────────────────────────
export function runAllValidationGates(files: GeneratedFile[]): {
  ok: boolean;
  results: { gate: string; result: ValidationGateResult }[];
  totalErrors: number;
  totalWarnings: number;
} {
  const gates = [
    { gate: "syntax", fn: validateSyntax },
    { gate: "imports", fn: validateImports },
    { gate: "exports", fn: validateExports },
    { gate: "architecture", fn: validateArchitecture },
    { gate: "typesafety", fn: validateTypeSafety },
  ];

  const results = gates.map(({ gate, fn }) => ({
    gate,
    result: fn(files),
  }));

  const totalErrors = results.reduce((sum, r) => sum + r.result.errors.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.result.warnings.length, 0);

  return {
    ok: results.every((r) => r.result.ok),
    results,
    totalErrors,
    totalWarnings,
  };
}

// ── Build a corrective prompt from validation errors ──────────────────────
export function buildCorrectivePrompt(
  errors: ValidationError[],
  fileContents: Record<string, string>
): string {
  const errorList = errors
    .map((e) => `- ${e.file}: ${e.message}`)
    .join("\n");

  return `Le code généré contient les erreurs suivantes. Corrige-les et régénère UNIQUEMENT les fichiers concernés.

ERREURS À CORRIGER:
${errorList}

RÈGLES:
- Réponds UNIQUEMENT avec du JSON valide: {"files":[{"path":"...","content":"...","language":"..."}]}
- Ne modifie que les fichiers qui ont des erreurs
- Garde le code fonctionnel — ne casse pas ce qui marche
- Assure-toi que tous les imports sont résolus
- Assure-toi que chaque composant a un export default
- Corrige les déséquilibres d'accolades/parenthèses
- Types stricts: pas de 'any', pas de @ts-ignore`;
}
