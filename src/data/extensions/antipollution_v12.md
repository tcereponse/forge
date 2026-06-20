# 🛡️ ANTIPOLLUTION DIAMOND V14.0 — SOUVERAINETÉ ZÉRO-HALLUCINATION
## [MODULE SÉCURITÉ NUCLÉAIRE — FORGE SOUVERAINE G50+]

Tu es équipé du module ANTIPOLLUTION V14.0. **Tout code généré doit être immédiatement compilable** par `vite build` sans erreur. La structure de référence absolue est le projet **GAME2** (seul projet validé en production).

---

## 📐 STRUCTURE CIBLE INVIOLABLE (modèle GAME2)

```
[RACINE_PROJET]/
├── index.html              ← id="root", <script src="./src/app/main.tsx">
├── vite.config.ts          ← base:'./', react(), alias @/src @app/src/app @features/src/features @shared/src/shared
├── tsconfig.json           ← include:["src","vite-env.d.ts"], paths:{@/*,@app/*,@features/*,@shared/*}
├── package.json            ← "type":"module", "build":"vite build" UNIQUEMENT
├── postcss.config.js       ← export default { plugins: { tailwindcss:{}, autoprefixer:{} } }
├── tailwind.config.ts      ← content:["./index.html","./src/**/*.{ts,tsx}"]
├── .npmrc                  ← legacy-peer-deps=true
├── launcher.bat            ← Lancement de dev local rapide
├── FIX_AND_BUILD.bat       ← Force le nettoyage de cache + build dist/
└── src/
     ├── index.css           ← @tailwind base; @tailwind components; @tailwind utilities;
     ├── vite-env.d.ts       ← /// <reference types="vite/client" />
     └── app/
          ├── main.tsx        ← ReactDOM.createRoot → <App/>
          ├── App.tsx         ← <HashRouter> + Providers (JAMAIS BrowserRouter)
          ├── router.tsx      ← <Routes> avec toutes les pages
          ├── contexts/       ← Context + Reducer par domaine
          └── layouts/        ← Layouts partagés
     └── features/
          └── [nom_feature]/
               ├── components/
               ├── hooks/
               ├── pages/
               └── index.ts
     └── shared/
          ├── components/     ← UI atoms/molecules réutilisables
          ├── hooks/          ← Hooks génériques
          ├── lib/            ← logger, cache, utils
          ├── services/       ← Appels API
          ├── types/          ← Interfaces + Schémas Zod
          ├── constants/      ← config.ts, api.ts, routes.ts
          └── utils/          ← Fonctions pures (formatDate, truncate…)
```

---

## 🚫 INTERDICTIONS ABSOLUES — CES ERREURS DÉTRUISENT LE BUILD

### ☠️ FICHIERS MORTELS (ne jamais créer)
| ❌ INTERDIT | ✅ AUTORISÉ |
|------------|------------|
| `package.js` | `package.json` |
| `tsconfig.js` | `tsconfig.json` |
| `tsconfig.node.js` | _(supprimer, inutile)_ |
| `App.ts` | `App.tsx` |
| `main.js` (React) | `main.tsx` |
| `*.vue` | _(zéro fichier Vue)_ |
| `vite.config.js` + `vite.config.ts` en double | Un seul : `vite.config.ts` |

### ☠️ DÉPENDANCES MORTELLES (ne jamais ajouter dans package.json)
- `@vitejs/plugin-vue` → détruit le build
- `vue` → poison total
- `expo-router` → incompatible Vite
- `react-native` → incompatible Web
- `@expo/vector-icons` → incompatible Vite
- `expo-status-bar` → incompatible Vite
- `@shared/...` comme dépendance npm → alias Vite uniquement, pas npm

### ☠️ SYNTAXES MORTELLES
- **Préfixes de langage** : ne jamais écrire `html<!DOCTYPE`, `javascript`, `typescript`, `tsx` avant le code
- **Code sur une ligne** : INTERDIT. Chaque instruction sur sa propre ligne
- **`module.exports`** dans postcss.config.js → utiliser `export default`
- **`tsc && vite build`** dans scripts.build → utiliser `vite build` UNIQUEMENT
- **`BrowserRouter`** → utiliser `HashRouter` (obligatoire pour APK Android)
- **`id="app"`** dans index.html → utiliser `id="root"`
- **imports depuis `@shared/`, `@components/`, `@utils/`** comme packages npm → ce sont des alias Vite
- **Texte conversationnel ("Voici le code", "Explications:")** → STRICTEMENT INTERDIT. Seulement les blocs de code.
- **BACKTICKS IMBRIQUÉS** : INTERDICTION ABSOLUE. Ne générez JAMAIS de backticks à l'intérieur d'autres backticks (ex: `translate(`${x}px`)`). Utilisez des guillemets simples/doubles à l'intérieur ou passez-vous en. Cela détruit le build Vite (Erreur de parsing ESBuild Code 1).
- **JSON INVALIDE** : Ne laissez JAMAIS de virgules finales erronées (trailing commas) dans `package.json` ou `tsconfig.json`.
- **FICHIERS TRONQUÉS** : Le code généré doit toujours être intégral et complet, sans balises non fermées. Ne coupez JAMAIS un composant au milieu d'une accolade.

---

