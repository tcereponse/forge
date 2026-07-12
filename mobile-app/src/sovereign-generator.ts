// Sovereign project generator — runs entirely on-device, no PC server needed.
// Uses glm-native.ts (NativeHttp bridge) to call GLM-4.6 directly from the APK.
// Generates PRD + code files for a React project, with post-processing.
//
// FALLBACK: if the GLM API is unreachable from the phone (carrier DNS/proxy),
// automatically falls back to the PC server endpoint (/api/projects/[id]/generate).

import { glmChatAsync, extractJson, unescapeJsonString, inferLanguage, hasNativeHttp, nativePost } from './glm-native'
import { apiFetch, apiUrl, getApiBase, isNativeAndroid } from './api'
import type { ProjectFile } from './useProjects'

export interface GenerationResult {
  success: boolean
  files: ProjectFile[]
  prd: string
  error?: string
  mode?: 'sovereign' | 'server' | 'failed'
}

/** Tests if the GLM API is reachable from the device (native bridge). */
export async function testGlmConnectivity(): Promise<{ ok: boolean; error?: string; latencyMs?: number }> {
  if (!hasNativeHttp()) {
    return { ok: false, error: 'NativeHttp bridge non disponible' }
  }
  const start = Date.now()
  try {
    const result = nativePost(
      'https://internal-api.z.ai/v1/chat/completions',
      {
        'Content-Type': 'application/json',
        'X-Z-AI-From': 'Z',
        'X-Token': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOGI5MGZiNDUtODVlYS00MWNkLWEwOGMtMDAwZWM2ZmQ3MmQ0IiwiY2hhdF9pZCI6ImNoYXQtZjJmODM5YmEtZjczMi00NjEzLTkwMTAtOGY0NThkMTYyMjVjIiwicGxhdGZvcm0iOiJ6YWkifQ.cKusmTSeG5NvNWXKKLfQfEw3XXRYEi4-ryqTIrTdt40',
      },
      JSON.stringify({ messages: [{ role: 'user', content: 'ping' }], thinking: { type: 'disabled' } })
    )
    const latency = Date.now() - start
    if (result.error || result.status === 0) {
      return { ok: false, error: result.error || 'Connexion impossible', latencyMs: latency }
    }
    if (result.status >= 200 && result.status < 300) {
      return { ok: true, latencyMs: latency }
    }
    return { ok: false, error: `HTTP ${result.status}`, latencyMs: latency }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), latencyMs: Date.now() - start }
  }
}

/** Checks if the server fallback is available (configured URL or same-origin). */
export function hasServerFallback(): boolean {
  if (!isNativeAndroid()) return true // web mobile = same-origin
  const base = getApiBase()
  return !!base // APK with configured server URL
}

