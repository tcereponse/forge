// Standalone HTML generator — creates a self-contained .html file that runs the
// React project in any browser (phone, desktop) without npm install or build.
// Used in sovereign mode (APK) where we can't compile a real .apk on-device.
//
// The generated HTML uses:
// - esm.sh CDN for React/react-dom/react-router-dom imports
// - Babel Standalone for in-browser TSX transpilation
// - All source files inlined as strings, loaded into a virtual file system

import type { ProjectFile } from './useProjects'
import { hasNativeHttp } from './glm-native'
import { apiFetch, apiUrl, getApiBase } from './api'

/**
 * Builds a standalone HTML file that runs the project in-browser.
 * Uses esm.sh + Babel Standalone — no build step required.
 */
export function buildStandaloneHtml(projectName: string, description: string, files: ProjectFile[]): string {
  // Find the main source files
  const appFile = files.find(f => /src\/App\.(tsx|jsx)$/.test(f.path))
  const mainFile = files.find(f => /src\/main\.(tsx|jsx)$/.test(f.path))
  const indexCss = files.find(f => f.path === 'src/index.css')
  const mainComponent = files.find(f => /src\/components\/.*\.(tsx|jsx)$/.test(f.path))

  // Collect all component files (for inlining)
  const componentFiles = files.filter(f =>
    /src\/.*\.(tsx|jsx)$/.test(f.path) &&
    f.path !== 'src/App.tsx' &&
    f.path !== 'src/App.jsx' &&
    f.path !== 'src/main.tsx' &&
    f.path !== 'src/main.jsx'
  )

  // Build the inline source code
  const sources: Record<string, string> = {}
  if (appFile) sources[appFile.path] = appFile.content
  if (mainComponent) sources[mainComponent.path] = mainComponent.content
  for (const f of componentFiles) {
    if (!sources[f.path]) sources[f.path] = f.content
  }

  // Extract MainComponent name from the import in App.tsx
  const mainImportMatch = appFile?.content.match(/import\s+(\w+)\s+from\s+['"]\.\/components\/([^'"]+)['"]/)
  const mainComponentName = mainImportMatch ? mainImportMatch[1] : 'MainComponent'

  // Escape for embedding in JS template literal
  const escapeJs = (s: string) => s
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$/g, '\\$')

  const sourcesJson = JSON.stringify(
    Object.fromEntries(
      Object.entries(sources).map(([k, v]) => [k, v])
    ),
    null,
    0
  )

  const appCode = appFile?.content || `import React from 'react'; export default function App() { return <div style={{padding:20,fontFamily:'sans-serif'}}><h1>${projectName}</h1><p>${description}</p></div> }`

  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#0f172a">
<title>${projectName}</title>
<style>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; background: #0f172a; color: #f1f5f9; }
#root { min-height: 100vh; }
#loading { display: flex; align-items: center; justify-content: center; min-height: 100vh; flex-direction: column; gap: 12px; }
#loading .spinner { width: 40px; height: 40px; border: 3px solid rgba(6,182,212,0.2); border-top-color: #06b6d4; border-radius: 50%; animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
#error { display: none; padding: 20px; margin: 20px; border-radius: 12px; background: #1e293b; border: 1px solid #ef4444; color: #fca5a5; font-size: 13px; white-space: pre-wrap; word-break: break-word; }
${indexCss ? `<style id="index-css">${escapeHtml(indexCss.content.replace(/@tailwind\s+(base|components|utilities);?\s*/g, ''))}</style>` : ''}
</style>
</head>
<body>
<div id="root">
  <div id="loading">
    <div class="spinner"></div>
    <p style="color:#94a3b8;font-size:14px;">Chargement de ${projectName}...</p>
  </div>
</div>
<div id="error"></div>

<script type="importmap">
{
  "imports": {
    "react": "https://esm.sh/react@18.3.1",
    "react-dom": "https://esm.sh/react-dom@18.3.1",
    "react-dom/client": "https://esm.sh/react-dom@18.3.1/client",
    "react-router-dom": "https://esm.sh/react-router-dom@6.26.0"
  }
}
</script>

