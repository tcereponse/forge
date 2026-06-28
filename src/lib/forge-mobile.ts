// APK / Mobile build support
// Converts a React project to a mobile-ready package:
// 1. Adds PWA manifest + service worker (installable on Android)
// 2. Generates Capacitor config (wraps the web app in a native shell)
// 3. Downloads as a ZIP with capacitor setup instructions

import { promises as fs } from "fs";
import os from "os";
import path from "path";
import type { GeneratedFile, ProjectConfig } from "./forge-config";

const MOBILE_WORKSPACES_DIR = path.join(os.tmpdir(), "react-forge-apk");

// PWA manifest for the generated project
export function generatePWAManifest(config: ProjectConfig): string {
  const appName = config.name;
  const slug = config.name.toLowerCase().replace(/[^a-z0-9]/g, "-");
  return JSON.stringify(
    {
      name: appName,
      short_name: appName.slice(0, 12),
      description: config.description,
      start_url: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0f172a",
      theme_color: "#06b6d4",
      icons: [
        {
          src: "/icon-192.png",
          sizes: "192x192",
          type: "image/png",
          purpose: "any maskable",
        },
        {
          src: "/icon-512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "any maskable",
        },
      ],
      categories: ["productivity", "utilities"],
    },
    null,
    2
  );
}

// Service worker for offline support
export function generateServiceWorker(): string {
  return `// Simple service worker for PWA offline support
const CACHE_NAME = 'react-forge-pwa-v1';
const ASSETS_TO_CACHE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        if (response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
        }
        return response;
      }).catch(() => cached || caches.match('/index.html'));
    })
  );
});
`;
}

// Capacitor config for wrapping the web app in a native Android shell
export function generateCapacitorConfig(config: ProjectConfig): string {
  const appId = `com.reactforge.${config.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  return `import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: '${appId}',
  appName: '${config.name}',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0f172a',
      showSpinner: false,
    },
  },
};

export default config;
`;
}

// Generate a simple SVG icon that can be converted to PNG
export function generateIconSVG(appName: string): string {
  const initial = appName.charAt(0).toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#06b6d4" rx="80"/>
  <text x="256" y="340" font-family="system-ui, sans-serif" font-size="280" font-weight="bold" fill="white" text-anchor="middle">${initial}</text>
</svg>`;
}

// README with APK build instructions
export function generateApkReadme(config: ProjectConfig): string {
  const appId = `com.reactforge.${config.name.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
  return `# ${config.name} — Build APK

## 📱 Méthode 1 : PWA (installable sur Android sans compilation)

1. Build le projet : \`npm run build\`
2. Sers le dossier \`dist/\` : \`npx serve dist\`
3. Ouvre l'URL sur ton téléphone Android (Chrome)
4. Menu → "Installer l'application"
5. L'app apparaît sur ton écran d'accueil ✅

## 📱 Méthode 2 : Capacitor (APK natif)

### Prérequis
- Node.js 18+
- Android Studio + SDK
- JDK 17

### Étapes

\`\`\`bash
# 1. Build le projet web
npm run build

# 2. Installer Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/splash-screen

# 3. Initialiser Android
npx cap init "${config.name}" "${appId}" --web-dir=dist

# 4. Ajouter la plateforme Android
npx cap add android

# 5. Copier les assets web
npx cap copy

# 6. Ouvrir dans Android Studio
npx cap open android

# 7. Dans Android Studio : Build → Build Bundle(s)/APK(s) → Build APK(s)
\`\`\`

L'APK sera généré dans :
\`android/app/build/outputs/apk/debug/app-debug.apk\`

### Build en ligne de commande
\`\`\`bash
cd android
./gradlew assembleDebug
\`\`\`

## 📁 Fichiers de configuration

- \`capacitor.config.ts\` — Configuration Capacitor
- \`public/manifest.json\` — PWA manifest
- \`public/sw.js\` — Service worker (offline)
- \`public/icon.svg\` — Icône app (convertir en PNG 192/512)

## 🔧 Conversion SVG → PNG
\`\`\`bash
# Avec ImageMagick
convert public/icon.svg -resize 192x192 public/icon-192.png
convert public/icon.svg -resize 512x512 public/icon-512.png

# Ou en ligne : https://svg2png.com
\`\`\`

---
Généré par React Forge
`;
}

// Add mobile files to a generated project
export function addMobileFiles(
  files: GeneratedFile[],
  config: ProjectConfig
): GeneratedFile[] {
  const mobileFiles: GeneratedFile[] = [
    {
      path: "public/manifest.json",
      content: generatePWAManifest(config),
      language: "json",
    },
    {
      path: "public/sw.js",
      content: generateServiceWorker(),
      language: "javascript",
    },
    {
      path: "public/icon.svg",
      content: generateIconSVG(config.name),
      language: "xml",
    },
    {
      path: "capacitor.config.ts",
      content: generateCapacitorConfig(config),
      language: "typescript",
    },
    {
      path: "APK_BUILD.md",
      content: generateApkReadme(config),
      language: "markdown",
    },
  ];

  // Check if the feature "pwa" is enabled — if so, also update vite config
  // to use vite-plugin-pwa
  const hasPwa = config.features.includes("pwa");
  if (hasPwa) {
    // Update vite.config to include PWA plugin
    const viteConfigIdx = files.findIndex((f) => f.path.startsWith("vite.config"));
    if (viteConfigIdx !== -1) {
      const oldContent = files[viteConfigIdx].content;
      if (!oldContent.includes("VitePWA")) {
        files[viteConfigIdx] = {
          ...files[viteConfigIdx],
          content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: '${config.name}',
        short_name: '${config.name.slice(0, 12)}',
        theme_color: '#06b6d4',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      }
    })
  ],
  base: './',
  build: { crossOriginLoading: false },
})
`,
        };
      }
    }
  }

  // Add link to manifest in index.html
  const htmlIdx = files.findIndex((f) => f.path === "index.html");
  if (htmlIdx !== -1) {
    const html = files[htmlIdx].content;
    if (!html.includes("manifest.json")) {
      files[htmlIdx] = {
        ...files[htmlIdx],
        content: html.replace(
          "</head>",
          '    <link rel="manifest" href="/manifest.json" />\n    <meta name="theme-color" content="#06b6d4" />\n  </head>'
        ),
      };
    }
  }

  return [...files, ...mobileFiles];
}
