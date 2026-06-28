# 🏗️ React Forge — Architecture Technique

> Documentation complète de l'architecture technique de React Forge, incluant la structure des dossiers, les API, les modules, et le flux de données.

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Structure des dossiers](#structure-des-dossiers)
3. [Base de données](#base-de-données)
4. [API Routes](#api-routes)
5. [Modules Core](#modules-core)
6. [Flux de génération](#flux-de-génération)
7. [Système de workspace](#système-de-workspace)
8. [Template Android](#template-android)
9. [Extension PRD Parser](#extension-prd-parser)
10. [Arsenal PRD Grade Diamond](#arsenal-prd-grade-diamond)

---

## Vue d'ensemble

React Forge est construit sur :

- **Next.js 16** (App Router, Turbopack)
- **TypeScript 5** (strict mode)
- **Tailwind CSS 4** + **shadcn/ui** (New York style)
- **Prisma ORM** (SQLite)
- **Zustand** (state management client)
- **z-ai-web-dev-sdk** (LLM backend)
- **Framer Motion** (animations)
- **JSZip** (export ZIP)
- **react-syntax-highlighter** (code viewer)

---

## Structure des dossiers

```
src/
├── app/
│   ├── api/
│   │   └── projects/
│   │       ├── route.ts                    # GET (list) + POST (create)
│   │       └── [id]/
│   │           ├── route.ts                # GET (detail) + DELETE
│   │           ├── generate/route.ts       # POST (IA generation)
│   │           ├── evolve/route.ts         # POST (evolve project)
│   │           ├── build/route.ts          # POST (trigger build)
│   │           ├── install/route.ts        # POST (trigger npm install)
│   │           ├── status/route.ts         # GET (install/build status)
│   │           ├── download/route.ts       # GET (ZIP download)
│   │           ├── download-info/route.ts  # GET (ZIP availability)
│   │           └── apk/route.ts            # GET (APK template ZIP)
│   ├── preview/
│   │   └── [id]/
│   │       └── [[...path]]/route.ts        # GET (serve dist/ files)
│   ├── extensions/route.ts                 # GET (list 49 packs)
│   ├── layout.tsx                          # Root layout
│   ├── page.tsx                            # Home (ForgeApp)
│   └── globals.css                         # Tailwind + custom CSS
│
├── components/
│   ├── forge/
│   │   ├── forge-app.tsx                   # Main app layout
│   │   ├── sidebar.tsx                     # Project gallery
│   │   ├── welcome-view.tsx                # Welcome screen
│   │   ├── builder-form.tsx                # New project form
│   │   ├── generation-overlay.tsx          # Generation progress modal
│   │   ├── workspace.tsx                   # Project workspace (6 tabs)
│   │   ├── file-explorer.tsx               # File tree + code viewer
│   │   ├── preview-panel.tsx               # Build + iframe preview
│   │   ├── download-button.tsx             # ZIP download (source/full)
│   │   ├── evolve-panel.tsx                # Evolve project UI
│   │   ├── feature-summary.tsx             # Feature detection
│   │   ├── arsenal-panel.tsx               # 10 PRD documents viewer
│   │   ├── validation-panel.tsx            # Validation report
│   │   └── markdown.tsx                    # Markdown renderer
│   └── ui/                                 # shadcn/ui components
│
├── hooks/
│   ├── use-forge-store.ts                  # Zustand store (projects, workspace)
│   ├── use-process-status.ts               # Install/build status polling
│   ├── use-mobile.ts                       # Mobile detection
│   └── use-toast.ts                        # Toast notifications
│
├── lib/
│   ├── db.ts                               # Prisma client
│   ├── forge-config.ts                     # Types + constants (stack options, features)
│   ├── forge-templates.ts                  # Deterministic template files
│   ├── forge-postprocess.ts                # Validation + auto-repair
│   ├── forge-anticorruption.ts             # Newline corruption detection + repair
│   ├── forge-arsenal.ts                    # Arsenal PRD (10 documents generator)
│   ├── forge-android-template.ts           # Android APK template generator
│   ├── forge-mobile.ts                     # PWA + Capacitor files
│   ├── forge-apk-builder.ts                # Direct APK builder (aapt2, d8, apksigner)
│   ├── extension-parser.ts                 # 49 PRD packs parser
│   ├── workspace.ts                        # Disk workspace manager (write, install, build)
│   ├── file-tree.ts                        # File tree builder
│   └── utils.ts                            # cn() utility
│
└── data/
    └── extensions/                         # 49 PRD packs (inject_*.js files)
```

---

## Base de données

### Schéma Prisma (`prisma/schema.prisma`)

```prisma
model Project {
  id              String   @id @default(cuid())
  name            String
  slug            String   @unique
  description     String
  stack           String   @default("vite")
  typescript      Boolean  @default(true)
  styling         String   @default("tailwind")
  routing         String   @default("router")
  stateMgmt       String   @default("none")
  uiLib           String   @default("none")
  features        String   @default("[]")       // JSON array
  selectedPacks   String   @default("[]")       // JSON array
  prd             String   @default("")          // Markdown PRD
  arsenalJson     String   @default("")          // JSON: 10 Arsenal documents
  filesJson       String   @default("[]")        // JSON: array of {path, content, language}
  fileCount       Int      @default(0)
  validationJson  String   @default("")          // JSON: validation report
  installStatus   String   @default("pending")
  buildStatus     String   @default("pending")
  status          String   @default("draft")     // draft | generating | ready | failed
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([createdAt])
}
```

---

## API Routes

| Route | Méthode | Rôle |
|-------|---------|------|
| `/api/projects` | GET | Liste tous les projets |
| `/api/projects` | POST | Crée un nouveau projet |
| `/api/projects/[id]` | GET | Détail d'un projet (avec fichiers, arsenal, validation) |
| `/api/projects/[id]` | DELETE | Supprime un projet + workspace |
| `/api/projects/[id]/generate` | POST | Génère le projet (Arsenal PRD + code + post-traitement) |
| `/api/projects/[id]/evolve` | POST | Fait évoluer un projet (ajout features/packs) |
| `/api/projects/[id]/build` | POST | Lance `npm run build` |
| `/api/projects/[id]/install` | POST | Lance `npm install` + répare fichiers manquants |
| `/api/projects/[id]/status` | GET | Statut install/build (réconcilié avec disque) |
| `/api/projects/[id]/download` | GET | Télécharge ZIP (source ou complet) |
| `/api/projects/[id]/download-info` | GET | Vérifie disponibilité ZIP complet |
| `/api/projects/[id]/apk` | GET | Télécharge ZIP avec template Android |
| `/api/preview/[id]` | GET | Sert `dist/index.html` (aperçu) |
| `/api/preview/[id]/[[...path]]` | GET | Sert les assets `dist/` |
| `/api/extensions` | GET | Liste les 49 packs d'extensions |

---

## Modules Core

### `forge-config.ts`
- Types : `ProjectConfig`, `GeneratedFile`, `ProjectRecord`, `ArsenalDocument`
- Constantes : `STACK_OPTIONS`, `STYLING_OPTIONS`, `ROUTING_OPTIONS`, `STATE_OPTIONS`, `UI_LIB_OPTIONS`, `FEATURE_OPTIONS`
- Helpers : `slugify()`, `inferLanguage()`, `buildStackDirective()`

### `forge-templates.ts`
- `buildTemplateFiles(config)` : génère les fichiers déterministes (package.json, vite.config, tsconfig, tailwind.config, postcss.config, index.html, main.tsx, .gitignore, README.md, test files)
- `buildIndexCss(config)` : génère le CSS de base avec variables Tailwind

### `forge-postprocess.ts`
- `postProcessProject(files, config)` : pipeline de post-traitement
  - A. Réconciliation des dépendances (scan imports → package.json)
  - B. Crash-test corruption des sauts de ligne
  - C. Création de `utils.ts` si `cn()` est utilisé
  - D. Vérification config Tailwind + architecture React
  - E. Auto-réparation des imports manquants (création de stubs)
  - F. Rapport de validation

### `forge-anticorruption.ts`
- `unescapeJsonString()` : déséchappe correctement les séquences JSON (`\n` → newline)
- `detectCorruption()` : détecte les fichiers corrompus (ligne > 300 chars, pattern `;nkeyword`)
- `repairCorruptedNewlines()` : répare les sauts de ligne corrompus
- `sanitizeFileContent()` : détection + réparation complète

### `forge-arsenal.ts`
- `generateArsenal(config, extensionDirective)` : génère 10 documents PRD via LLM
- `ARSENAL_DOCS` : définition des 10 documents (id, nom, filename, rôle, prompt)

### `extension-parser.ts`
- `getExtensionPacks()` : scanne `src/data/extensions/` et parse les fichiers `inject_*.js`
- `getPRDContextsForFeatures()` : récupère les contextes PRD pour les features
- `getPRDContextsForPacks()` : récupère les contextes PRD pour les packs sélectionnés manuellement
- `buildExtensionDirective()` : construit la directive pour le prompt LLM (features + packs manuels)

### `workspace.ts`
- `writeProjectFiles()` : écrit les fichiers sur disque (`/tmp/react-forge-workspaces/{id}/`)
- `runInstall()` : lance `npm install` en async
- `runBuild()` : lance `npm run build` en async
- `getReconciledStatus()` : statut réconcilié avec disque (cache 3s)
- `getPreviewFile()` / `getPreviewIndex()` : sert les fichiers `dist/`
- `createFullZipFromDisk()` : crée un ZIP complet (source + node_modules + dist)
- `deleteWorkspace()` : nettoie workspace + kill processes

### `forge-android-template.ts`
- `generateAndroidTemplate(config)` : génère les fichiers Android (AndroidManifest, MainActivity.java, build.gradle, settings.gradle, res/, icônes, scripts build-apk.sh/bat, BUILD_APK.md)

---

## Flux de génération

```
POST /api/projects/[id]/generate
│
├── Phase 1: Arsenal PRD (10 documents)
│   └── generateArsenal() → LLM génère 10 docs PRD
│
├── Phase 2: Génération de code
│   ├── buildExtensionDirective() → contextes PRD des packs
│   ├── buildPackUIDirective() → directives UI par pack
│   ├── LLM génère les fichiers React (JSON)
│   └── Phase 2.5: Vérification imports + réparation (2ème appel LLM si manquants)
│
├── Phase 3: Templates + Fusion
│   ├── buildTemplateFiles() → fichiers de config déterministes
│   ├── buildIndexCss() → CSS de base
│   ├── addMobileFiles() → PWA + Capacitor
│   └── Merge: templates + fichiers LLM
│
├── Phase 4: Post-traitement
│   └── postProcessProject() → validation + auto-réparation
│
├── Phase 5: Écriture disque + auto-install
│   ├── writeProjectFiles() → /tmp/react-forge-workspaces/{id}/
│   └── runInstall() → npm install en arrière-plan
│
└── Sauvegarde en DB (status: ready)
```

---

## Système de workspace

### Emplacement
```
/tmp/react-forge-workspaces/{projectId}/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── index.html
├── .gitignore
├── README.md
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   └── components/
│       ├── MainComponent.tsx
│       └── [PackComponent].tsx
├── node_modules/          (après npm install)
└── dist/                  (après npm run build)
    ├── index.html
    └── assets/
        ├── index-xxx.js
        └── index-xxx.css
```

### Statut réconcilié
Le statut install/build est vérifié sur disque (pas seulement en mémoire) pour survivre aux redémarrages serveur :
- `node_modules/` existe → `install: "installed"`
- `dist/` existe → `build: "built"`

---

## Template Android

### Fichiers générés
```
android/
├── app/
│   ├── build.gradle
│   ├── proguard-rules.pro
│   └── src/main/
│       ├── AndroidManifest.xml
│       ├── assets/www/           ← Copier dist/ ici
│       ├── java/.../MainActivity.java
│       └── res/
│           ├── values/ (styles, colors, strings)
│           ├── drawable/ (icon)
│           └── mipmap-anydpi-v26/ (adaptive icon)
├── src/
│   ├── AndroidManifest.xml.j2    ← Template pour forge_apk_builder.py
│   └── MainActivity.java.j2
├── build.gradle
├── settings.gradle
└── gradle.properties

build-apk.sh / build-apk.bat     ← Scripts de build
BUILD_APK.md                      ← Instructions
```

### Configuration
- **Package ID** : `com.reactforge.{name}`
- **Min SDK** : 24 (Android 7.0)
- **Target SDK** : 34 (Android 14)
- **WebView** : charge `file:///android_asset/www/index.html`

---

## Extension PRD Parser

### Fonctionnement
1. Scan de `src/data/extensions/` (49 dossiers `_pack`)
2. Lecture des fichiers `inject_*.js`
3. Extraction des contextes PRD via regex : `prd_key_name: \`...\``
4. Mapping vers les features via `FEATURE_PACK_MAP`
5. Injection dans le prompt LLM via `buildExtensionDirective()`

### Mapping Features → Packs
```typescript
const FEATURE_PACK_MAP = {
  darkmode: ["interface_pack", "layout_pack"],
  auth: ["saas_pack", "auth_mobile_pack"],
  api: ["saas_pack", "ia_pack"],
  forms: ["forms_inputs_pack", "formulaire_pack"],
  charts: ["productivity_pack", "interface_pack"],
  tables: ["productivity_pack", "interface_pack"],
  pwa: ["mobile_pack", "mobile_web_pack"],
  i18n: ["texte_pack"],
  tests: ["productivity_pack"],
  animations: ["interface_pack", "widget_pack"],
};
```

---

## Arsenal PRD Grade Diamond

### Les 10 documents

| # | Document | Rôle |
|---|----------|------|
| 1 | Vision Stratégique | Objectifs, public, fonctionnalités clés |
| 2 | Architecture Système | Stack, structure des dossiers |
| 3 | Interface Utilisateur | Design system, composants |
| 4 | Base de Données | Modèles de données, schémas |
| 5 | Sécurité | Auth, validation, guards |
| 6 | API et Protocoles | Endpoints, hooks de fetch |
| 7 | Expérience Utilisateur | Animations, empty states |
| 8 | Tests et Qualité | Stratégie, cas de test |
| 9 | Déploiement | Build Vite, optimisations |
| 10 | Maintenance | Roadmap, monitoring |

### Génération
- Un seul appel LLM génère les 10 documents en JSON
- Chaque document fait 50-100 mots en Markdown français
- Les documents sont stockés en DB (`arsenalJson`)
- Affichés dans l'onglet « Arsenal PRD » du workspace

---

*Documentation technique générée pour React Forge.*
