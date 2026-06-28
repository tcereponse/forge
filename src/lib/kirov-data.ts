import { promises as fs } from "fs";
import path from "path";

export interface ExtensionFile {
  name: string;
  path: string;
  language: string;
  size: number;
  content: string;
  description: string;
}

let cache: ExtensionFile[] | null = null;

export async function getKirovFiles(): Promise<ExtensionFile[]> {
  if (cache) return cache;

  const dir = path.join(process.cwd(), "src", "data", "kirov3");
  const entries: { name: string; language: string; description: string }[] = [
    {
      name: "manifest.json",
      language: "json",
      description:
        "Manifest V3 — déclare les permissions, les host permissions (DeepSeek, ChatGPT, Gemini, serveur local 5005), le service worker d'arrière-plan et le content script injecté sur les plateformes d'IA.",
    },
    {
      name: "background.js",
      language: "javascript",
      description:
        "Service Worker (background) — agit comme relais FETCH pour contourner les restrictions CSP / Mixed-Content. Reçoit les requêtes du content script via chrome.runtime.onMessage et exécute les fetch dans le contexte de l'extension.",
    },
    {
      name: "content.js",
      language: "javascript",
      description:
        "Content script (841 lignes) — le cœur de l'extension. Architecture modulaire : KirovLogger (observabilité), EventBus (Observer), StateManager (état persistant + file offline), BridgeClient (circuit breaker + polling adaptatif), PlatformDetector (sélecteurs DOM par plateforme), PromptEngine (injection de prompts via native setters + React valueTracker + keypresses simulés), ValidationOrchestrator, OutputScanner (MutationObserver capture la sortie IA), UIRenderer (toasts + overlay build monitor).",
    },
    {
      name: "popup.html",
      language: "html",
      description:
        "Interface du popup — cockpit style 'Elite Forge' avec LEDs de phase P1–P6, statut du bridge, bouton One-Shot et bouton P6 (Flat Architecture). Esthétique cyan sur fond noir.",
    },
    {
      name: "popup.js",
      language: "javascript",
      description:
        "Logique du popup — interroge /v1/bridge/poll toutes les 2s, met à jour les LEDs, lance une mission One-Shot via /v1/mission/start, et copie le protocole P6 dans le presse-papier.",
    },
  ];

  const files: ExtensionFile[] = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const content = await fs.readFile(fullPath, "utf-8");
    const stat = await fs.stat(fullPath);
    files.push({
      name: entry.name,
      path: `GLOBAL_KIROV3/${entry.name}`,
      language: entry.language,
      size: stat.size,
      content,
      description: entry.description,
    });
  }

  cache = files;
  return files;
}

export interface ExtensionAnalysis {
  totalFiles: number;
  totalSize: number;
  totalLines: number;
  permissions: string[];
  hostPermissions: string[];
  platforms: { id: string; label: string; host: string }[];
  phases: { id: number; name: string; description: string }[];
  modules: { name: string; role: string; pattern: string }[];
  metrics: { label: string; value: string }[];
}