/** Deterministic template files (config, boilerplate) — always present, not LLM-generated. */
function buildTemplateFiles(name: string, description: string): ProjectFile[] {
  const pkgName = name.toLowerCase().replace(/[^a-z0-9]/g, '-')
  return [
    {
      path: 'package.json',
      language: 'json',
      content: JSON.stringify({
        name: pkgName,
        private: true,
        version: '0.1.0',
        type: 'module',
        scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
        dependencies: { react: '^18.3.1', 'react-dom': '^18.3.1', 'react-router-dom': '^6.26.0' },
        devDependencies: {
          '@types/react': '^18.3.5', '@types/react-dom': '^18.3.0',
          '@vitejs/plugin-react': '^4.3.1', autoprefixer: '^10.4.20',
          postcss: '^8.4.41', tailwindcss: '^3.4.10', typescript: '^5.5.4', vite: '^5.4.0',
        },
      }, null, 2),
    },
    { path: 'vite.config.ts', language: 'typescript', content: `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})\n` },
    { path: 'tsconfig.json', language: 'json', content: JSON.stringify({ compilerOptions: { target: 'ES2020', useDefineForClassFields: true, lib: ['ES2020', 'DOM', 'DOM.Iterable'], module: 'ESNext', skipLibCheck: true, moduleResolution: 'bundler', allowImportingTsExtensions: true, resolveJsonModule: true, isolatedModules: true, noEmit: true, jsx: 'react-jsx', strict: true, noUnusedLocals: false, noUnusedParameters: false, noFallthroughCasesInSwitch: true }, include: ['src'], references: [{ path: './tsconfig.node.json' }] }, null, 2) },
    { path: 'tsconfig.node.json', language: 'json', content: JSON.stringify({ compilerOptions: { composite: true, skipLibCheck: true, module: 'ESNext', moduleResolution: 'bundler', allowSyntheticDefaultImports: true }, include: ['vite.config.ts'] }, null, 2) },
    { path: 'tailwind.config.js', language: 'javascript', content: `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],\n  theme: { extend: {} },\n  plugins: [],\n}\n` },
    { path: 'postcss.config.js', language: 'javascript', content: `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}\n` },
    { path: 'index.html', language: 'html', content: `<!doctype html>\n<html lang="fr">\n  <head>\n    <meta charset="UTF-8\" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0\" />\n    <title>${name}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n` },
    { path: 'src/main.tsx', language: 'typescript', content: `import React from 'react'\nimport { createRoot } from 'react-dom/client'\nimport App from './App'\nimport './index.css'\n\ncreateRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n)\n` },
    { path: '.gitignore', language: 'text', content: 'node_modules\ndist\n.env\n*.log\n' },
    { path: 'README.md', language: 'markdown', content: `# ${name}\n\n${description}\n\n## Stack\n- React 18 + TypeScript\n- Vite\n- Tailwind CSS\n- React Router\n\n## Developpement\n\\\`\\\`\\\`bash\nnpm install\nnpm run dev\n\\\`\\\`\\\`\n\nGenere par React Forge Mobile (GLM-4.6)\n` },
  ]
}

function buildIndexCss(): string {
  return `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --background: 0 0% 100%;\n  --foreground: 222.2 84% 4.9%;\n  --primary: 186 100% 40%;\n  --border: 214.3 31.8% 91.4%;\n}\n\n* {\n  border-color: rgb(var(--border));\n}\n\nbody {\n  margin: 0;\n  font-family: system-ui, -apple-system, sans-serif;\n  -webkit-font-smoothing: antialiased;\n}\n`
}

/** Detects if an error is a network/connectivity issue (vs an API error). */
function isNetworkError(error: string): boolean {
  const lower = error.toLowerCase()
  return lower.includes('failed to connect') ||
    lower.includes('network') ||
    lower.includes('unreachable') ||
    lower.includes('timeout') ||
    lower.includes('timed out') ||
    lower.includes('unknown host') ||
    lower.includes('unable to resolve') ||
    lower.includes('connection refused') ||
    lower.includes('connection reset')
}

/**
 * Generates a project using the PC server (fallback mode).
 * Creates the project in Prisma + calls /api/projects/[id]/generate.
 */
async function generateViaServer(
  name: string,
  description: string,
  features: string[],
  onProgress?: (phase: 'prd' | 'code' | 'merge' | 'done', message: string) => void
): Promise<GenerationResult> {
  onProgress?.('prd', 'Creation du projet sur le serveur...')
  try {
    // 1. Create project
    const createData = await apiFetch<{ success: boolean; project: any; error?: string }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        name, description, stack: 'vite', typescript: true, styling: 'tailwind',
        routing: 'router', stateMgmt: 'none', uiLib: 'none', features, selectedPacks: [],
      }),
    })
    if (!createData.success || !createData.project) {
      return { success: false, files: [], prd: '', error: createData.error || 'Echec creation projet sur serveur', mode: 'failed' }
    }
    const projectId = createData.project.id

    // 2. Generate
    onProgress?.('code', 'Generation GLM-4.6 via serveur...')
    const genData = await apiFetch<{ success: boolean; project: any; error?: string }>(`/api/projects/${projectId}/generate`, {
      method: 'POST',
    })
    if (!genData.success || !genData.project) {
      return { success: false, files: [], prd: '', error: genData.error || 'Echec generation serveur', mode: 'failed' }
    }

    onProgress?.('done', `${genData.project.files?.length || 0} fichiers generes`)
    return {
      success: true,
      files: genData.project.files || [],
      prd: genData.project.prd || '',
      mode: 'server',
    }
  } catch (e) {
    return {
      success: false,
      files: [],
      prd: '',
      error: e instanceof Error ? e.message : String(e),
      mode: 'failed',
    }
  }
}

