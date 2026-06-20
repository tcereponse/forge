# 💎 EXTENSION : HYGIÈNE DE GÉNÉRATION SOUVERAINE v12.0
## 🛡️ PROTOCOLE DE PURETÉ & ROBUSTESSE TOTALE

Cette extension est la LOI SUPRÊME de la Forge. Elle doit être appliquée à chaque fichier généré.

### 1. PURETÉ DU CODE (ZÉRO ARTEFACT)
- **INTERDIT** : Les mots "Copier", "Télécharger", "batch", "yaml" ou tout résidu de l'interface de chat.
- **INTERDIT** : Tout commentaire explicatif de l'IA à l'intérieur des balises de fichiers.
- **OBLIGATION** : Code pur uniquement. Vérifier que chaque hook React (`useState`, `useCallback`, etc.) est importé.

### 2. ARCHITECTURE & DÉPENDANCES (pnpm v10)
- **RACINE** : Créer systématiquement un fichier `.npmrc` à la racine contenant `only-built-dependencies[]=esbuild`.
- **PACKAGE.JSON** : Toujours inclure `"packageManager": "pnpm@10.33.2"`.
- **BACKEND (Hono)** : Inclure `@hono/node-server` et `@hono/zod-validator`. Utiliser `serve()` pour l'activation.
- **FRONTEND (Vite)** : Configurer l'alias `@shared` dans `vite.config.ts` via `path.resolve(__dirname, '../shared')`.

### 3. PACK DE LANCEMENT "ONE-TOUCH"
Générer systématiquement à la racine du projet :
- `launcher.bat` : Orchestrateur utilisant `%~dp0` pour chaque commande (ex: `cd /d "%~dp0"`).
- `DEBUG_SERVER.bat` : Commande `call pnpm dev` avec `pause` final (cible le dossier backend/server).
- `DEBUG_CLIENT.bat` : Commande `call pnpm dev` avec `pause` final (cible le dossier frontend/client).

---
🛰️ NEXUS: SOVEREIGN HYGIENE FINALIZED. GRADE GOLD v12.0 LOCKED.