export async function getKirovAnalysis(): Promise<ExtensionAnalysis> {
  const files = await getKirovFiles();
  const contentFile = files.find((f) => f.name === "content.js")!;
  const manifestFile = files.find((f) => f.name === "manifest.json")!;
  const manifest = JSON.parse(manifestFile.content);

  const totalLines = files.reduce(
    (acc, f) => acc + f.content.split("\n").length,
    0
  );
  const totalSize = files.reduce((acc, f) => acc + f.size, 0);

  return {
    totalFiles: files.length,
    totalSize,
    totalLines,
    permissions: manifest.permissions,
    hostPermissions: manifest.host_permissions,
    platforms: [
      { id: "DEEPSEEK", label: "DeepSeek", host: "deepseek.com" },
      { id: "CHATGPT", label: "ChatGPT", host: "chatgpt.com" },
      { id: "GEMINI", label: "Gemini", host: "gemini.google.com" },
    ],
    phases: [
      {
        id: 1,
        name: "PRD & Architecture",
        description:
          "Génère un Product Requirements Document technique (Méthode Matt Pocock) : Problem Statement, User Stories numérotées, Deep Modules, Testing Decisions, Out of Scope. Aucun code, uniquement de la spécification.",
      },
      {
        id: 2,
        name: "Génération de Code (TDD)",
        description:
          "Injecte des règles strictes de génération : Vertical Slicing (Red→Green→Refactor), structure de fichiers inviolable (modèle GAME2/TETRISV3), interdictions absolues (Vue, Expo, BrowserRouter, purple/indigo), modèle package.json exact.",
      },
      {
        id: 3,
        name: "Audit & Refactoring",
        description:
          "Active le mode Tech Lead : audit agressif de sécurité, fuites mémoire, goulots d'étranglement. Critique de l'architecture, vérification syntaxe JSX, refactorisations massives.",
      },
      {
        id: 4,
        name: "Build Monitor",
        description:
          "L'OutputScanner capture la sortie IA, la valide (fichiers requis, couleurs interdites, imports), et l'UIRenderer affiche un overlay de build en temps réel avec logs colorisés.",
      },
      {
        id: 5,
        name: "Materialisation",
        description:
          "Le bridge relaye le code validé au serveur local qui matérialise le projet (création des fichiers, npm install, build). Toast '📦 MATÉRIALISÉ' confirme le succès.",
      },
      {
        id: 6,
        name: "Flat Architecture (P6)",
        description:
          "Bouton dédié copiant un protocole de maintien de l'architecture plate (Flat Structure) : tous les fichiers de config à la racine, code uniquement dans src/, jamais de monorepo.",
      },
    ],
    modules: [
      {
        name: "KirovLogger",
        role: "Observabilité & métriques",
        pattern: "Static logger avec niveaux DEBUG/INFO/WARN/ERROR et tracking de métriques (promptsInjected, captures, bridgeErrors).",
      },
      {
        name: "EventBus",
        role: "Communication découplée",
        pattern: "Pattern Observer — émet/écoute des événements (BRIDGE_SYNC, UI_TOAST, CAPTURE_SENT, BRIDGE_OFFLINE/ONLINE).",
      },
      {
        name: "StateManager",
        role: "État persistant + résilience",
        pattern: "État immutable persisté dans chrome.storage.local. File d'attente offline pour les payloads non livrés.",
      },
      {
        name: "BridgeClient",
        role: "Client réseau résilient",
        pattern: "Polling adaptatif, AbortController (anti-conflits Promises), Circuit Breaker (5 échecs → offline), flush automatique de la queue à la reconnexion.",
      },
      {
        name: "PlatformDetector",
        role: "Adaptation multi-plateformes",
        pattern: "Détecte DeepSeek/ChatGPT/Gemini via hostname et fournit des sélecteurs DOM spécifiques (textarea, bouton send, conteneur de messages).",
      },
      {
        name: "PromptEngine",
        role: "Injection intelligente de prompts",
        pattern: "Native setters (HTMLTextAreaElement.prototype) + reset React _valueTracker + dispatch input/change/keyup + keypresses simulés + MutationObserver en fallback.",
      },
      {
        name: "ValidationOrchestrator",
        role: "Contrôle qualité du code généré",
        pattern: "Valide le scaffold (fichiers requis), le design (couleurs bannies purple/indigo/violet), et les imports (pas de .jsx, pas de module.exports en ESM).",
      },
      {
        name: "OutputScanner",
        role: "Capture & parsing de la sortie IA",
        pattern: "MutationObserver avec debounce 500ms. Clone + nettoie le DOM, déduplique via SHA-256, détecte la fin du streaming (absence de spinner).",
      },
      {
        name: "UIRenderer",
        role: "Overlays & feedback visuel",
        pattern: "Toasts non-intrusifs (textContent anti-XSS) + overlay flottant 'Build Monitor' avec logs colorisés et auto-scroll.",
      },
    ],
    metrics: [
      { label: "Fichiers", value: String(files.length) },
      { label: "Lignes totales", value: totalLines.toLocaleString("fr-FR") },
      {
        label: "Taille",
        value: `${(totalSize / 1024).toFixed(1)} Ko`,
      },
      { label: "Modules", value: "9" },
      { label: "Phases", value: "6" },
      { label: "Plateformes IA", value: "3" },
    ],
  };
}
