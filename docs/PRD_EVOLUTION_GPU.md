# ⚡ React Forge — PRD Évolution GPU-First

> Plan d'implémentation complet pour faire évoluer React Forge vers une architecture GPU-first avec TensorRT-LLM, fallback CPU, multiplateforme (Web / Electron / Android), et monitoring de performance.

---

## 📋 Table des matières

1. [Vision & Objectifs](#1-vision--objectifs)
2. [Architecture cible (3 couches)](#2-architecture-cible-3-couches)
3. [Structure des dossiers (monorepo)](#3-structure-des-dossiers-monorepo)
4. [Service IA local GPU (TensorRT-LLM)](#4-service-ia-local-gpu-tensorrt-llm)
5. [API du Service GPU](#5-api-du-service-gpu)
6. [Gestion des fallbacks CPU](#6-gestion-des-fallbacks-cpu)
7. [Workflow de génération GPU-first](#7-workflow-de-génération-gpu-first)
8. [KPIs de performance GPU](#8-kpis-de-performance-gpu)
9. [Flux de messages événementiels](#9-flux-de-messages-événementiels)
10. [Versions multiplateformes](#10-versions-multiplateformes)
11. [Plan d'implémentation (5 phases)](#11-plan-dimplémentation-5-phases)
12. [Risques & Contraintes](#12-risques--contraintes)
13. [Comparaison des performances](#13-comparaison-des-performances)

---

## 1. Vision & Objectifs

React Forge devient un générateur de projets React **GPU-first**, capable de :

- Exploiter **TensorRT-LLM** sur GPU NVIDIA pour la génération PRD, code et réparations locales
- Basculer automatiquement vers un **fallback CPU** (ou backend distant) en cas d'absence de GPU
- Offrir une **latence de génération réduite** (10-18s au lieu de 60-90s)
- Maintenir un **taux de build réussi > 95%**
- Fonctionner sur **3 plateformes** : Web, Electron (Desktop), Android APK

### KPIs principaux

| KPI | Cible |
|-----|-------|
| Latence PRD (GPU) | < 2s |
| Latence Code (GPU) | < 5s |
| Taux build réussi | > 95% |
| Taux réparation auto | > 80% |
| Utilisation GPU | > 70% |
| Fallbacks CPU | < 10% |

---

## 2. Architecture cible (3 couches)

```
┌─────────────────────────────────────────────────────┐
│              COUCHE UI (React)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐          │
│  │   Web    │  │ Electron │  │ Android  │          │
│  │ (Chrome) │  │ (Desktop)│  │  (APK)   │          │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘          │
│       └──────────────┴──────────────┘                │
│                      │ HTTP/WebSocket                │
├──────────────────────┼──────────────────────────────┤
│              COUCHE CORE (Node.js)                   │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │Orchestre │ │ Build    │ │ Export   │            │
│  │projet    │ │ Runner   │ │ ZIP/APK  │            │
│  └────┬─────┘ └──────────┘ └──────────┘            │
│       │ HTTP                                          │
├───────┼─────────────────────────────────────────────┤
│       │     COUCHE IA (Service GPU)                  │
│  ┌────▼─────────────────────────────────┐           │
│  │     TensorRT-LLM (GPU NVIDIA)        │           │
│  │  ┌────────┐ ┌────────┐ ┌──────────┐ │           │
│  │  │  PRD   │ │ Code   │ │ Repair   │ │           │
│  │  │Engine  │ │Engine  │ │Engine    │ │           │
│  │  └────────┘ └────────┘ └──────────┘ │           │
│  │  ┌────────┐ ┌────────────────────┐  │           │
│  │  │Embedd. │ │ Fallback CPU       │  │           │
│  │  │Engine  │ │ (transformers)     │  │           │
│  │  └────────┘ └────────────────────┘  │           │
│  └──────────────────────────────────────┘           │
└─────────────────────────────────────────────────────┘
```

---

## 3. Structure des dossiers (monorepo)

```
react-forge/
  apps/
    web/                    # Application web (Next.js)
    desktop-electron/       # Application desktop (Electron)
    mobile-android/        # Application mobile (APK)
  packages/
    core/                  # Orchestration, workflow, events
      domain/
      prompts/
      workflow/
      events/
      types/
    prd-engine/            # Génération Arsenal PRD
      packs/
      arsenal/
      generator/
      validators/
    codegen/               # Génération de code
      templates/
      repair/
      dependency-mapper/
      file-fixer/
    validation/            # Post-traitement + validation
    export/                # ZIP + APK export
    api-client/            # Client HTTP pour le service GPU
    shared/                # Types partagés
  services/
    local-ai-gpu/          # Service Python TensorRT-LLM
      adapters/
        prd_adapter.py
        codegen_adapter.py
        repair_adapter.py
      engines/
        tensorrt_engine.py
        cpu_engine.py
        remote_engine.py
      models/
        llm/
        embeddings/
      config/
        gpu_config.yaml
      server.py
      requirements.txt
    build-runner/          # npm install, vite build, APK
      npm/
      vite/
      apk/
      preview/
    file-system/           # Gestion fichiers locale
    pack-registry/         # Registre des 49 packs
  assets/
  docs/
  scripts/
```

---

## 4. Service IA local GPU (TensorRT-LLM)

### Sous-composants

1. **Prompt Orchestrator** : assemble les packs, features, contexte projet
2. **Inference Engine** : exécute le modèle local sur GPU (TensorRT-LLM)
3. **Post Processor** : corrige le JSON, imports, dépendances, fichiers corrompus

### Configuration

```yaml
# services/local-ai-gpu/config/gpu_config.yaml
gpu_mode: auto              # auto | gpu-only | cpu-only | remote
fallback_on_error: true
fallback_on_oom: true
max_gpu_memory_percent: 90
model:
  llm: "llama-3-8b-tensorrt"
  embeddings: "all-MiniLM-L6-v2"
server:
  host: "localhost"
  port: 5006
  max_concurrent: 2
```

### Choix technique par plateforme

| Plateforme | Backend IA | GPU |
|------------|------------|-----|
| Electron (Desktop) | TensorRT-LLM | NVIDIA locale |
| Web | z-ai-web-dev-sdk / WebGPU | Cloud ou WebGPU |
| Android | Backend distant | Pas de GPU local |

---

## 5. API du Service GPU

### Endpoints

| Endpoint | Méthode | Rôle |
|----------|---------|------|
| `/v1/health` | GET | Statut du service |
| `/v1/capabilities` | GET | Capacités GPU/CPU |
| `/v1/prd/generate` | POST | Génère les 10 documents PRD |
| `/v1/code/generate` | POST | Génère le code React |
| `/v1/code/repair` | POST | Répare les imports/dépendances |
| `/v1/embeddings/prompt` | POST | Embeddings pour scoring packs |
| `/v1/embeddings/packs` | POST | Embeddings des packs PRD |

### Exemple : GET /v1/capabilities

```json
{
  "gpuAvailable": true,
  "backend": "tensorrt-llm",
  "deviceName": "NVIDIA RTX 4080",
  "memoryTotalMB": 16384,
  "memoryFreeMB": 9210,
  "supportsEmbeddings": true,
  "supportsCodegen": true,
  "supportsPRD": true,
  "supportsRepair": true,
  "fallbackMode": "cpu"
}
```

### Exemple : POST /v1/code/generate

**Request :**
```json
{
  "projectId": "uuid",
  "prdArsenal": { "documents": [...] },
  "stack": {
    "framework": "vite-react",
    "typescript": true,
    "styling": "tailwind",
    "routing": "react-router"
  },
  "features": ["auth", "charts", "darkMode"],
  "packs": ["saas_pack", "interface_pack"],
  "gpuMode": "auto"
}
```

**Response :**
```json
{
  "projectId": "uuid",
  "gpuUsed": true,
  "backend": "tensorrt-llm",
  "files": [
    {"path": "src/App.tsx", "content": "..."},
    {"path": "src/components/MainComponent.tsx", "content": "..."}
  ],
  "metrics": {
    "latencyMs": 2450,
    "tokensInput": 5000,
    "tokensOutput": 8500,
    "computeMode": "gpu"
  }
}
```

---

## 6. Gestion des fallbacks CPU

### Modes de fonctionnement

| Mode | Comportement |
|------|-------------|
| `auto` | GPU si disponible, fallback CPU automatique |
| `gpu-only` | Échec explicite si GPU indisponible |
| `cpu-only` | Force CPU (debug, compat) |
| `remote` | Appel vers backend distant (cloud) |

### Stratégie de fallback

```
Avant chaque requête IA :
1. GET /v1/capabilities
2. Décision de mode (gpu ou cpu)
3. Si erreur GPU (OOM, runtime) :
   a. Log l'événement
   b. Rejoue la requête en mode CPU
   c. Remonte à l'UI : "GPU failure, CPU fallback"
```

---

## 7. Workflow de génération GPU-first

```
┌──────────────────────────────────────────────────────────┐
│ 1. UTILISATEUR CLIQUE "Générer"                          │
│    Description + features + packs + stack                │
└──────────────────┬───────────────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 2. CORE — VÉRIFICATION GPU                               │
│    GET /v1/capabilities → gpuAvailable: true             │
│    Décide: TensorRT-LLM (GPU)                            │
└──────────────────┬───────────────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 3. SERVICE GPU — PRD (1-2s)                              │
│    POST /v1/prd/generate                                 │
│    → 10 documents Arsenal générés                        │
│    → Metrics: { latencyMs, device, computeMode }         │
└──────────────────┬───────────────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 4. SERVICE GPU — CODE (3-5s)                             │
│    POST /v1/code/generate                                │
│    → Fichiers React générés (JSON)                       │
│    → Metrics: { latencyMs, tokensInput, tokensOutput }   │
└──────────────────┬───────────────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 5. POST-TRAITEMENT (0.5-1s)                              │
│    POST /v1/code/repair                                  │
│    → Imports manquants réparés                           │
│    → Dépendances ajoutées                                │
│    → Anti-corruption                                     │
└──────────────────┬───────────────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 6. BUILD RUNNER (5-10s)                                  │
│    npm install → vite build → dist/                      │
└──────────────────┬───────────────────────────────────────┘
                   ▼
┌──────────────────────────────────────────────────────────┐
│ 7. APERÇU + EXPORT                                       │
│    iframe preview + ZIP + APK                            │
└──────────────────────────────────────────────────────────┘
```

---

## 8. KPIs de performance GPU

### KPIs de performance

| KPI | Description |
|-----|-------------|
| `mean_latency_prd_ms` | Latence moyenne génération PRD |
| `mean_latency_codegen_ms` | Latence moyenne génération code |
| `gpu_usage_percent_mean` | Taux d'utilisation GPU moyen |
| `%_requests_gpu` | Pourcentage de requêtes sur GPU |
| `%_requests_cpu_fallback` | Pourcentage de fallbacks CPU |
| `projects_generated_per_hour` | Throughput |
| `tokens_inference_per_second` | Vitesse d'inférence |

### KPIs de qualité

| KPI | Description |
|-----|-------------|
| `%_projects_build_success` | Taux de build réussi |
| `%_imports_fixed_auto` | Taux de réparation automatique |
| `%_dependencies_fixed_auto` | Taux de dépendances ajoutées auto |
| `ratio_features_implemented` | Features détectées vs sélectionnées |

---

## 9. Flux de messages événementiels

### Événements

```
project.create       → Création du projet en DB
prd.generate         → Génération PRD démarrée
prd.complete         → PRD généré (avec metrics)
code.generate        → Génération code démarrée
code.complete        → Code généré (avec fichiers)
dependency.resolve   → Résolution dépendances
repair.request       → Demande de réparation
repair.result        → Réparation terminée
build.start          → Build démarré
build.progress       → Progression build (npm install, vite)
build.success        → Build réussi
build.failure        → Build échoué
export.ready         → Export ZIP/APK prêt
gpu.fallback         → Bascule GPU → CPU
```

### Format d'événement

```json
{
  "type": "build.progress",
  "projectId": "uuid",
  "step": "npm install",
  "progress": 0.64,
  "message": "Installing dependencies",
  "timestamp": "2026-06-28T11:50:00Z"
}
```

---

## 10. Versions multiplateformes

### Electron (Desktop)

```
apps/desktop-electron/
├── main/
│   ├── index.ts          # Electron main process
│   ├── gpu-service.ts    # Lance le service GPU local (Python)
│   └── workspace.ts      # Gestion fichiers locale directe
├── preload/
│   └── api.ts            # Bridge IPC (Renderer ↔ Main)
└── renderer/
    └── (React Forge UI — identique au web)
```

**Avantages :**
- Accès disque direct (rapide)
- Service GPU en processus enfant (pas de cold start)
- Build APK directement (Gradle + Android SDK)
- Pas de serveur web à maintenir

### Web

- Utilise `z-ai-web-dev-sdk` (cloud) ou WebGPU
- Mode `remote` par défaut
- Pas d'accès disque direct (limité au sandbox)

### Android APK

- Client léger vers backend distant (PC)
- WebView avec interface simplifiée
- Pas de TensorRT-LLM sur mobile
- Cas d'usage : pilotage depuis le téléphone

---

## 11. Plan d'implémentation (5 phases)

### Phase 1 — Extraction du Core & API (Semaine 1-2)

- Extraire `prd-engine` et `codegen` en packages séparés
- Définir les interfaces : `IPrdGenerator`, `ICodeGenerator`, `IRepairEngine`
- Implémenter une version mock (sans GPU)
- Définir les types partagés (`GpuCapabilities`, `GpuMode`)

### Phase 2 — Service IA Local GPU (Semaine 3-5)

- Créer `services/local-ai-gpu/` (Python + FastAPI)
- Intégrer TensorRT-LLM (modèle LLM + embeddings)
- Implémenter les 7 endpoints API
- Tester le fallback CPU automatique
- Mesurer les latences

### Phase 3 — Intégration dans Core (Semaine 6-7)

- Core utilise l'API externe du service GPU
- Configuration : URL du service, `gpuMode` par défaut
- Logique de retry/fallback sur erreurs
- Fallback vers `z-ai-web-dev-sdk` si service GPU down

### Phase 4 — UI & Monitoring GPU (Semaine 8)

- Badge GPU dans le header (🟢 GPU / 🟡 CPU / 🔴 Down)
- Onglet « Performance IA » (latence, GPU usage, tokens/s, historique)
- Indicateur temps réel dans l'overlay de génération
- Affichage des métriques par projet

### Phase 5 — Multiplateforme (Semaine 9-12)

- **Semaine 9-10** : Electron desktop avec GPU local
- **Semaine 11** : Web avec WebGPU + mode remote
- **Semaine 12** : Android APK (client léger)

---

## 12. Risques & Contraintes

### Contraintes matérielles
- Nécessite GPU NVIDIA + drivers + runtime TensorRT
- Modèle LLM nécessite 6-12 Go VRAM
- Cold start du modèle (5-10s au premier lancement)

### Risques

| Risque | Mitigation |
|--------|-----------|
| OOM GPU | Fallback CPU automatique + limite mémoire |
| Config TensorRT complexe | Documentation + script d'installation |
| Latence cold-start | Modèle préchargé en mémoire (Electron) |
| Compatibilité GPU | Détection automatique + fallback |

---

## 13. Comparaison des performances

| Étape | Avant (cloud) | Après (GPU local) |
|-------|---------------|-------------------|
| PRD | 10-15s | **1-2s** |
| Code | 20-40s | **3-5s** |
| Réparation | 10-20s | **0.5-1s** |
| Build | 10-15s | 5-10s (identique) |
| **Total** | **50-90s** | **10-18s** |
| **Gain** | — | **5x plus rapide** |

---

*PRD d'évolution React Forge GPU-First — Prêt pour implémentation.*