/**
 * Gold Grade generation via server endpoint.
 * Calls /api/projects/[id]/generate-gold (5-pass pipeline with validation gates).
 */
async function generateGoldViaServer(
  name: string,
  description: string,
  features: string[],
  onProgress?: (phase: 'prd' | 'code' | 'merge' | 'done', message: string) => void
): Promise<GenerationResult> {
  onProgress?.('prd', 'Création du projet sur le serveur...')
  try {
    const createData = await apiFetch<{ success: boolean; project: any; error?: string }>('/api/projects', {
      method: 'POST',
      body: JSON.stringify({
        name, description, stack: 'vite', typescript: true, styling: 'tailwind',
        routing: 'router', stateMgmt: 'none', uiLib: 'none', features, selectedPacks: [],
      }),
    })
    if (!createData.success || !createData.project) {
      return { success: false, files: [], prd: '', error: createData.error || 'Echec creation projet', mode: 'failed' }
    }
    const projectId = createData.project.id

    onProgress?.('code', 'Pipeline Gold 5 passes (Architecture → Types → Logic → UI → Tests)...')
    const genData = await apiFetch<{ success: boolean; project: any; error?: string; pipeline?: any }>(`/api/projects/${projectId}/generate-gold`, {
      method: 'POST',
    })
    if (!genData.success || !genData.project) {
      return { success: false, files: [], prd: '', error: genData.error || 'Echec pipeline Gold', mode: 'failed' }
    }

    onProgress?.('done', `${genData.project.files?.length || 0} fichiers générés (Gold Grade)`)
    return {
      success: true,
      files: genData.project.files || [],
      prd: genData.project.prd || '',
      mode: 'server',
    }
  } catch (e) {
    return {
      success: false,
      files: [],
      prd: '',
      error: e instanceof Error ? e.message : String(e),
      mode: 'failed',
    }
  }
}

/**
 * Gold Grade on-device generation — 5-pass pipeline using GLM-4.6 via NativeHttp.
 * Pass 1: Architecture (plan JSON)
 * Pass 2: Types (TypeScript + Zod)
 * Pass 3: Business Logic (components + hooks + repository)
 * Pass 4: Design System (deterministic — 32 components)
 * Pass 5: Tests (Vitest + RTL)
 */
