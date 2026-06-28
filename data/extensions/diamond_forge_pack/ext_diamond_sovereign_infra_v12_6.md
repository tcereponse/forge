# 🛡️ EXTENSION SOUVERAINE : INFRASTRUCTURE NUCLÉAIRE (v12.6)
## PROTOCOLE DE MATÉRIALISATION ANTI-ERREUR PNPM/VITE

Cette extension est le bouclier ultime contre les erreurs de build sur Windows et les problèmes de dépendances monorepo. Elle doit être appliquée avec une rigueur absolue.

### 🚀 1. PROTOCOLE "NUCLEAR LOCAL STORE" (.npmrc)
Tout projet généré DOIT impérativement inclure un fichier `.npmrc` à la racine (et dans chaque sous-app si nécessaire) avec ce contenu EXACT :
```ini
package-import-method=copy
store-dir=.pnpm-store
shamefully-hoist=true
```
**Pourquoi ?** Cela force PNPM à copier les fichiers au lieu de faire des liens symboliques, évitant ainsi les erreurs `ENOENT` et `EPERM` sur les systèmes Windows multi-disques.

### 🏗️ 2. ARCHITECTURE MONOREPO RÉSILIENTE
Pour tout projet complexe (Backend + Frontend) :
- **pnpm-workspace.yaml** : Obligatoire à la racine.
  ```yaml
  packages:
    - 'apps/*'
    - 'packages/*'
  ```
- **Dépendances Croisées** : Utiliser systématiquement le protocole `workspace:*`.
  Exemple dans `apps/frontend/package.json` : `"@shared/types": "workspace:*"`

### ⚡ 3. GARANTIE D'EXÉCUTION (VITE / HONO)
- **Vite** : S'assurer que `vite` est présent dans les `devDependencies` de l'application frontend.
- **Hono** : S'assurer que `@hono/node-server` et `tsx` sont présents dans les `dependencies` du backend.
- **Scripts de Secours** : Ajouter un script `"fix": "pnpm install"` dans le `package.json` racine.

### 🩹 4. SUTURE VITE (MOBILE READY)
Le fichier `vite.config.ts` (ou .js) DOIT contenir :
```typescript
export default defineConfig({
  base: './', // CRITIQUE : Pour éviter l'écran blanc sur mobile
  // ... reste de la config
})
```

### 🧪 5. INTÉGRITÉ TYPESCRIPT & ZOD
- **Zod** : Toujours vérifier que `zod` est listé dans le `package.json` du module qui l'utilise.
- **TSConfig** : Chaque sous-projet (`apps/frontend`, `apps/backend`) DOIT avoir son propre `tsconfig.json` qui étend (ou non) un fichier racine.

---
*Extension de Souveraineté Grade Gold - Matérialisation Garantie.*
