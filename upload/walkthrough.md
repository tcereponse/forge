# Walkthrough : Forge Intelligente & RAG

Ce guide explique pas-à-pas comment la Forge sera modifiée pour devenir intelligente dès son initialisation.

## L'Ancien Modèle (Manuel)
Avant, lorsque tu créais un projet, tu devais taper un prompt dans `kirov3_launcher.html` (ex: "Crée un clone de Vinted"). L'IA générait l'architecture, mais sans spécificité. Si tu voulais des composants experts de panier, il fallait aller manuellement dans la page `ai.html`, cocher "E-Commerce", et lancer une Phase 5/6.

## Le Nouveau Modèle (Automatique via RAG)

### Étape 1 : Le Réveil Sémantique (Phase 0)
Désormais, lorsque tu tapes : *"Application de réservation de VTC avec carte, chat en temps réel et paiement Stripe"*, le serveur (dans `mobile_bridge_server.py`) va passer cette phrase dans la fonction `extract_tags` (rapatriée de `rag_memory.py`).
Le serveur extrait les tags : `["carte", "chat", "temps réel", "paiement", "stripe"]`.

### Étape 2 : Le Mapping des "Pépites" (Patchs)
Le serveur possède un dictionnaire interne. Il voit :
- Le tag `"paiement stripe"` correspond au patch `commerce_paiement_pack`.
- Le tag `"chat temps réel"` correspond au patch `expostack_rt` ou un patch de messagerie.
Il va silencieusement charger le contenu de ces patchs (qui contiennent les instructions d'architecture de pointe, de base de données, etc.).

### Étape 3 : L'Injection Furtive (Phase 1 & 2)
Le serveur concatène ces patchs au grand prompt envoyé au CTO (Phase 1). Ainsi, l'architecte génère des PRD qui intègrent *dès le départ* la structure pour Stripe et le WebSocket !
En Phase 2, le code généré obéit aux mêmes règles d'or (Grade Gold) définies dans l'AST Engine.

### Étape 4 : L'Ange Gardien (Phase 3 - Nuclear Guard)
Une fois le code généré, le `nuclear_guard.py` rapatrié va scanner les milliers de lignes de code. S'il détecte que l'IA a oublié de fermer une accolade dans `PaymentPage.tsx`, il l'isole, l'envoie à l'API de DeepSeek, récupère le fichier corrigé, et relance la compilation, tout ça de manière invisible !

---
### Conclusion
En migrant les pépites des archives, tu transformes ta Forge d'un "Générateur passif" à une véritable **Usine Intelligente** (Sovereign Software Factory) capable de s'auto-assembler selon tes désirs, sans configuration manuelle à chaque projet.
