# 💎 EXTENSION : RÉSILIENCE PAIEMENT STRIPE v12.0
## 🛰️ PROTOCOLE DE TUNNEL SANS FRICTION

Cette extension régit la création des services de paiement et de checkout.

### 1. MODE SIMULATION OBLIGATOIRE
- Tout service Stripe DOIT détecter l'absence ou l'invalidité de `STRIPE_SECRET_KEY`.
- En l'absence de clé, le service ne doit JAMAIS lancer d'exception.
- Il doit simuler un succès et renvoyer directement l'utilisateur vers la `success_url` fournie.

### 2. SÉCURITÉ DU TUNNEL
- L'appel `stripe.checkout.sessions.create` doit être protégé pour éviter tout crash du backend.
- Les erreurs réelles de l'API Stripe doivent être logguées via `console.error` mais le message renvoyé au client doit être élégant.

### 3. CONFIGURATION PAR DÉFAUT
- Toujours fournir un `priceMapping` clair.
- Inclure une documentation sur les variables d'environnement nécessaires pour passer en production.

---
🛰️ NEXUS: STRIPE RESILIENCE PROTOCOL LOCKED.