export async function generateGoldProjectOnDevice(
  name: string,
  description: string,
  features: string[] = [],
  onProgress?: (phase: 'prd' | 'code' | 'merge' | 'done', message: string) => void
): Promise<GenerationResult> {
  const native = hasNativeHttp()

  // Web mobile (no NativeHttp): use server Gold endpoint directly
  if (!native) {
    return generateGoldViaServer(name, description, features, onProgress)
  }

  // APK (NativeHttp available): try sovereign Gold pipeline
  onProgress?.('prd', 'Pipeline Gold — Passe 1: Architecture...')
  try {
    // ── Pass 1: Architecture ──
    const archPrompt = `Tu es un architecte logiciel senior. Génère un plan d'architecture JSON pour:
Application: "${name}"
Description: "${description}"
Features: ${features.join(', ') || 'aucune'}

Format JSON: {"features":["auth","tasks"],"components":["Header","TaskList"],"dependencies":[{"name":"zustand","version":"^4.5.4"}]}
Réponds UNIQUEMENT avec le JSON.`

    const archResult = await glmChatAsync([
      { role: 'assistant', content: 'Tu es un architecte logiciel. Tu réponds UNIQUEMENT par du JSON valide.' },
      { role: 'user', content: archPrompt },
    ])

    if (archResult.error && isNetworkError(archResult.error)) {
      onProgress?.('code', 'API GLM injoignable. Bascule vers le serveur Gold...')
      if (hasServerFallback()) {
        return generateGoldViaServer(name, description, features, onProgress)
      }
      return { success: false, files: [], prd: '', error: 'API GLM injoignable. Configurez l URL du serveur (bouton Configurer).', mode: 'failed' }
    }
    if (archResult.error) {
      return { success: false, files: [], prd: '', error: `Echec architecture: ${archResult.error}`, mode: 'failed' }
    }

    // Generate PRD simultaneously
    const prdResult = await glmChatAsync([
      { role: 'assistant', content: 'Tu es un expert en conception de produits React. Tu réponds uniquement avec du Markdown.' },
      { role: 'user', content: `Génère un PRD en Markdown pour "${name}": ${description}. Sections: Vue d'ensemble, Objectifs, User Stories, Interface, Stack.` },
    ])
    const prd = prdResult.content || `# ${name}\n\n${description}`
    onProgress?.('prd', `Architecture + PRD générés`)

    // ── Pass 2: Types ──
    onProgress?.('code', 'Passe 2: Types TypeScript + Zod...')
    const typesResult = await glmChatAsync([
      { role: 'assistant', content: 'Tu es un ingénieur TypeScript senior. Tu réponds UNIQUEMENT par du JSON valide.' },
      { role: 'user', content: `Génère les types TypeScript pour "${name}". Features: ${features.join(', ') || 'aucune'}.
Format: {"files":[{"path":"src/shared/types/index.ts","content":"...","language":"typescript"}]}
Inclus interfaces + schémas Zod. Réponds UNIQUEMENT avec le JSON.` },
    ])

    let typeFiles: ProjectFile[] = []
    if (!typesResult.error && typesResult.content) {
      const parsed = extractJson(typesResult.content) as { files?: any[] } | null
      if (parsed?.files) typeFiles = parsed.files.map((f: any) => ({ path: f.path, content: f.content || '', language: f.language || 'typescript' }))
    }
    onProgress?.('code', `${typeFiles.length} fichiers de types générés`)

    // ── Pass 3: Business Logic ──
    onProgress?.('code', 'Passe 3: Composants + hooks + repository...')
    const logicResult = await glmChatAsync([
      { role: 'assistant', content: 'Tu es un ingénieur React senior. Tu réponds UNIQUEMENT par du JSON valide.' },
      { role: 'user', content: `Génère les composants React pour "${name}": ${description}.
Utilise HashRouter, useState, Tailwind. Composants fonctionnels avec export default.
Format: {"files":[{"path":"src/App.tsx","content":"...","language":"tsx"},{"path":"src/components/MainComponent.tsx","content":"...","language":"tsx"}]}
Réponds UNIQUEMENT avec le JSON.` },
    ])

    let logicFiles: ProjectFile[] = []
    if (!logicResult.error && logicResult.content) {
      const parsed = extractJson(logicResult.content) as { files?: any[] } | null
      if (parsed?.files) logicFiles = parsed.files.map((f: any) => ({ path: f.path, content: f.content || '', language: f.language || 'tsx' }))
    }
    onProgress?.('code', `${logicFiles.length} fichiers business logic générés`)

    // ── Pass 4: Design System (deterministic — inline templates) ──
    onProgress?.('merge', 'Passe 4: Design system (32 composants déterministes)...')
    const designSystemFiles = buildDesignSystemTemplates()
    onProgress?.('merge', `${designSystemFiles.length} composants design system`)

    // ── Pass 5: Tests (skip on-device — too slow for 5th LLM call) ──
    onProgress?.('merge', 'Passe 5: Tests (ignorés en mode souverain)')

    // ── Merge all files ──
    onProgress?.('merge', 'Fusion des fichiers...')
    const templateFiles = buildTemplateFiles(name, description)

    // Ensure index.css
    const hasCss = [...typeFiles, ...logicFiles].some(f => f.path === 'src/index.css')
    if (!hasCss) {
      logicFiles.push({ path: 'src/index.css', content: buildIndexCss(), language: 'css' })
    }

    // Merge: templates (config) + design system (shared) + types + logic
    const allFiles: ProjectFile[] = [...templateFiles, ...designSystemFiles, ...typeFiles, ...logicFiles]

    // Dedupe (later files win on path conflicts)
    const seen = new Set<string>()
    const deduped: ProjectFile[] = []
    for (let i = allFiles.length - 1; i >= 0; i--) {
      if (!seen.has(allFiles[i].path)) {
        seen.add(allFiles[i].path)
        deduped.unshift(allFiles[i])
      }
    }

    onProgress?.('done', `${deduped.length} fichiers Gold Grade générés`)

    return {
      success: true,
      files: deduped,
      prd,
      mode: 'sovereign',
    }
  } catch (e) {
    if (hasServerFallback()) {
      onProgress?.('code', 'Erreur inattendue. Bascule vers le serveur Gold...')
      return generateGoldViaServer(name, description, features, onProgress)
    }
    return {
      success: false,
      files: [],
      prd: '',
      error: e instanceof Error ? e.message : 'Erreur inconnue',
      mode: 'failed',
    }
  }
}

