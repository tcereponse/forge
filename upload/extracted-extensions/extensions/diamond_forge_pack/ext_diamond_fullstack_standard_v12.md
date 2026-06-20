# 💎 EXTENSION : STANDARD FULLSTACK DIAMOND v12.0
## 🛰️ PROTOCOLE DE MATÉRIALISATION SOUVERAINE

Cette extension impose les règles de robustesse pour tous les projets combinant un Backend Hono (Port 3005) et un Frontend React/Vite (Port 5173).

### 1. CONFIGURATION RÉSEAU & RÉSOLUTION
- **Backend (Port 3005)** : Utiliser impérativement `@hono/node-server` avec la fonction `serve()`.
- **CORS** : NE JAMAIS installer `@hono/cors`. Importer `cors` directement depuis `hono/cors`.
- **Vite Alias** : Configurer impérativement l'alias `@shared` dans `vite.config.ts`.
- **Validation** : Toujours inclure `@hono/zod-validator` pour la sécurité des API.

### 2. PROTOCOLE PNPM v10 & WORKSPACE
- **Verrouillage** : Utiliser `"packageManager": "pnpm@10.33.2"` dans le `package.json` racine.
- **Sécurité Build** : Le fichier `.npmrc` à la racine est MANDATAIRE pour autoriser `esbuild`.
- **Shared Package** : Le `package.json` du module partagé DOIT inclure `"type": "module"` pour une résolution ESM sans erreur.
- **Structure** : Supporter indifféremment les noms de dossiers `backend/frontend` ou `server/client`.

### 3. DIAGNOSTIC & LANCEMENT
- Livraison obligatoire du trio de fichiers `.bat` à la racine.
- Utilisation systématique de `%~dp0` pour la portabilité totale sur Windows.

---
🛰️ NEXUS: FULLSTACK STANDARD v12.0 LOCKED.
