# React Forge — Desktop Edition (Electron)

> Version desktop de React Forge avec accélération GPU NVIDIA (TensorRT-LLM).

## 🚀 Démarrage rapide

### Prérequis
- **Node.js 18+** (ou Bun)
- **Python 3.10+** (pour le service GPU)
- **GPU NVIDIA** (recommandé pour l'accélération, optionnel)
- **NVIDIA Drivers** + **CUDA Toolkit 12.x** (si GPU)

### Installation

```bash
# 1. Installer les dépendances Node.js
cd /home/z/my-project
bun install

# 2. Installer les dépendances Python du service GPU
cd services/local-ai-gpu
pip install -r requirements.txt

# 3. (Optionnel) Installer TensorRT-LLM si vous avez un GPU NVIDIA
pip install tensorrt-llm --extra-index-url https://pypi.nvidia.com
```

### Lancement

```bash
# Option 1 : Lancer le service GPU + l'app web
# Terminal 1 : Service GPU
cd services/local-ai-gpu
./start.sh          # Linux/Mac
start.bat           # Windows

# Terminal 2 : App web
cd /home/z/my-project
bun run dev

# Option 2 : Lancer en mode Electron (desktop)
cd apps/desktop-electron
npm run dev
```

## 🖥️ Mode Electron

Le mode Electron lance automatiquement :
1. Le **service GPU Python** (TensorRT-LLM) en processus enfant
2. Le **serveur Next.js** en production
3. La **fenêtre desktop** qui charge l'UI

### Avantages du mode Electron
- ✅ **GPU local** : TensorRT-LLM utilise directement la carte NVIDIA
- ✅ **Accès disque** : build APK directement (Gradle + Android SDK)
- ✅ **Pas de serveur web** à maintenir
- ✅ **Modèle IA préchargé** en mémoire (pas de cold start)
- ✅ **ZIP complet** avec node_modules instantané
- ✅ **Offline** : fonctionne sans connexion internet (si modèle local)

## 🔧 Configuration GPU

### Fichier `services/local-ai-gpu/config/gpu_config.yaml`

```yaml
gpu_mode: auto           # auto | gpu-only | cpu-only | remote
llm_model: "Qwen/Qwen2.5-7B-Instruct"
embeddings_model: "all-MiniLM-L6-v2"
max_gpu_memory_percent: 90
```

### Variables d'environnement

| Variable | Défaut | Description |
|----------|--------|-------------|
| `GPU_MODE` | `auto` | Mode GPU (auto, gpu-only, cpu-only, remote) |
| `GPU_SERVICE_PORT` | `5006` | Port du service GPU |
| `GPU_SERVICE_URL` | `http://localhost:5006` | URL du service GPU (pour Next.js) |
| `LLM_MODEL` | `Qwen/Qwen2.5-7B-Instruct` | Modèle HuggingFace |
| `EMBEDDINGS_MODEL` | `all-MiniLM-L6-v2` | Modèle embeddings |

## 📊 Détection automatique

Le badge GPU dans la sidebar affiche :
- 🟢 **GPU TensorRT-LLM** — GPU NVIDIA détecté et modèle chargé
- 🟡 **CPU Fallback** — GPU indisponible, fallback CPU
- 🔵 **Cloud (z-ai)** — Service GPU down, fallback cloud

## 🏗️ Build de l'installeur

```bash
cd apps/desktop-electron

# Windows (.exe)
npm run build:win

# macOS (.dmg)
npm run build:mac

# Linux (.AppImage)
npm run build:linux
```

Les installeurs sont générés dans `apps/desktop-electron/dist-electron/`.

## 📁 Structure

```
apps/desktop-electron/
├── main/
│   └── index.ts          # Main process (Electron)
├── preload/
│   └── index.ts          # Preload (bridge IPC)
├── renderer/             # Renderer (utilise l'UI React Forge)
├── package.json          # Config Electron + electron-builder
└── README.md

services/local-ai-gpu/
├── server.py             # FastAPI server (TensorRT-LLM)
├── requirements.txt      # Dépendances Python
├── config/
│   └── gpu_config.yaml   # Configuration
├── start.sh              # Script lancement (Linux/Mac)
├── start.bat             # Script lancement (Windows)
└── models/               # Modèles IA (téléchargés)
```

## 🔄 Flux de fonctionnement

```
1. Electron démarre
2. Main process lance le service GPU Python (child process)
3. Main process lance le serveur Next.js (production)
4. BrowserWindow charge http://localhost:3000
5. L'UI React Forge détecte le GPU via /api/gpu-status
6. Quand l'utilisateur génère un projet :
   → Next.js appelle le service GPU (localhost:5006)
   → TensorRT-LLM génère PRD + code sur GPU
   → Next.js build le projet (npm install + vite build)
   → L'aperçu s'affiche dans l'UI
7. L'utilisateur peut télécharger ZIP/APK
8. En mode Electron, le build APK peut se faire directement (Gradle)
```

---

*React Forge Desktop Edition — GPU-First Architecture.*