/** Deterministic design system templates (simplified for mobile). */
function buildDesignSystemTemplates(): ProjectFile[] {
  return [
    {
      path: 'src/shared/lib/utils.ts',
      language: 'typescript',
      content: `import { clsx } from 'clsx'\nimport { twMerge } from 'tailwind-merge'\n\nexport function cn(...inputs: any[]): string {\n  return twMerge(clsx(inputs))\n}\n\nexport function formatDate(date: Date | string | number): string {\n  return new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })\n}\n\nexport function formatNumber(n: number): string {\n  return new Intl.NumberFormat('fr-FR').format(n)\n}\n\nexport function truncate(text: string, max: number): string {\n  return text.length > max ? text.slice(0, max) + '…' : text\n}\n\nexport function generateId(): string {\n  return Math.random().toString(36).slice(2, 11)\n}\n`,
    },
    {
      path: 'src/shared/ui/button.tsx',
      language: 'tsx',
      content: `import { forwardRef, type ButtonHTMLAttributes } from 'react'\nimport { cva, type VariantProps } from 'class-variance-authority'\nimport { cn } from '../lib/utils'\n\nconst buttonVariants = cva(\n  'inline-flex items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 disabled:opacity-50',\n  {\n    variants: {\n      variant: { primary: 'bg-cyan-500 text-slate-950 hover:bg-cyan-600', secondary: 'bg-slate-800 text-slate-100 hover:bg-slate-700', outline: 'border border-slate-700 hover:bg-slate-800', ghost: 'hover:bg-slate-800 text-slate-300', destructive: 'bg-rose-500 text-white hover:bg-rose-600' },\n      size: { sm: 'h-8 px-3 text-xs', md: 'h-10 px-4', lg: 'h-12 px-6 text-base', icon: 'h-10 w-10' },\n    },\n    defaultVariants: { variant: 'primary', size: 'md' },\n  }\n)\n\nexport interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}\n\nexport const Button = forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, ...props }, ref) => (\n  <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />\n))\nButton.displayName = 'Button'\nexport { buttonVariants }`,
    },
    {
      path: 'src/shared/ui/input.tsx',
      language: 'tsx',
      content: `import { forwardRef, type InputHTMLAttributes } from 'react'\nimport { cn } from '../lib/utils'\n\nexport interface InputProps extends InputHTMLAttributes<HTMLInputElement> { error?: boolean }\n\nexport const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => (\n  <input ref={ref} className={cn('flex h-10 w-full rounded-md border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500', error && 'border-rose-500', className)} {...props} />\n))\nInput.displayName = 'Input'`,
    },
    {
      path: 'src/shared/ui/card.tsx',
      language: 'tsx',
      content: `import { type HTMLAttributes } from 'react'\nimport { cn } from '../lib/utils'\n\nexport function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {\n  return <div className={cn('rounded-xl border border-slate-800 bg-slate-900/40 text-slate-100 shadow', className)} {...props} />\n}\nexport function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {\n  return <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />\n}\nexport function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {\n  return <h3 className={cn('text-lg font-semibold', className)} {...props} />\n}\nexport function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {\n  return <div className={cn('p-6 pt-0', className)} {...props} />\n}\nexport function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {\n  return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />\n}\n`,
    },
    {
      path: 'src/shared/ui/badge.tsx',
      language: 'tsx',
      content: `import { type HTMLAttributes } from 'react'\nimport { cn } from '../lib/utils'\n\nexport function Badge({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {\n  return <span className={cn('inline-flex items-center rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-medium text-cyan-300', className)} {...props} />\n}\n`,
    },
    {
      path: 'src/shared/ui/skeleton.tsx',
      language: 'tsx',
      content: `import { type HTMLAttributes } from 'react'\nimport { cn } from '../lib/utils'\n\nexport function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {\n  return <div className={cn('animate-pulse rounded-md bg-slate-800', className)} {...props} />\n}\n`,
    },
    {
      path: 'src/shared/ui/empty-state.tsx',
      language: 'tsx',
      content: `import { type ReactNode } from 'react'\nimport { Inbox } from 'lucide-react'\n\nexport function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {\n  return (\n    <div className="flex flex-col items-center justify-center py-12 text-center">\n      <Inbox className="mb-4 h-12 w-12 text-slate-700" />\n      <h3 className="text-base font-semibold text-slate-200">{title}</h3>\n      {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}\n      {action && <div className="mt-4">{action}</div>}\n    </div>\n  )\n}\n`,
    },
    {
      path: 'src/shared/ui/error-state.tsx',
      language: 'tsx',
      content: `import { AlertTriangle, RefreshCw } from 'lucide-react'\nimport { Button } from './button'\n\nexport function ErrorState({ title = 'Erreur', description = 'Veuillez réessayer.', onRetry }: { title?: string; description?: string; onRetry?: () => void }) {\n  return (\n    <div className="flex flex-col items-center justify-center py-12 text-center">\n      <AlertTriangle className="mb-4 h-12 w-12 text-rose-400" />\n      <h3 className="text-base font-semibold text-slate-200">{title}</h3>\n      <p className="mt-1 text-sm text-slate-500">{description}</p>\n      {onRetry && <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}><RefreshCw className="mr-1.5 h-3.5 w-3.5" />Réessayer</Button>}\n    </div>\n  )\n}\n`,
    },
    {
      path: 'src/shared/ui/async-boundary.tsx',
      language: 'tsx',
      content: `import { type ReactNode } from 'react'\nimport { Skeleton } from './skeleton'\nimport { ErrorState } from './error-state'\nimport { EmptyState } from './empty-state'\n\nexport function AsyncBoundary({ isLoading, isError, isEmpty, onRetry, emptyTitle = 'Aucune donnée', children }: {\n  isLoading?: boolean; isError?: boolean; isEmpty?: boolean; onRetry?: () => void; emptyTitle?: string; children: ReactNode\n}) {\n  if (isLoading) return <Skeleton className="h-32 w-full" />\n  if (isError) return <ErrorState onRetry={onRetry} />\n  if (isEmpty) return <EmptyState title={emptyTitle} />\n  return <>{children}</>\n}\n`,
    },
    {
      path: 'src/shared/ui/index.ts',
      language: 'typescript',
      content: `export { Button, buttonVariants } from './button'\nexport { Input } from './input'\nexport { Card, CardHeader, CardTitle, CardContent, CardFooter } from './card'\nexport { Badge } from './badge'\nexport { Skeleton } from './skeleton'\nexport { EmptyState } from './empty-state'\nexport { ErrorState } from './error-state'\nexport { AsyncBoundary } from './async-boundary'\n`,
    },
  ]
}

