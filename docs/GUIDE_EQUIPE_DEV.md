# React Forge — Guide de l'équipe de développement

> Documentation complète pour comprendre l'architecture, les fonctionnalités et le fonctionnement de React Forge.

---

## 1. Vue d'ensemble

React Forge est un **générateur de projets React par IA**. L'utilisateur décrit son application, configure sa stack technique, et l'IA génère un projet React complet — code source, configuration, composants — prêt à télécharger, builder et déployer.

### Ce que l'utilisateur peut faire

| Action | Description |
|---|---|
| **Créer un projet** | Décrire une app, configurer la stack, générer via IA (GLM-4.6) |
| **Explorer le code** | Arborescence de fichiers navigable avec coloration syntaxique |
| **Lire le PRD** | Product Requirements Document généré automatiquement |
| **Consulter l'Arsenal PRD** | 10 documents techniques (Vision, Architecture, Sécurité, API, etc.) |
| **Valider le projet** | Rapport de validation post-génération (imports, dépendances, config) |
| **Voir l'aperçu** | Build automatique + preview iframe du projet généré |
| **Gérer les snapshots** | Sauvegarder des points de restauration, restaurer un état antérieur |
| **Télécharger en ZIP** | Export complet du projet (avec ou sans node_modules) |
| **Générer un APK** | Compilation d'un fichier .apk Android installable sur mobile |
| **Évoluer un projet** | Ajouter des features à un projet existant sans tout régénérer |
| **Utiliser l'app mobile** | Application Android autonome avec 8 templates + génération IA |

---

## 2. Architecture technique

### Stack

- **Framework** : Next.js 16 (App Router, Turbopack)
- **Langage** : TypeScript 5
- **Styling** : Tailwind CSS 4 + shadcn/ui
- **Base de données** : Prisma ORM + SQLite
- **IA** : z-ai-web-dev-sdk (GLM-4.6) — backend uniquement
- **State** : Zustand (client) + TanStack Query (server, optionnel)
- **Animations** : Framer Motion
- **Build mobile** : Vite + Android SDK (aapt2, javac, d8, apksigner)

### Structure des dossiers

