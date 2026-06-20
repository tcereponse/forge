# 🛰️ EXTENSION : DIAMOND SHELL AI v12.3
# PROTOCOLE : SÉLECTION DYNAMIQUE DE CHÂSSIS BINAIRE

## 💎 OBJECTIF SOUVERAIN
Automatiser le choix de la "Coquille APK" en fonction de la Stack technique détectée dans le projet. Éliminer les frictions de compatibilité Web/Native.

## 🧠 LOGIQUE DE DÉTECTION (STAGING)
- **STACK: REACT/VITE** → Utilise `coquille_react.apk` (Optimisée WebView + Hermes)
- **STACK: FULLSTACK/HONO** → Utilise `coquille_fullstack.apk` (Inclusion Chaquopy Server)
- **STACK: HTML/JS PUR** → Utilise `coquille_standard.apk` (Ultra-légère)
- **STACK: GAME/CANVAS** → Utilise `coquille_game.apk` (Hardware Acceleration Max)

## 🏗️ RÈGLES D'INJECTION
1. Le compilateur scanne le fichier `package.json` ou la structure du dossier `PROJECTS`.
2. Si `react` est détecté → Sélection forcée du moule React.
3. Si un dossier `backend` est présent → Sélection du moule Fullstack.
4. Par défaut → Utilisation de la `coquille_vide.apk` standard.

## 🛡️ SÉCURITÉ CRYPTOGRAPHIQUE
Chaque coquille intelligente doit être scellée avec le même keystore `elite.keystore` (JKS) pour permettre les mises à jour sans désinstallation.

---
*Généré par Antigravity — Nexus Diamond v12.3*
