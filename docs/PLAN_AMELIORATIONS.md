# DiamondForge — Plan d'amélioration du projet et de ses fonctionnalités

> Document de référence pour faire passer DiamondForge de « fonctionnel » à « production-grade ».
> Dernière mise à jour : session courante.

---

## 1. État des lieux (snapshot)

| Domaine | État actuel | Maturité |
|---|---|---|
| Génération IA (PRD + code) | 5 phases, anti-corruption, post-traitement | ★★★★☆ |
| 49 packs d'extensions + embeddings TF-IDF |Matcher intelligent opérationnel | ★★★★☆ |
| Arsenal PRD (10 documents) | Généré par LLM, affiché | ★★★★☆ |
| Workspace (7 onglets) | Code, PRD, Arsenal, Validation, Perf IA, Aperçu, Évoluer | ★★★★☆ |
| Build auto + preview iframe | install + build + SPA fallback | ★★★☆☆ |
| Export ZIP + APK | ZIP source/complet + template Android | ★★★★☆ |
| GPU/CPU/Cloud fallback | 3 backends, détection pynvml | ★★★☆☆ |
| Stabilité serveur | **Point faible** — crashes sous charge, polling agressif | ★★☆☆☆ |
| UX (feedback, erreurs) | Toasts Sonner, mais pas d'error boundary | ★★☆☆☆ |

**Verdict global** : la feature-completeness est élevée (~7 700 lignes, 32 modules), mais la **robustesse perçue** est faible à cause des erreurs 502/page blanche et du manque de filet de sécurité côté client.

---

## 2. Problèmes identifiés (priorisés par impact utilisateur)

### P0 — Critique (bloque l'utilisation)
1. **Page blanche sur erreur runtime** — aucune error boundary ; un seul crash de composant → écran vide.
2. **Polling GPU toutes les 30 s même onglet caché** — charge serveur inutile, contribue aux 502.
3. **Pas de garde-fou si la génération LLM échoue à mi-chemin** — l'utilisateur reste bloqué sur l'overlay.

### P1 — Élevé (dégrade l'expérience)
4. **Pas de galerie de modèles prêts à lancer** — l'utilisateur doit toujours tout décrire de zéro.
5. **Aucune visibilité sur la santé du système** sur l'écran d'accueil (nombre de projets, statut GPU, dernier build).
6. **Re-render excessifs** dans le workspace (polling status déclenche des re-renders lourds).
7. **Erreurs API muettes** — fetch échoue → spinner infini au lieu d'un message actionable.

### P2 — Moyen (polish)
8. **Pas de raccourcis clavier** (Cmd+K, N pour nouveau, Échap pour fermer).
9. **Skeletons absents** — loaders à spinner partout, pas de structure aperçue.
10. **Pas de retry automatique** sur échec réseau transient.
11. **Aucune métrique temps réel** pendant la génération (tokens/s, ETA).