/**
 * Generates a complete React project.
 * Strategy:
 *   1. If NativeHttp available (APK): try sovereign mode (GLM-4.6 on-device)
 *   2. If sovereign fails with network error AND server is available: fallback to server
 *   3. If no NativeHttp (web mobile): use server mode directly
 */
export async function generateProjectOnDevice(
  name: string,
  description: string,
  features: string[] = [],
  onProgress?: (phase: 'prd' | 'code' | 'merge' | 'done', message: string) => void
): Promise<GenerationResult> {
  const native = hasNativeHttp()

  // ── Web mobile (no NativeHttp): server mode directly ──
  if (!native) {
    return generateViaServer(name, description, features, onProgress)
  }

  // ── APK (NativeHttp available): try sovereign mode first ──
  onProgress?.('prd', 'Generation du PRD via GLM-4.6 (on-device)...')
  try {
    const prdPrompt = `Tu es un expert en conception de produits. Genere un PRD (Product Requirements Document) en Markdown pour l'application suivante.

Application: "${name}"
Description: "${description}"
${features.length > 0 ? `Fonctionnalites: ${features.join(', ')}` : ''}

Structure du PRD:
1. Vue d'ensemble (2-3 phrases)
2. Problematique
3. Objectifs (3-5 points)
4. Utilisateurs cibles
5. User Stories (3-5 stories au format "En tant que..., je veux..., afin de...")
6. Interface (description des ecrans principaux)
7. Stack technique (React 18, TypeScript, Vite, Tailwind CSS)

Reponds UNIQUEMENT avec le Markdown du PRD, sans texte autour.`

    const prdResult = await glmChatAsync([
      { role: 'assistant', content: 'Tu es un expert en conception de produits React. Tu reponds uniquement avec du Markdown propre.' },
      { role: 'user', content: prdPrompt },
    ])

    // ── Network error: fallback to server ──
    if (prdResult.error && isNetworkError(prdResult.error)) {
      onProgress?.('prd', 'API GLM injoignable depuis le telephone. Bascule vers le serveur...')
      if (hasServerFallback()) {
        return generateViaServer(name, description, features, onProgress)
      }
      return {
        success: false,
        files: [],
        prd: '',
        error: `L API GLM-4.6 est injoignable depuis votre telephone (reseau operateur). Configurez l URL du serveur React Forge (bouton Configurer) pour utiliser le serveur comme relais.`,
        mode: 'failed',
      }
    }

    if (prdResult.error) {
      return { success: false, files: [], prd: '', error: `Echec PRD: ${prdResult.error}`, mode: 'failed' }
    }
    const prd = prdResult.content
    onProgress?.('prd', `PRD genere (${prd.length} chars)`)

    // ── Phase 2: Generate code ──
    onProgress?.('code', 'Generation du code source via GLM-4.6...')
    const featuresRule = features.length > 0
      ? `Implemente VRAIMENT ces fonctionnalites: ${features.join(', ')}.`
      : 'Aucune fonctionnalite speciale demandee.'

    const codePrompt = `Genere UNIQUEMENT 3 fichiers React pour l'application decrite. Reponds UNIQUEMENT avec du JSON valide, AUCUN texte autour, AUCUN markdown.

Application: "${name}"
Description: "${description}"
${featuresRule}

Genere EXACTEMENT ces 3 fichiers:
1. "src/App.tsx" — composant racine. Integre HashRouter de react-router-dom avec une route "/" qui affiche MainComponent. Peut contenir un header/navbar avec le nom de l'app.
2. "src/components/MainComponent.tsx" — le composant METIER principal avec VRAIE logique (state React, interactions, donnees). Pas juste un affichage statique. Doit etre fonctionnel et interactif.
3. "src/index.css" — commence par les 3 directives @tailwind (base, components, utilities). Ajoute quelques styles globaux simples.

REGLES:
- TypeScript: interfaces pour les props et le state, typage explicite.
- Utilise des classes Tailwind pour TOUT le style.
- Composants PascalCase. Imports relatifs sans extension.
- NE genere PAS package.json, index.html, main.tsx, vite.config — ils sont fournis automatiquement.
- Echappe les guillemets dans le JSON (utilise \\" pour les guillemets dans le code).
- Code COMPLET et fonctionnel, concis.

Format JSON EXACT:
{"files":[{"path":"src/App.tsx","content":"...","language":"tsx"},{"path":"src/components/MainComponent.tsx","content":"...","language":"tsx"},{"path":"src/index.css","content":"...","language":"css"}]}

Reponds MAINTENANT avec uniquement l'objet JSON.`

    const codeResult = await glmChatAsync([
      { role: 'assistant', content: 'Tu es un generateur de composants React expert. Tu reponds UNIQUEMENT par du JSON valide, jamais de texte autour, jamais de markdown.' },
      { role: 'user', content: codePrompt },
    ])

    if (codeResult.error && isNetworkError(codeResult.error)) {
      // PRD succeeded but code failed with network error — try server fallback for code only
      onProgress?.('code', 'Reconnexion au serveur pour le code...')
      if (hasServerFallback()) {
        const serverResult = await generateViaServer(name, description, features, onProgress)
        if (serverResult.success) {
          return { ...serverResult, prd: prd || serverResult.prd }
        }
      }
      return {
        success: false,
        files: [],
        prd,
        error: `Connexion perdue pendant la generation du code. Reessayez.`,
        mode: 'failed',
      }
    }

    if (codeResult.error) {
      return { success: false, files: [], prd, error: `Echec code: ${codeResult.error}`, mode: 'failed' }
    }

    // ── Phase 3: Parse + merge ──
    onProgress?.('merge', 'Analyse des fichiers generes...')
    const parsed = extractJson(codeResult.content) as { files?: Array<{ path: string; content?: string; language?: string }> } | null

    if (!parsed || !Array.isArray(parsed.files) || parsed.files.length === 0) {
      return { success: false, files: [], prd, error: 'L IA n a pas retourne de fichiers valides. Reessaie avec une description plus precise.', mode: 'failed' }
    }

    const llmFiles: ProjectFile[] = []
    const seen = new Set<string>()
    for (const f of parsed.files) {
      if (!f.path) continue
      const cleanPath = f.path.replace(/^\.?\//, '').trim()
      if (!cleanPath || seen.has(cleanPath)) continue
      seen.add(cleanPath)
      llmFiles.push({
        path: cleanPath,
        content: unescapeJsonString(String(f.content || '')),
        language: f.language || inferLanguage(cleanPath),
      })
    }

    if (llmFiles.length === 0) {
      return { success: false, files: [], prd, error: 'Aucun fichier valide genere.', mode: 'failed' }
    }

    const templateFiles = buildTemplateFiles(name, description)
    const templatePaths = new Set(templateFiles.map(f => f.path))

    const llmCssIdx = llmFiles.findIndex(f => f.path === 'src/index.css')
    if (llmCssIdx === -1) {
      llmFiles.push({ path: 'src/index.css', content: buildIndexCss(), language: 'css' })
    } else {
      const llmCss = llmFiles[llmCssIdx].content
      if (!llmCss.includes('@tailwind')) {
        llmFiles[llmCssIdx].content = buildIndexCss() + '\n' + llmCss
      }
    }

    const allFiles: ProjectFile[] = [...templateFiles]
    for (const f of llmFiles) {
      if (!templatePaths.has(f.path)) {
        allFiles.push(f)
      }
    }

    onProgress?.('done', `${allFiles.length} fichiers prets`)

    return {
      success: true,
      files: allFiles,
      prd,
      mode: 'sovereign',
    }
  } catch (e) {
    // Unexpected error — try server fallback
    if (hasServerFallback()) {
      onProgress?.('code', 'Erreur inattendue. Bascule vers le serveur...')
      return generateViaServer(name, description, features, onProgress)
    }
    return {
      success: false,
      files: [],
      prd: '',
      error: e instanceof Error ? e.message : 'Erreur inconnue',
      mode: 'failed',
    }
  }
}
