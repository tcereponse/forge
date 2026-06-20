# 🛡️ EXTENSION DIAMOND : CODE & BUILD INTEGRITY (v12.2)
## PROTOCOLE DE MATÉRIALISATION ZÉRO DÉFAUT

Cette extension est chargée d'office pour garantir que le code généré est non seulement syntaxiquement correct, mais aussi structurellement prêt pour une compilation APK sans erreur.

### 🚀 1. VIGILANCE SYNTAXIQUE (JSX & TS)
- **Balises JSX** : Toujours vérifier la fermeture parfaite des balises (`>`).
- **Template Strings vs Concat** : En cas d'erreur de build TS1005 sur Windows, privilégier la concaténation classique (`+`) pour les URLs et chemins complexes.
- **Async Logic** : Toute fonction utilisant `import()` dynamique doit être `async`.
- **Zod & Types** : 
    - Interdiction d'utiliser un schéma Zod comme type direct. Utiliser `z.infer`.
    - Nommage distinct pour les types (suffixe `DataType`).
- **Auto-Installation** : Le pipeline de build exécute désormais `pnpm install` d'office avant chaque compilation.
- **Zéro Implicit Any** : Typage explicite obligatoire.

### 🏗️ 2. CONFIGURATION VITE (MOBILE READY)
Pour tout projet Frontend utilisant Vite :
- **Chemins Relatifs** : Le fichier `vite.config.ts` DOIT impérativement contenir `base: './'`. Sans cela, l'APK affichera un écran blanc (erreurs 404 sur les assets).
- **Proxy API** : Configurer systématiquement un proxy vers `http://localhost:3005` pour éviter les erreurs CORS en développement.

### 📦 3. ARCHITECTURE MONOREPO (PNPM)
- **pnpm-workspace.yaml** : Présence obligatoire à la racine.
- **Liens @shared** : Les sous-projets doivent lier le dossier partagé via `"@nom-projet/shared": "workspace:*"`.
- **.npmrc** : Forcer `node-linker=hoisted` pour une résolution stable des modules fantômes.

### 🛠️ 4. SCAN DE PRÉ-VALIDATION
Avant chaque `write_file`, effectue ce scan :
1.  **Syntax Scan** : Vérifier les `>` et les `` ` ``.
2.  **Base Scan** : Vérifier la présence de `base: './'` dans les configs.
3.  **Import Scan** : Utiliser les extensions `.js` pour les imports ESM.
4.  **No Require** : Utiliser uniquement `import`.

---
*Extension injectée par le Radar Sémantique pour le Protocole de Matérialisation Sans Erreur.*
