// forge-stub-generator.ts — Auto-génère des stubs pour les imports manquants.
// Scanne tous les fichiers .tsx/.ts, extrait les imports relatifs, et crée des
// stubs (composants vides, hooks vides, types vides) pour ceux qui n'existent pas.

import type { GeneratedFile, ProjectConfig } from "./forge-config";
import { inferLanguage } from "./forge-config";
import path from "path";

interface MissingImport {
  fromFile: string;
  importPath: string;
  resolvedPath: string;
  namedImports: string[];
  defaultImport?: string;
}

/** Extracts all relative imports from a file's content. */
function extractImports(content: string, filePath: string): Array<{ importPath: string; named: string[]; default?: string }> {
  const imports: Array<{ importPath: string; named: string[]; default?: string }> = [];
  const lines = content.split("\n");

  for (const line of lines) {
    // Match: import DefaultName from './path'
    // Match: import { Name1, Name2 } from './path'
    // Match: import DefaultName, { Name1, Name2 } from './path'
    const importMatch = line.match(
      /^import\s+(?:(\w+)(?:\s*,\s*)?)?(?:\{([^}]+)\})?\s*(?:from\s+)?['"](\.[^'"]+)['"]/
    );
    if (importMatch) {
      const defaultImport = importMatch[1] || undefined;
      const namedStr = importMatch[2] || "";
      const importPath = importMatch[3];
      const named = namedStr
        .split(",")
        .map((s) => s.trim().split(/\s+as\s+/)[0].trim())
        .filter((s) => s && s !== "type");
      imports.push({ importPath, named, default: defaultImport });
    }

    // Match: import './path' (side-effect import)
    const sideEffectMatch = line.match(/^import\s+['"](\.[^'"]+)['"]/);
    if (sideEffectMatch && !importMatch) {
      imports.push({ importPath: sideEffectMatch[1], named: [], default: undefined });
    }
  }

  return imports;
}

/** Resolves a relative import path to a file path (with extension). */
function resolveImportPath(importPath: string, fromFile: string, existingPaths: Set<string>): string | null {
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
  } else if (normalized.startsWith("./")) {
    resolved = fromDir ? `${fromDir}/${normalized.replace(/^\.\//, "")}` : normalized.replace(/^\.\//, "");
  } else {
    resolved = normalized;
  }

  // Try exact path
  if (existingPaths.has(resolved)) return resolved;
  // Try with extensions
  const extensions = [".tsx", ".ts", ".jsx", ".js", ".json", ".css"];
  for (const ext of extensions) {
    if (existingPaths.has(resolved + ext)) return resolved + ext;
  }
  // Try index files
  for (const ext of extensions) {
    if (existingPaths.has(`${resolved}/index${ext}`)) return `${resolved}/index${ext}`;
  }

  return null; // Not found — needs a stub
}

/** Generates a stub file based on the import names. */
function generateStub(
  resolvedPath: string,
  namedImports: string[],
  defaultImport: string | undefined
): GeneratedFile {
  const ext = path.extname(resolvedPath);
  const isTsx = ext === ".tsx" || ext === ".jsx";
  const content: string[] = [];

  if (isTsx) {
    // Generate React component stubs
    content.push("import { type ReactNode } from 'react'");
    content.push("");

    for (const name of namedImports) {
      // Check if it looks like a component (PascalCase)
      if (/^[A-Z]/.test(name)) {
        content.push(`export function ${name}({ children }: { children?: ReactNode }) {`);
        content.push(`  return <>{children}</>`);
        content.push(`}`);
        content.push("");
      } else {
        // It's a hook or utility — export a no-op
        content.push(`export function ${name}(...args: any[]) { return {} }`);
        content.push("");
      }
    }

    if (defaultImport) {
      content.push(`export default function ${defaultImport}({ children }: { children?: ReactNode }) {`);
      content.push(`  return <>{children}</>`);
      content.push(`}`);
    }
  } else {
    // TypeScript file — export types and functions
    for (const name of namedImports) {
      // Type-like names (uppercase, not PascalCase component)
      if (/^[A-Z][a-z]/.test(name) || name === name.charAt(0).toUpperCase() + name.slice(1).toLowerCase()) {
        content.push(`export type ${name} = Record<string, unknown>`);
      } else if (/^[A-Z]/.test(name)) {
        // Interface-like
        content.push(`export interface ${name} { [key: string]: unknown }`);
      } else {
        // Function/const
        content.push(`export function ${name}(...args: any[]) { return {} }`);
      }
      content.push("");
    }

    if (defaultImport) {
      content.push(`export default function ${defaultImport}(...args: any[]) { return {} }`);
    }
  }

  return {
    path: resolvedPath,
    content: content.join("\n"),
    language: inferLanguage(resolvedPath),
  };
}

