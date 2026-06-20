// Post-generation validation and auto-repair for generated React projects.
// Addresses the standardization plan:
//   A. Dependency reconciliation (scan imports → ensure all in package.json)
//   B. Tailwind corruption crash-test + auto-repair
//   C. Utility files (src/lib/utils.ts + cn()) when needed
//   D. React architecture checks (no hook-before-provider patterns)
//   E. Newline corruption crash-test + auto-repair (CODE_GENERATION_CORRUPTION_PRD)
//   F. Missing import auto-repair (create stub components for unresolved imports)
//   G. Validation report

import type { GeneratedFile, ProjectConfig, ValidationIssue, ValidationReport } from "./forge-config";
import { sanitizeFileContent } from "./forge-anticorruption";
import path from "path";

// ── Known import-name → npm-package mappings with versions ────────────────
// When the LLM uses an import like `import { motion } from 'framer-motion'`,
// we ensure the package is in package.json.
interface PkgMapping {
  pkg: string;
  version: string;
  dev?: boolean;
}

const IMPORT_TO_PACKAGE: Record<string, PkgMapping> = {
  // React core (already in templates, but listed for safety)
  react: { pkg: "react", version: "^18.3.1" },
  "react-dom": { pkg: "react-dom", version: "^18.3.1" },

  // Routing
  "react-router-dom": { pkg: "react-router-dom", version: "^6.26.0" },

  // State
  zustand: { pkg: "zustand", version: "^4.5.4" },
  "@reduxjs/toolkit": { pkg: "@reduxjs/toolkit", version: "^2.2.7" },
  "react-redux": { pkg: "react-redux", version: "^9.1.2" },
  "@tanstack/react-query": { pkg: "@tanstack/react-query", version: "^5.52.0" },

  // UI / icons / animation
  "lucide-react": { pkg: "lucide-react", version: "^0.439.0" },
  "framer-motion": { pkg: "framer-motion", version: "^11.3.24" },
  motion: { pkg: "framer-motion", version: "^11.3.24" },
  "next-themes": { pkg: "next-themes", version: "^0.3.0" },
  "@radix-ui/react-dialog": { pkg: "@radix-ui/react-dialog", version: "^1.1.2" },
  "@radix-ui/react-dropdown-menu": { pkg: "@radix-ui/react-dropdown-menu", version: "^2.1.2" },
  "@radix-ui/react-tabs": { pkg: "@radix-ui/react-tabs", version: "^1.1.1" },
  "@radix-ui/react-toast": { pkg: "@radix-ui/react-toast", version: "^1.2.2" },
  "@radix-ui/react-select": { pkg: "@radix-ui/react-select", version: "^2.1.2" },
  "@radix-ui/react-slot": { pkg: "@radix-ui/react-slot", version: "^1.1.0" },
  "@radix-ui/react-tooltip": { pkg: "@radix-ui/react-tooltip", version: "^1.1.3" },
  "@radix-ui/react-checkbox": { pkg: "@radix-ui/react-checkbox", version: "^1.1.2" },
  "@radix-ui/react-switch": { pkg: "@radix-ui/react-switch", version: "^1.1.1" },

  // MUI
  "@mui/material": { pkg: "@mui/material", version: "^5.16.7" },
  "@mui/icons-material": { pkg: "@mui/icons-material", version: "^5.16.7" },
  "@emotion/react": { pkg: "@emotion/react", version: "^11.13.3" },
  "@emotion/styled": { pkg: "@emotion/styled", version: "^11.13.0" },

  // Utils
  clsx: { pkg: "clsx", version: "^2.1.1" },
  "tailwind-merge": { pkg: "tailwind-merge", version: "^2.5.2" },
  "class-variance-authority": { pkg: "class-variance-authority", version: "^0.7.0" },
  zod: { pkg: "zod", version: "^3.23.8" },

  // Forms
  "react-hook-form": { pkg: "react-hook-form", version: "^7.53.0" },
  "@hookform/resolvers": { pkg: "@hookform/resolvers", version: "^3.9.0" },

  // Data / charts
  recharts: { pkg: "recharts", version: "^2.12.7" },
  axios: { pkg: "axios", version: "^1.7.5" },
  "date-fns": { pkg: "date-fns", version: "^3.6.0" },

  // i18n
  "react-i18next": { pkg: "react-i18next", version: "^15.0.1" },
  i18next: { pkg: "i18next", version: "^23.14.0" },
};

// ── Validation report type is re-exported from forge-config ────────────────
export type { ValidationIssue, ValidationReport };

