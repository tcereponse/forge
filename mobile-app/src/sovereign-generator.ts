// Sovereign project generator — runs entirely on-device, no PC server needed.
// Uses glm-native.ts (NativeHttp bridge) to call GLM-4.6 directly from the APK.
// Generates PRD + code files for a React project, with post-processing.

import { glmChatAsync, extractJson, unescapeJsonString, inferLanguage, hasNativeHttp } from './glm-native'
import type { ProjectFile } from './useProjects'

export interface GenerationResult {
  success: boolean
  files: ProjectFile[]
  prd: string
  error?: string
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
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview',
        },
        dependencies: {
          react: '^18.3.1',
          'react-dom': '^18.3.1',
          'react-router-dom': '^6.26.0',
        },
        devDependencies: {
          '@types/react': '^18.3.5',
          '@types/react-dom': '^18.3.0',
          '@vitejs/plugin-react': '^4.3.1',
          autoprefixer: '^10.4.20',
          postcss: '^8.4.41',
          tailwindcss: '^3.4.10',
          typescript: '^5.5.4',
          vite: '^5.4.0',
        },
      }, null, 2),
    },
    {
      path: 'vite.config.ts',
      language: 'typescript',
      content: `import { defineConfig } from 'vite'\nimport react from '@vitejs/plugin-react'\n\nexport default defineConfig({\n  plugins: [react()],\n})\n`,
    },
    {
      path: 'tsconfig.json',
      language: 'json',
      content: JSON.stringify({
        compilerOptions: {
          target: 'ES2020',
          useDefineForClassFields: true,
          lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          module: 'ESNext',
          skipLibCheck: true,
          moduleResolution: 'bundler',
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: 'react-jsx',
          strict: true,
          noUnusedLocals: false,
          noUnusedParameters: false,
          noFallthroughCasesInSwitch: true,
        },
        include: ['src'],
        references: [{ path: './tsconfig.node.json' }],
      }, null, 2),
    },
    {
      path: 'tsconfig.node.json',
      language: 'json',
      content: JSON.stringify({
        compilerOptions: {
          composite: true,
          skipLibCheck: true,
          module: 'ESNext',
          moduleResolution: 'bundler',
          allowSyntheticDefaultImports: true,
        },
        include: ['vite.config.ts'],
      }, null, 2),
    },
    {
      path: 'tailwind.config.js',
      language: 'javascript',
      content: `/** @type {import('tailwindcss').Config} */\nexport default {\n  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],\n  theme: { extend: {} },\n  plugins: [],\n}\n`,
    },
    {
      path: 'postcss.config.js',
      language: 'javascript',
      content: `export default {\n  plugins: {\n    tailwindcss: {},\n    autoprefixer: {},\n  },\n}\n`,
    },
    {
      path: 'index.html',
      language: 'html',
      content: `<!doctype html>\n<html lang="fr">\n  <head>\n    <meta charset="UTF-8\" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0\" />\n    <title>${name}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`,
    },
    {
      path: 'src/main.tsx',
      language: 'typescript',
      content: `import React from 'react'\nimport { createRoot } from 'react-dom/client'\nimport App from './App'\nimport './index.css'\n\ncreateRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n)\n`,
    },
    {
      path: '.gitignore',
      language: 'text',
      content: 'node_modules\ndist\n.env\n*.log\n',
    },
    {
      path: 'README.md',
      language: 'markdown',
      content: `# ${name}\n\n${description}\n\n## Stack\n- React 18 + TypeScript\n- Vite\n- Tailwind CSS\n- React Router\n\n## Developpement\n\\\`\\\`\\\`bash\nnpm install\nnpm run dev\n\\\`\\\`\\\`\n\nGenere par React Forge Mobile (GLM-4.6)\n`,
    },
  ]
}

/** Safe index.css with Tailwind directives + CSS variables. */
function buildIndexCss(): string {
  return `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n:root {\n  --background: 0 0% 100%;\n  --foreground: 222.2 84% 4.9%;\n  --primary: 186 100% 40%;\n  --border: 214.3 31.8% 91.4%;\n}\n\n* {\n  border-color: rgb(var(--border));\n}\n\nbody {\n  margin: 0;\n  font-family: system-ui, -apple-system, sans-serif;\n  -webkit-font-smoothing: antialiased;\n}\n`
}

/**
 * Generates a complete React project on-device using GLM-4.6.
 * 1. Generates PRD (markdown document)
 * 2. Generates code files (App.tsx, MainComponent.tsx, index.css)
 * 3. Merges with deterministic template files
 * 4. Post-processes (ensures imports, dedupes)
 */
export async function generateProjectOnDevice(
  name: string,
  description: string,
  features: string[] = [],
  onProgress?: (phase: 'prd' | 'code' | 'merge' | 'done', message: string) => void
): Promise<GenerationResult> {
  if (!hasNativeHttp()) {
    return { success: false, files: [], prd: '', error: 'NativeHttp bridge non disponible. Cette fonctionnalite necessite l APK mobile.' }
  }

  try {
    // ── Phase 1: Generate PRD ──
    onProgress?.('prd', 'Generation du PRD via GLM-4.6...')
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

    if (prdResult.error) {
      return { success: false, files: [], prd: '', error: `Echec PRD: ${prdResult.error}` }
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

    if (codeResult.error) {
      return { success: false, files: [], prd, error: `Echec code: ${codeResult.error}` }
    }

    // ── Phase 3: Parse + merge ──
    onProgress?.('merge', 'Analyse des fichiers generes...')
    const parsed = extractJson(codeResult.content) as { files?: Array<{ path: string; content?: string; language?: string }> } | null

    if (!parsed || !Array.isArray(parsed.files) || parsed.files.length === 0) {
      return { success: false, files: [], prd, error: 'L IA n a pas retourne de fichiers valides. Reessaie avec une description plus precise.' }
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
      return { success: false, files: [], prd, error: 'Aucun fichier valide genere.' }
    }

    // Merge: templates (config) + LLM files (src/)
    const templateFiles = buildTemplateFiles(name, description)
    const templatePaths = new Set(templateFiles.map(f => f.path))

    // Ensure index.css has Tailwind directives
    const llmCssIdx = llmFiles.findIndex(f => f.path === 'src/index.css')
    if (llmCssIdx === -1) {
      llmFiles.push({ path: 'src/index.css', content: buildIndexCss(), language: 'css' })
    } else {
      const llmCss = llmFiles[llmCssIdx].content
      if (!llmCss.includes('@tailwind')) {
        llmFiles[llmCssIdx].content = buildIndexCss() + '\n' + llmCss
      }
    }

    // Start with templates, add LLM files (templates win on config paths)
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
    }
  } catch (e) {
    return {
      success: false,
      files: [],
      prd: '',
      error: e instanceof Error ? e.message : 'Erreur inconnue pendant la generation',
    }
  }
}
