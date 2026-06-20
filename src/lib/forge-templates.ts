// Deterministic template files injected into every generated project.
// These guarantee the project is always runnable (Tailwind compiles,
// no border-border errors, no hook-before-provider errors).

import type { ProjectConfig, GeneratedFile } from "./forge-config";

const REACT_VERSION = "^18.3.1";
const VITE_VERSION = "^5.4.0";
const TAILWIND_VERSION = "^3.4.10";
const POSTCSS_VERSION = "^8.4.41";
const AUTOPREFIXER_VERSION = "^10.4.20";
const REACT_ROUTER_VERSION = "^6.26.0";
const TYPESCRIPT_VERSION = "^5.5.4";

export function buildTemplateFiles(config: ProjectConfig): GeneratedFile[] {
  const tsExt = config.typescript ? "tsx" : "jsx";
  const tsOrJs = config.typescript ? "ts" : "js";
  const files: GeneratedFile[] = [];

  // ── package.json ─────────────────────────────────────────────
  const deps: Record<string, string> = {
    react: REACT_VERSION,
    "react-dom": REACT_VERSION,
  };
  const devDeps: Record<string, string> = {};

  if (config.routing === "router") {
    deps["react-router-dom"] = REACT_ROUTER_VERSION;
  }
  if (config.stateMgmt === "zustand") {
    deps.zustand = "^4.5.4";
  }

  // ── Feature-based dependencies ───────────────────────────────
  if (config.features.includes("forms")) {
    deps["react-hook-form"] = "^7.53.0";
    deps["@hookform/resolvers"] = "^3.9.0";
    deps.zod = "^3.23.8";
  }
  if (config.features.includes("charts")) {
    deps.recharts = "^2.12.7";
  }
  if (config.features.includes("animations")) {
    deps["framer-motion"] = "^11.3.24";
  }
  if (config.features.includes("i18n")) {
    deps["react-i18next"] = "^15.0.1";
    deps.i18next = "^23.14.0";
  }
  if (config.features.includes("api")) {
    deps.axios = "^1.7.5";
  }
  if (config.features.includes("tests")) {
    devDeps.vitest = "^2.0.5";
    devDeps["@testing-library/react"] = "^16.0.1";
    devDeps["@testing-library/jest-dom"] = "^6.4.8";
    devDeps["jsdom"] = "^25.0.0";
  }
  if (config.features.includes("pwa")) {
    devDeps["vite-plugin-pwa"] = "^0.20.5";
  }
  if (config.features.includes("auth")) {
    deps["lucide-react"] = "^0.439.0";
  }

  if (config.stateMgmt === "redux") {
    deps["@reduxjs/toolkit"] = "^2.2.7";
    deps["react-redux"] = "^9.1.2";
  }
  if (config.uiLib === "mui") {
    deps["@mui/material"] = "^5.16.7";
    deps["@emotion/react"] = "^11.13.3";
    deps["@emotion/styled"] = "^11.13.0";
    deps["@mui/icons-material"] = "^5.16.7";
  }

  if (config.styling === "tailwind") {
    devDeps.tailwindcss = TAILWIND_VERSION;
    devDeps.postcss = POSTCSS_VERSION;
    devDeps.autoprefixer = AUTOPREFIXER_VERSION;
  }

  if (config.stack === "vite") {
    devDeps["@vitejs/plugin-react"] = "^4.3.1";
    devDeps.vite = VITE_VERSION;
  }
  if (config.typescript) {
    devDeps.typescript = TYPESCRIPT_VERSION;
    devDeps["@types/react"] = "^18.3.5";
    devDeps["@types/react-dom"] = "^18.3.0";
  }

  const scripts: Record<string, string> = {
    // verify-syntax runs BEFORE dev/build: TypeScript compilation check.
    verifySyntax:
      config.typescript && config.stack === "vite"
        ? "tsc --noEmit"
        : "echo \"verify-syntax: skipped\"",
    dev:
      config.typescript && config.stack === "vite"
        ? "npm run verifySyntax && vite"
        : config.stack === "vite"
          ? "vite"
          : "next dev",
    build:
      config.typescript && config.stack === "vite"
        ? "npm run verifySyntax && vite build"
        : config.stack === "vite"
          ? "vite build"
          : "next build",
    preview: config.stack === "vite" ? "vite preview" : "next start",
  };

  // Add test script if tests feature is enabled
  if (config.features.includes("tests")) {
    scripts.test = "vitest";
    scripts["test:run"] = "vitest run";
  }

  const packageJson = {
    name: config.name.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
    private: true,
    version: "0.1.0",
    type: "module",
    scripts,
    dependencies: deps,
    devDependencies: devDeps,
  };

  files.push({
    path: "package.json",
    language: "json",
    content: JSON.stringify(packageJson, null, 2) + "\n",
  });

  // ── .gitignore ───────────────────────────────────────────────
  files.push({
    path: ".gitignore",
    language: "text",
    content: `# Dependencies
node_modules
.pnp
.pnp.js

# Build output
dist
dist-ssr
*.local

# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor directories
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Environment
.env
.env.local
.env.*.local

# Testing
coverage

# Misc
.cache
.temp
`,
  });

  // ── README.md ────────────────────────────────────────────────
  const featuresList = config.features.length > 0
    ? config.features.map((f) => `- ✅ ${f}`).join("\n")
    : "- (aucune feature supplémentaire)";
  files.push({
    path: "README.md",
    language: "markdown",
    content: `# ${config.name}

${config.description}

## 🚀 Démarrage rapide

\`\`\`bash
npm install
npm run dev
\`\`\`

Le serveur de développement démarre sur http://localhost:5173

## 📜 Scripts disponibles

| Script | Description |
|--------|-------------|
| \`npm run dev\` | Démarre le serveur de développement (avec vérification TS) |
| \`npm run build\` | Build de production |
| \`npm run preview\` | Prévisualise le build de production |
| \`npm run verifySyntax\` | Vérification TypeScript (tsc --noEmit) |
${config.features.includes("tests") ? "| `npm test` | Lance les tests (Vitest) |\n" : ""}

## 🛠️ Stack technique

- **React** 18
- **Build tool**: ${config.stack}
${config.typescript ? "- **TypeScript** 5\n" : ""}- **Styling**: ${config.styling}
${config.routing === "router" ? "- **Routing**: React Router DOM v6 (HashRouter)\n" : ""}${config.stateMgmt !== "none" ? `- **State**: ${config.stateMgmt}\n` : ""}${config.uiLib !== "none" ? `- **UI Library**: ${config.uiLib}\n` : ""}
## ✨ Fonctionnalités

${featuresList}

## 📁 Structure du projet

\`\`\`
${config.name.toLowerCase().replace(/[^a-z0-9-]/g, "-")}/
├── index.html
├── package.json
├── vite.config.${tsOrJs}
├── tsconfig.json
├── tailwind.config.${tsOrJs}
├── postcss.config.js
└── src/
    ├── main.${tsExt}
    ├── App.${tsExt}
    ├── index.css
    └── components/
        └── MainComponent.${tsExt}
\`\`\`

---

Généré par **React Forge** le ${new Date().toLocaleDateString("fr-FR")}
`,
  });

  // ── index.html (Vite only) ───────────────────────────────────
  if (config.stack === "vite") {
    files.push({
      path: "index.html",
      language: "html",
      content: `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(config.name)}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.${tsExt}"></script>
  </body>
</html>
`,
    });
  }

  // ── src/main.tsx — entry point (NO context here, just createRoot) ──
  const mainImports = [
    config.typescript
      ? `import React from 'react'`
      : `import React from 'react'`,
    `import { createRoot } from 'react-dom/client'`,
    `import App from './App.${tsExt}'`,
    config.styling === "tailwind" ? `import './index.css'` : `import './index.css'`,
  ];

  const mainContent = `${mainImports.join("\n")}

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;

  files.push({
    path: `src/main.${tsExt}`,
    language: tsExt,
    content: mainContent,
  });

  // ── vite.config ──────────────────────────────────────────────
  // base: './' makes built assets use relative paths so the preview
  // iframe can load them from /api/preview/{id}/
  // build.crossOriginLoading: false removes the crossorigin attribute
  // from script/link tags (needed for sandboxed iframe preview)
  if (config.stack === "vite") {
    files.push({
      path: `vite.config.${tsOrJs}`,
      language: tsOrJs,
      content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    crossOriginLoading: false,
  },
})
`,
    });
  }

  // ── tsconfig.json ────────────────────────────────────────────
  if (config.typescript) {
    files.push({
      path: "tsconfig.json",
      language: "json",
      content: `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
`,
    });
    files.push({
      path: "tsconfig.node.json",
      language: "json",
      content: `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
`,
    });
  }

  // ── Tailwind config (with CSS variable mappings — fixes border-border) ──
  if (config.styling === "tailwind") {
    files.push({
      path: `tailwind.config.${tsOrJs}`,
      language: tsOrJs,
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "rgb(var(--border) / <alpha-value>)",
        input: "rgb(var(--input) / <alpha-value>)",
        ring: "rgb(var(--ring) / <alpha-value>)",
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
    },
  },
  plugins: [],
}
`,
    });

    files.push({
      path: "postcss.config.js",
      language: "javascript",
      content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`,
    });
  }

  return files;
}

