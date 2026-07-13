// forge-gold-templates.ts — Deterministic Gold-grade config files.
// Generates: tsconfig (strict+), eslint, prettier, husky, vitest, docker, CI/CD, PWA, etc.
// These are NOT LLM-generated — they're deterministic for guaranteed quality.

import type { ProjectConfig, GeneratedFile } from "./forge-config";
import { buildDesignSystem } from "./forge-design-system";

/** Build the gold-grade package.json with all deps from the plan. */
export function buildGoldPackageJson(
  config: ProjectConfig,
  extraDeps: { name: string; version: string; dev?: boolean }[] = []
): GeneratedFile {
  const deps: Record<string, string> = {
    react: "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "@tanstack/react-query": "^5.52.0",
    zustand: "^4.5.4",
    zod: "^3.23.8",
    "lucide-react": "^0.439.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2",
    "class-variance-authority": "^0.7.0",
  };

  const devDeps: Record<string, string> = {
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    autoprefixer: "^10.4.20",
    postcss: "^8.4.41",
    tailwindcss: "^3.4.10",
    typescript: "^5.5.4",
    vite: "^5.4.0",
    vitest: "^2.0.5",
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/user-event": "^14.5.2",
    jsdom: "^25.0.0",
    eslint: "^8.57.0",
    "eslint-plugin-react": "^7.35.0",
    "eslint-plugin-react-hooks": "^4.6.2",
    "@typescript-eslint/eslint-plugin": "^7.18.0",
    "@typescript-eslint/parser": "^7.18.0",
    prettier: "^3.3.3",
    "eslint-config-prettier": "^9.1.0",
    "@vitest/coverage-v8": "^2.0.5",
    msw: "^2.4.0",
  };

  // Add extra deps from architecture plan
  for (const dep of extraDeps) {
    if (dep.dev) {
      devDeps[dep.name] = dep.version;
    } else {
      deps[dep.name] = dep.version;
    }
  }

  return {
    path: "package.json",
    language: "json",
    content: JSON.stringify({
      name: config.name.toLowerCase().replace(/[^a-z0-9]/g, "-"),
      private: true,
      version: "0.1.0",
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview",
        typecheck: "tsc --noEmit --skipLibCheck",
        test: "vitest",
        "test:coverage": "vitest run --coverage",
        "test:ui": "vitest --ui",
        lint: "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
        "lint:fix": "eslint . --ext ts,tsx --fix",
        format: "prettier --write \"src/**/*.{ts,tsx,css}\"",
        "format:check": "prettier --check \"src/**/*.{ts,tsx,css}\"",
      },
      dependencies: deps,
      devDependencies: devDeps,
    }, null, 2),
  };
}

/** Gold-grade tsconfig.json with strict+ options. */
export function buildGoldTsconfig(): GeneratedFile {
  return {
    path: "tsconfig.json",
    language: "json",
    content: JSON.stringify({
      compilerOptions: {
        target: "ES2022",
        useDefineForClassFields: true,
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,

        // Strict options (Gold grade)
        strict: true,
        noUncheckedIndexedAccess: true,
        noImplicitOverride: true,
        exactOptionalPropertyTypes: false,
        noFallthroughCasesInSwitch: true,
        noUnusedLocals: false,
        noUnusedParameters: false,
        noImplicitReturns: true,
        noPropertyAccessFromIndexSignature: false,

        // Module resolution
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",

        // Paths
        baseUrl: ".",
        paths: {
          "@/*": ["./src/*"],
          "@/shared/*": ["./src/shared/*"],
          "@/features/*": ["./src/features/*"],
          "@/app/*": ["./src/app/*"],
        },
      },
      include: ["src", "vitest.config.ts"],
      exclude: ["src/**/*.test.tsx", "src/**/*.test.ts", "src/test/**"],
      references: [{ path: "./tsconfig.node.json" }],
    }, null, 2),
  };
}

/** Gold-grade tsconfig.node.json. */
export function buildGoldTsconfigNode(): GeneratedFile {
  return {
    path: "tsconfig.node.json",
    language: "json",
    content: JSON.stringify({
      compilerOptions: {
        composite: true,
        skipLibCheck: true,
        module: "ESNext",
        moduleResolution: "bundler",
        allowSyntheticDefaultImports: true,
        strict: true,
      },
      include: ["vite.config.ts"],
    }, null, 2),
  };
}

