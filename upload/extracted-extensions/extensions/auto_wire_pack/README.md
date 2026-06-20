# AUTO-WIRE ENGINE — Pack d'Intégration Universelle
## Moteur d'Auto-Câblage pour tout projet React/TypeScript

Ce pack équipe le Bridge Sovereign d'un moteur capable de :
1. **Scanner automatiquement** l'architecture de n'importe quel projet (main.tsx, App.tsx, router, LandingPage)
2. **Créer un scaffold Showcase** sur le disque immédiatement lors de l'injection d'un patch
3. **Câbler le Showcase dans la page principale** sans intervention humaine (import + createElement automatiques)
4. **Enrichir le Master Prompt** avec le contexte réel du projet (fichiers lus depuis le disque)

### Ce pack installe :
- `inject_autowire.js` : Script de contenu pour DeepSeek/ChatGPT/Gemini
  - Polling toutes les 2s du Bridge sur le statut `"prompt"`
  - Injection automatique dans la zone de texte + envoi
  - Capture du code généré + callback vers le Bridge
- `background.js` : Service Worker Chrome pour la communication cross-origin
- `popup.html/.js` : Interface de monitoring du Bridge (statut, projet actif, clear)

### Architecture du moteur (côté Bridge - mobile_bridge_server.py) :
- `_discover_project_arch(proj_path)` : Détecte universellement entry_file, app_file, router, main_page, style (Tailwind/CSS)
- `_generate_showcase_scaffold(name, ext_id, arch)` : Crée le squelette TSX à remplir par l'IA
- `_auto_wire_into_main_page(proj_path, arch, name, rel, ext_id)` : Injecte l'import + createElement dans la page principale
- `_build_integration_context(proj_path, arch)` : Lit les fichiers clés et les envoie à l'IA

### Installation dans Chrome/Edge :
1. Ouvrir `chrome://extensions`
2. Activer le **Mode développeur**
3. Cliquer **Charger l'extension non empaquetée**
4. Sélectionner ce dossier `auto_wire_pack`

### Score de recommandation :
Ce pack est recommandé pour TOUS les projets car il est le moteur sous-jacent de l'injection de patch.
