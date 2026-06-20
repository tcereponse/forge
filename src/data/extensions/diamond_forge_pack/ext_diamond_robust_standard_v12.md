# 💎 EXTENSION : ROBUSTESSE DIAMOND v12.0
## 🛡️ PROTOCOLE DE STABILITÉ ABSOLUE

Cette extension impose les standards de qualité "Grade Gold" pour tout code généré dans cette mission.

### 1. SYNTAXE & INTÉGRITÉ TSX
- **TAG CLOSING** : Chaque balise React/TSX doit être explicitement fermée. JAMAIS de balises orphelines (ex: `<div />` est toléré, mais `<motion.div>` doit avoir son `</motion.div>`).
- **TEMPLATE LITERALS** : Utilise impérativement les backticks (`` ` ``) pour toute chaîne dynamique `${...}`. Évite les erreurs de syntaxe ESBuild.
- **APOSTROPHES** : Échappe systématiquement les apostrophes (`\'`) dans les textes pour éviter de briser les chaînes JS.

### 2. PROTOCOLE DiamondDate (ZOD)
- Pour toute validation de données JSON, utilise l'union suivante :
```typescript
const DiamondDate = z.union([
  z.date(),
  z.string().transform((val) => new Date(val)),
  z.number().transform((val) => new Date(val))
]);
```

### 3. ARCHITECTURE RÉSEAU (SOUVERAINETÉ 3005)
- **Backend (Hono/Express)** : Utilise impérativement le **PORT 3005**.
- **Frontend (Vite)** : Proxy configuré sur `http://localhost:3005`.
- **CORS** : Autorise `http://localhost:5173`.

### 4. GESTION DES DÉPENDANCES
- Utilise **PNPM** comme package manager standard.
- Ajoute toujours `@types/node` dans les devDependencies.

🛰️ NEXUS: ROBUSTNESS ACTIVE.