### P3 — Faible (nice-to-have)
12. Historique/versioning des snapshots de projet.
13. Templates collaboratifs (partage d'ID).
14. Export vers frameworks non-React (Svelte, Vue).
15. Thème clair complet (actuellement dark-only).

---

## 3. Plan d'amélioration (4 tiers)

### Tier 0 — Stabilité & robustesse (fait maintenant)
- ✅ **Error Boundary globale** — attrape tout crash React, affiche un fallback récupérable.
- ✅ **Polling GPU intelligent** — pause quand l'onglet est caché, intervalle 60 s, reprise au focus.
- ✅ **Garde-fou génération** — timeout + état « error » propre si la génération dépasse 90 s.

### Tier 1 — UX & productivité (fait maintenant)
- ✅ **Templates Gallery** — 8 starters riches (TaskFlow, RecipeBox, DevPortfolio, WeatherCast, ExpenseTracker, PomodoroPro, MarkdownNotes, QuizMaster) avec config pré-remplie + lancement en 1 clic.
- ✅ **Dashboard santé** sur l'accueil — nombre de projets, statut GPU, dernier projet créé.
- ✅ **Error states actionables** — messages clairs avec bouton « Réessayer ».

### Tier 2 — Performance & qualité perçue (prochaine itération)
- Memoïsation des composants lourds (React.memo sur FileExplorer, ArsenalPanel).
- Skeletons structurés (pas de spinners nus).
- Retry exponentiel sur fetch échouant (3 tentatives, backoff 500 ms → 2 s).
- Métriques temps réel pendant la génération (SSE déjà en place, à brancher côté UI).

### Tier 3 — Fonctionnalités avancées (roadmap)
- Historique de snapshots (Prisma : modèle `Snapshot` lié à `Project`).
- Raccourcis clavier globaux (Cmd+K command palette, N nouveau, / recherche).
- Thème clair complet + respect `prefers-color-scheme`.
- Export multi-framework (Svelte/Vue) via templates dédiés.
- Mode collaboratif temps réel (WebSocket déjà disponible via mini-service).

---

## 4. Implémentations livrées cette session

| # | Amélioration | Fichier | Impact |
|---|---|---|---|
| 1 | Error Boundary globale | `src/components/forge/error-boundary.tsx` | Anti page blanche |
| 2 | Polling GPU intelligent | `src/components/forge/gpu-badge.tsx` | -50 % charge serveur |
| 3 | Templates Gallery (8 starters) | `src/components/forge/templates-gallery.tsx` | Démarrage en 1 clic |
| 4 | Dashboard santé accueil | `src/components/forge/welcome-view.tsx` | Visibilité système |
| 5 | Plan d'amélioration (ce doc) | `docs/PLAN_AMELIORATIONS.md` | Référence produit |

---

## 5. Comment utiliser les nouvelles fonctionnalités

### Templates Gallery
1. Sur l'écran d'accueil, clique sur une carte de la galerie (ex: « TaskFlow »).
2. Le formulaire de création s'ouvre **pré-rempli** : nom, description, stack, features.
3. Ajuste si besoin, puis clique « Forger le projet » — ou utilise le bouton « Lancer direct » pour générer immédiatement sans éditer.

### Récupération d'erreur
- Si un composant crash à l'exécution, l'app affiche un écran de récupération avec 2 boutons : « Réessayer » (recharge le composant) et « Retour à l'accueil ».
- Plus jamais de page blanche muette.

### Statut GPU
- Le badge en haut à droite ne se rafraîchit plus quand l'onglet est en arrière-plan.
- Au retour sur l'onglet, un check immédiat est fait, puis toutes les 60 s.

---

## 6. Métriques cibles post-amélioration

| Métrique | Avant | Cible | Comment |
|---|---|---|---|
| Page blanche sur crash | 100 % des crashes | 0 % | Error boundary |
| Requêtes /api/gpu-status par heure (onglet caché) | ~120 | 0 | Pause on hidden |
| Temps pour démarrer un projet | ~45 s (saisie) | ~5 s (template) | Gallery |
| Récupération après erreur de génération | Manuelle | 1 clic | Garde-fou |
| Charge serveur en idle | Élevée | Faible | Polling optimisé |

---

## 7. Prochaines étapes recommandées (ordre suggéré)

1. **Tier 2 — Performance** : memoïser `FileExplorer` et `ArsenalPanel` (re-renders lourds).
2. **Tier 2 — Retry réseau** : wrapper `fetch` avec retry exponentiel dans `useForgeStore`.
3. **Tier 3 — Snapshots** : modèle Prisma `Snapshot`, UI « historique » dans le workspace.
4. **Tier 3 — Command palette** (Cmd+K) : recherche projets + actions rapides.
5. **Tier 3 — Thème clair** : variables CSS + toggle persistant.

Chaque tier est indépendant et peut être livré séparément sans regression.
