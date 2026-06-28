# 🔧 React Forge — Guide de Développement

> Guide technique pour les développeurs qui travaillent sur React Forge.

---

## 📋 Table des matières

1. [Prérequis](#prérequis)
2. [Installation](#installation)
3. [Commandes](#commandes)
4. [Structure du code](#structure-du-code)
5. [Ajouter une fonctionnalité](#ajouter-une-fonctionnalité)
6. [Ajouter un pack d'extensions](#ajouter-un-pack-dextensions)
7. [Modifier le prompt LLM](#modifier-le-prompt-llm)
8. [Débogage](#débogage)
9. [Bonnes pratiques](#bonnes-pratiques)

---

## Prérequis

- **Node.js 18+** (ou Bun)
- **Next.js 16** (App Router, Turbopack)
- **TypeScript 5**
- **SQLite** (inclus, via Prisma)
- **z-ai-web-dev-sdk** (déjà installé)

---

## Installation

```bash
# Cloner le projet
cd /home/z/my-project

# Installer les dépendances
bun install

# Initialiser la base de données
bun run db:push

# Lancer le serveur de développement
bun run dev
```

---

## Commandes

| Commande | Description |
|----------|-------------|
| `bun run dev` | Démarre le serveur dev (port 3000) |
| `bun run lint` | Vérifie la qualité du code (ESLint) |
| `bun run db:push` | Pousse le schéma Prisma vers SQLite |
| `bun run db:generate` | Régénère le client Prisma |
| `bun run db:migrate` | Crée une migration Prisma |
| `bun run db:reset` | Réinitialise la base de données |

---

## Structure du code

### Fichiers clés

| Fichier | Rôle |
|---------|------|
| `src/app/page.tsx` | Page d'accueil (ForgeApp) |
| `src/app/api/projects/[id]/generate/route.ts` | Génération IA (PRD + code) |
| `src/lib/forge-config.ts` | Types + constantes |
| `src/lib/forge-templates.ts` | Templates déterministes |
| `src/lib/forge-postprocess.ts` | Post-traitement + validation |
| `src/lib/extension-parser.ts` | Parser des 49 packs PRD |
| `src/lib/workspace.ts` | Gestion workspace disque |
| `src/hooks/use-forge-store.ts` | Store Zustand |
| `src/components/forge/builder-form.tsx` | Formulaire de création |
| `src/components/forge/workspace.tsx` | Workspace (6 onglets) |

---

## Ajouter une fonctionnalité

### 1. Ajouter la feature dans `forge-config.ts`

```typescript
// src/lib/forge-config.ts
export const FEATURE_OPTIONS: { value: string; label: string }[] = [
  // ... existant
  { value: "myfeature", label: "Ma Feature" },
];
```

### 2. Ajouter le mapping de packs

```typescript
// src/lib/extension-parser.ts
export const FEATURE_PACK_MAP = {
  // ... existant
  myfeature: ["my_new_pack"],
};
```

### 3. Ajouter les dépendances dans `forge-templates.ts`

```typescript
// src/lib/forge-templates.ts — dans buildTemplateFiles()
if (config.features.includes("myfeature")) {
  deps["my-package"] = "^1.0.0";
}
```

### 4. Ajouter l'instruction d'implémentation

```typescript
// src/app/api/projects/[id]/generate/route.ts
const FEATURE_INSTRUCTIONS = {
  myfeature: () =>
    "IMPLÉMENTE ma feature avec...",
};
```

### 5. Ajouter la détection dans `feature-summary.tsx`

```typescript
// src/components/forge/feature-summary.tsx
const FEATURE_CHECKS = [
  {
    feature: "myfeature",
    label: "Ma Feature",
    icon: MyIcon,
    check: (files) => files.some(f => f.content.includes("my-package")),
  },
];
```

---

## Ajouter un pack d'extensions

### 1. Créer le dossier

```bash
mkdir src/data/extensions/my_new_pack
```

### 2. Créer `manifest.json`

```json
{
  "manifest_version": 3,
  "name": "PRD: My New Pack",
  "description": "Description du pack",
  "permissions": ["activeTab"],
  "content_scripts": [{
    "matches": ["*://*.deepseek.com/*"],
    "js": ["inject_my_new.js"],
    "run_at": "document_idle"
  }]
}
```

### 3. Créer `inject_my_new.js`

```javascript
(function() {
    const PRDS = {
        prd_my_feature_1: `[CONTEXTE - PRD MY_FEATURE_1]
MISSION: Description de la feature.
STYLE: Design attendu.
MAPPING: Component1.tsx, Component2.tsx`,
    };
    // ... (le parser extraira automatiquement ces contextes)
})();
```

Le parser (`extension-parser.ts`) détectera automatiquement le nouveau pack.

---

## Modifier le prompt LLM

### Prompt PRD (Arsenal)

```typescript
// src/lib/forge-arsenal.ts
const ARSENAL_DOCS = [
  {
    id: "vision",
    name: "Vision Stratégique",
    prompt: `Rédige la Vision Stratégique...`,
  },
  // ... modifier ici
];
```

### Prompt de génération de code

```typescript
// src/app/api/projects/[id]/generate/route.ts
const codePrompt = `Génère des fichiers React...
// Modifier les règles ici
`;
```

---

## Débogage

### Voir les logs serveur

```bash
tail -f dev.log
```

### Vérifier le statut d'un projet

```bash
curl http://localhost:3000/api/projects/{id}/status
```

### Voir les fichiers sur disque

```bash
ls /tmp/react-forge-workspaces/{id}/
```

### Tester un build manuellement

```bash
cd /tmp/react-forge-workspaces/{id}
npm install
npm run build
```

### Erreurs courantes

| Erreur | Solution |
|--------|----------|
| 502 Bad Gateway | Redémarrer le serveur : `pkill -f bun && bun run dev` |
| Build échoué | Vérifier les imports manquants dans les logs |
| Page blanche | Hard refresh : Ctrl+Shift+R |
| Polling excessif | Le hook s'arrête après 3 erreurs |

---

## Bonnes pratiques

1. **Toujours passer par les templates** pour les fichiers de config (ne pas les faire générer par l'LLM)
2. **Ne jamais utiliser `tsc --noEmit` strict** dans le build — utilise `vite build` directement
3. **Logger avec `console.error`** dans les API routes pour le débogage
4. **Nettoyer les workspaces** supprimés (`deleteWorkspace()`)
5. **Désactiver les logs Prisma** en production (`log: ['error']`)
6. **Stocker les workspaces dans `/tmp`** (pas dans le projet) pour éviter de casser le file browser

---

*Guide de développement React Forge.*
