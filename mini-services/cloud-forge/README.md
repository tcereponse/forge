# 💎 Cloud Forge — Mobile Bridge Server

Zero-Touch APK Deployment via GitHub Actions.

## Architecture

```
Cockpit (HTML) → mobile_bridge_server.py → GitHub API → GitHub Actions → APK
```

## Installation

### 1. Prérequis

- Python 3.8+ installé
- Un dépôt GitHub (ex: `tcereponse/apk-builder`)
- Un Personal Access Token (PAT) GitHub avec droits `repo` et `workflow`

### 2. Configuration du token

**Option A — Variable d'environnement:**
```bash
set GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

**Option B — Hardcoder dans le fichier:**
Édite `mobile_bridge_server.py` ligne 25:
```python
GITHUB_TOKEN = "ghp_xxxxxxxxxxxxxxxxxxxx"
```

### 3. Démarrage

```bash
# Windows
start_cloud_forge.bat

# Ou manuellement
python mobile_bridge_server.py
```

### 4. Utilisation

1. Ouvre **http://localhost:5005** dans ton navigateur
2. Remplis le nom du projet + le dossier local
3. Clique **"☁️ Cloud Forge — Push & Build APK"**
4. Attends 2-5 min que GitHub Actions compile
5. Clique **"📥 Récupérer l'APK"**
6. L'APK est téléchargé dans `apk_library/`

## Endpoints API

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/` | GET | Interface Cockpit HTML |
| `/v1/health` | GET | Health check |
| `/v1/forge/cloud_build` | POST | Push code + trigger workflow |
| `/v1/forge/cloud_download?project=Nom` | GET | Poll statut + download APK |

## Fonctionnalités

### Auto-Suture (Pre-Push)
Vérifie et crée automatiquement les fichiers manquants:
- `vite.config.ts`
- `src/main.tsx`
- `src/index.css`
- `index.html`
- `package.json`
- `tsconfig.json`
- `tailwind.config.js`
- `postcss.config.js`

### GitHub Actions Workflow
Le workflow pousse automatiquement:
- `npm install --legacy-peer-deps`
- `npm run build` (vite build)
- Capacitor init + add android + sync
- `gradlew assembleDebug`
- Upload artifact `app-debug.apk`

### Rapatriement APK
- Poll `GET /actions/runs` pour le statut
- Télécharge l'artefact ZIP
- Extrait `app-debug.apk` → `{project}_Final.apk`
- Stocké dans `apk_library/`

## Structure des dossiers

```
cloud-forge/
├── mobile_bridge_server.py    # Serveur Python
├── cockpit.html               # Interface web
├── start_cloud_forge.bat      # Lanceur Windows
├── PROJECTS/                  # Projets locaux
├── apk_library/               # APKs téléchargés
└── workspace/                 # Téléchargements temporaires
```
