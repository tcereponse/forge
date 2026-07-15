# Liste des Tâches : Auto-Injection de Patchs & RAG

- [ ] **1. Créer le dictionnaire sémantique des Patchs**
  - Lister les 68 extensions (ou les principales) avec leurs mots-clés associés.
  - *Ex: `auth_mobile_pack` => `["login", "auth", "inscription", "connexion", "mot de passe"]`*.

- [ ] **2. Intégrer l'extracteur de mots-clés dans le serveur**
  - Rapatrier la fonction `extract_tags` depuis `rag_memory.py` dans `mobile_bridge_server.py`.
  - Configurer l'endpoint de la Phase 1 (`/v1/mission/phase1`) pour extraire les mots du descriptif de la vision du projet.

- [ ] **3. Auto-injection des Patchs (Phase 1 & 2)**
  - Dans `/v1/mission/phase1`, après avoir identifié les patchs pertinents, lire le contenu de ces fichiers markdown (`ext_*.md`) ou JSON depuis le dossier des extensions.
  - Concaténer le contenu à la variable `p1_prompt`.
  - Faire de même pour `/v1/mission/phase2` (injection dans `p2_prompt`).

- [ ] **4. Migrer et Adapter `nuclear_guard.py`**
  - Rapatrier la logique de `nuclear_guard.py` dans le pipeline de la Phase 3.
  - Ajouter l'appel à l'API DeepSeek pour corriger automatiquement les erreurs de syntaxe générées par la Phase 2.

- [ ] **5. Mettre à jour `cto_core_engine.md`**
  - Injecter les "pépites" de `system_grade_gold_ast.md` (Notion de spirales, AST Engine, exigences PNPM) dans les consignes du CTO.

- [ ] **6. Tests & Validation**
  - Générer un projet avec un prompt contenant "ecommerce, paiement" pour vérifier si les patchs s'injectent bien.
  - Simuler un fichier avec erreur de syntaxe pour valider l'action de `nuclear_guard.py`.