```
src/
├── app/
│   ├── page.tsx                    # Route unique (ForgeApp)
│   ├── layout.tsx                  # Layout + ErrorBoundary + Toaster
│   ├── api/
│   │   ├── projects/               # CRUD projets (GET, POST, DELETE)
│   │   │   └── [id]/
│   │   │       ├── generate/       # Génération IA (5 phases)
│   │   │       ├── build/          # Build Vite
│   │   │       ├── install/        # npm install
│   │   │       ├── status/         # Statut install/build
│   │   │       ├── download/       # ZIP download
│   │   │       ├── apk/            # APK download
│   │   │       ├── evolve/         # Évolution projet
│   │   │       ├── reprocess/      # Re-post-traitement
│   │   │       ├── snapshots/      # Snapshots CRUD
│   │   │       ├── deepseek-save/  # Sauvegarde fichiers DeepSeek
│   │   │       └── build-apk/      # Compilation APK directe
│   │   ├── bridge/                 # Bridge KIROV intégré (7 endpoints)
│   │   │   ├── health/
│   │   │   ├── prompt/             # Extension G50 poll ici
│   │   │   ├── code/               # Extension G50 capture ici
│   │   │   ├── poll/
│   │   │   └── mission/
│   │   │       ├── start/
│   │   │       ├── status/
│   │   │       └── reset/
│   │   ├── deepseek/generate/      # API DeepSeek directe (avec clé)
│   │   ├── mobile/deepseek-generate/ # Endpoint mobile (GLM-4.6 ou DeepSeek)
│   │   ├── extensions/             # Liste des 49 packs d'extensions
│   │   ├── recommend-packs/        # Recommandation IA de packs
│   │   ├── gpu-status/             # Statut GPU/CPU/Cloud
│   │   └── preview/[id]/           # Servir le build pour preview iframe
│   └── globals.css
├── components/
│   ├── ui/                         # shadcn/ui (button, card, dialog, etc.)
│   └── forge/
│       ├── forge-app.tsx           # Layout principal (sidebar + main)
│       ├── sidebar.tsx             # Galerie de projets + GPU badge
│       ├── welcome-view.tsx        # Accueil + templates + stats + APK
│       ├── builder-form.tsx        # Formulaire de création
│       ├── workspace.tsx           # Workspace avec 10 onglets
│       ├── file-explorer.tsx       # Arborescence + code viewer (memo)
│       ├── arsenal-panel.tsx       # 10 documents PRD (memo)
│       ├── preview-panel.tsx       # Build + iframe preview
│       ├── validation-panel.tsx    # Rapport de validation
│       ├── perf-ia-panel.tsx       # Dashboard GPU/perf
│       ├── snapshots-panel.tsx     # Snapshots historique
│       ├── kirov-panel.tsx         # KIROV Bridge (extension Chrome)
│       ├── kirov-launcher.tsx      # Launcher P0-P3 (phases)
│       ├── deepseek-webview.tsx    # DeepSeek Auto (GLM-4.6 intégré)
│       ├── generation-overlay.tsx  # Overlay modal 4 phases
│       ├── templates-gallery.tsx   # 8 templates prêts à forger
│       ├── apk-button.tsx          # Bouton APK
│       ├── download-button.tsx     # Bouton ZIP
│       ├── command-palette.tsx     # Cmd+K palette
│       ├── error-boundary.tsx      # Anti page blanche
│       └── evolve-panel.tsx        # Évolution projet
├── hooks/
│   ├── use-forge-store.ts          # Zustand store
│   ├── use-process-status.ts       # Polling install/build
│   └── use-toast.ts                # Toasts
├── lib/
│   ├── db.ts                       # Prisma client
│   ├── bridge-state.ts             # État du bridge KIROV (mémoire)
│   ├── bridge-server.ts            # Serveur bridge (proxy 5005)
│   ├── forge-config.ts             # Types + config (stack, features)
│   ├── forge-templates.ts          # Templates déterministes (package.json, vite.config, etc.)
│   ├── forge-postprocess.ts        # Post-traitement (7 sections A-H)
│   ├── forge-anticorruption.ts     # Anti-corruption JSON/newlines
│   ├── forge-arsenal.ts            # Génération Arsenal PRD (10 docs)
│   ├── forge-ui-components.ts      # 7 composants shadcn complets
│   ├── forge-apk-builder.ts        # Compilation APK (aapt2, javac, d8, apksigner)
│   ├── forge-android-template.ts  # Template Android (Manifest, MainActivity, etc.)
│   ├── forge-mobile.ts             # Config mobile
│   ├── workspace.ts                # Gestion workspaces (/tmp)
│   ├── pack-embeddings.ts          # TF-IDF + cosine similarity pour packs
│   ├── extension-parser.ts         # Parse 49 packs d'extensions
│   ├── file-tree.ts                # Construction arborescence
│   ├── fetch-retry.ts              # Fetch avec retry exponentiel
│   ├── sse.ts                      # Server-Sent Events
│   └── utils.ts                    # cn() helper
├── data/
│   └── extensions/                 # 49 packs d'extensions PRD
└── prisma/
    └── schema.prisma               # Modèles Project + Snapshot
```

---

## 3. Flux de génération d'un projet

### Phase 1 : Création
1. L'utilisateur remplit le formulaire (nom, description, stack, features)
2. POST `/api/projects` → crée le projet en DB
3. POST `/api/projects/[id]/generate` → déclenche la génération