// ── Extract import specifiers from a source file ───────────────────────────
const IMPORT_REGEX =
  /(?:^|\n)\s*import\s+(?:[^'"]+\s+from\s+)?['"]([^'"]+)['"]/g;

function extractImports(content: string): string[] {
  const imports: string[] = [];
  let match: RegExpExecArray | null;
  // Reset regex state
  IMPORT_REGEX.lastIndex = 0;
  while ((match = IMPORT_REGEX.exec(content)) !== null) {
    imports.push(match[1]);
  }
  return imports;
}

// Normalize an import specifier to its package name.
// e.g. "react-router-dom" → "react-router-dom"
//      "react/jsx-runtime" → "react"
//      "@radix-ui/react-dialog" → "@radix-ui/react-dialog"
//      "./components/Foo" → null (relative)
function specToPackage(spec: string): string | null {
  if (spec.startsWith(".") || spec.startsWith("/")) return null; // relative
  if (spec.startsWith("node:")) return null; // node builtin
  const parts = spec.split("/");
  if (spec.startsWith("@")) {
    return parts.length >= 2 ? `${parts[0]}/${parts[1]}` : parts[0];
  }
  return parts[0];
}

// ── Parse the current package.json from generated files ────────────────────
interface ParsedPackageJson {
  json: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  } | null;
  raw: string;
  index: number;
}

function findPackageJson(files: GeneratedFile[]): ParsedPackageJson | null {
  const idx = files.findIndex((f) => f.path === "package.json");
  if (idx === -1) return null;
  try {
    return {
      json: JSON.parse(files[idx].content),
      raw: files[idx].content,
      index: idx,
    };
  } catch {
    return { json: null, raw: files[idx].content, index: idx };
  }
}

// ── Ensure src/lib/utils.ts exists if cn() is used ─────────────────────────
const UTILS_TS = `import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
`;