<script src="https://unpkg.com/@babel/standalone@7.25.6/babel.min.js"></script>

<script>
// Virtual file system — all source files inlined
const SOURCES = ${sourcesJson};

// Babel transform: TSX -> JS (stripping TypeScript types, transforming JSX)
function transformTsx(code) {
  try {
    return Babel.transform(code, {
      presets: [
        ['typescript', { allExtensions: true, isTSX: true }],
        ['react', { runtime: 'automatic' }]
      ],
      filename: 'file.tsx'
    }).code;
  } catch(e) {
    console.error('Transform error:', e);
    throw e;
  }
}

// Rewrite relative imports to use our virtual module system
function rewriteImports(code, filePath) {
  // Replace relative imports like './components/MainComponent' with __virtual__('./components/MainComponent')
  let rewritten = code
    // import X from './path' → import X from __virtual__('./path')
    .replace(/from\\s+['"]((?:\\.{1,2})\\/[^'"]+)['"]/g, "from __virtual__(\\\"$1\\\")")
    // import './path' → import __virtual__('./path')
    .replace(/import\\s+['"]((?:\\.{1,2})\\/[^'"]+)['"]/g, "import __virtual__(\\\"$1\\\")");
  return rewritten;
}

// Resolve a relative path from a base file path
function resolvePath(importPath, fromFile) {
  const dir = fromFile.split('/').slice(0, -1).join('/');
  let resolved = importPath;
  if (importPath.startsWith('./')) {
    resolved = dir + '/' + importPath.slice(2);
  } else if (importPath.startsWith('../')) {
    const parts = dir.split('/');
    parts.pop();
    resolved = parts.join('/') + '/' + importPath.slice(3);
  }
  // Add extension if missing
  if (!resolved.match(/\\.(tsx|jsx|ts|js)$/)) {
    for (const ext of ['.tsx', '.jsx', '.ts', '.js']) {
      if (SOURCES[resolved + ext]) { resolved = resolved + ext; break; }
    }
  }
  // Normalize
  resolved = resolved.replace(/\\/+/g, '/').replace(/\\/$/, '');
  return resolved;
}

// Virtual module loader
const moduleCache = {};
function __virtual__(importPath) {
  const resolved = resolvePath(importPath, '');
  return loadModule(resolved);
}

function loadModule(filePath) {
  if (moduleCache[filePath]) return moduleCache[filePath].exports;
  const source = SOURCES[filePath];
  if (!source) throw new Error('Module non trouve: ' + filePath);

  const module = { exports: {} };
  moduleCache[filePath] = module;

  let code = transformTsx(source);
  code = rewriteImports(code, filePath);

  // Wrap in a function with our imports
  const wrapper = new Function('React', 'ReactDOM', 'HashRouter', 'Routes', 'Route', 'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useContext', 'useReducer', 'Link', 'NavLink', 'useParams', 'useNavigate', 'useLocation', '__virtual__', 'module', 'exports', code);

  // Execute
  wrapper(
    window.React, window.ReactDOM,
    window.ReactRouterDOM?.HashRouter, window.ReactRouterDOM?.Routes, window.ReactRouterDOM?.Route,
    window.React?.useState, window.React?.useEffect, window.React?.useRef, window.React?.useMemo, window.React?.useCallback, window.React?.useContext, window.React?.useReducer,
    window.ReactRouterDOM?.Link, window.ReactRouterDOM?.NavLink, window.ReactRouterDOM?.useParams, window.ReactRouterDOM?.useNavigate, window.ReactRouterDOM?.useLocation,
    __virtual__, module, module.exports
  );

  return module.exports;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function showError(msg) {
  const el = document.getElementById('error');
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';
  if (el) { el.style.display = 'block'; el.textContent = msg; }
  console.error(msg);
}

async function init() {
  try {
    // Wait for Babel
    if (!window.Babel) {
      await new Promise((resolve, reject) => {
        const check = setInterval(() => {
          if (window.Babel) { clearInterval(check); resolve(); }
        }, 50);
        setTimeout(() => { clearInterval(check); reject('Babel non charge'); }, 10000);
      });
    }

    // Load App module
    const appModule = loadModule('src/App.tsx');
    const App = appModule.default || appModule.App;
    if (!App) throw new Error('Composant App non trouve');

    // Render
    const React = window.React;
    const ReactDOM = window.ReactDOM;
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(App));

    // Remove loading
    const loading = document.getElementById('loading');
    if (loading) loading.remove();
  } catch(e) {
    showError('Erreur de chargement: ' + (e.message || e) + '\\n\\nLe projet peut necessiter des dependances non disponibles en mode standalone.');
  }
}