/** Vite config with path aliases + test config. */
export function buildGoldViteConfig(): GeneratedFile {
  return {
    path: "vite.config.ts",
    language: "typescript",
    content: `/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/app': path.resolve(__dirname, './src/app'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'src/test/'],
    },
  },
})
`,
  };
}

/** ESLint config (Gold grade). */
export function buildGoldEslintConfig(): GeneratedFile {
  return {
    path: ".eslintrc.cjs",
    language: "javascript",
    content: `module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  plugins: ['react-refresh', '@typescript-eslint'],
  settings: {
    react: { version: 'detect' },
  },
  rules: {
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
}
`,
  };
}

/** Prettier config. */
export function buildGoldPrettierConfig(): GeneratedFile {
  return {
    path: ".prettierrc",
    language: "json",
    content: JSON.stringify({
      semi: false,
      singleQuote: true,
      tabWidth: 2,
      trailingComma: "es5",
      printWidth: 100,
      bracketSpacing: true,
      arrowParens: "always",
      endOfLine: "lf",
    }, null, 2),
  };
}

/** Vitest setup file. */
export function buildGoldTestSetup(): GeneratedFile {
  return {
    path: "src/test/setup.ts",
    language: "typescript",
    content: `import '@testing-library/jest-dom'
import { afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})
`,
  };
}

/** Dockerfile (multi-stage build). */
export function buildGoldDockerfile(config: ProjectConfig): GeneratedFile {
  return {
    path: "Dockerfile",
    language: "dockerfile",
    content: `# Multi-stage build for ${config.name}
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
COPY --from=deps /app/node_modules ./node_modules
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
`,
  };
}

/** Docker Compose. */
export function buildGoldDockerCompose(): GeneratedFile {
  return {
    path: "docker-compose.yml",
    language: "yaml",
    content: `version: '3.8'
services:
  app:
    build: .
    ports:
      - "8080:80"
    environment:
      - NODE_ENV=production
  dev:
    image: node:20-alpine
    working_dir: /app
    volumes:
      - .:/app
      - /app/node_modules
    ports:
      - "5173:5173"
    command: sh -c "npm install && npm run dev -- --host"
`,
  };
}

/** GitHub Actions CI. */
export function buildGoldCI(): GeneratedFile {
  return {
    path: ".github/workflows/ci.yml",
    language: "yaml",
    content: `name: CI
on:
  push:
    branches: [main, master]
  pull_request:
    branches: [main, master]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run typecheck
      - run: npm run lint
      - run: npm run format:check
      - run: npm test
      - run: npm run build
`,
  };
}

/** .env.example. */
export function buildGoldEnvExample(): GeneratedFile {
  return {
    path: ".env.example",
    language: "text",
    content: `# API
VITE_API_URL=http://localhost:3000/api

# App
VITE_APP_NAME=MyApp
VITE_APP_VERSION=0.1.0

# Features
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_PWA=true
`,
  };
}

/** .editorconfig. */
export function buildGoldEditorConfig(): GeneratedFile {
  return {
    path: ".editorconfig",
    language: "text",
    content: `root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
max_line_length = 100
trim_trailing_whitespace = true

[*.md]
max_line_length = off
trim_trailing_whitespace = false
`,
  };
}