/** Scans all files for missing imports and generates stubs. */
export function generateMissingStubs(files: GeneratedFile[]): GeneratedFile[] {
  const existingPaths = new Set(files.map((f) => f.path));
  const missingMap = new Map<string, { named: string[]; default?: string }>();

  for (const file of files) {
    if (!file.path.match(/\.(tsx?|jsx?)$/)) continue;
    const imports = extractImports(file.content, file.path);

    for (const imp of imports) {
      // Skip bare imports (node_modules, @/ aliases — those are handled by package.json)
      if (!imp.importPath.startsWith(".") && !imp.importPath.startsWith("/")) continue;

      const resolved = resolveImportPath(imp.importPath, file.path, existingPaths);
      if (!resolved) {
        // Missing! Collect the import names
        const existing = missingMap.get(resolved || imp.importPath);
        if (existing) {
          existing.named.push(...imp.named.filter((n) => !existing.named.includes(n)));
          if (imp.default && !existing.default) existing.default = imp.default;
        } else {
          // We need to compute the resolved path even though it doesn't exist
          let normalized = imp.importPath.replace(/^\.\//, "");
          const fromDir = file.path.includes("/")
            ? file.path.substring(0, file.path.lastIndexOf("/"))
            : "";
          let resolvedPath: string;
          if (normalized.startsWith("../")) {
            const parts = fromDir.split("/");
            const upCount = (normalized.match(/\.\.\//g) || []).length;
            normalized = normalized.replace(/^(\.\.\/)+/, "");
            for (let i = 0; i < upCount; i++) parts.pop();
            resolvedPath = [...parts, normalized].filter(Boolean).join("/");
          } else {
            resolvedPath = fromDir ? `${fromDir}/${normalized.replace(/^\.\//, "")}` : normalized.replace(/^\.\//, "");
          }
          // Add .tsx extension if no extension
          if (!path.extname(resolvedPath)) resolvedPath += ".tsx";
          missingMap.set(resolvedPath, { named: [...imp.named], default: imp.default });
          existingPaths.add(resolvedPath); // Prevent duplicate stubs
        }
      }
    }
  }

  // Generate stubs
  const stubs: GeneratedFile[] = [];
  for (const [resolvedPath, { named, default: defaultImp }] of missingMap) {
    stubs.push(generateStub(resolvedPath, named, defaultImp));
  }

  return stubs;
}

/** Also fixes common LLM errors in generated code. */
export function fixCommonErrors(files: GeneratedFile[]): GeneratedFile[] {
  return files.map((file) => {
    if (!file.path.match(/\.(tsx?|jsx?)$/)) return file;
    let content = file.content;

    // Fix: RequestOptions → ApiClientOptions
    content = content.replace(/RequestOptions/g, "ApiClientOptions");

    // Fix: SelectContent, SelectItem, SelectTrigger, SelectValue → use native Select
    content = content.replace(
      /import\s+\{[^}]*SelectContent[^}]*\}\s+from\s+['"][^'"]*['"]/g,
      (match) => match.replace(/SelectContent,?\s*/g, "").replace(/SelectItem,?\s*/g, "").replace(/SelectTrigger,?\s*/g, "").replace(/SelectValue,?\s*/g, "").replace(/,\s*\}/g, " }").replace(/\{\s*,/g, "{ ")
    );

    // Fix: DialogContent, DialogHeader, DialogTitle, DialogTrigger → use Dialog
    content = content.replace(/DialogContent/g, "Dialog");
    content = content.replace(/DialogHeader/g, "Dialog");
    content = content.replace(/DialogTitle/g, "Dialog");
    content = content.replace(/DialogTrigger/g, "Dialog");

    // Fix: Table, TableBody, TableCell, TableHead, TableHeader, TableRow → native table
    content = content.replace(/import\s+\{[^}]*\bTable\b[^}]*\}\s+from\s+['"][^'"]*['"]/g, "");

    // Fix: onValueChange → onChange (Select compound component)
    content = content.replace(/onValueChange/g, "onChange");

    // Fix: toast import from @/shared/ui → remove (use console.warn)
    content = content.replace(/import\s+\{[^}]*toast[^}]*\}\s+from\s+['"]@\/shared\/ui['"]/g, "");
    content = content.replace(/toast\.\w+\([^)]*\)/g, "console.warn($&)");

    // Fix: expenseSchema → use schema variable
    content = content.replace(/expenseSchema/g, "schema");

    // Fix: .omit( on ZodEffects → .innerType()
    content = content.replace(/\.omit\(/g, ".innerType().omit(");

    return { ...file, content };
  });
}