function usesCn(files: GeneratedFile[]): boolean {
  return files.some(
    (f) =>
      (f.language === "tsx" ||
        f.language === "ts" ||
        f.language === "jsx" ||
        f.language === "javascript") &&
      /\bcn\s*\(/.test(f.content) &&
      f.path !== "src/lib/utils.ts" &&
      f.path !== "src/lib/utils.js"
  );
}

// ── Main post-processing entry point ───────────────────────────────────────
export function postProcessProject(
  files: GeneratedFile[],
  config: ProjectConfig
): { files: GeneratedFile[]; report: ValidationReport } {
  const issues: ValidationIssue[] = [];
  const autoFixed: string[] = [];
  let packagesAdded = 0;

  // Work on a mutable copy
  const result = files.map((f) => ({ ...f }));

  // ── E. Newline corruption crash-test + auto-repair (FIRST, before anything else) ──
  // Detects \n → n corruption and attempts to repair. This must run before
  // dependency scanning so imports are parsed correctly.
  for (let i = 0; i < result.length; i++) {
    const f = result[i];
    // Only check code files, not binary/config
    if (
      f.language === "tsx" ||
      f.language === "ts" ||
      f.language === "jsx" ||
      f.language === "javascript" ||
      f.language === "css" ||
      f.language === "json" ||
      f.language === "html" ||
      f.language === "markdown"
    ) {
      const { content: repaired, wasRepaired, findings } = sanitizeFileContent(
        f.content,
        f.path
      );
      if (wasRepaired) {
        result[i] = { ...f, content: repaired };
        autoFixed.push(
          `Sauts de ligne corrompus réparés dans ${f.path} (${findings.length === 0 ? "entièrement" : "partiellement"})`
        );
      }
      // Report remaining (unrepairable) corruption as errors
      for (const finding of findings) {
        issues.push({
          severity: "error",
          category: "css", // reuse category; the message is explicit
          message: `Corruption de syntaxe détectée dans ${f.path}: ${finding.detail}`,
          file: f.path,
          fix: "Le fichier peut nécessiter une régénération. Vérifie manuellement les sauts de ligne.",
        });
      }
    }
  }

  // ── A. Dependency reconciliation ──────────────────────────────────────
  const pkgJsonInfo = findPackageJson(result);
  if (pkgJsonInfo?.json) {
    const pj = pkgJsonInfo.json;
    pj.dependencies = pj.dependencies ?? {};
    pj.devDependencies = pj.devDependencies ?? {};

    // Scan all source files for imports
    const allImports = new Set<string>();
    let importsFound = 0;
    for (const f of result) {
      if (
        f.language === "tsx" ||
        f.language === "ts" ||
        f.language === "jsx" ||
        f.language === "javascript"
      ) {
        for (const spec of extractImports(f.content)) {
          const pkg = specToPackage(spec);
          if (pkg) {
            allImports.add(pkg);
            importsFound++;
          }
        }
      }
    }

    // Ensure each imported package is declared
    for (const pkg of allImports) {
      const alreadyInDeps = pkg in pj.dependencies;
      const alreadyInDevDeps = pkg in pj.devDependencies;
      if (alreadyInDeps || alreadyInDevDeps) continue;

      const mapping = IMPORT_TO_PACKAGE[pkg];
      if (mapping) {
        if (mapping.dev) {
          pj.devDependencies[mapping.pkg] = mapping.version;
        } else {
          pj.dependencies[mapping.pkg] = mapping.version;
        }
        packagesAdded++;
        autoFixed.push(`Dépendance ajoutée : ${mapping.pkg}@${mapping.version}`);
      } else {
        // Unknown package — warn but don't crash
        issues.push({
          severity: "warning",
          category: "dependencies",
          message: `Import « ${pkg} » détecté mais package non reconnu. Ajoute-le manuellement dans package.json.`,
          fix: `npm install ${pkg}`,
        });
      }
    }

    // Write back the updated package.json
    result[pkgJsonInfo.index] = {
      ...result[pkgJsonInfo.index],
      content: JSON.stringify(pj, null, 2) + "\n",
    };
  }

  // ── C. Utility files (cn / utils.ts) ──────────────────────────────────
  if (usesCn(result)) {
    const utilsPath = config.typescript ? "src/lib/utils.ts" : "src/lib/utils.js";
    const hasUtils = result.some((f) => f.path === utilsPath);
    if (!hasUtils) {
      result.push({
        path: utilsPath,
        language: config.typescript ? "typescript" : "javascript",
        content: config.typescript
          ? UTILS_TS
          : UTILS_TS.replace(/: type ClassValue,|: string/g, "").replace(
              'import { type ClassValue, clsx }',
              "import { clsx }"
            ),
      });
      autoFixed.push(`Fichier utilitaire créé : ${utilsPath} (fonction cn())`);

      // Ensure clsx + tailwind-merge are in package.json
      const pinfo = findPackageJson(result);
      if (pinfo?.json) {
        const pj = pinfo.json;
        pj.dependencies = pj.dependencies ?? {};
        let added = false;
        if (!pj.dependencies["clsx"]) {
          pj.dependencies["clsx"] = "^2.1.1";
          added = true;
        }
        if (!pj.dependencies["tailwind-merge"]) {
          pj.dependencies["tailwind-merge"] = "^2.5.2";
          added = true;
        }
        if (added) {
          packagesAdded += 1;
          autoFixed.push("Dépendances cn() ajoutées : clsx + tailwind-merge");
          result[pinfo.index] = {
            ...result[pinfo.index],
            content: JSON.stringify(pj, null, 2) + "\n",
          };
        }
      }
    }
  }

  // ── B. Tailwind/CSS config verification ───────────────────────────────
  if (config.styling === "tailwind") {
    const tailwindFile = result.find((f) =>
      /^tailwind\.config\.(ts|js|cjs|mjs)$/.test(f.path)
    );
    if (!tailwindFile) {
      issues.push({
        severity: "error",
        category: "config",
        message: "tailwind.config manquant",
        fix: "Recréé automatiquement via les templates.",
      });
    } else {
      // Verify content array references src/
      if (!tailwindFile.content.includes("src")) {
        issues.push({
          severity: "warning",
          category: "config",
          message: "tailwind.config ne scanne pas le dossier src/",
          file: tailwindFile.path,
          fix: 'Ajouter "./src/**/*.{js,ts,jsx,tsx}" dans content.',
        });
      }
    }

    const postcssFile = result.find((f) =>
      /^postcss\.config\.(js|cjs|mjs)$/.test(f.path)
    );
    if (!postcssFile) {
      issues.push({
        severity: "error",
        category: "config",
        message: "postcss.config manquant",
        fix: "Recréé automatiquement via les templates.",
      });
    }

    // Verify @tailwind directives in index.css
    const cssFile = result.find((f) => f.path === "src/index.css");
    if (cssFile && !cssFile.content.includes("@tailwind")) {
      issues.push({
        severity: "error",
        category: "css",
        message: "Directives @tailwind manquantes dans src/index.css",
        file: "src/index.css",
        fix: "Ajouter @tailwind base; @tailwind components; @tailwind utilities;",
      });
    }
  }

  // ── D. React architecture checks ──────────────────────────────────────
  // Detect hook-before-provider: a component that both defines a Context.Provider
  // AND calls the corresponding use hook in the same function body.
  for (const f of result) {
    if (f.language !== "tsx" && f.language !== "jsx") continue;
    if (f.path === "src/main.tsx" || f.path === "src/main.jsx") continue;

    const hasProvider = /\.Provider\s*>/.test(f.content);
    const hasUseContext = /useContext\s*\(/.test(f.content);
    const hasCreateContext = /createContext\s*\(/.test(f.content);

    if (hasProvider && hasCreateContext && hasUseContext) {
      issues.push({
        severity: "warning",
        category: "architecture",
        message:
          "Ce fichier définit un Context ET utilise useContext — vérifie que le hook n'est pas appelé avant le Provider (séparer AppContent de App).",
        file: f.path,
        fix: "Extraire le contenu dans un composant enfant enveloppé par le Provider.",
      });
    }
  }

  // ── F. Missing import auto-repair ─────────────────────────────────────
  // Scan all .tsx/.ts/.jsx/.js files for relative imports (./ or ../),
  // check if the target file exists, and create stub components for any
  // missing ones. This prevents "Cannot find module" build errors.
  const existingPaths = new Set(result.map((f) => f.path));
  const createdStubs = new Set<string>();

  for (const f of [...result]) {
    if (
      f.language !== "tsx" &&
      f.language !== "ts" &&
      f.language !== "jsx" &&
      f.language !== "javascript"
    )
      continue;

    const imports = extractImports(f.content);
    for (const spec of imports) {
      // Only handle relative imports
      if (!spec.startsWith(".")) continue;
      // Skip CSS/style imports (these are handled by the bundler, not TypeScript)
      if (spec.endsWith(".css") || spec.endsWith(".scss") || spec.endsWith(".sass") || spec.endsWith(".less")) continue;
      // Skip JSON imports
      if (spec.endsWith(".json")) continue;
      // Skip asset imports
      if (/\.(png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|eot|mp4|webm|mp3|wav)$/.test(spec)) continue;

      // Resolve the import path relative to the file's directory
      const fileDir = path.dirname(f.path);
      const resolvedBase = path.posix.join(fileDir, spec);

      // Try multiple extensions
      const exts = config.typescript
        ? [".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts", "/index.jsx", "/index.js"]
        : [".jsx", ".js", ".tsx", ".ts", "/index.jsx", "/index.js", "/index.tsx", "/index.ts"];

      let found = false;
      for (const ext of exts) {
        const candidate = resolvedBase.endsWith(ext) ? resolvedBase : resolvedBase + ext;
        if (existingPaths.has(candidate)) {
          found = true;
          break;
        }
      }

      if (!found) {
        // Determine the best stub file path and name
        const stubExt = config.typescript ? ".tsx" : ".jsx";
        let stubPath = resolvedBase + stubExt;
        // If the import points to a directory (index), create index file
        if (resolvedBase.endsWith("/index")) {
          stubPath = resolvedBase + stubExt;
        }

        // Skip if already created
        if (createdStubs.has(stubPath)) continue;

        // Determine component name from the path
        const baseName = path.posix.basename(stubPath, stubExt);
        const componentName = baseName
          .split(/[-_]/)
          .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
          .join("");

        // Create a stub component
        const stubContent = config.typescript
          ? `// Auto-generated stub component (the LLM imported this but didn't create it)
// Replace with real implementation
import type { ReactNode } from 'react'

interface ${componentName}Props {
  children?: ReactNode
}

export default function ${componentName}({ children }: ${componentName}Props) {
  return (
    <div className="${componentName.toLowerCase()}-stub p-4 border border-dashed border-slate-300 rounded-lg text-slate-500 text-sm">
      {children ?? '${componentName} (stub)'}
    </div>
  )
}
`
          : `// Auto-generated stub component
export default function ${componentName}({ children }) {
  return (
    <div className="${componentName.toLowerCase()}-stub p-4 border border-dashed border-slate-300 rounded-lg text-slate-500 text-sm">
      {children || '${componentName} (stub)'}
    </div>
  )
}
`;

        result.push({
          path: stubPath,
          language: config.typescript ? "tsx" : "jsx",
          content: stubContent,
        });
        existingPaths.add(stubPath);
        createdStubs.add(stubPath);
        autoFixed.push(
          `Composant stub créé : ${stubPath} (import manquant depuis ${f.path})`
        );
      }
    }
  }

  // ── G. Compile report ─────────────────────────────────────────────────
  const errors = issues.filter((i) => i.severity === "error");
  const report: ValidationReport = {
    issues,
    ok: errors.length === 0,
    autoFixed,
    stats: {
      filesScanned: result.length,
      importsFound: 0, // filled below
      packagesAdded,
    },
  };

  // Count imports for stats
  let importCount = 0;
  for (const f of result) {
    if (
      f.language === "tsx" ||
      f.language === "ts" ||
      f.language === "jsx" ||
      f.language === "javascript"
    ) {
      importCount += extractImports(f.content).length;
    }
  }
  report.stats.importsFound = importCount;

  return { files: result, report };
}
