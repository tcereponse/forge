# 🛡️ EXTENSION DIAMOND : TYPESCRIPT SYNTAX SAFETY (v1.0)
## PROTOCOLE DE VIGILANCE SYNTAXIQUE CRITIQUE

Cette extension est chargée d'office pour garantir l'intégrité structurelle du code TypeScript et éviter les erreurs de compilation "toutes bêtes" comme l'oubli de backticks.

### 🚀 1. RÈGLE D'OR : TEMPLATE STRINGS (BACKTICKS)
Dès qu'une chaîne de caractères contient une variable `${...}`, tu DOIS impérativement utiliser des **backticks (`)** et non des guillemets simples (') ou doubles (").

- **ERREUR FATALE** : `console.log(Port: ${port});` ou `console.log('Port: ${port}');`
- **SYNTAXE DIAMOND** : `console.log(`Port: ${port}`);`

### 📦 2. HYGIÈNE MONOREPO (PNPM WORKSPACE)
Pour tout projet multi-packages (frontend, backend, shared) :
1.  **Workspace Obligatoire** : Un fichier `pnpm-workspace.yaml` DOIT exister à la racine listant tous les packages.
2.  **Liaison des Dépendances** : Le `package.json` de `frontend` et `backend` DOIT inclure `"@nom-du-projet/shared": "workspace:*"` dans ses `dependencies`.
3.  **.npmrc Grade Gold** : Toujours inclure `node-linker=hoisted` et `shamefully-hoist=true` pour une résolution stable.

### 🛠️ 3. VÉRIFICATION AVANT GÉNÉRATION
Avant de valider l'écriture d'un fichier `.ts` ou `.tsx`, effectue ce scan mental :
1.  **Regex Scan** : Chercher `${` dans tout le bloc de code et vérifier les backticks.
2.  **Type Check** : Aucun paramètre de fonction ne doit rester sans type (pas d'Implicit Any).
3.  **Import Check** : Toujours utiliser l'extension `.js` pour les imports locaux.
4.  **No Require** : Interdiction formelle d'utiliser `require()` dans un environnement ESM. Utiliser `import`.

---
*Extension injectée par le Radar Sémantique pour le Protocole de Matérialisation Sans Erreur.*