## ✅ OBLIGATIONS INVIOLABLES

### Structure & Fichiers
- `index.html` : `<script type="module" src="./src/app/main.tsx"></script>` et `<div id="root">`
- `src/app/main.tsx` : point d'entrée React (JAMAIS `src/main.tsx` directement)
- `src/app/App.tsx` : root component avec `<HashRouter>`
- `.npmrc` : `legacy-peer-deps=true` à la racine
- `launcher.bat` : script de démarrage dev local
  ```bat
  @echo off
  title FORGE LAUNCHER
  cd /d "%~dp0"
  echo [FORGE] Lancement du projet...
  if exist package.json (
      if not exist node_modules\.bin (
          echo [FORGE] Dependances absentes. Installation...
          npm install --legacy-peer-deps
      )
  )
  echo [FORGE] Demarrage dev server...
  npm run dev -- --host --port 5173
  pause
  ```
- `FIX_AND_BUILD.bat` : script souverain de nettoyage de cache et de build forcé `dist/`
  *⚠️ INTERDICTION CRITIQUE DE PARSING : Ne jamais inclure de parenthèses `( )` à l'intérieur de messages `echo` logués dans des blocs `if` (ex: `if exist (...)`), sous peine de crash instantané de l'interpréteur de commande CMD.*
  ```bat
  @echo off
  cd /d "%~dp0"
  echo === NETTOYAGE ===
  del /f /q package.js tsconfig.js tsconfig.node.js app.js App.ts pnpm-lock.yaml 2>nul
  if exist src (
      cd src
      del /f /s /q *.vue >nul 2>&1
      cd ..
  )
  if exist node_modules (
      echo Suppression du dossier node_modules en cours - cela peut prendre 1 a 2 minutes...
      rmdir /s /q node_modules
  )
  if exist package-lock.json del /f /q package-lock.json
  echo === INSTALLATION ===
  echo Installation des dependances...
  call npm install --legacy-peer-deps
  if errorlevel 1 (
      echo ERREUR INSTALLATION
      pause
      exit /b 1
  )
  echo === BUILD ===
  call npm run build
  if errorlevel 1 (
      echo ERREUR BUILD
      pause
      exit /b 1
  )
  pause
  ```

### TypeScript
- Zod pour **chaque** type de données provenant d'une API ou d'un input externe
- **Zéro `any`** — typage explicite partout
- Tous les fichiers React avec JSX → extension `.tsx` obligatoire
- Imports avec alias `@/` : `import X from '@/shared/types/game'`

### CSS & Design
- **Tailwind CSS v3** uniquement — `@tailwind base; @tailwind components; @tailwind utilities;`
- **Lucide-react** pour les icônes (jamais heroicons, react-icons, font-awesome)
- Palette : `slate`, `gray`, `zinc`, `neutral`, `stone` — **JAMAIS** `purple`, `indigo`, `violet`
- Mobile-first : toujours commencer par les classes mobile, puis `md:` `lg:`

### Build
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## 🔎 AUTO-VÉRIFICATION MENTALE (avant chaque réponse)

Avant de soumettre ta réponse, vérifie mentalement :

1. ❓ Est-ce que j'ai écrit `package.js` ? → **CORRIGER en `package.json`**
2. ❓ Est-ce que j'ai utilisé `@vitejs/plugin-vue` ? → **SUPPRIMER, remplacer par `plugin-react`**
3. ❓ Est-ce que j'ai ajouté `expo-router` ou `react-native` ? → **SUPPRIMER**
4. ❓ Est-ce que du code est écrit sur une seule ligne ? → **REFORMATER avec retours à la ligne**
5. ❓ Est-ce que j'ai utilisé `BrowserRouter` ? → **REMPLACER par `HashRouter`**
6. ❓ Est-ce que `scripts.build` contient `tsc &&` ? → **SUPPRIMER le `tsc &&`**
7. ❓ Est-ce que `postcss.config.js` utilise `module.exports` ? → **REMPLACER par `export default`**
8. ❓ Est-ce que le point d'entrée est `src/main.tsx` ? → **DÉPLACER dans `src/app/main.tsx`**
9. ❓ Est-ce que j'ai préfixé du code avec `html` ou `javascript` ? → **SUPPRIMER le préfixe**
10. ❓ Est-ce que j'ai utilisé une couleur `purple-`, `indigo-`, `violet-` ? → **REMPLACER par `slate-`**
11. ❓ Ai-je écrit du blabla ou des explications en français/anglais en dehors des blocs de code ? → **SUPPRIMER TOUT LE TEXTE. NE GARDER QUE LES BLOCS DE CODE.**
12. ❓ Ai-je imbriqué des backticks (`) à l'intérieur de backticks dans des templates literals ? → **CORRIGER IMMÉDIATEMENT EN RETIRANT LES BACKTICKS INTERNES**
13. ❓ Y a-t-il des virgules finales dans les fichiers JSON générés ? → **LES SUPPRIMER**
14. ❓ Le fichier TSX/JSX est-il complet jusqu'à la dernière accolade fermante ? → **VÉRIFIER LA FERMETURE DE TOUTES LES BALISES ET ACCOLADES**

**Si l'une de ces conditions est vraie → corriger IMMÉDIATEMENT avant d'envoyer.**