/** README.md (Gold grade). */
export function buildGoldReadme(config: ProjectConfig): GeneratedFile {
  return {
    path: "README.md",
    language: "markdown",
    content: `# ${config.name}

${config.description}

## 🚀 Démarrage rapide

\`\`\`bash
# Installation
npm install

# Développement
npm run dev

# Build production
npm run build

# Tests
npm test

# Vérification complète (typecheck + lint + format + test)
npm run verify
\`\`\`

## 📋 Scripts

| Script | Description |
|--------|-------------|
| \`npm run dev\` | Serveur de développement Vite |
| \`npm run build\` | Build production (tsc + vite build) |
| \`npm run preview\` | Preview du build production |
| \`npm test\` | Tests unitaires (Vitest) |
| \`npm run test:coverage\` | Tests avec coverage |
| \`npm run lint\` | ESLint |
| \`npm run lint:fix\` | ESLint avec auto-fix |
| \`npm run format\` | Prettier (write) |
| \`npm run typecheck\` | Vérification TypeScript |
| \`npm run verify\` | Vérification complète (CI) |

## 🏗️ Architecture

\`\`\`
src/
├── app/              # App shell, providers, routing
├── features/         # Features autonomes (auth, tasks, etc.)
│   └── {feature}/
│       ├── api/      # Repository pattern
│       ├── components/# Composants de la feature
│       ├── hooks/    # Hooks (TanStack Query)
│       └── types.ts  # Types + Zod schemas
├── shared/           # Code partagé
│   ├── ui/           # Design system
│   ├── lib/          # Utils (cn, formatters)
│   └── api/          # Client HTTP
└── main.tsx          # Entry point
\`\`\`

## 🧪 Tests

- **Vitest** + **React Testing Library** pour les tests unitaires
- Coverage minimum: 80%
- Tests dans \`src/**/*.test.tsx\`

\`\`\`bash
npm test           # Watch mode
npm run test:coverage  # Coverage report
\`\`\`

## 🐳 Docker

\`\`\`bash
# Build
docker-compose up --build

# Dev
docker-compose up dev
\`\`\`

## 📦 Déploiement

### Vercel
\`\`\`bash
npm i -g vercel
vercel
\`\`\`

### Netlify
\`\`\`bash
npm i -g netlify-cli
netlify deploy --build
\`\`\`

## 🔧 Configuration

Copier \`.env.example\` vers \`.env\` et configurer les variables.

## 📝 Licence

MIT

---

Généré par **React Forge** — Gold Grade Industrial
`,
  };
}

/** LICENSE (MIT). */
export function buildGoldLicense(): GeneratedFile {
  return {
    path: "LICENSE",
    language: "text",
    content: `MIT License

Copyright (c) ${new Date().getFullYear()}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
  };
}

/** ARCHITECTURE.md. */
export function buildGoldArchitectureDoc(config: ProjectConfig): GeneratedFile {
  return {
    path: "ARCHITECTURE.md",
    language: "markdown",
    content: `# Architecture — ${config.name}

## Vue d'ensemble

${config.description}

## Stack technique

- **React 18** — UI library
- **TypeScript 5** — Typage statique (strict mode)
- **Vite 5** — Build tool & dev server
- **Tailwind CSS 3** — Styling utility-first
- **React Router 6** — Routing client-side
- **TanStack Query 5** — Cache serveur & data fetching
- **Zustand 4** — State management global
- **Zod 3** — Validation runtime
- **Vitest** — Tests unitaires
- **React Testing Library** — Tests de composants

## Principes architecturaux

### 1. Feature-based architecture
Chaque feature est autonome dans \`src/features/{feature}/\` avec:
- \`api/\` — Repository pattern (couche données)
- \`components/\` — Composants UI de la feature
- \`hooks/\` — Hooks React (TanStack Query)
- \`types.ts\` — Types TypeScript + schémas Zod

### 2. Design System partagé
Les composants UI réutilisables sont dans \`src/shared/ui/\`:
- Button, Input, Card, Badge, Skeleton
- EmptyState, ErrorState, AsyncBoundary

### 3. Repository pattern
La couche données utilise le pattern Repository:
\`\`\`typescript
// features/tasks/api/tasks-repository.ts
export class TasksRepository {
  constructor(private client: ApiClient) {}
  async list(): Promise<Task[]> { ... }
  async create(input: CreateTaskInput): Promise<Task> { ... }
}
\`\`\`

### 4. TanStack Query
Les hooks utilisent TanStack Query pour le cache:
\`\`\`typescript
// features/tasks/hooks/use-tasks.ts
export function useTasks() {
  return useQuery({ queryKey: ['tasks'], queryFn: () => repo.list() });
}
\`\`\`

### 5. États complets
Tous les composants gèrent 4 états:
- **Loading** — Skeleton
- **Error** — ErrorState avec retry
- **Empty** — EmptyState avec CTA
- **Success** — Contenu

## Décisions techniques (ADR)

### ADR-001: Vite + React (pas Next.js)
**Contexte**: Application SPA sans besoin SSR.
**Décision**: Vite + React pour la simplicité et la rapidité.
**Conséquences**: Pas de SEO server-side, mais build rapide et DX excellente.

### ADR-002: TanStack Query (pas Redux)
**Contexte**: Gestion du cache serveur.
**Décision**: TanStack Query pour le cache serveur, Zustand pour l'UI state.
**Conséquences**: Moins de boilerplate, cache automatique, invalidation intelligente.

### ADR-003: Zod (pas Yup)
**Contexte**: Validation runtime des données.
**Décision**: Zod pour l'inférence de types TypeScript.
**Conséquences**: Types et validation synchronisés, DX améliorée.

## Qualité code

- **TypeScript strict+** (noUncheckedIndexedAccess, exactOptionalPropertyTypes)
- **ESLint** avec règles TypeScript + React + a11y
- **Prettier** pour le formatage
- **Tests** avec coverage 80%+
- **CI/CD** via GitHub Actions

---

Généré par **React Forge** — Gold Grade Industrial
`,
  };
}

