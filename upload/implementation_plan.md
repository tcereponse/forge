# Plan d'Implémentation : Intelligence Active RAG & Auto-Injection de Patchs

## 1. Objectif Global
Automatiser l'intelligence de la Forge en injectant **dès la création du projet (Phase 0 et Phase 1)** les extensions et patchs souverains (P5/P6) pertinents, en se basant sur une analyse sémantique (RAG) du prompt utilisateur. De plus, rapatrier et moderniser les "pépites" de l'ancienne version (`rag_memory.py`, `nuclear_guard.py`, `system_grade_gold_ast.md`) pour durcir la Phase 3 (Auto-Suture) et le prompt CTO.

## 2. Architecture de la Solution

### A. Moteur RAG & Auto-Sélection de Patchs (Phase 0 -> Phase 1)
- **Concept** : Lorsqu'un utilisateur lance un nouveau projet avec un descriptif (ex: "Application de e-commerce avec système de login et panier"), le système ne se contente plus du prompt de base. Il analyse les mots-clés.
- **Mapping Sémantique** : Création d'un dictionnaire de mots-clés liant le prompt aux identifiants des patchs (ex: `login/auth/inscription` -> `auth_mobile_pack`, `panier/stripe/achat` -> `ecommerce_pack`).
- **Auto-Injection** : Le `mobile_bridge_server.py` va lire le contenu de ces patchs depuis le catalogue des extensions et les injecter furtivement dans les instructions de la Phase 1 (Architecture) et Phase 2 (Génération de Code).

### B. Migration des "Pépites" (Archives `qodmaxv2`)
1. **`rag_memory.py` (Mémoire Spirale Infinie)** :
   - Rapatriement de la logique d'extraction de tags (`extract_tags`) pour catégoriser le prompt utilisateur.
   - Mise en place d'un système de recherche sémantique locale pour trouver les anciens projets/fichiers qui ressemblent au nouveau projet.
2. **`nuclear_guard.py` (Contrôleur de Qualité & Auto-Réparation API)** :
   - Intégration de cette logique directement dans le workflow de la **Phase 3 (Suture & Audit)**.
   - Si la compilation Vite échoue, le Guard scanne la syntaxe, trouve l'erreur (accolade manquante, import cassé) et appelle automatiquement DeepSeek pour générer la correction en format JSON.
3. **`system_grade_gold_ast.md` (Spirales & Usine AST)** :
   - Fusion de ces concepts puissants (Méthodologie Spiralaire, Exigence PNPM, Refactor_AST) dans le fichier d'instructions de base de la Forge (`cto_core_engine.md`).

## 3. Flux de Données (Workflow)
1. **Utilisateur** : Saisit la Vision du projet dans `kirov3_launcher.html` et clique sur P1.
2. **Bridge (Python)** : 
   - Reçoit la Vision.
   - Appelle la fonction RAG : Extraction des mots-clés.
   - Fait correspondre les mots-clés avec les Patchs (ex: `auth`, `sqlite`).
   - Concatène les instructions des patchs trouvés.
3. **LLM (CTO Engine)** : Reçoit le prompt enrichi. Il génère le PRD en tenant compte des standards de l'extension `auth_mobile_pack`.
4. **Phase 2** : L'IA génère le code en respectant ces mêmes patchs.
5. **Phase 3** : Le `Nuclear Guard` s'assure qu'aucun fichier n'est tronqué ou invalide avant l'Aperçu.