### Phase 2 : Génération IA (5 étapes)
1. **Arsenal PRD** : GLM-4.6 génère 10 documents (Vision, Architecture, Interface, etc.)
2. **Code generation** : GLM-4.6 génère App.tsx + MainComponent.tsx + index.css
3. **Phase 2.5 — Réparation** : si MainComponent manque → 2e appel LLM
4. **Post-traitement** (7 sections) :
   - A. Réconciliation des dépendances (30+ mappings)
   - B. Anti-corruption (newlines, JSON escapes)
   - C. utils.ts + cn() si nécessaire
   - D. Vérification Tailwind/PostCSS
   - E. Réparation imports manquants (stubs)
   - F.0. Remplacement stubs ui/* cassés par composants shadcn complets
   - F.0.1. Garantie finale utils.ts
   - F. Création composants ui/* manquants (card, button, badge, tabs, etc.)
   - F.2. Ajout dépendances shadcn (clsx, tailwind-merge, lucide-react, @radix-ui/*)
   - H. Validation finale des exports nommés
   - H.2. Suppression des exports dupliqués
5. **Écriture disque** : writeProjectFiles + runInstall (async)

### Phase 3 : Build automatique
1. npm install (async, polling status)
2. vite build (async, polling status)
3. Preview disponible via iframe

### Phase 4 : Téléchargement
- ZIP source (sans node_modules)
- ZIP complet (avec node_modules + dist)
- APK Android (compilation directe via aapt2/javac/d8/apksigner)

---

## 4. Les 10 onglets du Workspace

| Onglet | Composant | Fonctionnalité |
|---|---|---|
| Code source | FileExplorer | Arborescence + viewer avec coloration |
| PRD | Markdown renderer | Product Requirements Document |
| Arsenal PRD | ArsenalPanel | 10 documents (Vision, Archi, Sécurité, etc.) |
| Validation | ValidationPanel | Rapport post-génération (erreurs, fixes) |
| Perf IA | PerfIAPanel | Dashboard GPU/CPU/Cloud |
| Aperçu | PreviewPanel | Build + iframe preview |
| Snapshots | SnapshotsPanel | Historique + restauration |
| KIROV Bridge | KirovPanel | Extension Chrome + bridge intégré |
| Launcher | KirovLauncher | Phases P0-P3 + ouverture DeepSeek |
| DeepSeek Auto | DeepseekWebview | Génération GLM-4.6 (1 clic, gratuit) |

---

## 5. Système de génération IA

### 3 flux disponibles

| Flux | IA utilisée | Clé API | Extension | Coût |
|---|---|---|---|---|
| **GLM-4.6 intégré** | GLM-4.6 (z-ai-web-dev-sdk) | ❌ Aucune | ❌ Aucune | Gratuit, illimité |
| **DeepSeek API** | DeepSeek (api.deepseek.com) | ✅ sk-... | ❌ Aucune | 500 req/mois gratuites |
| **KIROV Bridge** | DeepSeek Chat (chat.deepseek.com) | ❌ Aucune | ✅ KIROV3 Chrome | Gratuit, illimité |

### Flux recommandé : GLM-4.6 intégré
- Bouton "Créer un projet" sur l'accueil
- Bouton "Générer le projet" dans l'onglet DeepSeek Auto
- Aucune configuration, aucune clé, aucun coût

---

## 6. Application mobile

### APK Mobile (React Forge Mobile)
- App Vite + React + TypeScript standalone
- 10 onglets identiques au PC
- 8 templates pré-générés (génération instantanée, offline)
- DeepSeek Auto : copier-coller avec chat.deepseek.com (gratuit)
- KIROV Bridge : copier-coller avec presse-papier natif Android
- ForgeFolder : système de fichiers virtuel + APK download
- Compilation APK via coquille vide Android (aapt2, javac, d8, apksigner)

### WebView Android
- ForgeFileSaver : sauvegarde fichiers sur stockage interne
- StealthBridge : presse-papier natif + bridge phantom.js
- Permissions : WRITE_EXTERNAL_STORAGE, INTERNET
- minSdk 21 (Android 5.0), targetSdk 34 (Android 14)

---

## 7. Bridge KIROV (extension Chrome)

### Architecture
```
React Forge (Next.js, port 3000)
  ↓ POST /api/bridge/mission/start
Bridge intégré (routes API Next.js)
  ↓ GET /api/bridge/prompt (poll 2.5s)
Extension KIROV3 (Chrome)
  ↓ Injecte le prompt dans le textarea DeepSeek
  ↓ Clique sur Envoyer
DeepSeek Chat (chat.deepseek.com)
  ↓ Génère le PRD/code
Extension KIROV3 capture
  ↓ POST /api/bridge/code {content}
Bridge → transition Phase 1 → Phase 2 → Done
```

### Proxy port 5005
- `mini-services/kirov-bridge/index.ts` : proxy port 5005 → port 3000
- Permet à l'extension (hardcodée sur localhost:5005) de fonctionner sans modification

### Extension KIROV3 G50
- `public/kirov-extension/` : 19 fichiers (manifest, content.js, background.js, etc.)
- Auto-détection du serveur (localhost:5005, localhost:3000, proxy preview)
- Timer de capture réduit à 10s (au lieu de 45s)
- Validation scaffold désactivée (gérée par React Forge)

---

## 8. Base de données

### Modèle Project
```prisma
model Project {
  id, name, slug, description
  stack, typescript, styling, routing, stateMgmt, uiLib
  features (JSON), selectedPacks (JSON)
  prd, arsenalJson, filesJson, fileCount
  validationJson
  installStatus, buildStatus
  status (draft | generating | ready | failed)
  createdAt, updatedAt
  snapshots (1:N)
}
```

### Modèle Snapshot
```prisma
model Snapshot {
  id, projectId, label, filesJson, fileCount, prd, note
  createdAt
  project (N:1)
}
```

---

## 9. API Endpoints

### Projets
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/projects` | Liste des projets |
| POST | `/api/projects` | Créer un projet |
| GET | `/api/projects/[id]` | Détail d'un projet |
| DELETE | `/api/projects/[id]` | Supprimer |
| POST | `/api/projects/[id]/generate` | Générer via IA |
| POST | `/api/projects/[id]/build` | Build Vite |
| POST | `/api/projects/[id]/install` | npm install |
| GET | `/api/projects/[id]/status` | Statut install/build |
| GET | `/api/projects/[id]/download` | ZIP download |
| GET | `/api/projects/[id]/apk` | APK source ZIP |
| POST | `/api/projects/[id]/build-apk` | Compiler APK direct |
| POST | `/api/projects/[id]/evolve` | Évoluer projet |
| POST | `/api/projects/[id]/reprocess` | Re-post-traitement |
| POST | `/api/projects/[id]/deepseek-save` | Sauvegarder fichiers DeepSeek |
| GET/POST | `/api/projects/[id]/snapshots` | Snapshots CRUD |
| GET/POST/DELETE | `/api/projects/[id]/snapshots/[sid]` | Snapshot individuel |

### Bridge KIROV
| Méthode | Route | Description |
|---|---|---|
| GET | `/api/bridge/health` | Health check |
| GET | `/api/bridge/prompt` | Extension poll (prompt actif) |
| POST | `/api/bridge/code` | Extension capture |
| GET | `/api/bridge/poll` | Popup status |
| POST | `/api/bridge/mission/start` | Démarrer mission |
| GET | `/api/bridge/mission/status` | Statut mission |
| POST | `/api/bridge/mission/reset` | Réinitialiser |

### IA
| Méthode | Route | Description |
|---|---|---|
| POST | `/api/deepseek/generate` | DeepSeek API (avec clé) |
| POST | `/api/mobile/deepseek-generate` | Mobile (GLM-4.6 ou DeepSeek) |

---

## 10. Post-processeur (forge-postprocess.ts)

Le post-processeur corrige automatiquement les problèmes courants de génération :

| Section | Action |
|---|---|
| E | Anti-corruption : répare les newlines corrompus (\n → n) |
| A | Réconciliation dépendances : scan imports → ajoute au package.json |
| C | Crée utils.ts + cn() si utilisé |
| B | Vérifie tailwind.config + postcss.config |
| D | Détecte les hooks avant Provider (architecture React) |
| F.0 | Remplace les stubs ui/* cassés par composants shadcn complets |
| F.0.1 | Garantie finale utils.ts (après toutes les autres sections) |
| F | Crée les composants ui/* manquants (card, button, badge, tabs, input, etc.) |
| F.2 | Ajoute les dépendances shadcn (clsx, tailwind-merge, lucide-react, @radix-ui/*) |
| H | Validation finale : vérifie que tous les imports nommés résolvent |
| H.1 | Garantie finale utils.ts (post-validation H) |
| H.2 | Supprime les exports dupliqués (conflits de noms) |

---

## 11. Configuration et démarrage

### Variables d'environnement
```bash
DATABASE_URL="file:./db/custom.db"
```

### Démarrage
```bash
# Installer les dépendances
bun install

# Démarrer le serveur (port 3000 + bridge auto)
bun run dev

# Pousser le schéma DB
bun run db:push

# Linter
bun run lint
```

### Bridge KIROV (optionnel)
```bash
# Le proxy bridge démarre automatiquement avec Next.js
# Pour le lancer manuellement :
cd mini-services/kirov-bridge && bun run dev
```

---

## 12. Sécurité et bonnes pratiques

- z-ai-web-dev-sdk **backend uniquement** (jamais côté client)
- ErrorBoundary globale (anti page blanche)
- Validation des entrées (noms, descriptions)
- Anti-corruption JSON (réparation newlines, escapes)
- Prisma log: `['error']` (pas de log query en production)
- Polling avec timeout et retry exponentiel
- Safe area insets pour mobile
- Permissions Android minimales (INTERNET, STORAGE)

---

## 13. Dépannage

| Problème | Solution |
|---|---|
| Page blanche | ErrorBoundary → clic "Réessayer" |
| Build échoue | Onglet Aperçu → "Retraiter & réinstaller" |
| Bridge offline | Ctrl+Shift+R ou clic "Reconnecter" |
| Extension KIROV3 ne injecte pas | Recharger extension + localStorage.clear() sur DeepSeek |
| APK ne s'installe pas | Vérifier targetSdkVersion=34 + signature |
| "Failed to fetch" sur mobile | Saisir l'IP du PC (pas localhost) |
| Capture bloquée "trop tôt" | Timer réduit à 10s (content.js corrigé) |

---

*Documentation générée le 11 juillet 2026 — React Forge v1.0*