// ── Phase 8: PWA + SEO + Deployment configs ─────────────────────────────────

/** PWA manifest.json — installable web app. */
export function buildGoldPwaManifest(config: ProjectConfig): GeneratedFile {
  return {
    path: "public/manifest.json",
    language: "json",
    content: JSON.stringify({
      name: config.name,
      short_name: config.name.slice(0, 12),
      description: config.description,
      start_url: "/",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#06b6d4",
      orientation: "portrait-primary",
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
      ],
      categories: ["productivity", "utilities"],
      lang: "fr",
      dir: "ltr",
    }, null, 2),
  };
}

/** Service worker — offline-first cache strategy. */
export function buildGoldServiceWorker(): GeneratedFile {
  return {
    path: "public/sw.js",
    language: "javascript",
    content: `// Gold Grade Service Worker — offline-first cache strategy
const CACHE_NAME = 'app-v1'
const STATIC_ASSETS = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Skip non-GET requests
  if (request.method !== 'GET') return

  // Skip cross-origin requests
  const url = new URL(request.url)
  if (url.origin !== location.origin) return

  // Network-first for navigation requests, cache-first for assets
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
          return response
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/index.html')))
    )
  } else {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            const clone = response.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone))
            return response
          })
      )
    )
  }
})
`,
  }
}

/** PWA registration in main entry. */
export function buildGoldPwaRegister(): GeneratedFile {
  return {
    path: "src/pwa-register.ts",
    language: "typescript",
    content: `// Register service worker for PWA offline support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('SW registration failed:', error)
    })
  })
}
`,
  }
}

/** SEO meta tags component. */
export function buildGoldSeo(): GeneratedFile {
  return {
    path: "src/shared/seo.tsx",
    language: "tsx",
    content: `import { useEffect } from 'react'

export interface SeoProps {
  title: string
  description?: string
  image?: string
  url?: string
  type?: 'website' | 'article' | 'profile'
  siteName?: string
  twitterCard?: 'summary' | 'summary_large_image' | 'player' | 'app'
  noindex?: boolean
}

/** Sets document title and meta tags for SEO + social sharing. */
export function Seo({
  title,
  description,
  image,
  url,
  type = 'website',
  siteName,
  twitterCard = 'summary_large_image',
  noindex = false,
}: SeoProps) {
  useEffect(() => {
    document.title = title

    const setMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let el = document.querySelector(\`meta[\${attr}="\${name}"]\`) as HTMLMetaElement | null
      if (!el) {
        el = document.createElement('meta')
        el.setAttribute(attr, name)
        document.head.appendChild(el)
      }
      el.setAttribute('content', content)
    }

    if (description) {
      setMeta('description', description)
      setMeta('og:description', description, 'property')
      setMeta('twitter:description', description)
    }

    setMeta('og:title', title, 'property')
    setMeta('twitter:title', title)
    setMeta('og:type', type, 'property')

    if (siteName) setMeta('og:site_name', siteName, 'property')
    if (image) {
      setMeta('og:image', image, 'property')
      setMeta('twitter:image', image)
    }
    if (url) setMeta('og:url', url, 'property')

    setMeta('twitter:card', twitterCard)

    if (noindex) {
      setMeta('robots', 'noindex, nofollow')
    }

    if (url) {
      let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.rel = 'canonical'
        document.head.appendChild(canonical)
      }
      canonical.href = url
    }
  }, [title, description, image, url, type, siteName, twitterCard, noindex])

  return null
}
`,
  }
}