// ── index.css template (Tailwind base with CSS variables defined) ──
// This is injected as a STARTER; the LLM-generated index.css will OVERRIDE it
// if present. But if the LLM forgets CSS variables, we provide a safe base.
export function buildIndexCss(config: ProjectConfig): string {
  if (config.styling === "tailwind") {
    return `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 255 255 255;
    --foreground: 15 23 42;
    --card: 255 255 255;
    --card-foreground: 15 23 42;
    --popover: 255 255 255;
    --popover-foreground: 15 23 42;
    --primary: 79 70 229;
    --primary-foreground: 255 255 255;
    --secondary: 241 245 249;
    --secondary-foreground: 15 23 42;
    --muted: 241 245 249;
    --muted-foreground: 100 116 139;
    --accent: 241 245 249;
    --accent-foreground: 15 23 42;
    --destructive: 239 68 68;
    --destructive-foreground: 255 255 255;
    --border: 226 232 240;
    --input: 226 232 240;
    --ring: 79 70 229;
    --radius: 0.5rem;
  }

  .dark {
    --background: 15 23 42;
    --foreground: 248 250 252;
    --card: 15 23 42;
    --card-foreground: 248 250 252;
    --popover: 15 23 42;
    --popover-foreground: 248 250 252;
    --primary: 99 102 241;
    --primary-foreground: 255 255 255;
    --secondary: 30 41 59;
    --secondary-foreground: 248 250 252;
    --muted: 30 41 59;
    --muted-foreground: 148 163 184;
    --accent: 30 41 59;
    --accent-foreground: 248 250 252;
    --destructive: 239 68 68;
    --destructive-foreground: 255 255 255;
    --border: 51 65 85;
    --input: 51 65 85;
    --ring: 99 102 241;
  }
}

@layer base {
  * {
    border-color: rgb(var(--border));
  }
  body {
    background-color: rgb(var(--background));
    color: rgb(var(--foreground));
    font-family: system-ui, -apple-system, sans-serif;
  }
}
`;
  }
  return `/* Global styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}
`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