init();
</script>
</body>
</html>`
}

/**
 * Builds a ZIP containing the project source + a build-apk.sh script.
 * Used as a fallback for users who want to compile a real APK on a PC.
 */
export async function buildProjectZipWithApkScript(projectName: string, description: string, files: ProjectFile[]): Promise<Blob> {
  const z = new (await import('jszip')).default()
  const root = projectName.toLowerCase().replace(/\s+/g, '-')

  // Add all source files
  for (const f of files) {
    z.file(`${root}/${f.path}`, f.content)
  }

  // Add build-apk.sh
  z.file(`${root}/build-apk.sh`, `#!/bin/bash
# Build script for ${projectName}
# Generates an Android APK from this React project.
# Requires: Android SDK (aapt2, d8, apksigner, javac) + Node.js

set -e
echo "=== Building ${projectName} ==="
echo "1. Installing dependencies..."
npm install
echo "2. Building web app..."
npm run build
echo "3. Building APK..."
# This uses the same build process as React Forge's /api/build-apk
# You need Android SDK build-tools 34.0.0 + platform android-34
ANDROID_HOME=\${ANDROID_HOME:-/tmp/android-sdk}
BUILD_TOOLS=\$ANDROID_HOME/build-tools/34.0.0
PLATFORM_JAR=\$ANDROID_HOME/platforms/android-34/android.jar

mkdir -p android/assets/www
cp -r dist/* android/assets/www/

# Create manifest, compile resources, link, compile Java, d8, sign...
# (See React Forge's build-mobile-apk.sh for the full process)
echo "=== Done! ==="
echo "APK: \${root}.apk"
`)

  z.file(`${root}/README.md`, `# ${projectName}

${description}

## Build APK

\`\`\`bash
npm install
npm run build
./build-apk.sh
\`\`\`

Generated by React Forge Mobile
`)

  return await z.generateAsync({ type: 'blob' })
}

export interface ApkBuildOptions {
  project: { id: string; name: string; description: string; files: ProjectFile[] }
}

export interface ApkBuildResult {
  success: boolean
  filename: string
  blob: Blob
  error?: string
}

/**
 * Builds an APK for the selected project.
 * - Sovereign mode (APK): generates a standalone HTML (runnable on phone)
 * - Server mode: calls /api/build-apk (real compiled APK)
 */
export async function buildProjectApk(opts: ApkBuildOptions): Promise<ApkBuildResult> {
  const { project } = opts
  const filename = project.name.toLowerCase().replace(/\s+/g, '-')

  if (hasNativeHttp()) {
    // Sovereign mode: generate standalone HTML
    const html = buildStandaloneHtml(project.name, project.description, project.files)
    const blob = new Blob([html], { type: 'text/html' })
    return {
      success: true,
      filename: `${filename}.html`,
      blob,
    }
  }

  // Server mode: call /api/build-apk
  try {
    const res = await fetch(apiUrl('/api/build-apk'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId: project.id, backendUrl: getApiBase() }),
    })
    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`
      try { const ej = await res.json(); errMsg = ej.error || errMsg } catch {}
      throw new Error(errMsg)
    }
    const blob = await res.blob()
    if (blob.size < 1000) throw new Error('APK trop petit (compilation echouee)')
    return {
      success: true,
      filename: `${filename}.apk`,
      blob,
    }
  } catch (e) {
    return {
      success: false,
      filename: '',
      blob: new Blob(),
      error: e instanceof Error ? e.message : String(e),
    }
  }
}