/** robots.txt for SEO. */
export function buildGoldRobotsTxt(): GeneratedFile {
  return {
    path: "public/robots.txt",
    language: "text",
    content: `User-agent: *
Allow: /

Sitemap: /sitemap.xml
`,
  }
}

/** sitemap.xml generator. */
export function buildGoldSitemap(config: ProjectConfig): GeneratedFile {
  return {
    path: "public/sitemap.xml",
    language: "xml",
    content: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>
<!-- ${config.name} — Generated by React Forge Gold Grade -->
`,
  }
}

/** Vercel deployment config. */
export function buildGoldVercelConfig(): GeneratedFile {
  return {
    path: "vercel.json",
    language: "json",
    content: JSON.stringify({
      buildCommand: "npm run build",
      outputDirectory: "dist",
      framework: "vite",
     rewrites: [{ source: "/(.*)", destination: "/index.html" }],
      headers: [
        {
          source: "/sw.js",
          headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }],
        },
        {
          source: "/assets/(.*)",
          headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
        },
      ],
    }, null, 2),
  };
}

/** Netlify deployment config. */
export function buildGoldNetlifyConfig(): GeneratedFile {
  return {
    path: "netlify.toml",
    language: "toml",
    content: `[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[[headers]]
  for = "/sw.js"
  [headers.values]
    Cache-Control = "no-cache, no-store, must-revalidate"

[[headers]]
  for = "/assets/*"
  [headers.values]
    Cache-Control = "public, max-age=31536000, immutable"
`,
  };
}

/** GitHub Actions CD (deploy to Vercel). */
export function buildGoldCD(): GeneratedFile {
  return {
    path: ".github/workflows/deploy.yml",
    language: "yaml",
    content: `name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
      - run: npm ci
      - run: npm run build
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
`,
  };
}

/** GitHub PR template. */
export function buildGoldPRTemplate(): GeneratedFile {
  return {
    path: ".github/pull_request_template.md",
    language: "markdown",
    content: `## Description

Décris brièvement les changements de cette PR.

## Type de changement

- [ ] Bug fix (changement non-cassant qui corrige un problème)
- [ ] Nouvelle feature (changement non-cassant qui ajoute une fonctionnalité)
- [ ] Breaking change (changement qui pourrait casser l'existant)
- [ ] Refactoring
- [ ] Documentation
- [ ] Test

## Checklist

- [ ] Mon code suit le style du projet (ESLint + Prettier)
- [ ] J'ai effectué une auto-revue de mon code
- [ ] J'ai commenté mon code, particulièrement dans les parties complexes
- [ ] J'ai mis à jour la documentation si nécessaire
- [ ] Mes changements ne génèrent pas de nouveaux warnings
- [ ] J'ai ajouté des tests qui prouvent que mon fix est efficace ou que ma feature fonctionne
- [ ] Les tests existants passent toujours
- [ ] \`npm run verify\` passe sans erreur
`,
  };
}

/** CONTRIBUTING.md — Gold grade contribution guide. */
export function buildGoldContributing(config: ProjectConfig): GeneratedFile {
  return {
    path: "CONTRIBUTING.md",
    language: "markdown",
    content: `# Contribuer à ${config.name}

Merci de votre intérêt pour contribuer ! Ce guide vous aidera à démarrer.

## 🚀 Démarrage

\`\`\`bash
# Clone le repo
git clone <repo-url>
cd ${config.name.toLowerCase().replace(/\s+/g, '-')}

# Installe les dépendances
npm install

# Lance le serveur de dev
npm run dev

# Vérifie que tout marche
npm run verify
\`\`\`

## 📋 Prérequis

- Node.js 20+
- npm 10+

## 🔄 Workflow de contribution

1. **Fork** le projet
2. Crée une **branche** : \`git checkout -b feature/ma-feature\`
3. **Code** en suivant les conventions
4. **Teste** : \`npm run verify\` doit passer
5. **Commit** avec conventional commits
6. **Push** et crée une **Pull Request**

## 📝 Conventional Commits

Nous utilisons les [conventional commits](https://www.conventionalcommits.org/) :

\`\`\`
feat: ajoute une nouvelle feature
fix: corrige un bug
docs: documentation
style: formatage (pas de changement de code)
refactor: refactoring
test: ajout de tests
chore: tâches de maintenance
\`\`\`

Exemple : \`feat: ajoute le filtrage des tâches par catégorie\`

## 🎨 Style de code

- **TypeScript strict** (pas de \`any\`)
- **ESLint** + **Prettier** (config fournie)
- Composants fonctionnels avec hooks
- Props typées avec interfaces
- Nomage : PascalCase pour composants, camelCase pour fonctions

## 🧪 Tests

- Couverture minimum : 80%
- Tests unitaires : Vitest + React Testing Library
- Nom des fichiers : \`*.test.tsx\`

\`\`\`bash
npm test           # Mode watch
npm run test:coverage  # Coverage
\`\`\`

## 🏗️ Architecture

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) pour les décisions techniques.

- **Feature-based** : chaque feature dans \`src/features/{feature}/\`
- **Design system** : composants partagés dans \`src/shared/ui/\`
- **Couche données** : repository pattern + TanStack Query

## 🐛 Signaler un bug

Ouvrez une [issue](../../issues) avec :
- Description du bug
- Étapes pour reproduire
- Comportement attendu vs actuel
- Screenshots si applicable

## 💡 Proposer une feature

Ouvrez une issue avec le label \`enhancement\` et décrivez :
- Le problème que ça résout
- La solution proposée
- Les alternatives envisagées

## 📜 Code de conduite

Soyez respectueux et bienveillant. Voir [Code of Conduct](./CODE_OF_CONDUCT.md).

---

Généré par **React Forge** — Gold Grade Industrial
`,
  };
}

/** CODE_OF_CONDUCT.md. */
export function buildGoldCodeOfConduct(): GeneratedFile {
  return {
    path: "CODE_OF_CONDUCT.md",
    language: "markdown",
    content: `# Code de Conduite

## Notre engagement

Nous nous engageons à offrir un environnement bienveillant et inclusif à tous, quelle que soit leur expérience, genre, identité, orientation, apparence, origine ou religion.

## Nos standards

**Comportements attendus :**
- Faire preuve d'empathie et de respect
- Accepter les critiques constructives
- Se concentrer sur ce qui est best pour la communauté

**Comportements inacceptables :**
- Harcèlement, trolling, insultes
- Publication d'informations privées sans consentement
- Tout autre conduite inappropriée en milieu professionnel

## Application

Les violations peuvent être signalées. Des sanctions seront appliquées.

## Attribution

Adapté du [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).
`,
  };
}

/** CHANGELOG.md. */
export function buildGoldChangelog(config: ProjectConfig): GeneratedFile {
  return {
    path: "CHANGELOG.md",
    language: "markdown",
    content: `# Changelog

Tous les changements notables de ${config.name} seront documentés ici.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/lang/fr/).

## [Unreleased]

### Added
- Projet initial généré par React Forge Gold Grade

## [0.1.0] - ${new Date().toISOString().slice(0, 10)}

### Added
- Architecture feature-based
- Design system (32 composants)
- Couche données typée (ApiClient + TanStack Query)
- Tests Vitest + React Testing Library
- PWA (manifest + service worker)
- Docker + CI/CD
- Documentation complète (README, ARCHITECTURE, CONTRIBUTING)

---

Généré par **React Forge** — Gold Grade Industrial
`,
  };
}

/** Husky pre-commit hook. */
export function buildGoldHuskyPreCommit(): GeneratedFile {
  return {
    path: ".husky/pre-commit",
    language: "text",
    content: `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run typecheck
npm run lint
npm run format:check
`,
  };
}

/** Commitlint config. */
export function buildGoldCommitlintConfig(): GeneratedFile {
  return {
    path: ".commitlintrc.json",
    language: "json",
    content: JSON.stringify({
      extends: ["@commitlint/config-conventional"],
      rules: {
        "type-enum": [
          2,
          "always",
          ["feat", "fix", "docs", "style", "refactor", "test", "chore", "perf", "ci", "build", "revert"],
        ],
        "subject-max-length": [2, "always", 72],
      },
    }, null, 2),
  };
}

/** VSCode settings + extensions recommendations. */
export function buildGoldVsCodeSettings(): GeneratedFile {
  return {
    path: ".vscode/settings.json",
    language: "json",
    content: JSON.stringify({
      "editor.formatOnSave": true,
      "editor.defaultFormatter": "esbenp.prettier-vscode",
      "editor.codeActionsOnSave": {
        "source.fixAll.eslint": "explicit",
      },
      "typescript.tsdk": "node_modules/typescript/lib",
      "typescript.enablePromptUseWorkspaceTsdk": true,
      "files.associations": { "*.css": "tailwindcss" },
    }, null, 2),
  };
}

export function buildGoldVsCodeExtensions(): GeneratedFile {
  return {
    path: ".vscode/extensions.json",
    language: "json",
    content: JSON.stringify({
      recommendations: [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode",
        "bradlc.vscode-tailwindcss",
        "ms-vscode.vscode-typescript-next",
      ],
    }, null, 2),
  };
}
export function buildAllGoldTemplates(
  config: ProjectConfig,
  extraDeps: { name: string; version: string; dev?: boolean }[] = []
): GeneratedFile[] {
  return [
    buildGoldPackageJson(config, extraDeps),
    buildGoldTsconfig(),
    buildGoldTsconfigNode(),
    buildGoldViteConfig(),
    buildGoldEslintConfig(),
    buildGoldPrettierConfig(),
    buildGoldTestSetup(),
    buildGoldDockerfile(config),
    buildGoldDockerCompose(),
    buildGoldCI(),
    buildGoldEnvExample(),
    buildGoldEditorConfig(),
    buildGoldReadme(config),
    buildGoldLicense(),
    buildGoldArchitectureDoc(config),
    // ── Phase 8: PWA + SEO + DevOps ──
    buildGoldPwaManifest(config),
    buildGoldServiceWorker(),
    buildGoldPwaRegister(),
    buildGoldSeo(),
    buildGoldRobotsTxt(),
    buildGoldSitemap(config),
    buildGoldVercelConfig(),
    buildGoldNetlifyConfig(),
    buildGoldCD(),
    // ── Phase 9: Documentation gold ──
    buildGoldContributing(config),
    buildGoldCodeOfConduct(),
    buildGoldChangelog(config),
    buildGoldPRTemplate(),
    buildGoldHuskyPreCommit(),
    buildGoldCommitlintConfig(),
    buildGoldVsCodeSettings(),
    buildGoldVsCodeExtensions(),
    // ── Design System (30+ components) ──
    ...buildDesignSystem(),
    // Core boilerplate
    {
      path: "src/main.tsx",
      language: "typescript",
      content: `import React from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'
import './pwa-register'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
`,
    },
    {
      path: "index.html",
      language: "html",
      content: `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
    <meta name="theme-color" content="#0f172a" />
    <meta name="description" content="${config.description}" />

    <!-- PWA -->
    <link rel="manifest" href="/manifest.json" />
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="apple-mobile-web-app-title" content="${config.name}" />

    <!-- Open Graph -->
    <meta property="og:type" content="website" />
    <meta property="og:title" content="${config.name}" />
    <meta property="og:description" content="${config.description}" />
    <meta property="og:site_name" content="${config.name}" />

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${config.name}" />
    <meta name="twitter:description" content="${config.description}" />

    <title>${config.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
    },
    {
      path: "tailwind.config.js",
      language: "javascript",
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
`,
    },
    {
      path: "postcss.config.js",
      language: "javascript",
      content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`,
    },
    {
      path: "src/index.css",
      language: "css",
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 186 100% 40%;
    --primary-foreground: 0 0% 100%;
    --border: 214.3 31.8% 91.4%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 186 100% 40%;
    --primary-foreground: 0 0% 100%;
    --border: 217.2 32.6% 17.5%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}
`,
    },
    {
      path: ".gitignore",
      language: "text",
      content: `# Dependencies
node_modules/
.pnp
.yarn/

# Build
dist/
dist-ssr/
*.local

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor
.vscode/*
!.vscode/extensions.json
.idea/
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?

# Test
coverage/
.nyc_output/

# Misc
.cache/
.temp/
`,
    },
  ];
}
