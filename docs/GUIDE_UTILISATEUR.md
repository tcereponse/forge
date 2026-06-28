# 🚀 React Forge — Guide Utilisateur Complet

> **React Forge** est un générateur de projets React par IA qui crée des applications complètes, fonctionnelles et téléchargeables. Il génère le code source, installe les dépendances, compile le projet, affiche un aperçu en direct, et produit un template Android APK.

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Création de projet](#-création-de-projet)
3. [Packs d'extensions PRD (49 packs)](#-packs-dextensions-prd-49-packs)
4. [Génération (4 phases)](#-génération-4-phases)
5. [Workspace (6 onglets)](#-workspace-6-onglets)
6. [Fonctionnalités implémentées](#-fonctionnalités-implémentées)
7. [Téléchargement](#-téléchargement)
8. [APK Android](#-apk-android)
9. [Gestion des projets](#-gestion-des-projets)
10. [Garanties qualité](#-garanties-qualité)
11. [Interface](#-interface)

---

## Vue d'ensemble

React Forge permet de :

- **Décrire** une application en langage naturel
- **Configurer** la stack technique (Vite, TypeScript, Tailwind, Router, etc.)
- **Sélectionner** des fonctionnalités et des packs d'extensions PRD
- **Générer** un projet React complet avec l'IA
- **Installer** automatiquement les dépendances
- **Build** le projet et afficher un aperçu en direct
- **Évoluer** le projet (ajouter des features/packs sans tout recréer)
- **Télécharger** en ZIP (source ou complet avec node_modules)
- **Exporter** un template Android APK

---

## 🏗️ Création de Projet

### Description

- L'utilisateur décrit son application en langage naturel
- **Ou laisse vide** — une description est auto-générée à partir des features et packs sélectionnés
- Plus la description est précise, meilleur est le code généré
- **Aucun blocage** : tu peux générer un projet juste en sélectionnant des packs, sans nom ni description

### Stack technique configurable

| Option | Choix |
|--------|-------|
| Build tool | Vite + React, Next.js, Create React App |
| TypeScript | Activé / Désactivé |
| Styling | Tailwind CSS, CSS Modules, Styled Components |
| Routing | React Router v6 (HashRouter), Aucun |
| State management | Aucun, Zustand, React Context, Redux Toolkit |
| UI Library | Aucune, shadcn/ui, Material UI |

### Fonctionnalités (10 disponibles)

Chaque feature est **vraiment implémentée** dans le code (pas juste un commentaire) :

| Feature | Implémentation |
|---------|---------------|
| 🌙 Dark Mode | `classList.toggle('dark')` + classes `dark:` Tailwind |
| 🔐 Authentification | Formulaire login/logout avec `useState` |
| 🌐 Couche API / fetch | Fonctions `fetch` avec loading/error states |
| 📝 Formulaires | `react-hook-form` avec validation `Zod` |
| 📊 Graphiques | `recharts` (BarChart, LineChart) avec données mockées |
| 📋 Tableaux | Tableau HTML triable avec pagination |
| 📱 PWA / offline | `vite-plugin-pwa` + manifest + service worker |
| 🌍 Internationalisation | `react-i18next` avec sélecteur FR/EN |
| 🧪 Tests | `Vitest` + `@testing-library/react` + fichier de test |
| ✨ Animations | `framer-motion` (`motion.div`, `AnimatePresence`, `whileHover`) |

---

## 📦 Packs d'Extensions PRD (49 packs)

### Catalogue complet

49 packs d'extensions contenant **325 contextes PRD spécialisés** qui guident l'IA pour produire du code de qualité industrielle.

### Sélection des packs

1. Clique sur **« 49 packs d'extensions PRD »** pour ouvrir le catalogue
2. **Clique sur chaque pack** pour le sélectionner/désélectionner
3. Les packs sont **colorés en cyan** quand sélectionnés
4. Les packs **auto-mappés** par les features sont marqués « auto: »

### Mapping automatique Features → Packs

| Feature | Packs automatiquement associés |
|---------|-------------------------------|
| Dark Mode | `interface_pack`, `layout_pack` |
| Auth | `saas_pack`, `auth_mobile_pack` |
| API | `saas_pack`, `ia_pack` |
| Forms | `forms_inputs_pack`, `formulaire_pack` |
| Charts | `productivity_pack`, `interface_pack` |
| Tables | `productivity_pack`, `interface_pack` |
| PWA | `mobile_pack`, `mobile_web_pack` |
| i18n | `texte_pack` |
| Tests | `productivity_pack` |
| Animations | `interface_pack`, `widget_pack` |

### Packs disponibles (examples)

- **Gamification** — points, achievements, badges, leaderboard
- **Audio** — player avec visualizer
- **Vidéo** — player type YouTube
- **E-Commerce** — catalogue, panier, checkout
- **Feed Social** — posts, likes, comments
- **Chat** — messages en bulles
- **Blog** — articles, catégories
- **SaaS Dashboard** — stats, sidebar, charts
- **CRM/ERP** — contacts, pipeline, deals
- **AI Apps** — chat interface, prompt builder
- ...et 39 autres packs

### Injection dans la génération

- Chaque pack sélectionné injecte ses **contextes PRD** dans le prompt LLM
- Le PRD et le code générés **reflètent les packs** dans leur logique métier
- L'UI affiche quelles extensions sont actives pour la génération

---

## ⚙️ Génération (4 phases)

### Phase 1 : Arsenal PRD Grade Diamond (10 documents)

L'IA génère **10 documents PRD structurés** qui guident la génération :

1. **Vision Stratégique** — objectifs, public, fonctionnalités clés
2. **Architecture Système** — stack, structure des dossiers
3. **Interface Utilisateur** — design system, composants
4. **Base de Données** — modèles de données, schémas
5. **Sécurité** — auth, validation, guards
6. **API et Protocoles** — endpoints, hooks de fetch
7. **Expérience Utilisateur** — animations, empty states
8. **Tests et Qualité** — stratégie, cas de test
9. **Déploiement** — build Vite, optimisations
10. **Maintenance** — roadmap, monitoring

### Phase 2 : Génération de code

- L'LLM génère les fichiers React (App.tsx, MainComponent.tsx, composants pack)
- Le prompt inclut les directives UI par pack, l'arsenal PRD, les contextes d'extensions
- **Règle stricte** : chaque composant doit avoir une VRAIE UI (pas de stub)
- **Navigation fonctionnelle** : tous les boutons ont un `onClick`
- **Un composant dédié par pack** sélectionné

### Phase 3 : Templates + Fusion

Fichiers de config injectés déterministiquement :
- `package.json`, `vite.config`, `tsconfig`, `tailwind.config`, `postcss.config`
- `index.html`, `main.tsx`, `.gitignore`, `README.md`
- Fichiers mobile : `manifest.json`, `sw.js`, `icon.svg`, `capacitor.config.ts`, `BUILD_APK.md`

### Phase 4 : Post-traitement

- **Anti-corruption** : détection et réparation des sauts de ligne `\n` → newline
- **Réconciliation des dépendances** : scan des imports → ajout auto au package.json
- **Auto-réparation des imports manquants** : si l'LLM importe un composant qu'il n'a pas créé, un 2ème appel LLM génère le composant manquant
- **Création de stubs** : fallback si l'auto-réparation échoue
- **Vérification** : config Tailwind, `utils.ts`/`cn()`, architecture React

---

## 💾 Workspace (6 onglets)

### Onglet « Code source »

- **Arborescence de fichiers** navigable (dossiers dépliables)
- **Coloration syntaxique** avec numérotation des lignes
- **Copier** un fichier dans le presse-papier
- **Télécharger ZIP** (source uniquement ou complet avec node_modules)

### Onglet « PRD »

- Document Product Requirements Document en Markdown
- Structuré : Objectif, Fonctionnalités, Architecture, Composants

### Onglet « Arsenal PRD »

- **10 documents PRD** navigables avec sidebar
- Icônes spécifiques par document (Target, Boxes, Palette, Database, etc.)
- Navigation précédent/suivant entre les documents
- Sidebar réductible

### Onglet « Validation »

- **Rapport de validation** post-génération
- Corrections automatiques affichées (dépendances ajoutées, imports réparés, etc.)
- Statistiques : fichiers scannés, imports analysés, packages ajoutés
- Badge « Prêt à l'emploi » ou « Points d'attention »

### Onglet « Aperçu »

- **Build automatique** : `npm install` → `npm run build` → `dist/`
- **Aperçu en direct** dans un iframe (l'app React compilée)
- **Statut temps réel** : Dépendances (En attente → Installé), Build (En attente → Prêt)
- **Logs** : `npm install` et `npm run build` affichables
- **Bouton Refresh** pour recharger l'iframe
- **Bouton « Ouvrir »** pour ouvrir dans un nouvel onglet

### Onglet « Évoluer »

- **Faire évoluer un projet existant** sans tout recréer
- Ajouter de nouvelles **fonctionnalités** (les déjà présentes sont désactivées)
- Ajouter de nouveaux **packs** (les déjà présents sont désactivés)
- Décrire l'**évolution** souhaitée
- L'IA **préserve le code existant** et ajoute les nouvelles pages
- Réinstallation automatique des dépendances après évolution

---

## 📊 Fonctionnalités implémentées

Un panneau affiche quelles features sont **réellement détectées** dans le code généré :

- ✅ **Vert « Implémenté »** : la feature est dans le code
- ⚠️ **Orange « Non détecté »** : la feature a été sélectionnée mais n'est pas trouvée

Détection par mots-clés : `dark:` + `documentElement` pour darkmode, `recharts` + `Chart` pour charts, `framer-motion` pour animations, etc.

---

## 📥 Téléchargement

### ZIP Source (bouton « ZIP source »)

- Code source + config + README
- ~15 Ko, léger
- Lancer avec `npm install && npm run dev`

### ZIP Complet (bouton « ZIP complet +deps »)

- Source + **node_modules** + **dist** (build)
- ~27 Mo
- Lance directement avec `npm run dev` — **aucune installation requise**
- Disponible seulement quand `npm install` a terminé

### Menu déroulant

- Clique sur la flèche à côté du bouton ZIP
- Choix entre « ZIP complet » (avec deps) ou « ZIP source uniquement »

---

## 📱 APK Android (bouton vert « APK »)

Télécharge un ZIP contenant un **template Android natif complet** :

### Fichiers Android inclus

- `AndroidManifest.xml` — manifest avec permissions Internet
- `MainActivity.java` — Activity WebView qui charge l'app
- `build.gradle` (app + project) — config Gradle (compileSdk 34, minSdk 24)
- `settings.gradle` + `gradle.properties`
- `res/values/` — styles, colors, strings
- `res/drawable/` — icône vectorielle
- `res/mipmap-anydpi-v26/` — icône adaptive

### Fichiers `.j2` pour `forge_apk_builder.py`

- `AndroidManifest.xml.j2` — template avec `{{ package_id }}`
- `MainActivity.java.j2` — template avec `{{ package_id }}`

### Scripts de build

- `build-apk.sh` (Linux/Mac) — `npm build` → copie `dist` → `gradlew assembleDebug`
- `build-apk.bat` (Windows) — même chose en `.bat`
- `BUILD_APK.md` — instructions détaillées

### Comment obtenir le .apk

```bash
# Méthode 1 : Script
./build-apk.sh        # Linux/Mac
build-apk.bat         # Windows

# Méthode 2 : Android Studio
# Ouvre android/ → Build → Build APK(s)

# Méthode 3 : Script Python
python forge_apk_builder.py --src dist --name "MonApp" --package "com.reactforge.monapp" --build
```

---

## 🔄 Gestion des Projets

### Galerie (sidebar)

- Liste de tous les projets avec statut (Prêt, En cours, Échec)
- Nombre de fichiers et date de création
- **Supprimer** un projet (corbeille au survol)
- **Rafraîchir** la liste

### Workflow complet

```
Nouveau projet → Configurer stack → Sélectionner features + packs → Générer
    → Auto-install npm → Build → Aperçu live → Télécharger ZIP/APK
    → Évoluer (ajouter features/packs) → Re-build → Re-télécharger
```

---

## 🛡️ Garanties Qualité

### Anti-corruption

- Détection des `\n` corrompus en `n` littéral
- Réparation automatique des sauts de ligne
- Crash-test : première ligne > 300 caractères = corruption détectée

### Auto-réparation

- Imports manquants → 2ème appel LLM pour générer le composant
- Dépendances manquantes → ajout automatique au `package.json` (17+ packages mappés)
- Fichiers utilitaires → création auto de `src/lib/utils.ts` si `cn()` est utilisé

### Build sécurisé

- `vite build` directement (sans `tsc --noEmit` strict)
- Les erreurs de typage TypeScript ne bloquent plus le build
- Vite/esbuild compile sans vérification de types

---

## 🎨 Interface

### Design

- Thème sombre (`slate-950`) avec accents cyan/teal
- Responsive (mobile-first)
- Animations Framer Motion
- Custom scrollbar cyan

### Layout

- **Sidebar** (gauche) : galerie de projets + bouton « Nouveau projet »
- **Zone principale** : builder form ou workspace selon le contexte
- **Footer** sticky en bas

### Onglets du workspace

1. Code source (arborescence + visualiseur)
2. PRD (document Markdown)
3. Arsenal PRD (10 documents navigables)
4. Validation (rapport)
5. Aperçu (iframe live)
6. Évoluer (ajout de features/packs)

---

*React Forge est un outil complet qui couvre tout le cycle : description → génération IA → installation → build → aperçu → évolution → téléchargement (ZIP/APK).*
