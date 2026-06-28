# 💎 EXTENSION : CONTACT & MAILER RÉSILIENT v12.0
## 🛰️ PROTOCOLE DE SOUVERAINETÉ DES COMMUNICATIONS

Cette extension régit la création des services de contact et d'envoi d'emails.

### 1. PRIORITÉ ABSOLUE AU STOCKAGE LOCAL
- Tout message de contact DOIT être enregistré localement (ex: `contacts.json`) AVANT toute tentative d'envoi réseau.
- Le succès de la requête ne doit dépendre que de la réussite de cette sauvegarde locale.

### 2. RÉSILIENCE SMTP (ANTI-ERREUR 500)
- L'appel au service de mailer DOIT être enveloppé dans un bloc `try/catch`.
- Si `transporter.sendMail()` échoue (SMTP non configuré, clés invalides), l'erreur doit être capturée et logguée via `console.warn()`.
- Le serveur DOIT renvoyer un succès `200 OK` même si l'email n'a pas pu être envoyé, à condition que le stockage local ait réussi.

### 3. CONFIGURATION PAR DÉFAUT
- Utiliser `nodemailer` avec des variables d'environnement.
- Toujours fournir un mode "Démo/Fallback" permettant de tester le formulaire sans serveur SMTP actif.

---
🛰️ NEXUS: RESILIENT MAILER PROTOCOL LOCKED.
